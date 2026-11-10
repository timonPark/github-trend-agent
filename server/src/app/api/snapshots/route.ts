import { NextResponse } from 'next/server';
import { getServerDb } from '@/lib/db';
import { authenticateClientKey } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await authenticateClientKey(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing client auth key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    const db = getServerDb();
    const snapshot = await db.getDailySnapshot(targetDate);

    if (!snapshot) {
      return NextResponse.json(
        { snapshot: null, message: `No snapshot found for ${targetDate}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ snapshot }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await authenticateClientKey(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing client auth key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { snapshot_date, repositories } = body;

    if (!snapshot_date || !Array.isArray(repositories) || repositories.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload: snapshot_date and non-empty repositories array are required' },
        { status: 400 }
      );
    }

    const db = getServerDb();
    const saved = await db.saveDailySnapshot(snapshot_date, repositories, user.username);

    return NextResponse.json(
      {
        success: true,
        snapshot: saved,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
