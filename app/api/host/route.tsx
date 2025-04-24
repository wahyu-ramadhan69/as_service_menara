import { NextResponse } from "next/server";
import { PrismaClient, Segment } from "@prisma/client";

const prisma = new PrismaClient();

// Response handler
function respondWithError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function respondWithSuccess(message: string, status: number, data?: any) {
  return NextResponse.json({ message, data }, { status });
}

// GET: Fetch all hosts with pagination
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [hosts, total] = await Promise.all([
      prisma.host.findMany({
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.host.count(),
    ]);

    return respondWithSuccess("Successfully fetched hosts", 200, {
      data: hosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return respondWithError("Failed to fetch hosts", 500);
  }
}

// POST: Create new host
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama, segment } = body;

    if (!nama || !segment) {
      return respondWithError("Missing required fields: nama, segment", 400);
    }

    const createdHost = await prisma.host.create({
      data: {
        nama,
        segment: segment.toUpperCase() as Segment,
      },
    });

    return respondWithSuccess("Host created successfully", 201, createdHost);
  } catch (error) {
    return respondWithError("Failed to create host", 500);
  }
}

// PUT: Update host by ID
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nama, segment } = body;

    if (!id || !nama || !segment) {
      return respondWithError(
        "Missing required fields: id, nama, segment",
        400
      );
    }

    const updatedHost = await prisma.host.update({
      where: { id: Number(id) },
      data: {
        nama,
        segment: segment.toUpperCase() as Segment,
      },
    });

    return respondWithSuccess("Host updated successfully", 200, updatedHost);
  } catch (error) {
    return respondWithError("Failed to update host", 500);
  }
}

// DELETE: Delete host by ID (from query string)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return respondWithError("Missing host id in query", 400);
    }

    await prisma.host.delete({
      where: { id: Number(id) },
    });

    return respondWithSuccess("Host deleted successfully", 200);
  } catch (error) {
    return respondWithError("Failed to delete host", 500);
  }
}
