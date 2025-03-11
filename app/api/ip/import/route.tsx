import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { respondWithSuccess } from "@/app/lib/Response";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    const dataToInsert = [];

    for (const data of jsonData) {
      const { ip, nama_server, status, type } = data;

      // Cek apakah IP sudah ada di database
      const existingIp = await prisma.ipAddress.findUnique({
        where: { ip },
      });

      if (!existingIp) {
        dataToInsert.push({
          ip,
          nama_server,
          status,
          type,
        });
      }
    }

    if (dataToInsert.length > 0) {
      await prisma.ipAddress.createMany({
        data: dataToInsert,
        skipDuplicates: true,
      });
    }

    return respondWithSuccess("Import successful", "Import successful", 200);
  } catch (error) {
    console.error("Error importing data:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}
