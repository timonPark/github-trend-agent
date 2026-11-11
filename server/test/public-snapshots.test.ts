import { describe, it, expect, beforeEach } from 'vitest';
import { resetServerDbForTest, ServerDatabase } from '../src/lib/db';
import { GET as getPublicSnapshotHandler } from '../src/app/api/snapshots/public/route';
import { ApiResponse, PublicSnapshotResponseDto } from '../src/lib/types/api';
import { TrendingRepository } from '../src/lib/types';

describe('Public Snapshot Explorer API (#28)', (): void => {
  let db: ServerDatabase;

  const mockRepos: TrendingRepository[] = [
    { rank: 1, name: 'next.js', full_name: 'vercel/next.js', url: 'https://github.com/vercel/next.js', description: 'Framework', language: 'JavaScript', total_stars: 120000, daily_stars: 450, digest: '1. 프레임워크\n2. SSR\n3. 성능' },
    { rank: 2, name: 'react', full_name: 'facebook/react', url: 'https://github.com/facebook/react', description: 'UI Lib', language: 'JavaScript', total_stars: 230000, daily_stars: 300 },
  ];

  beforeEach(async (): Promise<void> => {
    db = resetServerDbForTest();
    await db.saveDailySnapshot('2026-11-10', mockRepos);
    await db.saveDailySnapshot('2026-11-11', [mockRepos[0]]);
  });

  it('GET /api/snapshots/public returns latest snapshot without auth header', async (): Promise<void> => {
    const req: Request = new Request('http://localhost:4000/api/snapshots/public');
    const res: Response = await getPublicSnapshotHandler(req);
    expect(res.status).toBe(200);

    const json: ApiResponse<PublicSnapshotResponseDto> =
      (await res.json()) as ApiResponse<PublicSnapshotResponseDto>;
    expect(json.success).toBe(true);
    expect(json.data?.snapshot?.snapshot_date).toBe('2026-11-11');
    expect(json.data?.available_dates).toEqual(['2026-11-11', '2026-11-10']);
  });

  it('GET /api/snapshots/public?date=2026-11-10 returns requested date snapshot', async (): Promise<void> => {
    const req: Request = new Request('http://localhost:4000/api/snapshots/public?date=2026-11-10');
    const res: Response = await getPublicSnapshotHandler(req);
    expect(res.status).toBe(200);

    const json: ApiResponse<PublicSnapshotResponseDto> =
      (await res.json()) as ApiResponse<PublicSnapshotResponseDto>;
    expect(json.success).toBe(true);
    expect(json.data?.snapshot?.snapshot_date).toBe('2026-11-10');
    expect(json.data?.snapshot?.repositories).toHaveLength(2);
  });

  it('GET /api/snapshots/public?date=9999-99-99 returns null snapshot with available dates', async (): Promise<void> => {
    const req: Request = new Request('http://localhost:4000/api/snapshots/public?date=9999-99-99');
    const res: Response = await getPublicSnapshotHandler(req);
    expect(res.status).toBe(200);

    const json: ApiResponse<PublicSnapshotResponseDto> =
      (await res.json()) as ApiResponse<PublicSnapshotResponseDto>;
    expect(json.success).toBe(true);
    expect(json.data?.snapshot).toBeNull();
    expect(json.data?.available_dates).toHaveLength(2);
  });
});
