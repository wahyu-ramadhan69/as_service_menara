import axios from "axios";
import https from "https";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "rahasia";

interface MyJwtPayload extends JwtPayload {
  userId: number;
  role: string;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromCookies(req);

    if (!token) {
      return respondWithError("Authorization token is missing", 401);
    }

    const { id } = params;
    const prisma = new PrismaClient();
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return respondWithError("Invalid or expired token", 401);
    }

    const { userId, role } = decodedToken;

    if (role !== "HEAD") {
      return respondWithError(
        "You do not have access to perform this action",
        403
      );
    }

    const {
      type_os,
      cpu,
      ram,
      storage,
      segment,
      nama_aplikasi,
      jenis_pengajuan,
      vmid,
      node,
    } = await req.json();

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const headers = {
      Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
      "Content-Type": "application/json",
    };

    if (jenis_pengajuan === "New") {
      let ipAddress;
      let bridge: string;

      // Tentukan ipAddress dan bridge berdasarkan segment
      if (segment === "internal") {
        bridge = "vmbr0";
        ipAddress = await prisma.ipAddress.findFirst({
          where: {
            type: "INTERNAL",
            status: "AVAILABLE",
          },
        });
      } else if (segment === "backend") {
        bridge = "BE";
        ipAddress = await prisma.ipAddress.findFirst({
          where: {
            type: "BACKEND",
            status: "AVAILABLE",
          },
        });
      } else if (segment === "frontend") {
        bridge = "FE";
        ipAddress = await prisma.ipAddress.findFirst({
          where: {
            type: "FRONTEND",
            status: "AVAILABLE",
          },
        });
      }

      // Jika tidak ada IP Address yang tersedia
      if (!ipAddress) {
        return respondWithError(
          `No available IP address found for segment ${segment}`,
          400
        );
      }

      // Update status IP Address dan Pengajuan
      await prisma.ipAddress.update({
        where: { id: ipAddress.id },
        data: { nama_server: nama_aplikasi, status: "NOT_AVAILABLE" },
      });

      await prisma.pengajuan.update({
        where: { id: Number(id) },
        data: {
          status_pengajuan: "Proses pengerjaan",
        },
      });

      // Tentukan VM ID untuk cloning berdasarkan type OS
      let vmIdToClone;
      if (type_os === "Ubuntu") {
        vmIdToClone = 1000;
      } else if (type_os === "Windows") {
        vmIdToClone = 1001;
      } else if (type_os === "CentOS") {
        vmIdToClone = 1002;
      } else {
        return respondWithError(
          `Type OS yang kamu pilih tidak sesuai: ${type_os}`,
          400
        );
      }

      // Dapatkan node Proxmox dengan penggunaan terendah
      const nodesResponse = await axios.get(
        `${process.env.PROXMOX_API_URL}/nodes`,
        {
          headers,
          httpsAgent,
        }
      );

      const nodes = nodesResponse.data.data;

      let selectedNode = null;
      let minUsage = Infinity;

      for (const node of nodes) {
        const nodeStatusResponse = await axios.get(
          `${process.env.PROXMOX_API_URL}/nodes/${node.node}/status`,
          {
            headers,
            httpsAgent,
          }
        );

        const nodeStatus = nodeStatusResponse.data.data;
        const cpuUsage = nodeStatus.cpu;
        const ramUsage = nodeStatus.memory.used / nodeStatus.memory.total;

        const usageScore = cpuUsage + ramUsage;

        if (usageScore < minUsage) {
          minUsage = usageScore;
          selectedNode = node.node;
        }
      }

      if (!selectedNode) {
        return respondWithError(`No suitable node found for cloning.`, 401);
      }

      setImmediate(async () => {
        try {
          const vmListResponse = await axios.get(
            `${process.env.PROXMOX_API_URL}/cluster/resources?type=vm`,
            {
              headers,
              httpsAgent,
            }
          );

          const vmList = vmListResponse.data.data;

          let newid = 100;
          const usedIds = vmList.map((vm: { vmid: number }) => vm.vmid);

          while (usedIds.includes(newid)) {
            newid++;
          }

          const user = await prisma.user.findUnique({
            where: {
              id: userId,
            },
            include: {
              divisi: true,
            },
          });

          const NamaAplikasi = nama_aplikasi.replace(/\s+/g, "-");

          const data = {
            newid,
            name: `${ipAddress.ip}-${NamaAplikasi}`,
            target: `${selectedNode}`,
            full: 1,
            pool: user?.divisi.nama,
            storage: "G350",
          };

          await axios.post(
            `${process.env.PROXMOX_API_URL}/nodes/192-168-1-234/qemu/${vmIdToClone}/clone`,
            data,
            { headers, httpsAgent }
          );

          let taskFinished = false;

          while (!taskFinished) {
            try {
              const taskResponse = await axios.get(
                `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/status/current`,
                { headers, httpsAgent }
              );

              if (taskResponse.data.data.status === "stopped") {
                taskFinished = true;
              } else {
                await new Promise((resolve) => setTimeout(resolve, 5000));
              }
            } catch (error) {
              await new Promise((resolve) => setTimeout(resolve, 5000));
            }
          }

          await axios.put(
            `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/config`,
            {
              memory: ram,
              cores: cpu,
              net0: `virtio,bridge=${bridge}`,
            },
            { headers, httpsAgent }
          );

          await axios.put(
            `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/resize`,
            {
              disk: "scsi0",
              size: `+${storage - 40}G`,
            },
            { headers, httpsAgent }
          );

          await prisma.pengajuan.update({
            where: { id: Number(id) },
            data: {
              status_pengajuan: "Selesai",
            },
          });
        } catch (error) {
          return respondWithError(`Terjadi error tidak diketahui`, 500);
        }
      });
      return respondWithSuccess(`Server sedang dikerjakan.`, 200);
    } else if (jenis_pengajuan === "Existing") {
      try {
        await prisma.pengajuan.update({
          where: { id: Number(id) },
          data: {
            status_pengajuan: "Proses pengerjaan",
          },
        });

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
              `${process.env.PROXMOX_API_URL}/nodes/${node.node}/qemu/${vmid}/status/current`,
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
          return respondWithError(
            `VM with ID ${vmid} not found in any node`,
            404
          );
        }

        await axios.put(
          `${process.env.PROXMOX_API_URL}/nodes/${targetNode}/qemu/${vmid}/config`,
          {
            memory: ram,
            cores: cpu,
          },
          { headers, httpsAgent }
        );

        await axios.put(
          `${process.env.PROXMOX_API_URL}/nodes/${targetNode}/qemu/${vmid}/resize`,
          {
            disk: "scsi0",
            size: `+${storage}G`,
          },
          { headers, httpsAgent }
        );

        await prisma.pengajuan.update({
          where: { id: Number(id) },
          data: {
            status_pengajuan: "Selesai",
          },
        });

        return respondWithSuccess(
          `Berhasil mengkonfigurasi server ${vmid}`,
          200
        );
      } catch (error) {
        console.log(error);
      }
    } else if (jenis_pengajuan === "Delete") {
      await prisma.pengajuan.update({
        where: { id: Number(id) },
        data: {
          status_pengajuan: "Proses pengerjaan",
        },
      });

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
          // Try to get VM info from the node
          await axios.get(
            `${process.env.PROXMOX_API_URL}/nodes/${node.node}/qemu/${vmid}/status/current`,
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
        return respondWithError(
          `VM with ID ${vmid} not found in any node`,
          401
        );
      }

      await axios.delete(
        `${process.env.PROXMOX_API_URL}/nodes/${targetNode}/qemu/${vmid}`,
        { headers, httpsAgent }
      );

      await prisma.pengajuan.update({
        where: { id: Number(id) },
        data: {
          status_pengajuan: "Selesai",
        },
      });

      return respondWithSuccess(`Berhasil menghapus server ${vmid}`, 200);
    } else {
      return respondWithError(`Pengajuanmu tidak sesuai`, 400);
    }
  } catch (error) {
    return respondWithError(`Failed to create or update vm`, 500);
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
