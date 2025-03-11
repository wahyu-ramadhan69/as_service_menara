// app/api/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { respondWithError, respondWithSuccess } from "@/app/lib/Response";
import jwt from "jsonwebtoken";

interface MyJwtPayload {
  username: string;
  role: string;
  divisi: string;
}

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const decodedToken = extractAndVerifyToken(req);

    if (!decodedToken) {
      return respondWithError("Invalid or missing token", 401);
    }

    const templates = await prisma.template.findMany();

    return respondWithSuccess("Data fetched successfully", templates, 200);
  } catch (error: any) {
    return respondWithError(error.message || "Failed to fetch data", 500);
  }
}

export async function POST(req: Request) {
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

    const newTemplate = await prisma.template.create({
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
        message: "Template created successfully",
        data: newTemplate,
        statusCode: 201,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating template:", error.message);

    return NextResponse.json(
      { error: error.message || "Failed to create template", statusCode: 500 },
      { status: 500 }
    );
  }
}

function extractAndVerifyToken(req: Request): MyJwtPayload | null {
  const JWT_SECRET = process.env.JWT_SECRET as string;

  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split("=");
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies?.token;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as MyJwtPayload;
  } catch {
    return null;
  }
}
