import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { respondWithError, respondWithSuccess } from "@/app/lib/Response";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const PROXY_URL = process.env.PROXY_URL || "http://proxy.intra.bca.co.id";
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";
const AUTH_API_URL = "https://api.bcafinance.co.id/authenticateuserv2";
const agent = new HttpsProxyAgent(PROXY_URL);

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  try {
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
      agent, // Menggunakan proxy
    });

    if (!apiResponse.ok) {
      const errorData = (await apiResponse.json()) as { message?: string };
      return new NextResponse(
        JSON.stringify({
          message: errorData.message || "Authentication failed",
        }),
        {
          status: apiResponse.status,
        }
      );
    }

    const authData = (await apiResponse.json()) as {
      AuthenticateUserRs?: {
        ResponseHeader?: {
          ErrorDescription?: string;
        };
      };
    };

    const ErrorDescription =
      authData.AuthenticateUserRs?.ResponseHeader?.ErrorDescription ||
      "Authentication failed";

    if (ErrorDescription !== "Success") {
      return new NextResponse(
        JSON.stringify({
          message: ErrorDescription,
        }),
        {
          status: 401,
        }
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
    console.error("Error during login:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500 }
    );
  }
}
