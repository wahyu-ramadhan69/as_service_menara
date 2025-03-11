import { PrismaClient, IpType, Status, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const internal = await prisma.ipAddress.findMany();
    return NextResponse.json(internal, { status: 200 });
  } catch (error) {
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

export async function POST(req: NextRequest) {
  try {
    const { ip, nama_server, status, type } = await req.json();

    if (!Object.values(IpType).includes(type)) {
      return NextResponse.json({ error: "Invalid IP type" }, { status: 400 });
    }

    if (!Object.values(Status).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const response = await prisma.ipAddress.create({
      data: {
        ip,
        nama_server,
        status,
        type,
      },
    });

    return NextResponse.json(
      { message: "Ip address berhasil ditambahkan", data: response },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: `IP sudah ada. Silakan gunakan IP yang berbeda.` },
        { status: 400 }
      );
    } else if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}

function newResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}
