import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { respondWithError, respondWithSuccess } from "@/app/lib/Response";
import fetch from "node-fetch"; // Gunakan node-fetch
import { HttpsProxyAgent } from "https-proxy-agent";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "rahasia";
const AUTH_API_URL = "https://api.bcafinance.co.id/authenticateuserv2";

// Konfigurasi Proxy
const PROXY_URL = process.env.PROXY_URL || "http://10.1.10.50:8080"; // Proxy yang benar
const agent = new HttpsProxyAgent(PROXY_URL); // Buat proxy agent

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  try {
    console.log("Menggunakan proxy:", PROXY_URL);
    const apiResponse = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: "Basic YmNhZmFwcHM6QWRtaW4xMjM=", // Base64 encoded auth
      },
      body: JSON.stringify({
        AuthenticateUserRq: {
          UserId: username,
          Password: password,
        },
      }),
      agent,
    });

    const contentType = apiResponse.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const errorText = await apiResponse.text(); // Ambil teks HTML yang dikembalikan server
      console.error("Unexpected response format:", errorText);
      return new NextResponse(
        JSON.stringify({ message: "Invalid response format" }),
        { status: 500 }
      );
    }

    if (!apiResponse.ok) {
      const errorData = (await apiResponse.json()) as { message?: string };
      return new NextResponse(
        JSON.stringify({
          message: errorData.message || "Authentication failed",
        }),
        { status: apiResponse.status }
      );
    }

    const authData = (await apiResponse.json()) as {
      AuthenticateUserRs: {
        ResponseHeader: { ErrorDescription: string };
      };
    };

    const { ErrorDescription } = authData.AuthenticateUserRs.ResponseHeader;
    if (ErrorDescription !== "Success") {
      return new NextResponse(
        JSON.stringify({
          message: ErrorDescription || "Authentication failed",
        }),
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        divisi: true,
      },
    });

    if (!user) {
      return respondWithError("User not found", 404);
    }

    const token = jwt.sign(
      {
        username: user.username,
        role: user.role,
        divisi: user.divisi.nama,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
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
    console.error("Error during login:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500 }
    );
  }
}
