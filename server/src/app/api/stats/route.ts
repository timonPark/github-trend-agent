import { NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { toErrorMessage } from '@/lib/types/error';
import { DailySnapshot, DiscussionArchive, TrendingRepository } from '@/lib/types';
import { ApiResponse, PlatformStatsResponseDto } from '@/lib/types/api';

function resolveTodayTop3(snapshots: DailySnapshot[]): TrendingRepository[] {
  if (snapshots.length === 0) return [];
  const latest: DailySnapshot = snapshots[0];
  return latest.repositories.slice(0, 3);
}

export async function GET(): Promise<NextResponse<ApiResponse<PlatformStatsResponseDto>>> {
  try {
    const db: ServerDbAdapter = getServerDb();
    const snapshots: DailySnapshot[] = await db.listDailySnapshots();
    const publicArchives: DiscussionArchive[] = await db.listPublicDiscussionArchives();
    const userCount: number = await db.countUsers();
    const top3: TrendingRepository[] = resolveTodayTop3(snapshots);

    const data: PlatformStatsResponseDto = {
      snapshot_count: snapshots.length,
      public_archive_count: publicArchives.length,
      total_user_count: userCount,
      today_top3: top3,
      recent_public_discussions: publicArchives.slice(0, 3),
    };

    return NextResponse.json<ApiResponse<PlatformStatsResponseDto>>({
      success: true,
      data,
    });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse<PlatformStatsResponseDto>>(
      { success: false, error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
