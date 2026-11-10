import { NextResponse } from 'next/server';
import { getOrFetchDailySnapshot } from '@/lib/snapshot-service';
import { UnauthorizedError } from '@/lib/server-api';
import { toErrorMessage } from '@/lib/types/error';
import { LocalSnapshot } from '@/lib/types';

interface TrendingApiResponse {
  success: boolean;
  source?: string;
  syncedWithServer?: boolean;
  snapshot?: LocalSnapshot;
  repositories?: LocalSnapshot['repositories'];
  error?: string;
  statusCode?: number;
}

export async function GET(request: Request): Promise<NextResponse<TrendingApiResponse>> {
  try {
    const url: URL = new URL(request.url);
    const date: string | undefined = url.searchParams.get('date') || undefined;
    const forceRefresh: boolean = url.searchParams.get('force') === 'true';

    const result = await getOrFetchDailySnapshot(date, { forceRefresh });

    return NextResponse.json<TrendingApiResponse>({
      success: true,
      source: result.source,
      syncedWithServer: result.syncedWithServer,
      snapshot: result.snapshot,
      repositories: result.snapshot.repositories,
    });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json<TrendingApiResponse>(
        {
          success: false,
          statusCode: 401,
          error: err.message,
        },
        { status: 401 }
      );
    }
    return NextResponse.json<TrendingApiResponse>(
      { success: false, error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
