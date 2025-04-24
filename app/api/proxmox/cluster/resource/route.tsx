import axios, { AxiosError } from "axios";
import https from "https";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface MyJwtPayload extends JwtPayload {
  userId: number;
  role: string;
}

interface Storage {
  avail: number;
  total: number;
  type: string;
  storage: string;
  enabled: number;
  used_fraction: number;
  content: string;
  used?: number; // Optional karena mungkin tidak ada properti 'used'
  active: number;
  shared: number;
}

// const token = extractTokenFromCookies(req);

// if (!token) {
//   return respondWithError("Authorization token is missing", 401);
// }

// const decodedToken = verifyToken(token);

// if (!decodedToken) {
//   return respondWithError("Invalid or expired token", 401);
// }

// const { userId, role } = decodedToken;
// if (role !== "ADMIN") {
//     return respondWithError("Anda tidak memiliki akses ke halaman ini", 401);
//   }

export async function GET(req: NextRequest) {
  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const headers = {
      Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
      "Content-Type": "application/json",
    };

    const res = await axios.get(`${process.env.PROXMOX_API_URL}/nodes/`, {
      headers,
      httpsAgent,
    });

    const storages = await axios.get(
      `${process.env.PROXMOX_API_URL}/nodes/proxmox1/storage`,
      {
        headers,
        httpsAgent,
      }
    );

    let totalAvail = 0;
    let totalUsed = 0;
    let totalStorage = 0;

    const bytesToGB = (bytes: number): number => bytes / 1024 ** 3;

    let disk = storages.data.data;

    disk.forEach((storage: Storage) => {
      if (storage.type !== "local" && storage.storage !== "local-lvm") {
        totalAvail += storage.avail;
        totalUsed += storage.used || 0;
        totalStorage += storage.total;
      }
    });

    const resData = res.data.data;

    interface NodeData {
      maxmem: number;
      maxcpu: number;
      maxdisk: number;
      mem: number;
      cpu: number;
    }

    const totalMaxMem = resData.reduce(
      (acc: number, node: NodeData) => acc + node.maxmem,
      0
    );

    const totalUsedMem = resData.reduce(
      (acc: number, node: NodeData) => acc + node.mem,
      0
    );

    const totalMaxCpu = resData.reduce(
      (acc: number, node: NodeData) => acc + node.maxcpu,
      0
    );
    const totalUsedCpu = resData.reduce(
      (acc: number, node: NodeData) => acc + node.cpu,
      0
    );

    const data = {
      totalCPUMax: totalMaxCpu,
      totalUsedCpu: Math.round(totalUsedCpu * 100),
      totalRAMMax: bytesToGB(totalMaxMem).toFixed(2),
      totalUsedRAM: bytesToGB(totalUsedMem).toFixed(2),
      totalStorageDisk: bytesToGB(totalStorage).toFixed(2),
      totalStorageUsed: bytesToGB(totalUsed).toFixed(2),
    };

    return respondWithSuccess(
      "Berhasil mengambil data dari server proxmox",
      data,
      200
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.statusText) {
        console.log(axiosError.response.statusText);
        return respondWithError(`${axiosError.response.statusText}`, 500);
      } else {
        console.log(axiosError.message);
        return respondWithError(axiosError.message, 500);
      }
    } else {
      console.log("Unexpected error:", error);
      return respondWithError("An unexpected error occurred", 500);
    }
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

function respondWithError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function respondWithSuccess(message: string, data: any, status: number) {
  return NextResponse.json(
    {
      statusCode: status,
      message: message,
      data: data,
    },
    { status }
  );
}
