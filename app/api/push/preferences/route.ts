// API Route: GET/PUT /api/push/preferences
import { NextRequest, NextResponse } from 'next/server';
import type { UpdatePreferencesRequest } from '../../_types';
import {
  getPreferencesBySubscriptionId,
  updatePreferences,
} from '../../_lib/db';

// GET - Fetch preferences
export async function GET(req: NextRequest) {
  try {
    const subscriptionId = req.nextUrl.searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      );
    }

    const preferences = await getPreferencesBySubscriptionId(subscriptionId);

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subscriptionId: preferences.subscriptionId,
      morningEnabled: preferences.morningEnabled,
      morningHour: preferences.morningHour,
      eveningEnabled: preferences.eveningEnabled,
      eveningHour: preferences.eveningHour,
      timezone: preferences.timezone,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update preferences
export async function PUT(req: NextRequest) {
  try {
    const body: UpdatePreferencesRequest = await req.json();
    const { subscriptionId, preferences } = body;

    // Validate request
    if (!subscriptionId || !preferences) {
      return NextResponse.json(
        { error: 'subscriptionId and preferences are required' },
        { status: 400 }
      );
    }

    // Validate hour values
    if (
      (preferences.morningHour !== undefined &&
        (preferences.morningHour < 0 || preferences.morningHour > 23)) ||
      (preferences.eveningHour !== undefined &&
        (preferences.eveningHour < 0 || preferences.eveningHour > 23))
    ) {
      return NextResponse.json(
        { error: 'Hour values must be between 0 and 23' },
        { status: 400 }
      );
    }

    // Update preferences
    const success = await updatePreferences(subscriptionId, preferences);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    // Fetch updated preferences
    const updatedPreferences = await getPreferencesBySubscriptionId(subscriptionId);

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences ? {
        subscriptionId: updatedPreferences.subscriptionId,
        morningEnabled: updatedPreferences.morningEnabled,
        morningHour: updatedPreferences.morningHour,
        eveningEnabled: updatedPreferences.eveningEnabled,
        eveningHour: updatedPreferences.eveningHour,
        timezone: updatedPreferences.timezone,
      } : null,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
