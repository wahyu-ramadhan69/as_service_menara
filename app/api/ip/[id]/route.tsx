import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { ip, nama_server, status, type } = await req.json();

    // Validasi ID
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updatedIpInternal = await prisma.ipAddress.update({
      where: { id: Number(id) },
      data: {
        ip,
        nama_server,
        status,
        type,
      },
    });

    return NextResponse.json(
      { message: "Ip address berhasil ditambahkan", data: updatedIpInternal },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prisma Error: ", error); // Log seluruh error untuk detail lebih lanjut
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}
