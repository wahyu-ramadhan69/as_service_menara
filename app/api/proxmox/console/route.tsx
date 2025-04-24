import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import https from "https";
import jwt, { JwtPayload } from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";
import { PrismaClient } from "@prisma/client";

interface MyJwtPayload extends JwtPayload {
  userId: number;
  role: string;
}
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { node, vmid } = await req.json();

  const token = extractTokenFromCookies(req);

  if (!token) {
    return respondWithError("Authorization token is missing", 401);
  }

  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    return respondWithError("Invalid or expired token", 401);
  }

  const { username, role, divisi } = decodedToken;

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const headers = {
    Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(
      `https://10.20.210.20:8006/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`,
      { websocket: 1, "generate-password": 1 },
      {
        headers,
        httpsAgent,
      }
    );

    const { port, password } = response.data.data;

    await prisma.logVM.create({
      data: {
        user: username,
        activity: "Console",
        vmid: Number(vmid),
        tujuan: "",
        divisi: divisi,
      },
    });
    return NextResponse.json({ port, password }, { status: 200 });
  } catch (error) {
    console.error("Failed to connect to Proxmox:", error);
    return NextResponse.json(
      { error: "Failed to connect to Proxmox" },
      { status: 500 }
    );
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

function respondWithSuccess(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}
