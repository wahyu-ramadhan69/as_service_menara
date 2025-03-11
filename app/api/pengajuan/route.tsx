import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import https from "https";
import axios from "axios";
import { respondWithSuccess } from "@/app/lib/Response";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface MyJwtPayload extends JwtPayload {
  userId: number;
  role: string;
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const headers = {
  Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
  "Content-Type": "application/json",
};

export async function POST(req: Request) {
  try {
    const token = extractTokenFromCookies(req);

    if (!token) {
      return respondWithError("Authorization token is missing", 401);
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return respondWithError("Invalid or expired token", 401);
    }

    const { username, role, divisi } = decodedToken;

    const requestData = await req.json();

    if (requestData.jenis_pengajuan === "Perubahan") {
      const vmResponse = await axios.get(
        `${process.env.PROXMOX_API_URL}/nodes/${requestData.node}/qemu/${requestData.vmid}/status/current`,
        {
          headers,
          httpsAgent,
        }
      );

      const vmStorage = vmResponse.data.data.maxdisk / (1024 * 1024 * 1024);

      if (requestData.storage < vmStorage) {
        return respondWithError(`Storage tidak bisa dikecilkan`, 400);
      }
    }

    if (requestData.jenis_pengajuan === "New" && requestData.storage < 40) {
      return respondWithError("Storage tidak boleh kurang dari 40 GB", 400);
    }

    if (requestData.jenis_pengajuan === "New" && !requestData.nama_aplikasi) {
      return respondWithError("Nama aplikasi tidak boleh kosong", 400);
    }

    if (requestData.jenis_pengajuan === "Existing" && !requestData.nama_baru) {
      return respondWithError("Nama aplikasi baru tidak boleh kosong", 400);
    }

    const validationError = await validateResourceRequest(requestData, divisi);

    if (validationError) {
      return respondWithError(validationError, 400);
    }

    const pengajuan = await createPengajuan(requestData, username, divisi);

    return respondWithSuccess(
      "Berhasil membuat pengajuan server",
      pengajuan,
      200
    );
  } catch (error) {
    return respondWithError("Failed to create pengajuan", 500);
  }
}

function extractTokenFromCookies(req: Request): string | undefined {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split("=");
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);
  return cookies?.token;
}

function verifyToken(token: string): MyJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as MyJwtPayload;
  } catch {
    return null;
  }
}

async function validateResourceRequest(
  requestData: any,
  divisi: string
): Promise<string | null> {
  const { cpu, ram, storage } = requestData;

  const response = await axios.get(
    `${process.env.PROXMOX_API_URL}/pools/${divisi}`,
    {
      headers,
      httpsAgent,
    }
  );

  const quota = await prisma.divisi.findUnique({
    where: {
      nama: divisi,
    },
  });

  if (!quota) {
    return "divisi tidak ditemukan";
  }

  type Member = {
    maxcpu: number;
    maxmem: number;
    maxdisk: number;
  };

  const members: Member[] = response.data.data.members;

  const totalMaxCpu = members.reduce((acc, vm) => acc + vm.maxcpu, 0);
  const totalMaxMemGB = members.reduce(
    (acc, vm) => acc + vm.maxmem / (1024 * 1024 * 1024),
    0
  );
  const totalMaxDiskGB = members.reduce(
    (acc, vm) => acc + vm.maxdisk / (1024 * 1024 * 1024),
    0
  );

  const cpuReq = totalMaxCpu + cpu;
  const ramReq = Math.floor(totalMaxMemGB) + ram / 1024;
  const diskReq = Math.floor(totalMaxDiskGB) + storage;

  if (cpuReq > quota.ram) return "Quota cpu pada divisimu tidak mencukupi";
  if (ramReq > quota.ram) return "Quota ram pada divisimu tidak mencukupi";
  if (diskReq > quota.storage)
    return "Quota storage pada divisimu tidak mencukupi";

  return null;
}

async function createPengajuan(
  requestData: any,
  username: string,
  divisi: string
) {
  let {
    id_template,
    cpu,
    ram,
    storage,
    segment,
    nama_aplikasi,
    tujuan_pengajuan,
    jenis_pengajuan,
    vmid,
    nama_baru,
    node,
  } = requestData;

  let server,
    vmid_old = undefined;

  if (jenis_pengajuan === "Existing") {
    server = await prisma.server.findUnique({
      where: { vmid: vmid },
    });

    vmid_old = vmid;
  }

  if (jenis_pengajuan === "New" || jenis_pengajuan === "Existing") {
    vmid = undefined;
  }

  const pengajuanData = {
    id_template,
    cpu: parseInt(cpu, 10),
    ram: parseInt(ram, 10),
    storage: parseInt(storage, 10),
    segment,
    status_pengajuan: "Waiting For Dept Head",
    nama_aplikasi,
    tujuan_pengajuan,
    jenis_pengajuan,
    nama_baru,
    vmid: vmid,
    vmid_old,
    nodes: node,
    user: username,
    divisi: divisi,
  };

  return prisma.pengajuan.create({
    data: pengajuanData,
    include: {
      template: true,
    },
  });
}

export async function GET(req: Request) {
  try {
    const token = extractTokenFromCookies(req);

    if (!token) {
      return respondWithError("Authorization token is missing", 401);
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return respondWithError("Invalid or expired token", 401);
    }

    const { username, role, divisi } = decodedToken;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    let pengajuan, totalData;

    if (role === "USER") {
      [pengajuan, totalData] = await fetchPengajuanForUser(
        username,
        divisi,
        skip,
        limit
      );
    } else if (role === "HEAD") {
      [pengajuan, totalData] = await fetchPengajuanForHead(
        username,
        divisi,
        skip,
        limit
      );
    } else {
      return respondWithError("Access denied", 403);
    }

    return NextResponse.json(
      { pengajuan, totalData, currentPage: page },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching pengajuan:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P1001") {
        return respondWithError(
          "Database connection failed. Please try again later.",
          500
        );
      }
    }

    return respondWithError("Failed to fetch pengajuan", 500);
  }
}

async function fetchPengajuanForUser(
  username: string,
  divisi: string,
  skip: number,
  limit: number
) {
  const pengajuan = await prisma.pengajuan.findMany({
    where: {
      user: username,
    },
    orderBy: {
      tanggal_pengajuan: "desc",
    },
    include: {
      template: true,
    },
    skip: skip,
    take: limit,
  });

  const totalData = await prisma.pengajuan.count({
    where: {
      user: username,
    },
  });

  return [pengajuan, totalData];
}

async function fetchPengajuanForHead(
  username: string,
  divisi: string,
  skip: number,
  limit: number
) {
  let pengajuan: any;
  let totalData: any;

  const data_divisi = await prisma.divisi.findMany({
    where: {
      head: username,
    },
  });

  const namaDivisi = data_divisi.map((divisi) => divisi.nama);

  pengajuan = await prisma.pengajuan.findMany({
    where: {
      divisi: {
        in: namaDivisi,
      },
      status_pengajuan: {
        in: ["Waiting For Dept Head", "Proses pengerjaan"],
      },
    },
    orderBy: {
      tanggal_pengajuan: "desc",
    },
    skip: skip,
    take: limit,
    include: {
      template: true,
    },
  });

  totalData = await prisma.pengajuan.count({
    where: {
      divisi,
      status_pengajuan: {
        in: ["Waiting For Dept Head", "Proses pengerjaan"],
      },
    },
  });

  return [pengajuan, totalData];
}

function respondWithError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
