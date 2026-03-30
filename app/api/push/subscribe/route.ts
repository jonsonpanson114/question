import { NextRequest } from "next/server";
import {
  ensurePushTables,
  upsertSubscription,
} from "../_store";
import type {
  NotificationPreferences,
  PushSubscriptionRecord,
} from "../_types";

export const runtime = "nodejs";

type SubscribeRequest = {
  subscription?: {
    endpoint?: string;
    keys?: {
      auth?: string;
      p256dh?: string;
    };
  };
  preferences?: Partial<NotificationPreferences>;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubscribeRequest;
    const endpoint = body.subscription?.endpoint;
    const keys = body.subscription?.keys;

    if (!endpoint || !keys?.auth || !keys.p256dh) {
      return Response.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const subscription: PushSubscriptionRecord = {
      id: "",
      endpoint,
      keys: {
        auth: keys.auth,
        p256dh: keys.p256dh,
      },
    };

    await ensurePushTables();
    const saved = await upsertSubscription(subscription, body.preferences);

    return Response.json({
      ok: true,
      subscriptionId: saved.id,
      preferences: saved.preferences,
    });
  } catch (error) {
    console.error("push subscribe error:", error);
    return Response.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
