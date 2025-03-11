import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { respondWithError, respondWithSuccess } from "@/app/lib/Response";
// import {Attribute} from 'ldapjs'

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        divisi: true,
      },
    });

    if (!user || !user.password) {
      return respondWithError("User not found", 404);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return respondWithError("Incorrect password", 401);
    }

    const token = jwt.sign(
      { username: user.username, role: user.role, divisi: user.divisi.nama },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const response = respondWithSuccess("Login successful", { token }, 200);
    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    console.error(error);
    return respondWithError("Error logging in", 500);
  }
}
