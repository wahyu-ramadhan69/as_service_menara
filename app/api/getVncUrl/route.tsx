import axios from "axios";
import https from "https";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const headers = {
    Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
    "Content-Type": "application/json",
  };
  try {
    const { vmid, node, name, storage } = await req.json();

    // const response = await axios.get(
    //   `${process.env.PROXMOX_API_URL}/nodes/192-168-1-235/qemu/101/status/current`,
    //   { headers, httpsAgent }
    // );

    const vncTicket = await axios.post(
      `${process.env.PROXMOX_API_URL}/nodes/${node}/qemu/${vmid}/vncproxy`,
      {
        username: "root@pam",
        password: "C8s0f09",
        websocket: 1, // Menambahkan parameter websocket=1
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        httpsAgent,
      }
    );

    console.log(vncTicket);

    // await axios.put(
    //   `${process.env.PROXMOX_API_URL}/nodes/192-168-1-236/qemu/${vmid}/config`,
    //   {
    //     memory: 8192,
    //     cores: 8,
    //     net0: `virtio,bridge=BE`,
    //   },
    //   { headers, httpsAgent }
    // );

    // let ukuran = Number(storage) - 40;

    // console.log(ukuran);

    // await axios.put(
    //   `${process.env.PROXMOX_API_URL}/nodes/192-168-1-236/qemu/${vmid}/resize`,
    //   {
    //     disk: "scsi0",
    //     size: `-10`,
    //   },
    //   { headers, httpsAgent }
    // );

    // await axios.put(
    //   `${process.env.PROXMOX_API_URL}/nodes/192-168-1-234/qemu/${vmid}/resize`,
    //   {
    //     disk: "scsi0",
    //     size: "+10G",
    //   },
    //   { headers, httpsAgent }
    // );

    // const response = await axios.get(
    //   `${process.env.PROXMOX_API_URL}/nodes/192-168-1-234/qemu/${vmid}/status/current`,
    //   { headers, httpsAgent }
    // );

    // const response2 = await axios.post(
    //   `${process.env.PROXMOX_API_URL}/access/ticket`,
    //   {
    //     username: "root@pam",
    //     password: "C8s0f09",
    //   },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     httpsAgent,
    //   }
    // );

    // const ticket2 = response2.data.data.ticket;
    // const csrfToken = response2.data.data.CSRFPreventionToken;

    // const { ticket, port, user, CSRFPreventionToken } = response.data.data;

    // console.log(response.data.data.status);

    // const noVncUrl = `https://192.168.1.234:8006/?console=kvm&novnc=1&vmid=${vmid}&vmname=${name}&port=${port}&ticket=${ticket}`;
    // const noVncUrl = `https://192.168.1.234:8006/?console=kvm&novnc=1&vmid=${vmid}&node=${node}&port=${port}&token=${ticket}`;
    // const noVncUrl = `https://192.168.1.234:8006/?console=kvm&novnc=1&vmid=${vmid}&node=${node}&token=${ticket}&CSRFPreventionToken=${CSRFPreventionToken}`;
    // const noVncUrl = `wss://192.168.1.234:${port}/api2/json/nodes/${node}/qemu/${vmid}/vncwebsocket?port=${port}&vncticket=${ticket}`;

    return NextResponse.json("sipp");
  } catch (error) {
    console.error("Error fetching VNC URL:", error);
    return NextResponse.json(
      { error: "Failed to fetch VNC URL" },
      { status: 500 }
    );
  }
}
