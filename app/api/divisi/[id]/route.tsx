import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import https from "https";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { cpu, storage, ram, nama_storage, head } = await req.json();

    if (/\s/.test(nama_storage)) {
      return NextResponse.json(
        {
          error: "Nama storage cannot contain spaces.",
        },
        { status: 400 }
      );
    }

    const divisi = await prisma.divisi.update({
      where: { id: Number(id) },
      data: {
        cpu,
        storage,
        ram,
        nama_storage,
        head,
      },
    });

    return NextResponse.json(
      {
        message: "Data updated successfully",
        data: divisi,
        statusCode: 201,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update divisi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const headers = {
      Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
      "Content-Type": "application/json",
    };

    const divisi = await prisma.divisi.findUnique({
      where: {
        id: Number(id),
      },
    });

    await axios.delete(
      `${process.env.PROXMOX_API_URL}/pools/${divisi?.nama}`,

      {
        headers,
        httpsAgent,
      }
    );

    const response = await prisma.divisi.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json(
      {
        message: "Divisi deleted successfully",
        data: response,
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error deleting divisi:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while deleting divisi";

    return NextResponse.json(
      {
        message: "Failed to delete divisi",
        data: errorMessage,
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
