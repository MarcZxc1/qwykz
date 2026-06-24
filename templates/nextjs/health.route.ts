import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  }, { status: 200 });
}
