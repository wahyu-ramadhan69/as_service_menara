import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import https from "https";

export async function GET(req: NextRequest) {
  try {
    // Mendapatkan API Token dari environment variables
    const divisi = "Dev";

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // Abaikan validasi sertifikat self-signed
    });

    const response = await axios.get(
      `${process.env.PROXMOX_API_URL}/pools/${divisi}`,
      {
        headers: {
          Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
        },
        httpsAgent,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching VM data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch VM data", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const headers = {
      Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
      "Content-Type": "application/json",
    };

    // // Langkah 1: Dapatkan daftar semua VM
    const vmListResponse = await axios.get(
      `${process.env.PROXMOX_API_URL}/cluster/resources?type=vm`,
      {
        headers: {
          Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
        },
        httpsAgent,
      }
    );

    const vmList = vmListResponse.data.data;

    // Langkah 2: Tentukan newid yang belum digunakan
    let newid = 100; // Mulai dari 100 sebagai contoh
    const usedIds = vmList.map((vm: { vmid: number }) => vm.vmid);

    while (usedIds.includes(newid)) {
      newid++; // Increment until we find an unused ID
    }

    const data = {
      newid, // Specify the new VM ID you want
      name: "cloned-vm", // Name for the new cloned VM
      target: "192-168-1-234", // Target node where the VM should be cloned
      full: 1, // Whether to perform a full clone (1 for true, 0 for false)
    };

    const response = await axios.post(
      `${process.env.PROXMOX_API_URL}/nodes/192-168-1-234/qemu/1000/clone`,
      data,
      { headers, httpsAgent }
    );

    // console.log(newid);

    // const vmid = 1000; // VM ID yang ingin dikloning
    // const pool = "Infra"; // Pool yang ingin dituju
    // console.log(targetStorage);
    // console.log(node);

    // const cloneResponse = await axios.post(
    //   `${process.env.PROXMOX_API_URL}/nodes/${node}/qemu/${vmid}/clone`,
    //   {
    //     newid: newid, // ID VM baru yang dihasilkan
    //     pool: pool, // Masukkan ke dalam pool 'Infra'
    //     storage: targetStorage, // Storage yang digunakan
    //   },
    //   {
    //     headers: {
    //       Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
    //       "Content-Type": "application/json",
    //     },
    //     httpsAgent,
    //   }
    // );

    // const { groupid, comment } = await req.json();

    // if (!groupid) {
    //   return NextResponse.json(
    //     { error: "Group ID is required" },
    //     { status: 400 }
    //   );
    // }

    // const data = {
    //   groupid,
    //   comment,
    // };

    const { userid, password, email, comment } = await req.json();

    // Validasi input
    if (!userid || !password) {
      return NextResponse.json(
        { error: "User ID and password are required" },
        { status: 400 }
      );
    }

    // Data untuk dikirim ke Proxmox API
    // const data = {
    //   userid,
    //   password,
    //   email,
    //   comment,
    // };

    // const response = await axios.post(
    //   `${process.env.PROXMOX_API_URL}/access/users`,
    //   data,
    //   { headers, httpsAgent }
    // );

    // return NextResponse.json(response.data, { status: 200 });

    // Data for cloning the VM

    // API request to clone the VM

    // const { node, targetStorage } = await req.json();

    // if (!node || !targetStorage) {
    //   return NextResponse.json(
    //     { error: "Node dan target storage harus diisi" },
    //     { status: 400 }
    //   );
    // }

    return new Response(JSON.stringify(response.data), { status: 200 });
    // return NextResponse.json(cloneResponse.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else {
      console.error("Error cloning VM:", error);
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to clone VM", details: errorMessage },
      { status: 500 }
    );
  }
}

// export async function POST(request: NextRequest) {
//   try {
//     // Mengambil data dari body request dengan format JSON
//     const {
//       userid,
//       password,
//       comment,
//       enable,
//       expire,
//       firstname,
//       lastname,
//       email,
//       groups,
//     } = await request.json();

//     const url = `${process.env.PROXMOX_API_URL}/access/users`;

//     // Buat https agent untuk mengabaikan validasi sertifikat self-signed
//     const httpsAgent = new https.Agent({
//       rejectUnauthorized: false, // Abaikan validasi sertifikat self-signed
//     });

//     const bodyData = {
//       userid, // format: 'username@realm'
//       password,
//       comment,
//       enable,
//       expire,
//       firstname,
//       lastname,
//       email,
//       groups, // optional, must be an array of group IDs
//     };

//     console.log(bodyData);

//     console.log("Sending data:", bodyData);

//     const response = await axios.post(url, bodyData, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
//       },
//       httpsAgent: httpsAgent, // Menggunakan httpsAgent yang kita definisikan di atas
//     });

//     console.log("Response status:", response.status);
//     console.log("Response data:", response.data);

//     return NextResponse.json(response.data, { status: 200 });
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       console.error(
//         "Axios Error details:",
//         error.response?.data || error.message
//       );
//       return NextResponse.json(
//         { error: error.response?.data || error.message },
//         { status: 500 }
//       );
//     } else {
//       console.error("Unknown Error details:", (error as Error).message);
//       return NextResponse.json(
//         { error: (error as Error).message },
//         { status: 500 }
//       );
//     }
//   }
// }
