import { NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { toErrorMessage } from '@/lib/types/error';
import { DailySnapshot } from '@/lib/types';
import { ApiResponse, PublicSnapshotResponseDto } from '@/lib/types/api';

function parseRequestedDate(url: string): string | null {
  const searchParams: URLSearchParams = new URL(url).searchParams;
  return searchParams.get('date');
}

function extractAvailableDates(snapshots: DailySnapshot[]): string[] {
  return snapshots.map((s: DailySnapshot): string => s.snapshot_date);
}

function resolveTargetSnapshot(
  snapshots: DailySnapshot[],
  requestedDate: string | null
): DailySnapshot | null {
  if (requestedDate) {
    const found: DailySnapshot | undefined = snapshots.find(
      (s: DailySnapshot): boolean => s.snapshot_date === requestedDate
    );
    return found || null;
  }
  return snapshots.length > 0 ? snapshots[0] : null;
}

export async function GET(req: Request): Promise<NextResponse<ApiResponse<PublicSnapshotResponseDto>>> {
  try {
    const db: ServerDbAdapter = getServerDb();
    const snapshots: DailySnapshot[] = await db.listDailySnapshots();
    const requestedDate: string | null = parseRequestedDate(req.url);
    const snapshot: DailySnapshot | null = resolveTargetSnapshot(snapshots, requestedDate);
    const available_dates: string[] = extractAvailableDates(snapshots);

    return NextResponse.json<ApiResponse<PublicSnapshotResponseDto>>({
      success: true,
      data: { snapshot, available_dates },
    });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse<PublicSnapshotResponseDto>>(
      { success: false, error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
