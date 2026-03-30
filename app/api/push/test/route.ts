import { NextRequest } from "next/server";
import {
  ensurePushTables,
  getActiveSubscriptionById,
  recordNotificationHistory,
} from "../_store";
import { sendPushNotification } from "../_webpush";

export const runtime = "nodejs";

type TestNotificationRequest = {
  subscriptionId?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TestNotificationRequest;

    if (!body.subscriptionId) {
      return Response.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    await ensurePushTables();

    const item = await getActiveSubscriptionById(body.subscriptionId);
    if (!item) {
      return Response.json({ error: "Subscription not found" }, { status: 404 });
    }

    const payload = {
      title: "問いの道場",
      body: "テスト通知です。ここから練習を始めましょう。",
      type: "test",
      url: "/practice",
    } as const;

    try {
      await sendPushNotification(item.subscription, payload);
      await recordNotificationHistory({
        subscriptionId: item.id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        delivered: true,
      });
    } catch (error) {
      await recordNotificationHistory({
        subscriptionId: item.id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        delivered: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("push test error:", error);
    return Response.json({ error: "Failed to send test notification" }, { status: 500 });
  }
}
