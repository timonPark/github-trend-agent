import { NextResponse } from 'next/server';
import { getOrFetchDailySnapshot } from '@/lib/snapshot-service';
import { UnauthorizedError } from '@/lib/server-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const forceRefresh = searchParams.get('force') === 'true';

    const result = await getOrFetchDailySnapshot(date, { forceRefresh });

    return NextResponse.json({
      success: true,
      source: result.source,
      syncedWithServer: result.syncedWithServer,
      snapshot: result.snapshot,
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 401,
          error: err.message,
        },
        { status: 401 }
      );
    }
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch trending snapshot' }, { status: 500 });
  }
}
