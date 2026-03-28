// API Route: POST /api/cron/daily-reminders
// Triggered by Vercel Cron Jobs to send daily practice reminders
import { NextRequest, NextResponse } from 'next/server';
import { getEligibleSubscriptions } from '../../push/_lib/db';
import {
  sendPushNotification,
  getMorningNotificationPayload,
  getEveningNotificationPayload,
} from '../../push/_lib/web-push';
import { logNotification } from '../../push/_lib/db';

export async function GET(req: NextRequest) {
  try {
    // Verify CRON_SECRET to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    const cronSecret = req.headers.get('x-cron-secret') || authHeader?.replace('Bearer ', '');

    if (cronSecret !== process.env.CRON_SECRET) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current hour in user's timezone (default to Asia/Tokyo)
    const now = new Date();
    const currentHour = parseInt(
      now.toLocaleString('en-US', {
        timeZone: 'Asia/Tokyo',
        hour: 'numeric',
        hour12: false,
      })
    );

    console.log(`Cron job running for hour: ${currentHour}`);

    // Get subscriptions with matching notification times
    const eligibleSubscriptions = await getEligibleSubscriptions(currentHour);

    console.log(`Found ${eligibleSubscriptions.length} eligible subscriptions`);

    if (eligibleSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible subscriptions for this hour',
        sent: 0,
        hour: currentHour,
      });
    }

    // Send notifications
    const results = await Promise.allSettled(
      eligibleSubscriptions.map(async ({ subscription, preferences }) => {
        // Determine notification type based on hour
        const isMorning = preferences.morningHour === currentHour && preferences.morningEnabled;
        const isEvening = preferences.eveningHour === currentHour && preferences.eveningEnabled;

        let payload;
        let type: 'morning' | 'evening';

        if (isMorning) {
          payload = getMorningNotificationPayload();
          type = 'morning';
        } else if (isEvening) {
          payload = getEveningNotificationPayload();
          type = 'evening';
        } else {
          return { skipped: true };
        }

        // Send push notification
        const result = await sendPushNotification({
          subscription,
          payload,
        });

        // Log result
        await logNotification({
          id: crypto.randomUUID(),
          subscriptionId: preferences.subscriptionId,
          type,
          title: payload.title,
          body: payload.body,
          delivered: result.success,
          errorMessage: result.error,
        });

        return {
          sent: result.success,
          subscriptionId: preferences.subscriptionId,
          type,
          error: result.error,
        };
      })
    );

    // Count results
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.skipped) {
          skipped++;
        } else if (result.value.sent) {
          sent++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    });

    console.log(`Cron job completed: ${sent} sent, ${failed} failed, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} notifications`,
      sent,
      failed,
      skipped,
      hour: currentHour,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
