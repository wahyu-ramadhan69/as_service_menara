import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vmid, nama_server, segment, id_template, user, divisi } = body;

    console.log(vmid, nama_server, segment, id_template, user, divisi);

    if (!vmid || !id_template || !user || !divisi) {
      return NextResponse.json(
        { error: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    const existingServer = await prisma.server.findUnique({
      where: { vmid },
    });

    if (existingServer) {
      return NextResponse.json(
        { error: "VMID sudah diregistrasi." },
        { status: 400 }
      );
    }

    let ipAddress;

    if (segment === "internal") {
      ipAddress = await prisma.ipAddress.findFirst({
        where: {
          type: "INTERNAL",
          status: "AVAILABLE",
        },
      });
    } else if (segment === "backend") {
      ipAddress = await prisma.ipAddress.findFirst({
        where: {
          type: "BACKEND",
          status: "AVAILABLE",
        },
      });
    } else if (segment === "frontend") {
      ipAddress = await prisma.ipAddress.findFirst({
        where: {
          type: "FRONTEND",
          status: "AVAILABLE",
        },
      });
    }

    if (!ipAddress) {
      return respondWithError(
        `No available IP address found for segment ${segment}`,
        404
      );
    }

    await prisma.ipAddress.update({
      where: { id: ipAddress.id },
      data: { nama_server, status: "NOT_AVAILABLE" },
    });

    await prisma.server.create({
      data: {
        vmid: vmid,
        id_template: Number(id_template),
        id_ip: ipAddress.id,
        segment: segment,
        user: user,
        divisi: divisi,
      },
    });

    return respondWithSuccess("Server berhasil di register", 201);
  } catch (error) {
    console.error("Error saat membuat server:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

function respondWithError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function respondWithSuccess(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}
