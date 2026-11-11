import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, resetClientDbForTest, setServerAuthKey, getLocalSnapshot } from '../src/lib/db';
import { getOrFetchDailySnapshot, SnapshotFetchResult } from '../src/lib/snapshot-service';
import { LocalSnapshot, TrendingRepository } from '../src/lib/types';

const DB_CLIENT_A: string = path.resolve(__dirname, './test_client_a.sqlite');
const DB_CLIENT_B: string = path.resolve(__dirname, './test_client_b.sqlite');

interface MockServerPayload {
  snapshot_date: string;
  repositories: TrendingRepository[];
  created_by?: string;
}

describe('Daily Trending Snapshot 3-Tier Caching (#6)', (): void => {
  beforeEach((): void => {
    resetClientDbForTest();
    if (fs.existsSync(DB_CLIENT_A)) {
      try {
        fs.unlinkSync(DB_CLIENT_A);
      } catch {
        // ignore
      }
    }
    if (fs.existsSync(DB_CLIENT_B)) {
      try {
        fs.unlinkSync(DB_CLIENT_B);
      } catch {
        // ignore
      }
    }
  });

  afterEach((): void => {
    resetClientDbForTest();
    if (fs.existsSync(DB_CLIENT_A)) {
      try {
        fs.unlinkSync(DB_CLIENT_A);
      } catch {
        // ignore
      }
    }
    if (fs.existsSync(DB_CLIENT_B)) {
      try {
        fs.unlinkSync(DB_CLIENT_B);
      } catch {
        // ignore
      }
    }
    vi.restoreAllMocks();
  });

  it('Tier 1: returns local-cache immediately without network calls when present in SQLite', async (): Promise<void> => {
    const db: DatabaseInstance = getClientDb(DB_CLIENT_A);
    setServerAuthKey('gta_live_key_a', db);

    db.prepare(`
      INSERT INTO local_snapshots (snapshot_date, repositories, source, created_at)
      VALUES (?, ?, ?, ?)
    `).run(
      '2026-11-10',
      JSON.stringify([{ rank: 1, name: 'local-cached-repo', full_name: 'test/local', total_stars: 100, daily_stars: 10 }]),
      'local-scraper',
      new Date().toISOString()
    );

    const fetchSpy = vi.spyOn(global, 'fetch');

    const result: SnapshotFetchResult = await getOrFetchDailySnapshot('2026-11-10', { dbPath: DB_CLIENT_A });
    expect(result.source).toBe('local-cache');
    expect(result.snapshot.repositories[0].name).toBe('local-cached-repo');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('Tier 2: pulls from central server when local is empty and caches into local SQLite', async (): Promise<void> => {
    const db: DatabaseInstance = getClientDb(DB_CLIENT_A);
    setServerAuthKey('gta_live_key_a', db);

    const mockServerSnapshot: MockServerPayload = {
      snapshot_date: '2026-11-10',
      repositories: [
        {
          rank: 1,
          name: 'server-shared-repo',
          full_name: 'shared/repo',
          url: 'https://github.com/shared/repo',
          description: 'shared description',
          language: 'TypeScript',
          total_stars: 5000,
          daily_stars: 200,
        },
      ],
      created_by: 'another-user',
    };

    global.fetch = vi.fn().mockImplementation(async (url: string): Promise<Response> => {
      if (url.includes('/api/snapshots')) {
        return new Response(JSON.stringify({ snapshot: mockServerSnapshot }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const result: SnapshotFetchResult = await getOrFetchDailySnapshot('2026-11-10', { dbPath: DB_CLIENT_A });
    expect(result.source).toBe('remote-server');
    expect(result.snapshot.repositories[0].name).toBe('server-shared-repo');

    const cached: LocalSnapshot | null = getLocalSnapshot('2026-11-10', db);
    expect(cached).not.toBeNull();
    expect(cached?.source).toBe('remote-server');
    expect(cached?.repositories[0].name).toBe('server-shared-repo');
  });

  it('Tier 3: scrapes fresh data when both local and central server are missing, then syncs to central server', async (): Promise<void> => {
    const db: DatabaseInstance = getClientDb(DB_CLIENT_A);
    setServerAuthKey('gta_live_key_a', db);

    let syncPostPayload: MockServerPayload | null = null;

    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit): Promise<Response> => {
      if (url.includes('/api/snapshots') && (!init || init.method === 'GET')) {
        return new Response(JSON.stringify({ snapshot: null }), { status: 404 });
      }

      if (url.includes('/api/snapshots') && init?.method === 'POST') {
        syncPostPayload = JSON.parse(init.body as string) as MockServerPayload;
        return new Response(JSON.stringify({ success: true, snapshot: syncPostPayload }), { status: 201 });
      }

      if (url.includes('github.com/trending')) {
        return new Response(null, { status: 500 });
      }

      return new Response(null, { status: 404 });
    });

    const todayStr: string = new Date().toISOString().split('T')[0];
    const result: SnapshotFetchResult = await getOrFetchDailySnapshot(todayStr, { dbPath: DB_CLIENT_A });
    expect(result.source).toBe('fresh-scraped');
    expect(result.snapshot.repositories).toHaveLength(10);
    expect(result.syncedWithServer).toBe(true);

    expect(syncPostPayload).not.toBeNull();
    expect(syncPostPayload?.snapshot_date).toBe(todayStr);
    expect(syncPostPayload?.repositories).toHaveLength(10);

    const local: LocalSnapshot | null = getLocalSnapshot(todayStr, db);
    expect(local).not.toBeNull();
    expect(local?.source).toBe('local-scraper');
  });

  it('Multi-Client Sharing: Client B receives snapshot from Central Server without scraping after Client A initiates', async (): Promise<void> => {
    let centralServerStorage: MockServerPayload | null = null;
    const todayStr: string = new Date().toISOString().split('T')[0];

    const dbA: DatabaseInstance = getClientDb(DB_CLIENT_A);
    setServerAuthKey('gta_live_key_client_a', dbA);

    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit): Promise<Response> => {
      if (url.includes('/api/snapshots')) {
        if (!init || init.method === 'GET') {
          if (centralServerStorage) {
            return new Response(JSON.stringify({ snapshot: centralServerStorage }), { status: 200 });
          }
          return new Response(JSON.stringify({ snapshot: null }), { status: 404 });
        }
        if (init.method === 'POST') {
          centralServerStorage = JSON.parse(init.body as string) as MockServerPayload;
          return new Response(JSON.stringify({ success: true, snapshot: centralServerStorage }), { status: 201 });
        }
      }
      return new Response(null, { status: 500 });
    });

    const resA: SnapshotFetchResult = await getOrFetchDailySnapshot(todayStr, { dbPath: DB_CLIENT_A });
    expect(resA.source).toBe('fresh-scraped');
    expect(centralServerStorage).not.toBeNull();

    resetClientDbForTest();
    const dbB: DatabaseInstance = getClientDb(DB_CLIENT_B);
    setServerAuthKey('gta_live_key_client_b', dbB);

    expect(getLocalSnapshot(todayStr, dbB)).toBeNull();

    const resB: SnapshotFetchResult = await getOrFetchDailySnapshot(todayStr, { dbPath: DB_CLIENT_B });
    expect(resB.source).toBe('remote-server');
    expect(resB.snapshot.repositories).toHaveLength(10);
    expect(resB.snapshot.repositories[0].name).toBe(resA.snapshot.repositories[0].name);

    const fetchSpy = vi.spyOn(global, 'fetch');
    const resBAgain: SnapshotFetchResult = await getOrFetchDailySnapshot(todayStr, { dbPath: DB_CLIENT_B });
    expect(resBAgain.source).toBe('local-cache');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('Past Date Guard: does not scrape fresh data for past dates when neither local nor central server has data (#47)', async (): Promise<void> => {
    const db: DatabaseInstance = getClientDb(DB_CLIENT_A);
    setServerAuthKey('gta_live_key_past', db);

    // Mock central server returning 404 for past date
    global.fetch = vi.fn().mockImplementation(async (url: string): Promise<Response> => {
      if (url.includes('/api/snapshots')) {
        return new Response(JSON.stringify({ snapshot: null }), { status: 404 });
      }
      return new Response(null, { status: 500 });
    });

    const pastDate: string = '2020-01-01';
    const result: SnapshotFetchResult = await getOrFetchDailySnapshot(pastDate, { dbPath: DB_CLIENT_A });

    expect(result.source).toBe('local-cache');
    expect(result.snapshot.repositories).toHaveLength(0);
    expect(result.syncedWithServer).toBe(false);

    // Confirm nothing was scraped or saved into local SQLite
    const savedInDb = getLocalSnapshot(pastDate, db);
    expect(savedInDb).toBeNull();
  });
});
