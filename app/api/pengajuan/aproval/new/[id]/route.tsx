// /api/approval/new/[id]/route.ts
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import https from "https";
import jwt, { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface MyJwtPayload extends JwtPayload {
  userId: number;
  role: string;
  username: string;
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const proxmoxHeaders = {
  Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
  "Content-Type": "application/json",
};

function extractTokenFromCookies(req: NextRequest): string | undefined {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("="))
  );
  return cookies?.token;
}

function verifyToken(token: string): MyJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as MyJwtPayload;
  } catch {
    return null;
  }
}

function respondWithError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function waitForTaskCompletion(node: string, upid: string) {
  const encodedUpid = encodeURIComponent(upid);

  let taskFinished = false;
  while (!taskFinished) {
    const statusResponse = await axios.get(
      `${process.env.PROXMOX_API_URL}/nodes/${node}/tasks/${encodedUpid}/status`,
      { headers: proxmoxHeaders, httpsAgent }
    );
    console.log(statusResponse.data.data.status);
    if (statusResponse.data.data.status === "stopped") {
      taskFinished = true;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromCookies(req);
    if (!token) return respondWithError("Authorization token is missing", 401);

    const decoded = verifyToken(token);
    if (!decoded) return respondWithError("Invalid or expired token", 401);

    const { role, username } = decoded;
    if (role !== "HEAD") return respondWithError("Access denied", 403);

    const { id } = params;
    const { storage, segment, nama_aplikasi } = await req.json();

    const pengajuan = await prisma.pengajuan.findUnique({
      where: { id: Number(id) },
      include: { template: true },
    });
    if (!pengajuan) return respondWithError("Pengajuan not found", 404);

    let segmentHost: any;
    let bridge: string;

    if (segment === "internal") {
      segmentHost = "INTERNAL";
      bridge = "INT";
    } else if (segment === "backend") {
      segmentHost = "BACKEND";
      bridge = "BE";
    } else if (segment === "frontend") {
      segmentHost = "FRONTEND";
      bridge = "FE";
    } else {
      return respondWithError("Invalid segment", 400);
    }

    const ipAddress = await prisma.ipAddress.findFirst({
      where: { type: segmentHost, status: "AVAILABLE" },
    });

    if (!ipAddress)
      return respondWithError(`No available IP for segment ${segment}`, 404);

    const nodes = await prisma.host.findMany({
      where: { segment: segmentHost },
      select: { nama: true },
    });
    if (nodes.length === 0) return respondWithError("No hosts found", 404);

    let selectedNode = null;
    let minUsage = Infinity;

    for (const node of nodes) {
      const nodeStatusResponse = await axios.get(
        `${process.env.PROXMOX_API_URL}/nodes/${node.nama}/status`,
        { headers: proxmoxHeaders, httpsAgent }
      );
      const { cpu, memory } = nodeStatusResponse.data.data;
      const usageScore = cpu + memory.used / memory.total;
      if (usageScore < minUsage) {
        minUsage = usageScore;
        selectedNode = node.nama;
      }
    }

    if (!selectedNode) return respondWithError("No suitable node found", 404);

    await prisma.ipAddress.update({
      where: { id: ipAddress.id },
      data: { nama_server: nama_aplikasi, status: "NOT_AVAILABLE" },
    });

    const response = await prisma.pengajuan.update({
      where: { id: Number(id) },
      include: {
        template: true,
      },
      data: {
        status_pengajuan: "Proses pengerjaan",
      },
    });

    setImmediate(async () => {
      try {
        const vmListResponse = await axios.get(
          `${process.env.PROXMOX_API_URL}/cluster/resources?type=vm`,
          { headers: proxmoxHeaders, httpsAgent }
        );
        const vmList = vmListResponse.data.data;
        let newid = 100;
        const usedIds = vmList.map((vm: { vmid: number }) => vm.vmid);
        while (usedIds.includes(newid)) newid++;

        const user = await prisma.user.findUnique({
          where: { username },
          include: { divisi: true },
        });

        const NamaAplikasi = nama_aplikasi.replace(/\s+/g, "-");

        await prisma.server.create({
          data: {
            vmid: newid,
            id_template: Number(pengajuan.id_template),
            id_ip: ipAddress.id,
            segment,
            user: pengajuan.user,
            divisi: pengajuan.divisi,
          },
        });

        const clone = await axios.post(
          `${process.env.PROXMOX_API_URL}/nodes/${pengajuan.template?.nodes}/qemu/${pengajuan.template?.vmid}/clone`,
          {
            newid,
            name: NamaAplikasi,
            target: selectedNode,
            full: 1,
            pool: pengajuan.divisi,
            storage: user?.divisi.nama_storage,
          },
          { headers: proxmoxHeaders, httpsAgent }
        );

        const cloneId = clone.data.data;

        const encodedUpid = encodeURIComponent(cloneId);

        let taskFinished = false;
        while (!taskFinished) {
          const statusResponse = await axios.get(
            `${process.env.PROXMOX_API_URL}/nodes/${pengajuan.template?.nodes}/tasks/${encodedUpid}/status`,
            { headers: proxmoxHeaders, httpsAgent }
          );
          console.log(statusResponse.data.data.status);
          if (statusResponse.data.data.status === "stopped") {
            taskFinished = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }

        // await waitForTaskCompletion(pengajuan.template?.nodes, clone.data.data);

        await axios.put(
          `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/config`,
          {
            memory: pengajuan.ram,
            cores: pengajuan.cpu,
            net0: `virtio,bridge=${bridge}`,
          },
          { headers: proxmoxHeaders, httpsAgent }
        );

        await axios.put(
          `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/resize`,
          {
            disk: "scsi0",
            size: `+${storage - 40}G`,
          },
          { headers: proxmoxHeaders, httpsAgent }
        );

        await axios.post(
          `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/status/start`,
          {},
          { headers: proxmoxHeaders, httpsAgent }
        );

        await prisma.pengajuan.update({
          where: { id: Number(id) },
          data: {
            status_pengajuan: "Selesai",
            vmid: newid,
          },
        });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(error.response?.statusText || error.message);
          await prisma.pengajuan.update({
            where: { id: Number(id) },
            data: { status_pengajuan: "Error" },
          });
        } else {
          console.error("Unexpected error:", error);
        }
      }
    });

    return NextResponse.json(
      {
        message: "Server is being created it will take 10 to 15 minutes",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return respondWithError("Internal server error", 500);
  }
}
