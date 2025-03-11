import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import { respondWithSuccess } from "@/app/lib/Response";

export async function POST(request: Request) {
  const { ipAddress, gateway, node, vmid } = await request.json();

  // Hardcode interface dan prefix
  const interfaceName = "ens18";
  const prefix = "24";

  // Menggunakan NetworkManager untuk konfigurasi IP di Ubuntu
  const command = [
    "bash",
    "-c",
    `
      # Membuat file konfigurasi untuk NetworkManager di /etc/NetworkManager/system-connections/
      sudo bash -c "cat << EOF > /etc/NetworkManager/system-connections/${interfaceName}.nmconnection
[connection]
id=${interfaceName}
uuid=$(uuidgen)
type=ethernet
interface-name=${interfaceName}

[ipv4]
method=manual
addresses=${ipAddress}/${prefix};${gateway};
dns=192.168.29.12;192.168.29.101;

[ipv6]
method=ignore

EOF"

      # Set permissions dan restart NetworkManager untuk menerapkan perubahan
      sudo chmod 600 /etc/NetworkManager/system-connections/${interfaceName}.nmconnection;
      sudo nmcli connection reload;
      sudo systemctl restart NetworkManager;

      echo "IP address dan DNS telah diatur pada ${interfaceName}.";
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

    return respondWithSuccess(
      "Berhasil melakukan sinkronisasi IP Address di Ubuntu menggunakan NetworkManager",
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
