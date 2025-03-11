// app/api/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { extractAndVerifyToken } from "@/app/lib/Auth";
import { respondWithError, respondWithSuccess } from "@/app/lib/Response";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const decodedToken = extractAndVerifyToken(req);
  if (!decodedToken) {
    return respondWithError("Invalid or missing token", 401);
  }
  const { role } = decodedToken;
  if (role != "ADMIN") {
    return respondWithError("You do not have access to this page", 401);
  }
  try {
    const { id } = params;
    const template = await prisma.template.findUnique({
      where: { id: Number(id) },
    });
    if (!template) {
      return respondWithError("Template not found", 404);
    }
    return respondWithSuccess("Data fetched successfully", template, 200);
  } catch (error: any) {
    console.error("Error fetching data:", error.message);

    return NextResponse.json(
      { error: error.message || "Failed to fetch data", statusCode: 500 },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const decodedToken = extractAndVerifyToken(req);
  if (!decodedToken) {
    return respondWithError("Invalid or missing token", 401);
  }
  const { role } = decodedToken;
  if (role != "ADMIN") {
    return respondWithError("You do not have access to this page", 401);
  }
  try {
    const body = await req.json();
    const { id } = params;

    const updatedTemplate = await prisma.template.update({
      where: { id: Number(id) },
      data: {
        nama_template: body.nama_template,
        type_os: body.type_os,
        vmid: body.vmid,
        nodes: body.nodes,
        keterangan: body.keterangan,
      },
    });

    return NextResponse.json(
      {
        message: "Template updated successfully",
        data: updatedTemplate,
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating template:", error.message);

    return NextResponse.json(
      { error: error.message || "Failed to update template", statusCode: 500 },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const decodedToken = extractAndVerifyToken(req);
  if (!decodedToken) {
    return respondWithError("Invalid or missing token", 401);
  }
  const { role } = decodedToken;
  if (role != "ADMIN") {
    return respondWithError("You do not have access to this page", 401);
  }
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required", statusCode: 400 },
        { status: 400 }
      );
    }

    await prisma.template.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json(
      {
        message: "Template deleted successfully",
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting template:", error.message);

    return NextResponse.json(
      { error: error.message || "Failed to delete template", statusCode: 500 },
      { status: 500 }
    );
  }
}
