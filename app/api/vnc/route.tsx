import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function POST(req: NextRequest) {
  try {
    const { vmid, node } = await req.json(); // Parse the JSON body
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const credentials = {
      hostname: "192.168.1.234", // Replace with your Proxmox hostname
      username: "root",
      password: "C8s0f09",
      realm: "pam",
      port: "8006",
    };

    // Step 1: Authenticate and get ticket
    const loginResponse = await axios.post(
      `https://${credentials.hostname}:${credentials.port}/api2/json/access/ticket`,
      {
        username: `${credentials.username}@${credentials.realm}`,
        password: credentials.password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        httpsAgent,
      }
    );

    const { ticket, CSRFPreventionToken } = loginResponse.data.data;

    // Step 2: Create VNC proxy
    const proxyResponse = await axios.post(
      `https://${credentials.hostname}:${credentials.port}/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`,
      {
        websocket: 1,
      },
      {
        headers: {
          CSRFPreventionToken: CSRFPreventionToken,
          Cookie: `PVEAuthCookie=${ticket}`,
        },
        httpsAgent,
      }
    );

    const { port, ticket: vncTicket } = proxyResponse.data.data;

    // Step 3: Generate the noVNC URL
    const srcHref = `https://${credentials.hostname}:8006/?console=kvm&novnc=1&node=${node}&resize=1&vmid=${vmid}&path=api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket/port/${port}/vncticket/${vncTicket}`;

    // Return the URL as a JSON response
    return NextResponse.json({ url: srcHref });
  } catch (error) {
    console.error("Failed to open VNC console:", error);
    return NextResponse.json(
      { error: "Failed to open VNC console" },
      { status: 500 }
    );
  }
}
