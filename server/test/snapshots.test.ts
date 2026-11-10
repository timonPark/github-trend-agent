import { describe, it, expect, beforeEach } from 'vitest';
import { resetServerDbForTest, getServerDb } from '../src/lib/db';
import { GET as getSnapshotHandler, POST as saveSnapshotHandler } from '../src/app/api/snapshots/route';

describe('Server Daily Snapshots API (#6)', () => {
  let authKey: string;

  beforeEach(async () => {
    const db = resetServerDbForTest();
    const user = await db.createUser('timon', 'hashed-pass', 'gta_live_testkey_123');
    authKey = user.client_auth_key;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const getReq = new Request('http://localhost:4000/api/snapshots?date=2026-11-10');
    const getRes = await getSnapshotHandler(getReq);
    expect(getRes.status).toBe(401);

    const postReq = new Request('http://localhost:4000/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot_date: '2026-11-10', repositories: [] }),
    });
    const postRes = await saveSnapshotHandler(postReq);
    expect(postRes.status).toBe(401);
  });

  it('returns 404 when no snapshot exists for requested date', async () => {
    const req = new Request('http://localhost:4000/api/snapshots?date=2026-11-10', {
      headers: { Authorization: `Bearer ${authKey}` },
    });
    const res = await getSnapshotHandler(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.snapshot).toBeNull();
  });

  it('saves and retrieves daily snapshot with creator metadata', async () => {
    const mockRepos = [
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

    // POST snapshot
    const postReq = new Request('http://localhost:4000/api/snapshots', {
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

    const postRes = await saveSnapshotHandler(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.snapshot.created_by).toBe('timon');
    expect(postData.snapshot.repositories).toHaveLength(1);

    // GET snapshot
    const getReq = new Request('http://localhost:4000/api/snapshots?date=2026-11-10', {
      headers: { Authorization: `Bearer ${authKey}` },
    });
    const getRes = await getSnapshotHandler(getReq);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.snapshot.snapshot_date).toBe('2026-11-10');
    expect(getData.snapshot.repositories[0].name).toBe('next.js');
  });

  it('validates required fields on POST', async () => {
    const badReq = new Request('http://localhost:4000/api/snapshots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authKey}`,
      },
      body: JSON.stringify({ snapshot_date: '2026-11-10' }), // missing repositories
    });
    const badRes = await saveSnapshotHandler(badReq);
    expect(badRes.status).toBe(400);
  });
});
