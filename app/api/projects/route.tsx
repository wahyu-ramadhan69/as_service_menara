import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import https from "https";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface MyJwtPayload extends JwtPayload {
  userId: number;
  role: string;
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const headers = {
  Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
  "Content-Type": "application/json",
};

interface VM {
  vmid: number;
  name: string;
  status: string;
  maxcpu: number;
  maxmem: number;
  maxdisk: number;
  uptime: number;
  netout: number;
  netin: number;
  mem: number;
  diskread: number;
  diskwrite: number;
  node: string;
  cpu: number;
  type: string;
  template: number;
}

export async function GET(req: Request) {
  try {
    const token = extractTokenFromCookies(req);

    if (!token) {
      return respondWithError("Authorization token is missing", 401);
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return respondWithError("Invalid or expired token", 401);
    }

    const { username, role, divisi } = decodedToken;

    const isConnected = await testProxmoxConnection();
    if (!isConnected) {
      return respondWithError("Failed to connect to Proxmox server", 500);
    }

    const response = await axios.get(
      `${process.env.PROXMOX_API_URL}/pools/${divisi}`,
      {
        headers,
        httpsAgent,
      }
    );

    const server = await prisma.server.findMany({
      include: {
        ip_address: {
          select: {
            ip: true,
          },
        },
        template: {
          select: {
            type_os: true,
          },
        },
      },
    });

    const mergedData = response.data.data.members.map((vm: VM) => {
      const matchedServer = server.find((srv) => srv.vmid === vm.vmid);
      return {
        vmid: vm.vmid,
        name: vm.name,
        status: vm.status,
        maxcpu: vm.maxcpu,
        maxmem: vm.maxmem,
        maxdisk: vm.maxdisk,
        node: vm.node,
        type_os: matchedServer ? matchedServer.template.type_os : "Unknown",
        username: matchedServer ? matchedServer.user : "Unknown",
        ip: matchedServer ? matchedServer.ip_address.ip : "Unknown",
        id_ip: matchedServer ? matchedServer.id_ip : "Unknown",
        segment: matchedServer ? matchedServer.segment : "Ip Not Found",
      };
    });

    const responseData = {
      mergedData,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching pengajuan:", error);
    return respondWithError("Failed to fetch pengajuan", 500);
  }
}

async function testProxmoxConnection() {
  try {
    const testResponse = await axios.get(
      `${process.env.PROXMOX_API_URL}/nodes`,
      {
        headers,
        httpsAgent,
      }
    );
    return testResponse.status === 200;
  } catch (error) {
    console.error("Error testing Proxmox connection:", error);
    return false;
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
