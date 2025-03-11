import https from "https";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { respondWithError } from "@/app/lib/Response";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface MyJwtPayload {
  username: string;
  role: string;
  divisi: string;
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
  const decodedToken = extractAndVerifyToken(req);

  if (!decodedToken) {
    return respondWithError("Invalid or expired token", 401);
  }

  const { role } = decodedToken;

  if (role != "ADMIN") {
    respondWithError("you do not have access to this page", 401);
  }

  const isConnected = await testProxmoxConnection();
  if (!isConnected) {
    return respondWithError("Failed to connect to Proxmox server", 500);
  }

  try {
    const response = await axios.get(
      `${process.env.PROXMOX_API_URL}/cluster/resources?type=vm`,
      {
        headers,
        httpsAgent,
      }
    );

    const server = await prisma.server.findMany({
      include: {
        ip_address: true,
        template: true,
      },
    });

    const mergedData = response.data.data.map((vm: VM) => {
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
    console.error("Error fetching VMs:", error);
    return new Response(JSON.stringify({ error: "Error fetching VMs" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
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

function extractAndVerifyToken(req: Request): MyJwtPayload | null {
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
