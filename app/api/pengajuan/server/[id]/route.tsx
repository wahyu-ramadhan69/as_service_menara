import { PrismaClient } from "@prisma/client";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const server = await prisma.server.findUnique({
      where: {
        vmid: Number(id),
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Server tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Berhasil mengambil data server", data: server },
      { status: 200 }
    );
  } catch (error) {
    console.error("Prisma Error: ", error);
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
