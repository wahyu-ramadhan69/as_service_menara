import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface MyJwtPayload extends JwtPayload {
  userId: number;
  role: string;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromCookies(req);

    if (!token) {
      return respondWithError("Authorization token is missing", 401);
    }

    const { id } = params;
    const prisma = new PrismaClient();
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return respondWithError("Invalid or expired token", 401);
    }

    const { role } = decodedToken;

    if (role !== "HEAD") {
      return respondWithError(
        "You do not have access to perform this action",
        403
      );
    }

    const response = await prisma.pengajuan.update({
      where: { id: Number(id) },
      data: {
        status_pengajuan: "Reject",
      },
    });

    return NextResponse.json(
      { message: "Berhasil mereject pengajuan.", data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create or update vm" },
      { status: 500 }
    );
  }
}

function extractTokenFromCookies(req: Request): string | undefined {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split("=");
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);

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
