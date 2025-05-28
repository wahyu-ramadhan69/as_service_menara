// /api/approval/existing/[id]/route.ts
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import https from "https";
import jwt, { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface MyJwtPayload extends JwtPayload {
  userId: number;
  role: string;
  username: string;
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const proxmoxHeaders = {
  Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
  "Content-Type": "application/json",
};

function extractTokenFromCookies(req: NextRequest): string | undefined {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("="))
  );
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromCookies(req);
    if (!token) return respondWithError("Authorization token is missing", 401);

    const decoded = verifyToken(token);
    if (!decoded) return respondWithError("Invalid or expired token", 401);

    const { role, username } = decoded;
    if (role !== "HEAD") return respondWithError("Access denied", 403);

    const { id } = params;
    const { segment, nama_baru } = await req.json();

    const pengajuan = await prisma.pengajuan.findUnique({
      where: { id: Number(id) },
    });
    if (!pengajuan) return respondWithError("Pengajuan not found", 404);

    const existingTask = await prisma.pengajuan.findFirst({
      where: {
        vmid_old: pengajuan.vmid_old,
        status_pengajuan: "Proses pengerjaan",
      },
      orderBy: { id: "desc" },
    });
    if (existingTask) {
      return respondWithError(
        `VM with ID ${pengajuan.vmid_old} is currently being cloned or has an ongoing task.`,
        400
      );
    }

    let segmentHost: any;
    let bridge: string;
    if (segment === "internal") {
      segmentHost = "INTERNAL";
      bridge = "INT";
    } else if (segment === "backend") {
      segmentHost = "BACKEND";
      bridge = "BE";
    } else if (segment === "frontend") {
      segmentHost = "FRONTEND";
      bridge = "FE";
    } else {
      return respondWithError("Invalid segment", 400);
    }

    const ipAddress = await prisma.ipAddress.findFirst({
      where: { type: segmentHost, status: "AVAILABLE" },
    });
    if (!ipAddress)
      return respondWithError(`No available IP for segment ${segment}`, 404);

    const nodes = await prisma.host.findMany({
      where: { segment: segmentHost },
      select: { nama: true },
    });
    if (nodes.length === 0) return respondWithError("No hosts found", 404);

    let selectedNode = null;
    let minUsage = Infinity;

    for (const node of nodes) {
      const nodeStatusResponse = await axios.get(
        `${process.env.PROXMOX_API_URL}/nodes/${node.nama}/status`,
        { headers: proxmoxHeaders, httpsAgent }
      );
      const { cpu, memory } = nodeStatusResponse.data.data;
      const usageScore = cpu + memory.used / memory.total;
      if (usageScore < minUsage) {
        minUsage = usageScore;
        selectedNode = node.nama;
      }
    }

    if (!selectedNode) return respondWithError("No suitable node found", 404);

    const server = await prisma.server.findUnique({
      where: { vmid: pengajuan.vmid_old! },
    });
    if (!server) return respondWithError("Original server not found", 404);

    const user = await prisma.user.findUnique({
      where: { username },
      include: { divisi: true },
    });

    await prisma.ipAddress.update({
      where: { id: ipAddress.id },
      data: { nama_server: nama_baru, status: "NOT_AVAILABLE" },
    });

    const response = await prisma.pengajuan.update({
      where: { id: Number(id) },
      data: {
        status_pengajuan: "Proses pengerjaan",
      },
      include: {
        template: true,
      },
    });

    setImmediate(async () => {
      try {
        const vmListResponse = await axios.get(
          `${process.env.PROXMOX_API_URL}/cluster/resources?type=vm`,
          { headers: proxmoxHeaders, httpsAgent }
        );
        const vmList = vmListResponse.data.data;
        let newid = 100;
        const usedIds = vmList.map((vm: { vmid: number }) => vm.vmid);
        while (usedIds.includes(newid)) newid++;

        await prisma.server.create({
          data: {
            vmid: newid,
            id_template: server.id_template,
            id_ip: ipAddress.id,
            segment,
            user: pengajuan.user,
            divisi: pengajuan.divisi,
          },
        });

        const nodeVM =
          vmList.find((vm: { vmid: number }) => vm.vmid == pengajuan.vmid_old)
            ?.node || "";

        const NamaAplikasi = nama_baru.replace(/\s+/g, "-");

        const clone = await axios.post(
          `${process.env.PROXMOX_API_URL}/nodes/${nodeVM}/qemu/${pengajuan.vmid_old}/clone`,
          {
            newid,
            name: NamaAplikasi,
            target: selectedNode,
            full: 1,
            pool: pengajuan.divisi,
            storage: user?.divisi.nama_storage,
          },
          { headers: proxmoxHeaders, httpsAgent }
        );

        const cloneId = clone.data.data;
        const encodedUpid = encodeURIComponent(cloneId);

        let taskFinished = false;
        while (!taskFinished) {
          const statusResponse = await axios.get(
            `${process.env.PROXMOX_API_URL}/nodes/${nodeVM}/tasks/${encodedUpid}/status`,
            { headers: proxmoxHeaders, httpsAgent }
          );
          console.log(statusResponse.data.data.status);
          if (statusResponse.data.data.status === "stopped") {
            taskFinished = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }

        await axios.put(
          `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/config`,
          {
            net0: `virtio,bridge=${bridge}`,
          },
          { headers: proxmoxHeaders, httpsAgent }
        );

        await axios.post(
          `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/status/start`,
          {},
          { headers: proxmoxHeaders, httpsAgent }
        );

        await prisma.pengajuan.update({
          where: { id: Number(id) },
          data: {
            status_pengajuan: "Selesai",
            vmid: newid,
          },
        });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(error.response?.statusText || error.message);
          await prisma.pengajuan.update({
            where: { id: Number(id) },
            data: { status_pengajuan: "Error" },
          });
        } else {
          console.error("Unexpected error:", error);
        }
      }
    });

    return NextResponse.json(
      {
        message: "Server is being created it will take 10 to 15 minutes",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return respondWithError("Internal server error", 500);
  }
}
