import axios, { AxiosError } from "axios";
import https from "https";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface MyJwtPayload extends JwtPayload {
  userId: number;
  role: string;
}

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { tujuan, node } = await req.json();
    const token = extractTokenFromCookies(req);

    if (!token) {
      return respondWithError("Authorization token is missing", 401);
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return respondWithError("Invalid or expired token", 401);
    }

    const { username, divisi } = decodedToken;

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const headers = {
      Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
      "Content-Type": "application/json",
    };

    const shutdown = await axios.post(
      `${process.env.PROXMOX_API_URL}/nodes/${node}/qemu/${id}/status/stop`,
      {},
      { headers, httpsAgent }
    );

    let taskFinished = false;
    while (!taskFinished) {
      const statusResponse = await axios.get(
        `${process.env.PROXMOX_API_URL}/nodes/${node}/qemu/${id}/status/current`,
        {
          headers,
          httpsAgent,
        }
      );
      if (statusResponse.data.data.status === "stopped") {
        taskFinished = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    await prisma.logVM.create({
      data: {
        user: username,
        divisi: divisi,
        activity: "PowerOff",
        vmid: Number(id),
        tujuan,
      },
    });

    return respondWithSuccess(
      `VM with ID ${id} has been shut down successfully`,
      200
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.statusText) {
        console.log(axiosError.response.statusText);
        return respondWithError(`${axiosError.response.statusText}`, 500);
      } else {
        console.log(axiosError.message);
        return respondWithError(axiosError.message, 500);
      }
    } else {
      console.log("Unexpected error:", error);
      return respondWithError("An unexpected error occurred", 500);
    }
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

function respondWithSuccess(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}
