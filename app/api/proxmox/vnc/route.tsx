import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function POST(req: NextRequest) {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const headers = {
    Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
    "Content-Type": "application/json",
  };
  const { vmid, node } = await req.json();

  try {
    const proxmoxURL = `https://192.168.1.234:8006/api2/json/nodes/${node}/qemu/${vmid}/vncproxy`;
    const response = await axios.post(
      proxmoxURL,
      { websocket: 1, "generate-password": 1 },
      {
        headers,
        httpsAgent,
      }
    );

    return NextResponse.json(response.data.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching VNC proxy data" },
      { status: 500 }
    );
  }
}
