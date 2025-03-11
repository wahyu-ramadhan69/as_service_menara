import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import https from "https";

const prisma = new PrismaClient();

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const headers = {
  Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
  "Content-Type": "application/json",
};

export async function GET(req: NextRequest) {
  try {
    const divisies = await prisma.divisi.findMany();

    const storageResponse = await axios.get(
      `${process.env.PROXMOX_API_URL}/storage`,
      {
        headers,
        httpsAgent,
      }
    );

    const storage = storageResponse.data.data;

    const data = {
      divisies,
      storage,
    };

    return NextResponse.json(
      {
        message: "Data fetched successfully",
        data: data,
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching data:", error.message);

    return NextResponse.json(
      { error: error.message || "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { nama, cpu, storage, ram, nama_storage, head } = await req.json();

  // Validate that 'nama' does not contain spaces
  if (/\s/.test(nama)) {
    return NextResponse.json(
      {
        error: "Nama cannot contain spaces.",
      },
      { status: 400 }
    );
  }

  try {
    const divisi = await prisma.divisi.create({
      data: {
        nama,
        cpu,
        storage,
        ram,
        nama_storage,
        head,
      },
    });
    await axios.post(
      `${process.env.PROXMOX_API_URL}/pools`,
      {
        poolid: nama,
      },
      {
        headers,
        httpsAgent,
      }
    );
    return NextResponse.json(
      {
        message: "Divisi created successfully",
        data: divisi,
        statusCode: 201,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: `Failed to create divisi: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
