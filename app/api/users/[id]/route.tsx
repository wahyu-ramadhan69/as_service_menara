import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { username, password, email, role, id_divisi } = await req.json();

    let hashedPassword;
    const data: any = {
      username,
      email,
      role,
      divisi: {
        connect: { id: parseInt(id_divisi) },
      },
    };
    if (password) {
      if (password.length < 4) {
        return NextResponse.json(
          { error: "Password minimal terdiri dari 4 karakter" },
          { status: 400 }
        );
      }
      hashedPassword = await bcrypt.hash(password, 10);
      data.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: data,
      include: {
        divisi: true,
      },
    });

    return NextResponse.json(
      {
        message: "Data update successfully",
        data: updatedUser,
        statusCode: 201,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.user.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ message: "User deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete divisi" },
      { status: 500 }
    );
  }
}
