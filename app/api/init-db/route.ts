// API Route: POST /api/init-db
// Initialize database tables (run once during setup)
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: NextRequest) {
  try {
    // Verify request is from authorized source (optional: add password protection)
    const authHeader = req.headers.get('authorization');
    const setupKey = authHeader?.replace('Bearer ', '');

    // In production, require a setup key
    if (process.env.NODE_ENV === 'production' && setupKey !== process.env.SETUP_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Setup key required.' },
        { status: 401 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);
    const results: string[] = [];

    // Create push_subscriptions table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id TEXT PRIMARY KEY,
          endpoint TEXT NOT NULL UNIQUE,
          keys TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          last_used_at TIMESTAMP
        )
      `;
      results.push('✓ push_subscriptions table created');
    } catch (error: any) {
      results.push(`✗ push_subscriptions: ${error.message}`);
    }

    // Create notification_preferences table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS notification_preferences (
          id TEXT PRIMARY KEY,
          subscription_id TEXT REFERENCES push_subscriptions(id) ON DELETE CASCADE,
          morning_enabled BOOLEAN DEFAULT true,
          morning_hour INTEGER DEFAULT 7,
          evening_enabled BOOLEAN DEFAULT true,
          evening_hour INTEGER DEFAULT 21,
          timezone TEXT DEFAULT 'Asia/Tokyo',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      results.push('✓ notification_preferences table created');
    } catch (error: any) {
      results.push(`✗ notification_preferences: ${error.message}`);
    }

    // Create notification_history table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS notification_history (
          id TEXT PRIMARY KEY,
          subscription_id TEXT REFERENCES push_subscriptions(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          sent_at TIMESTAMP DEFAULT NOW(),
          delivered BOOLEAN DEFAULT true,
          error_message TEXT
        )
      `;
      results.push('✓ notification_history table created');
    } catch (error: any) {
      results.push(`✗ notification_history: ${error.message}`);
    }

    // Create indexes
    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
        ON push_subscriptions(is_active)
      `;
      results.push('✓ Index idx_push_subscriptions_active created');
    } catch (error: any) {
      results.push(`✗ Index creation failed: ${error.message}`);
    }

    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_notification_preferences_subscription
        ON notification_preferences(subscription_id)
      `;
      results.push('✓ Index idx_notification_preferences_subscription created');
    } catch (error: any) {
      results.push(`✗ Index creation failed: ${error.message}`);
    }

    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_notification_history_subscription
        ON notification_history(subscription_id)
      `;
      results.push('✓ Index idx_notification_history_subscription created');
    } catch (error: any) {
      results.push(`✗ Index creation failed: ${error.message}`);
    }

    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at
        ON notification_history(sent_at)
      `;
      results.push('✓ Index idx_notification_history_sent_at created');
    } catch (error: any) {
      results.push(`✗ Index creation failed: ${error.message}`);
    }

    // Verify tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('push_subscriptions', 'notification_preferences', 'notification_history')
      ORDER BY table_name
    `;

    const tableNames = tables.map((t: any) => t.table_name);

    return NextResponse.json({
      success: true,
      message: 'Database initialization completed',
      results,
      tables: tableNames,
      instructions: process.env.NODE_ENV === 'production'
        ? 'Remember to remove SETUP_KEY from environment variables after setup!'
        : 'Development setup complete!',
    });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        error: 'Database initialization failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - Check if database is initialized
export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          initialized: false,
          error: 'DATABASE_URL not configured',
        },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('push_subscriptions', 'notification_preferences', 'notification_history')
      ORDER BY table_name
    `;

    const tableNames = tables.map((t: any) => t.table_name);
    const allTablesExist = tableNames.length === 3;

    return NextResponse.json({
      initialized: allTablesExist,
      tables: tableNames,
      database_url: process.env.DATABASE_URL ? 'configured' : 'not configured',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        initialized: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
