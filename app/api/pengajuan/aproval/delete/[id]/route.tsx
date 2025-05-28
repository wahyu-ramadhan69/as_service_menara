// /api/approval/delete/[id]/route.ts
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromCookies(req);
    if (!token) return respondWithError("Authorization token is missing", 401);

    const decoded = verifyToken(token);
    if (!decoded) return respondWithError("Invalid or expired token", 401);

    const { role } = decoded;
    if (role !== "HEAD") return respondWithError("Access denied", 403);

    const { id } = params;

    const pengajuan = await prisma.pengajuan.findUnique({
      where: { id: Number(id) },
    });
    if (!pengajuan) return respondWithError("Pengajuan not found", 404);

    const server = await prisma.server.findUnique({
      where: { vmid: pengajuan.vmid! },
    });
    if (!server) return respondWithError("Server not found", 404);

    const statusVM = await axios.get(
      `${process.env.PROXMOX_API_URL}/nodes/${pengajuan.nodes}/qemu/${pengajuan.vmid}/status/current`,
      { headers: proxmoxHeaders, httpsAgent }
    );

    if (statusVM.data.data.status === "running") {
      return respondWithError(
        `Shutdown VM ${pengajuan.vmid} before deleting the server.`,
        400
      );
    }

    await prisma.pengajuan.update({
      where: { id: Number(id) },
      data: { status_pengajuan: "Proses pengerjaan" },
    });

    await axios.delete(
      `${process.env.PROXMOX_API_URL}/nodes/${pengajuan.nodes}/qemu/${pengajuan.vmid}`,
      { headers: proxmoxHeaders, httpsAgent }
    );

    await prisma.ipAddress.update({
      where: { id: server.id_ip },
      data: { nama_server: "", status: "AVAILABLE" },
    });

    await prisma.server.delete({
      where: { vmid: pengajuan.vmid! },
    });

    const response = await prisma.pengajuan.update({
      where: { id: Number(id) },
      data: { status_pengajuan: "Selesai" },
    });

    return NextResponse.json(
      { message: "Server successfully deleted", data: response },
      { status: 200 }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.statusText || error.message);
    } else {
      console.error("Unexpected error:", error);
    }

    await prisma.pengajuan.update({
      where: { id: Number(params.id) },
      data: { status_pengajuan: "Error" },
    });

    return respondWithError("Internal server error", 500);
  }
}
