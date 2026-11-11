import { describe, it, expect, beforeEach } from 'vitest';
import { resetServerDbForTest, ServerDatabase } from '../src/lib/db';
import { GET as getStatsHandler } from '../src/app/api/stats/route';
import { ApiResponse, PlatformStatsResponseDto } from '../src/lib/types/api';
import { TrendingRepository } from '../src/lib/types';

describe('Server Platform Stats API (#27)', (): void => {
  let db: ServerDatabase;

  const mockRepos: TrendingRepository[] = [
    { rank: 1, name: 'repo-1', full_name: 'org/repo-1', url: 'https://github.com/org/repo-1', description: 'Desc 1', language: 'TypeScript', total_stars: 1000, daily_stars: 100 },
    { rank: 2, name: 'repo-2', full_name: 'org/repo-2', url: 'https://github.com/org/repo-2', description: 'Desc 2', language: 'Rust', total_stars: 2000, daily_stars: 200 },
    { rank: 3, name: 'repo-3', full_name: 'org/repo-3', url: 'https://github.com/org/repo-3', description: 'Desc 3', language: 'Python', total_stars: 3000, daily_stars: 300 },
    { rank: 4, name: 'repo-4', full_name: 'org/repo-4', url: 'https://github.com/org/repo-4', description: 'Desc 4', language: 'Go', total_stars: 4000, daily_stars: 400 },
  ];

  beforeEach(async (): Promise<void> => {
    db = resetServerDbForTest();
    await db.createUser('user1', 'pass1', 'key1');
    await db.createUser('user2', 'pass2', 'key2');

    await db.saveDailySnapshot('2026-11-10', mockRepos);
    await db.saveDailySnapshot('2026-11-11', mockRepos);

    await db.createDiscussionArchive({
      id: 'arch-pub-1',
      user_id: 'u1',
      username: 'user1',
      snapshot_date: '2026-11-11',
      repo_full_name: 'org/repo-1',
      repo_url: 'https://github.com/org/repo-1',
      repo_digest: '요약 1',
      discussion_summary: '토론 요약 1',
      messages: [],
      is_public: true,
    });
    await db.createDiscussionArchive({
      id: 'arch-priv-1',
      user_id: 'u1',
      username: 'user1',
      snapshot_date: '2026-11-11',
      repo_full_name: 'org/repo-2',
      repo_url: 'https://github.com/org/repo-2',
      repo_digest: '요약 2',
      discussion_summary: '비공개 토론',
      messages: [],
      is_public: false,
    });
  });

  it('GET /api/stats returns cumulative metrics and highlights', async (): Promise<void> => {
    const req: Request = new Request('http://localhost:4000/api/stats');
    const res: Response = await getStatsHandler(req);
    expect(res.status).toBe(200);

    const json: ApiResponse<PlatformStatsResponseDto> =
      (await res.json()) as ApiResponse<PlatformStatsResponseDto>;
    expect(json.success).toBe(true);
    expect(json.data?.snapshot_count).toBe(2);
    expect(json.data?.public_archive_count).toBe(1);
    expect(json.data?.total_user_count).toBe(2);
    expect(json.data?.today_top3).toHaveLength(3);
    expect(json.data?.today_top3[0].rank).toBe(1);
    expect(json.data?.recent_public_discussions).toHaveLength(1);
    expect(json.data?.recent_public_discussions[0].id).toBe('arch-pub-1');
  });
});
