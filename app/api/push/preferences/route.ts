import { NextRequest } from "next/server";
import {
  ensurePushTables,
  getPreferences,
  updatePreferences,
} from "../_store";
import type { NotificationPreferences } from "../_types";

export const runtime = "nodejs";

type PreferencesRequest = {
  subscriptionId?: string;
  preferences?: Partial<NotificationPreferences>;
};

export async function GET(req: NextRequest) {
  try {
    const subscriptionId = req.nextUrl.searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return Response.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    await ensurePushTables();
    const preferences = await getPreferences(subscriptionId);

    if (!preferences) {
      return Response.json({ error: "Preferences not found" }, { status: 404 });
    }

    return Response.json(preferences);
  } catch (error) {
    console.error("push preferences get error:", error);
    return Response.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as PreferencesRequest;

    if (!body.subscriptionId || !body.preferences) {
      return Response.json({ error: "Missing subscriptionId or preferences" }, { status: 400 });
    }

    await ensurePushTables();
    const preferences = await updatePreferences(body.subscriptionId, body.preferences);

    return Response.json({ ok: true, preferences });
  } catch (error) {
    console.error("push preferences update error:", error);
    return Response.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
