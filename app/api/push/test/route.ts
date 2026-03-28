// API Route: POST /api/push/test
import { NextRequest, NextResponse } from 'next/server';
import type { TestNotificationRequest } from '../../_types';
import { getAllActiveSubscriptions } from '../../_lib/db';
import {
  sendPushNotification,
  getTestNotificationPayload,
} from '../../_lib/web-push';

export async function POST(req: NextRequest) {
  try {
    const body: TestNotificationRequest = await req.json();
    const { subscriptionId } = body;

    const payload = getTestNotificationPayload();

    let results;

    if (subscriptionId) {
      // Send to specific subscription
      // Implementation would need to fetch single subscription
      // For now, send to all active
      results = await sendToAll(payload);
    } else {
      // Send to all active subscriptions
      results = await sendToAll(payload);
    }

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${results.sent}/${results.total} subscriptions`,
      details: results,
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendToAll(payload: any) {
  const subscriptions = await getAllActiveSubscriptions();

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  const results = await Promise.allSettled(
    subscriptions.map(async ({ id, subscription }) => {
      const result = await sendPushNotification({
        subscription,
        payload,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
        if (result.error) {
          errors.push(`${id}: ${result.error}`);
        }
      }

      return result;
    })
  );

  return {
    total: subscriptions.length,
    sent,
    failed,
    errors: errors.slice(0, 10), // Limit error messages
  };
}
