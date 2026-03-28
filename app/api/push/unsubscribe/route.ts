// API Route: POST /api/push/unsubscribe
import { NextRequest, NextResponse } from 'next/server';
import type { UnsubscribeRequest } from '../../_types';
import { deleteSubscription, deactivateSubscription } from '../../_lib/db';

export async function POST(req: NextRequest) {
  try {
    const body: UnsubscribeRequest = await req.json();
    const { subscriptionId } = body;

    // Validate request
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      );
    }

    // Deactivate or delete the subscription
    const success = await deleteSubscription(subscriptionId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
