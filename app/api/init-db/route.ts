import { NextRequest } from "next/server";
import { sql } from "@vercel/postgres";
import { ensurePushTables } from "../push/_store";

export const runtime = "nodejs";

function isSetupAuthorized(req: NextRequest): boolean {
  const setupKey = process.env.SETUP_KEY;
  if (!setupKey) return true;

  const auth = req.headers.get("authorization");
  return auth === `Bearer ${setupKey}`;
}

async function listTables(): Promise<string[]> {
  const result = await sql<{ table_name: string }>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  return result.rows.map((row) => row.table_name);
}

export async function GET() {
  try {
    const tables = await listTables();
    const hasAllTables =
      tables.includes("push_subscriptions") &&
      tables.includes("notification_preferences") &&
      tables.includes("notification_history");

    return Response.json({
      initialized: hasAllTables,
      tables,
      database_url: process.env.DATABASE_URL ? "configured" : "missing",
    });
  } catch (error) {
    console.error("init-db get error:", error);
    return Response.json({
      initialized: false,
      tables: [],
      database_url: process.env.DATABASE_URL ? "configured" : "missing",
      error: "Failed to inspect database",
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSetupAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensurePushTables();
    const tables = await listTables();

    return Response.json({
      ok: true,
      results: [
        "push_subscriptions table is ready",
        "notification_preferences table is ready",
        "notification_history table is ready",
      ],
      tables,
      instructions: "Push notification backend is initialized.",
    });
  } catch (error) {
    console.error("init-db post error:", error);
    return Response.json({ error: "Failed to initialize database" }, { status: 500 });
  }
}
