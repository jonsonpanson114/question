// API Route: POST /api/push/subscribe
import { NextRequest, NextResponse } from 'next/server';
import type { SubscribeRequest, SubscribeResponse } from '../../_types';
import {
  createSubscription,
  createPreferences,
  getSubscriptionById,
  updateSubscriptionLastUsed,
  getPreferencesBySubscriptionId,
} from '../../_lib/db';

export async function POST(req: NextRequest) {
  try {
    const body: SubscribeRequest = await req.json();
    const { subscription, preferences } = body;

    // Validate request
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Check if subscription already exists by endpoint
    const existingSub = await getSubscriptionById(subscription.endpoint);

    let subscriptionId: string;

    if (existingSub) {
      // Update existing subscription
      subscriptionId = existingSub.id;
      await updateSubscriptionLastUsed(subscriptionId);

      // Update preferences if provided
      if (preferences) {
        const existingPrefs = await getPreferencesBySubscriptionId(subscriptionId);
        if (existingPrefs) {
          // Update existing preferences
          // (Implementation would go here)
        }
      }
    } else {
      // Create new subscription
      subscriptionId = (await createSubscription(subscription)) || '';

      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }

      // Create default preferences
      await createPreferences({
        id: crypto.randomUUID(),
        subscriptionId,
        morningEnabled: preferences?.morningEnabled ?? true,
        morningHour: preferences?.morningHour ?? 7,
        eveningEnabled: preferences?.eveningEnabled ?? true,
        eveningHour: preferences?.eveningHour ?? 21,
        timezone: preferences?.timezone ?? 'Asia/Tokyo',
      });
    }

    // Get the preferences for response
    const prefs = await getPreferencesBySubscriptionId(subscriptionId);

    const response: SubscribeResponse = {
      success: true,
      subscriptionId,
      preferences: prefs ? {
        subscriptionId: prefs.subscriptionId,
        morningEnabled: prefs.morningEnabled,
        morningHour: prefs.morningHour,
        eveningEnabled: prefs.eveningEnabled,
        eveningHour: prefs.eveningHour,
        timezone: prefs.timezone,
      } : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
