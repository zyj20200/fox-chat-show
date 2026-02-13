import { NextRequest, NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/db";

export async function GET() {
  const config = getConfig();
  return NextResponse.json({ ...config, password: "***" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await setConfig({
      host: body.host,
      port: Number(body.port) || 3306,
      user: body.user,
      password: body.password,
      database: body.database,
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "连接失败";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
