import { describe, it, expect, beforeEach } from 'vitest';
import { resetServerDbForTest, ServerDatabase } from '../src/lib/db';
import { GET as getSnapshotHandler, POST as saveSnapshotHandler } from '../src/app/api/snapshots/route';
import { User, TrendingRepository, DailySnapshot } from '../src/lib/types';

describe('Server Daily Snapshots API (#6)', (): void => {
  let authKey: string;

  beforeEach(async (): Promise<void> => {
    const db: ServerDatabase = resetServerDbForTest();
    const user: User = await db.createUser('timon', 'hashed-pass', 'gta_live_testkey_123');
    authKey = user.client_auth_key;
  });

  it('rejects unauthenticated requests with 401', async (): Promise<void> => {
    const getReq: Request = new Request('http://localhost:4000/api/snapshots?date=2026-11-10');
    const getRes: Response = await getSnapshotHandler(getReq);
    expect(getRes.status).toBe(401);

    const postReq: Request = new Request('http://localhost:4000/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot_date: '2026-11-10', repositories: [] }),
    });
    const postRes: Response = await saveSnapshotHandler(postReq);
    expect(postRes.status).toBe(401);
  });

  it('returns 404 when no snapshot exists for requested date', async (): Promise<void> => {
    const req: Request = new Request('http://localhost:4000/api/snapshots?date=2026-11-10', {
      headers: { Authorization: `Bearer ${authKey}` },
    });
    const res: Response = await getSnapshotHandler(req);
    expect(res.status).toBe(404);
    const data: { snapshot: unknown } = (await res.json()) as { snapshot: unknown };
    expect(data.snapshot).toBeNull();
  });

  it('saves and retrieves daily snapshot with creator metadata', async (): Promise<void> => {
    const mockRepos: TrendingRepository[] = [
      {
        rank: 1,
        name: 'next.js',
        full_name: 'vercel/next.js',
        url: 'https://github.com/vercel/next.js',
        description: 'React Framework',
        language: 'JavaScript',
        total_stars: 120000,
        daily_stars: 450,
      },
    ];

    const postReq: Request = new Request('http://localhost:4000/api/snapshots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authKey}`,
      },
      body: JSON.stringify({
        snapshot_date: '2026-11-10',
        repositories: mockRepos,
      }),
    });

    const postRes: Response = await saveSnapshotHandler(postReq);
    expect(postRes.status).toBe(201);
    const postData: { success: boolean; snapshot: DailySnapshot } =
      (await postRes.json()) as { success: boolean; snapshot: DailySnapshot };
    expect(postData.success).toBe(true);
    expect(postData.snapshot.created_by).toBe('timon');
    expect(postData.snapshot.repositories).toHaveLength(1);

    const getReq: Request = new Request('http://localhost:4000/api/snapshots?date=2026-11-10', {
      headers: { Authorization: `Bearer ${authKey}` },
    });
    const getRes: Response = await getSnapshotHandler(getReq);
    expect(getRes.status).toBe(200);
    const getData: { snapshot: DailySnapshot } = (await getRes.json()) as { snapshot: DailySnapshot };
    expect(getData.snapshot.snapshot_date).toBe('2026-11-10');
    expect(getData.snapshot.repositories[0].name).toBe('next.js');
  });

  it('validates required fields on POST', async (): Promise<void> => {
    const badReq: Request = new Request('http://localhost:4000/api/snapshots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authKey}`,
      },
      body: JSON.stringify({ snapshot_date: '2026-11-10' }),
    });
    const badRes: Response = await saveSnapshotHandler(badReq);
    expect(badRes.status).toBe(400);
  });
});
