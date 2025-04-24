import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import { respondWithError, respondWithSuccess } from "@/app/lib/Response";
import { PrismaClient } from "@prisma/client";
import { extractAndVerifyToken } from "@/app/lib/Auth";
const prisma = new PrismaClient();

export async function POST(request: Request) {
  const decodedToken = extractAndVerifyToken(request);

  if (!decodedToken) {
    return respondWithError("Invalid or expired token", 401);
  }

  const { username, divisi } = decodedToken;
  const { ipAddress, subnetMask, gateway, node, vmid } = await request.json();

  // Menggunakan `netplan` untuk konfigurasi IP di Ubuntu
  const command = [
    "bash",
    "-c",
    `
      # Pastikan interface yang digunakan
      interface=$(ip -o link show | awk -F': ' '{print $2}' | grep -v lo | head -n1);

      # Mengatur IP statis dan hardcode DNS server pada file konfigurasi netplan /etc/netplan/50-cloud-init.yaml
      sudo bash -c "cat << EOF > /etc/netplan/50-cloud-init.yaml
network:
  version: 2
  ethernets:
    \$interface:
      dhcp4: no
      addresses:
        - ${ipAddress}/24
      nameservers:
        addresses: [10.20.210.15]
      routes:
        - to: 0.0.0.0/0
          via: ${gateway}
EOF"

      sudo netplan apply;

      echo "IP address dan DNS telah diatur pada \$interface.";
    `,
  ];

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const headers = {
    Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const execResponse = await axios.post(
      `${process.env.PROXMOX_API_URL}/nodes/${node}/qemu/${vmid}/agent/exec`,
      {
        command: command,
      },
      {
        headers,
        httpsAgent,
      }
    );

    const pid = execResponse.data.data.pid;

    await new Promise((resolve) => setTimeout(resolve, 5000));
    const resultResponse = await axios.get(
      `${process.env.PROXMOX_API_URL}/nodes/${node}/qemu/${vmid}/agent/exec-status?pid=${pid}`,
      {
        headers,
        httpsAgent,
      }
    );

    const output = resultResponse.data.data["out-data"];

    const log = await prisma.logVM.create({
      data: {
        user: username,
        divisi: divisi,
        activity: "IPSync",
        vmid: Number(vmid),
      },
    });

    return respondWithSuccess(
      "Berhasil melakukan sinkronisasi IP Address di Ubuntu",
      output,
      200
    );
  } catch (error) {
    console.error("Error executing command:", error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    });
  }
}
