import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const search = searchParams.get("search")?.trim() || "";
  const offset = (page - 1) * limit;

  let where = "";
  const params: unknown[] = [];

  if (search) {
    where = "WHERE query_text LIKE ? OR app_name LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }

  const pool = getPool();

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT session_id) as total FROM chat_history ${where}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT session_id,
            MAX(app_name) as app_name,
            MAX(created_at) as last_time,
            MIN(query_text) as first_query,
            COUNT(*) as msg_count
     FROM chat_history ${where}
     GROUP BY session_id
     ORDER BY last_time DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return NextResponse.json({ sessions: rows, total, page, limit });
}
