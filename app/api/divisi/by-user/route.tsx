import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = "rahasia"; // Ganti dengan secret key yang lebih aman

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verifikasi token dan ambil userId dari token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    // Cari user berdasarkan userId dari token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { divisi: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ambil data divisi yang terkait dengan user tersebut
    const divisi = user.divisi;

    if (!divisi) {
      return NextResponse.json(
        { error: "Division not found" },
        { status: 404 }
      );
    }

    // Kirim response dengan data divisi
    return NextResponse.json({ divisi }, { status: 200 });
  } catch (error) {
    console.error("Error fetching division:", error);
    return NextResponse.json(
      { error: "Error fetching division" },
      { status: 500 }
    );
  }
}
