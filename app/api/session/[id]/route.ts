import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at ASC`,
    [id]
  );
  return NextResponse.json({ messages: rows });
}
