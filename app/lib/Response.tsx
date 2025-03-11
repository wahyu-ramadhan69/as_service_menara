import { NextResponse } from "next/server";

export function respondWithError(message: string, statusCode: number) {
  return NextResponse.json(
    { error: message || "Error server", status: statusCode },
    { status: statusCode }
  );
}

export function respondWithSuccess(
  message: string,
  data: any,
  statusCode: number
) {
  return NextResponse.json({
    message: message,
    data: data,
    status: statusCode,
  });
}
