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
    const token = extractTokenFromCookies(req);

    if (!token) {
      return respondWithError("Authorization token is missing", 401);
    }

    const { id } = params;
    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      return respondWithError("Invalid or expired token", 401);
    }

    const { username, role } = decodedToken;

    if (role !== "HEAD") {
      return respondWithError(
        "You do not have access to perform this action",
        403
      );
    }

    const {
      storage,
      segment,
      nama_aplikasi,
      jenis_pengajuan,
      vmid,
      nama_baru,
      vmid_old,
    } = await req.json();

    const pengajuan = await prisma.pengajuan.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        template: true,
      },
    });

    if (!pengajuan) {
      return respondWithError(
        "Pengajuan dengan id tersebut tidak ditemukan",
        404
      );
    }

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const headers = {
      Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
      "Content-Type": "application/json",
    };

    if (pengajuan.jenis_pengajuan === "New") {
      let selectedNode = null;
      let minUsage = Infinity;

      let ipAddress;
      let bridge: string;
      let segmentHost: any;

      if (pengajuan.segment === "internal") {
        segmentHost = "INTERNAL";
        bridge = "INT";
        ipAddress = await prisma.ipAddress.findFirst({
          where: {
            type: "INTERNAL",
            status: "AVAILABLE",
          },
        });
      } else if (pengajuan.segment === "backend") {
        segmentHost = "BACKEND";
        bridge = "BE";
        ipAddress = await prisma.ipAddress.findFirst({
          where: {
            type: "BACKEND",
            status: "AVAILABLE",
          },
        });
      } else if (pengajuan.segment === "frontend") {
        segmentHost = "FRONTEND";
        bridge = "FE";
        ipAddress = await prisma.ipAddress.findFirst({
          where: {
            type: "FRONTEND",
            status: "AVAILABLE",
          },
        });
      }

      const nodes = await prisma.host.findMany({
        where: {
          segment: segmentHost,
        },
        select: {
          nama: true, // kita hanya butuh nama host
        },
      });

      if (nodes.length === 0) {
        return new Response("No hosts found for the specified segment", {
          status: 404,
        });
      }

      for (const node of nodes) {
        const nodeStatusResponse = await axios.get(
          `${process.env.PROXMOX_API_URL}/nodes/${node.nama}/status`,
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
          selectedNode = node.nama;
        }
      }

      if (!ipAddress) {
        return respondWithError(
          `No available IP address found for segment ${pengajuan.segment}`,
          404
        );
      }

      const template = await prisma.template.findUnique({
        where: {
          id: Number(pengajuan.id_template),
        },
      });

      if (!template) {
        return respondWithError(
          `No available template found for id ${pengajuan.id_template}`,
          404
        );
      }

      // await prisma.ipAddress.update({
      //   where: { id: ipAddress.id },
      //   data: { nama_server: nama_aplikasi, status: "NOT_AVAILABLE" },
      // });

      // const response = await prisma.pengajuan.update({
      //   where: { id: Number(id) },
      //   include: {
      //     template: true,
      //   },
      //   data: {
      //     status_pengajuan: "Proses pengerjaan",
      //   },
      // });

      // if (!selectedNode) {
      //   return respondWithError(`No suitable node found for cloning.`, 401);
      // }

      setImmediate(async () => {
        try {
          // const vmListResponse = await axios.get(
          //   `${process.env.PROXMOX_API_URL}/cluster/resources?type=vm`,
          //   {
          //     headers,
          //     httpsAgent,
          //   }
          // );
          // const vmList = vmListResponse.data.data;
          // let newid = 100;
          // const usedIds = vmList.map((vm: { vmid: number }) => vm.vmid);
          // while (usedIds.includes(newid)) {
          //   newid++;
          // }
          // const server = await prisma.server.create({
          //   data: {
          //     vmid: newid,
          //     id_template: Number(pengajuan.id_template),
          //     id_ip: ipAddress.id,
          //     segment: segment,
          //     user: pengajuan.user,
          //     divisi: pengajuan.divisi,
          //   },
          // });
          // const user = await prisma.user.findUnique({
          //   where: {
          //     username: username,
          //   },
          //   include: {
          //     divisi: true,
          //   },
          // });
          // const NamaAplikasi = nama_aplikasi.replace(/\s+/g, "-");
          // const data = {
          //   newid,
          //   name: `${NamaAplikasi}`,
          //   target: `${selectedNode}`,
          //   full: 1,
          //   pool: pengajuan.divisi,
          //   storage: `${user?.divisi.nama_storage}`,
          // };
          // const clone = await axios.post(
          //   `${process.env.PROXMOX_API_URL}/nodes/${template.nodes}/qemu/${template.vmid}/clone`,
          //   data,
          //   { headers, httpsAgent }
          // );
          // let taskFinished = false;
          // const upid = clone.data.data;
          // const encodedUpid = encodeURIComponent(upid);
          // while (!taskFinished) {
          //   const statusResponse = await axios.get(
          //     `${process.env.PROXMOX_API_URL}/nodes/${template.nodes}/tasks/${encodedUpid}/status`,
          //     {
          //       headers,
          //       httpsAgent,
          //     }
          //   );
          //   if (statusResponse.data.data.status === "stopped") {
          //     taskFinished = true;
          //   } else {
          //     await new Promise((resolve) => setTimeout(resolve, 5000));
          //   }
          // }
          // const config = await axios.put(
          //   `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/config`,
          //   {
          //     memory: String(pengajuan.ram),
          //     cores: Number(pengajuan.cpu),
          //     net0: `virtio,bridge=${bridge}`,
          //   },
          //   { headers, httpsAgent }
          // );
          // const resize = await axios.put(
          //   `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/resize`,
          //   {
          //     disk: "scsi0",
          //     size: `+${storage - 40}G`,
          //   },
          //   { headers, httpsAgent }
          // );
          // const startVm = await axios.post(
          //   `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/status/start`,
          //   {},
          //   { headers, httpsAgent }
          // );
          // await prisma.pengajuan.update({
          //   where: { id: Number(id) },
          //   data: {
          //     status_pengajuan: "Selesai",
          //     vmid: newid,
          //   },
          // });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response && axiosError.response.statusText) {
              console.log(axiosError.response.statusText);
              await prisma.pengajuan.update({
                where: { id: Number(id) },
                data: {
                  status_pengajuan: "Error",
                },
              });
              return respondWithError(`${axiosError.response.statusText}`, 500);
            } else {
              console.log(axiosError.message);
            }
          } else {
            console.log("Unexpected error:", error);
          }
        }
      });

      return NextResponse.json(
        {
          message: "Server is being created it will take 10 to 15 minutes",
          data: "ok",
        },
        { status: 200 }
      );
    } else if (jenis_pengajuan === "Existing") {
      const taskOngoig = await prisma.pengajuan.findFirst({
        where: {
          vmid_old: pengajuan.vmid_old,
          status_pengajuan: "Proses pengerjaan",
        },
        orderBy: {
          id: "desc",
        },
      });
      if (taskOngoig) {
        return respondWithError(
          `VM with ID ${pengajuan.vmid_old} is currently being cloned or has another ongoing task.`,
          400
        );
      }

      const server = await prisma.server.findUnique({
        where: {
          vmid: Number(pengajuan.vmid_old),
        },
        select: {
          id_template: true,
        },
      });

      if (!server) {
        return respondWithError(`Server clonig tidak ditemukan`, 404);
      }

      let ipAddress;
      let selectedNode = null;
      if (pengajuan.segment === "internal") {
        selectedNode = "proxmox3";
        ipAddress = await prisma.ipAddress.findFirst({
          where: {
            type: "INTERNAL",
            status: "AVAILABLE",
          },
        });
      } else if (pengajuan.segment === "backend") {
        selectedNode = "proxmox2";
        ipAddress = await prisma.ipAddress.findFirst({
          where: {
            type: "BACKEND",
            status: "AVAILABLE",
          },
        });
      } else if (pengajuan.segment === "frontend") {
        selectedNode = "proxmox3";
        ipAddress = await prisma.ipAddress.findFirst({
          where: {
            type: "FRONTEND",
            status: "AVAILABLE",
          },
        });
      }

      if (!ipAddress) {
        return respondWithError(
          `No available IP address found for segment ${pengajuan.segment}`,
          400
        );
      }

      const response = await prisma.pengajuan.update({
        where: { id: Number(id) },
        data: {
          status_pengajuan: "Proses pengerjaan",
        },
        include: {
          template: true,
        },
      });

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

          await prisma.ipAddress.update({
            where: { id: ipAddress.id },
            data: { nama_server: nama_baru, status: "NOT_AVAILABLE" },
          });

          const user = await prisma.user.findUnique({
            where: {
              username: username,
            },
            include: {
              divisi: true,
            },
          });

          await prisma.server.create({
            data: {
              vmid: newid,
              id_template: Number(server.id_template),
              id_ip: ipAddress.id,
              segment: segment,
              user: pengajuan.user,
              divisi: pengajuan.divisi,
            },
          });

          const nodeVM =
            vmList.find((vm: { vmid: any }) => vm.vmid == vmid_old)?.node ||
            null;

          const NamaAplikasi = nama_baru.replace(/\s+/g, "-");

          const data = {
            newid,
            name: `${NamaAplikasi}`,
            target: `${selectedNode}`,
            full: 1,
            pool: pengajuan.divisi,
            storage: `${user?.divisi.nama_storage}`,
          };

          const clone = await axios.post(
            `${process.env.PROXMOX_API_URL}/nodes/${nodeVM}/qemu/${vmid_old}/clone`,
            data,
            { headers, httpsAgent }
          );

          const upid = clone.data.data;

          const encodedUpid = encodeURIComponent(upid);

          let taskFinished = false;

          while (!taskFinished) {
            const statusResponse = await axios.get(
              `${process.env.PROXMOX_API_URL}/nodes/${nodeVM}/tasks/${encodedUpid}/status`,
              {
                headers,
                httpsAgent,
              }
            );
            if (statusResponse.data.data.status === "stopped") {
              taskFinished = true;
            } else {
              await new Promise((resolve) => setTimeout(resolve, 5000));
            }
          }

          await axios.post(
            `${process.env.PROXMOX_API_URL}/nodes/${selectedNode}/qemu/${newid}/status/start`,
            {},
            { headers, httpsAgent }
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
            const axiosError = error as AxiosError;
            if (axiosError.response && axiosError.response.statusText) {
              console.log(axiosError.response.statusText);
              await prisma.pengajuan.update({
                where: { id: Number(id) },
                data: {
                  status_pengajuan: "Error",
                },
              });
              return respondWithError(`${axiosError.response.statusText}`, 500);
            } else {
              console.log(axiosError.message);
            }
          } else {
            console.log("Unexpected error:", error);
          }
        }
      });
      return NextResponse.json(
        {
          message: "Server is being created it will take 10 to 15 minutes.",
          data: response,
        },
        { status: 200 }
      );
    } else if (jenis_pengajuan === "Perubahan") {
      try {
        const server = await prisma.server.findUnique({
          where: {
            vmid: vmid,
          },
        });

        if (!server) {
          return respondWithError(
            `Server dengan id${vmid} tidak ditemukan`,
            400
          );
        }

        let bridge: string = "";

        if (segment != server.segment) {
          let ipAddress;
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

          if (!ipAddress) {
            return respondWithError(
              `No available IP address found for segment ${segment}`,
              400
            );
          }

          await prisma.ipAddress.update({
            where: { id: server.id_ip },
            data: { nama_server: "", status: "AVAILABLE" },
          });

          await prisma.ipAddress.update({
            where: { id: ipAddress.id },
            data: { nama_server: nama_aplikasi, status: "NOT_AVAILABLE" },
          });

          await prisma.server.update({
            where: { vmid },
            data: { id_ip: ipAddress.id },
          });
        }

        await prisma.pengajuan.update({
          where: { id: Number(id) },
          data: {
            status_pengajuan: "Proses pengerjaan",
          },
        });

        const vmResponse = await axios.get(
          `${process.env.PROXMOX_API_URL}/nodes/${pengajuan.nodes}/qemu/${pengajuan.vmid}/status/current`,
          {
            headers,
            httpsAgent,
          }
        );

        const vmStorage = vmResponse.data.data.maxdisk / (1024 * 1024 * 1024);
        const configPayload: any = {
          memory: pengajuan.ram,
          cores: pengajuan.cpu,
        };

        if (segment != server.segment) {
          configPayload.net0 = `virtio,bridge=${bridge}`;
        }

        if (storage < vmStorage) {
          return respondWithError(`Storage tidak bisa dikecilkan`, 400);
        }

        const fixStorage = storage - vmStorage;

        await axios.put(
          `${process.env.PROXMOX_API_URL}/nodes/${pengajuan.nodes}/qemu/${pengajuan.vmid}/config`,
          configPayload,
          { headers, httpsAgent }
        );

        await axios.put(
          `${process.env.PROXMOX_API_URL}/nodes/${pengajuan.nodes}/qemu/${pengajuan.vmid}/resize`,
          {
            disk: "scsi0",
            size: `+${fixStorage}G`,
          },
          { headers, httpsAgent }
        );

        const response = await prisma.pengajuan.update({
          where: { id: Number(id) },
          data: {
            status_pengajuan: "Selesai",
          },
        });

        return NextResponse.json(
          { message: "Server successfully configured.", data: response },
          { status: 200 }
        );
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          if (axiosError.response && axiosError.response.statusText) {
            console.log(axiosError.response.statusText);
            await prisma.pengajuan.update({
              where: { id: Number(id) },
              data: {
                status_pengajuan: "Error",
              },
            });
            return respondWithError(`${axiosError.response.statusText}`, 500);
          } else {
            console.log(axiosError.message);
          }
        } else {
          console.log("Unexpected error:", error);
        }
      }
    } else if (jenis_pengajuan === "Delete") {
      const statusVM = await axios.get(
        `${process.env.PROXMOX_API_URL}/nodes/${pengajuan.nodes}/qemu/${pengajuan.vmid}/status/current`,
        { headers, httpsAgent }
      );

      if (statusVM.data.data.status === "running") {
        return respondWithError(
          `Shutdown VM ${pengajuan.vmid} untuk menghapus server`,
          400
        );
      }

      await prisma.pengajuan.update({
        where: { id: Number(id) },
        data: {
          status_pengajuan: "Proses pengerjaan",
        },
      });

      await axios.delete(
        `${process.env.PROXMOX_API_URL}/nodes/${pengajuan.nodes}/qemu/${pengajuan.vmid}`,
        { headers, httpsAgent }
      );

      const server = await prisma.server.findUnique({
        where: {
          vmid: Number(pengajuan.vmid),
        },
      });

      if (!server) {
        return respondWithError(
          `Server dengan id${pengajuan.vmid} tidak ditemukan`,
          400
        );
      }

      await prisma.ipAddress.update({
        where: { id: server.id_ip },
        data: { nama_server: "", status: "AVAILABLE" },
      });

      await prisma.server.delete({
        where: {
          vmid: Number(pengajuan.vmid),
        },
      });

      const response = await prisma.pengajuan.update({
        where: { id: Number(id) },
        data: {
          status_pengajuan: "Selesai",
        },
      });

      return NextResponse.json(
        { message: "Server successfully deleted", data: response },
        { status: 200 }
      );
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
