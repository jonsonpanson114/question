import { NextRequest } from "next/server";
import {
  ensurePushTables,
  listActiveSubscriptions,
  recordNotificationHistory,
} from "../_store";
import { localHourInTimezone, sendPushNotification } from "../_webpush";

export const runtime = "nodejs";

type NotificationType = "morning" | "evening";

type SendRequest = {
  type?: NotificationType;
};

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

function shouldSendNow(type: NotificationType, localHour: number, prefs: {
  morningEnabled: boolean;
  morningHour: number;
  eveningEnabled: boolean;
  eveningHour: number;
}): boolean {
  if (type === "morning") {
    return prefs.morningEnabled && localHour === prefs.morningHour;
  }

  return prefs.eveningEnabled && localHour === prefs.eveningHour;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // クエリパラメータまたはリクエストボディからtypeを取得
    const queryType = req.nextUrl.searchParams.get("type");
    const body = (await req.json().catch(() => ({}))) as SendRequest;
    const type = (queryType ?? body.type ?? "evening") as NotificationType;

    if (type !== "morning" && type !== "evening") {
      return Response.json({ error: "Invalid type" }, { status: 400 });
    }

    await ensurePushTables();
    const subscriptions = await listActiveSubscriptions();

    const now = new Date();
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of subscriptions) {
      const localHour = localHourInTimezone(now, item.preferences.timezone);
      if (!shouldSendNow(type, localHour, item.preferences)) {
        skipped += 1;
        continue;
      }

      const payload = {
        type,
        title: "問いの道場",
        body:
          type === "morning"
            ? "朝の問いをひとつ。今日の練習を始めましょう。"
            : "1日の終わりに、問いをひとつ。練習を始めましょう。",
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
        sent += 1;
      } catch (error) {
        failed += 1;
        await recordNotificationHistory({
          subscriptionId: item.id,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          delivered: false,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return Response.json({ ok: true, type, sent, skipped, failed });
  } catch (error) {
    console.error("push send error:", error);
    return Response.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
