import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import https from "https";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface MyJwtPayload extends JwtPayload {
  userId: number;
  role: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const headers = {
    Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const token = extractTokenFromCookies(request);

    if (!token) {
      return respondWithError("Authorization token is missing", 401);
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return respondWithError("Invalid or expired token", 401);
    }

    const { divisi } = decodedToken;

    const poolResponse = await axios.get(
      `${process.env.PROXMOX_API_URL}/pools/${divisi}`,
      {
        headers,
        httpsAgent,
      }
    );

    const poolData = poolResponse.data.data;

    const vmInPool = poolData.members.find((member: any) => member.vmid == id);

    if (!vmInPool) {
      return respondWithError(
        `VM dengan ${id} tidak ditmukan di ${divisi}`,
        404
      );
    }

    const nodesResponse = await axios.get(
      `${process.env.PROXMOX_API_URL}/nodes`,
      {
        headers,
        httpsAgent,
      }
    );

    const nodes = nodesResponse.data.data;

    let targetNode = null;
    for (const node of nodes) {
      try {
        await axios.get(
          `${process.env.PROXMOX_API_URL}/nodes/${node.node}/qemu/${id}/status/current`,
          {
            headers,
            httpsAgent,
          }
        );
        targetNode = node.node;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!targetNode) {
      return respondWithError(`VM with ID ${id} not found in any node`, 404);
    }

    const vmResponse = await axios.get(
      `${process.env.PROXMOX_API_URL}/nodes/${targetNode}/qemu/${id}/status/current`,
      {
        headers,
        httpsAgent,
      }
    );

    await axios.get(
      `${process.env.PROXMOX_API_URL}/nodes/${targetNode}/qemu/${id}/config`,
      {
        headers,
        httpsAgent,
      }
    );

    if (!vmResponse.data) {
      return respondWithError("VM status data is empty", 500);
    }

    const data = {
      targetNode,
      vmStatus: vmResponse.data.data,
    };

    return NextResponse.json(
      { message: `Berhasil mengambil informasi VM dengan ID ${id}`, data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching VM information:", error);
    return NextResponse.json(
      { error: "Failed to fetch VM information" },
      { status: 500 }
    );
  }
}

function respondWithError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function respondWithSuccess(message: string, status: number) {
  return NextResponse.json({ message }, { status });
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
