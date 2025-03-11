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

  const { ipAddress, subnetMask, gateway, dnsServer, node, vmid } =
    await request.json();

  const command = [
    "powershell",
    "-Command",
    `
      $interfaceAlias = "Ethernet"; 
      $ipAddress = "${ipAddress}"; 
      $subnetMask = "${subnetMask}"; 
      $gateway = "${gateway}"; 
      $dnsServer = "${dnsServer}";

      # Pastikan interface menggunakan DHCP terlebih dahulu untuk reset pengaturan
      Write-Host "Mengatur interface $interfaceAlias ke DHCP...";
      Set-NetIPInterface -InterfaceAlias $interfaceAlias -Dhcp Enabled;
      Set-DnsClientServerAddress -InterfaceAlias $interfaceAlias -ResetServerAddresses;

      # Tunggu beberapa detik untuk memastikan perubahan DHCP diterapkan
      Start-Sleep -Seconds 5;

      # Menghapus pengaturan IP statis sebelumnya
      Write-Host "Menghapus pengaturan IP statis sebelumnya...";
      Remove-NetIPAddress -InterfaceAlias $interfaceAlias -Confirm:$false;

      # Menghapus pengaturan gateway sebelumnya
      Write-Host "Menghapus pengaturan gateway sebelumnya...";
      Remove-NetRoute -InterfaceAlias $interfaceAlias -Confirm:$false;

      # Mengubah dari DHCP ke IP statis
      Write-Host "Mengubah konfigurasi IP ke statis...";
      New-NetIPAddress -InterfaceAlias $interfaceAlias -IPAddress $ipAddress -PrefixLength 24 -DefaultGateway $gateway;

      # Mengatur DNS Server
      Write-Host "Mengatur DNS server...";
      Set-DnsClientServerAddress -InterfaceAlias $interfaceAlias -ServerAddresses $dnsServer;

      # Restart network adapter untuk menerapkan perubahan
      Restart-NetAdapter -Name $interfaceAlias;

      Write-Host "IP address dan DNS telah diatur pada $interfaceAlias.";
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
      "Berhasil melakukan sinkronisasi IP Address",
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
