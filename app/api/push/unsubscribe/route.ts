import { NextRequest } from "next/server";
import {
  deactivateSubscription,
  ensurePushTables,
} from "../_store";

export const runtime = "nodejs";

type UnsubscribeRequest = {
  subscriptionId?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UnsubscribeRequest;

    if (!body.subscriptionId) {
      return Response.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    await ensurePushTables();
    await deactivateSubscription(body.subscriptionId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("push unsubscribe error:", error);
    return Response.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
