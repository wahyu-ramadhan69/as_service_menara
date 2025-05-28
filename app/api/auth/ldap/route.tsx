import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { respondWithError, respondWithSuccess } from "@/app/lib/Response";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "rahasia";
const AUTH_API_URL =
  "http://10.4.198.249:10299/API/EnterpriseAuthentication/AuthenticateUserV2_PS";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  try {
    // Call the external authentication API
    const apiResponse = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Authorization: "Basic YmNhZmFwcHM6QWRtaW4xMjM=", // Base64 encoded auth, replace with your own if necessary
      },
      body: JSON.stringify({
        AuthenticateUserRq: {
          UserId: username,
          Password: password,
        },
      }),
    });

    // Check if the external API returned an error
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return new NextResponse(
        JSON.stringify({
          message: errorData.message || "Authentication failed",
        }),
        {
          status: apiResponse.status,
        }
      );
    }

    const authData = await apiResponse.json();
    const { ErrorDescription } = authData.AuthenticateUserRs.ResponseHeader;
    if (ErrorDescription !== "Success") {
      return new NextResponse(
        JSON.stringify({
          message: ErrorDescription || "Authentication failed",
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
