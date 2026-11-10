import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getClientDb, resetClientDbForTest, setServerAuthKey, getLocalSnapshot } from '../src/lib/db';
import { getOrFetchDailySnapshot } from '../src/lib/snapshot-service';

const DB_CLIENT_A = path.resolve(__dirname, './test_client_a.sqlite');
const DB_CLIENT_B = path.resolve(__dirname, './test_client_b.sqlite');

describe('Daily Trending Snapshot 3-Tier Caching (#6)', () => {
  beforeEach(() => {
    resetClientDbForTest();
    if (fs.existsSync(DB_CLIENT_A)) try { fs.unlinkSync(DB_CLIENT_A); } catch {}
    if (fs.existsSync(DB_CLIENT_B)) try { fs.unlinkSync(DB_CLIENT_B); } catch {}
  });

  afterEach(() => {
    resetClientDbForTest();
    if (fs.existsSync(DB_CLIENT_A)) try { fs.unlinkSync(DB_CLIENT_A); } catch {}
    if (fs.existsSync(DB_CLIENT_B)) try { fs.unlinkSync(DB_CLIENT_B); } catch {}
    vi.restoreAllMocks();
  });

  it('Tier 1: returns local-cache immediately without network calls when present in SQLite', async () => {
    const db = getClientDb(DB_CLIENT_A);
    setServerAuthKey('gta_live_key_a', db);

    // Pre-seed local SQLite
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

    const result = await getOrFetchDailySnapshot('2026-11-10', { dbPath: DB_CLIENT_A });
    expect(result.source).toBe('local-cache');
    expect(result.snapshot.repositories[0].name).toBe('local-cached-repo');
    // Tier 1 should NOT call central server or scraper
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('Tier 2: pulls from central server when local is empty and caches into local SQLite', async () => {
    const db = getClientDb(DB_CLIENT_A);
    setServerAuthKey('gta_live_key_a', db);

    const mockServerSnapshot = {
      snapshot_date: '2026-11-10',
      repositories: [
        { rank: 1, name: 'server-shared-repo', full_name: 'shared/repo', total_stars: 5000, daily_stars: 200 },
      ],
      created_by: 'another-user',
    };

    // Central server has the snapshot (200 OK)
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/snapshots')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ snapshot: mockServerSnapshot }),
        } as any;
      }
      return { ok: false, status: 404 } as any;
    });

    const result = await getOrFetchDailySnapshot('2026-11-10', { dbPath: DB_CLIENT_A });
    expect(result.source).toBe('remote-server');
    expect(result.snapshot.repositories[0].name).toBe('server-shared-repo');

    // Verify it was cached into local SQLite
    const cached = getLocalSnapshot('2026-11-10', db);
    expect(cached).not.toBeNull();
    expect(cached?.source).toBe('remote-server');
    expect(cached?.repositories[0].name).toBe('server-shared-repo');
  });

  it('Tier 3: scrapes fresh data when both local and central server are missing, then syncs to central server', async () => {
    const db = getClientDb(DB_CLIENT_A);
    setServerAuthKey('gta_live_key_a', db);

    let syncPostPayload: any = null;

    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      // 1. Central server GET returns 404 (no snapshot yet)
      if (url.includes('/api/snapshots') && (!init || init.method === 'GET')) {
        return {
          ok: false,
          status: 404,
          json: async () => ({ snapshot: null }),
        } as any;
      }

      // 2. Central server POST syncs the fresh snapshot
      if (url.includes('/api/snapshots') && init?.method === 'POST') {
        syncPostPayload = JSON.parse(init.body as string);
        return {
          ok: true,
          status: 201,
          json: async () => ({ success: true, snapshot: syncPostPayload }),
        } as any;
      }

      // 3. GitHub Trending live fetch fails so it uses verified fallback
      if (url.includes('github.com/trending')) {
        return { ok: false, status: 500 } as any;
      }

      return { ok: false, status: 404 } as any;
    });

    const result = await getOrFetchDailySnapshot('2026-11-10', { dbPath: DB_CLIENT_A });
    expect(result.source).toBe('fresh-scraped');
    expect(result.snapshot.repositories).toHaveLength(10);
    expect(result.syncedWithServer).toBe(true);

    // Verify sync POST was called with the fresh snapshot
    expect(syncPostPayload).not.toBeNull();
    expect(syncPostPayload.snapshot_date).toBe('2026-11-10');
    expect(syncPostPayload.repositories).toHaveLength(10);

    // Verify saved in local SQLite
    const local = getLocalSnapshot('2026-11-10', db);
    expect(local).not.toBeNull();
    expect(local?.source).toBe('local-scraper');
  });

  it('Multi-Client Sharing: Client B receives snapshot from Central Server without scraping after Client A initiates', async () => {
    // Shared Central Server Mock Database
    let centralServerStorage: any = null;

    // --- Step 1: Client A runs (Tier 3: fresh scrape and syncs to server) ---
    const dbA = getClientDb(DB_CLIENT_A);
    setServerAuthKey('gta_live_key_client_a', dbA);

    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes('/api/snapshots')) {
        if (!init || init.method === 'GET') {
          if (centralServerStorage) {
            return { ok: true, status: 200, json: async () => ({ snapshot: centralServerStorage }) } as any;
          }
          return { ok: false, status: 404, json: async () => ({ snapshot: null }) } as any;
        }
        if (init.method === 'POST') {
          centralServerStorage = JSON.parse(init.body as string);
          return { ok: true, status: 201, json: async () => ({ success: true, snapshot: centralServerStorage }) } as any;
        }
      }
      return { ok: false, status: 500 } as any; // scraper uses fallback
    });

    const resA = await getOrFetchDailySnapshot('2026-11-10', { dbPath: DB_CLIENT_A });
    expect(resA.source).toBe('fresh-scraped');
    expect(centralServerStorage).not.toBeNull();

    // --- Step 2: Client B requests same date (Tier 2: gets from server without scraping) ---
    resetClientDbForTest();
    const dbB = getClientDb(DB_CLIENT_B);
    setServerAuthKey('gta_live_key_client_b', dbB);

    // Verify Client B local DB is completely empty
    expect(getLocalSnapshot('2026-11-10', dbB)).toBeNull();

    const resB = await getOrFetchDailySnapshot('2026-11-10', { dbPath: DB_CLIENT_B });
    // MUST be remote-server (Tier 2), not fresh-scraped!
    expect(resB.source).toBe('remote-server');
    expect(resB.snapshot.repositories).toHaveLength(10);
    expect(resB.snapshot.repositories[0].name).toBe(resA.snapshot.repositories[0].name);

    // --- Step 3: Client B requests again (Tier 1: gets from local cache) ---
    const fetchSpy = vi.spyOn(global, 'fetch');
    const resBAgain = await getOrFetchDailySnapshot('2026-11-10', { dbPath: DB_CLIENT_B });
    expect(resBAgain.source).toBe('local-cache');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
