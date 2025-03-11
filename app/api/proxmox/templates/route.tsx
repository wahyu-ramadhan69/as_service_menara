import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import https from "https";
import { extractAndVerifyToken } from "@/app/lib/Auth";
import { respondWithError, respondWithSuccess } from "@/app/lib/Response";

export async function GET(req: NextRequest) {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const headers = {
    Authorization: `PVEAPIToken=${process.env.TOKEN_ID}=${process.env.TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    // const decodedToken = extractAndVerifyToken(req);
    // if (!decodedToken) {
    //   return respondWithError("Invalid or missing token", 401);
    // }
    // const { role } = decodedToken;
    // if (role != "ADMIN") {
    //   return respondWithError("You do not have access to this page", 401);
    // }

    const response = await axios.get(
      `${process.env.PROXMOX_API_URL}/pools/Templates`,
      {
        headers,
        httpsAgent,
      }
    );

    const data = response.data.data.members;

    return respondWithSuccess("Data fetched successfully", data, 200);
  } catch (error: any) {
    return respondWithError(error.message || "Failed to fetch data", 500);
  }
}
