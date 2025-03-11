import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import https from "https";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia"; // Ensure to use an environment variable for security

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

    const quota = await prisma.divisi.findUnique({
      where: {
        nama: divisi,
      },
    });

    const response = await axios.get(
      `${process.env.PROXMOX_API_URL}/pools/${divisi}`,
      {
        headers,
        httpsAgent,
      }
    );

    type Member = {
      maxcpu: number;
      maxmem: number;
      maxdisk: number;
    };

    const members: Member[] = response.data.data.members;

    const totalMaxCpu = members.reduce(
      (acc: number, vm: Member) => acc + vm.maxcpu,
      0
    );
    const totalMaxMemGB = members.reduce(
      (acc: number, vm: Member) => acc + vm.maxmem / (1024 * 1024 * 1024),
      0
    );
    const totalMaxDiskGB = members.reduce(
      (acc: number, vm: Member) => acc + vm.maxdisk / (1024 * 1024 * 1024),
      0
    );

    const responseData = {
      quota,
      totalMaxCpu,
      totalMaxMemGB: Math.floor(totalMaxMemGB),
      totalMaxDiskGB: Math.floor(totalMaxDiskGB),
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching pengajuan:", error);
    return respondWithError("Failed to fetch pengajuan", 500);
  }
}

// Utility functions
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
