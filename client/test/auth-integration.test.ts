import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Database as DatabaseInstance } from 'better-sqlite3';
import {
  getClientDb,
  resetClientDbForTest,
  saveLocalSnapshot,
  saveDiscussionSession,
  saveLocalArchive,
  getServerAuthKey,
  setServerAuthKey,
} from '../src/lib/db';
import { verifyServerKey, fetchWithServerAuth, UnauthorizedError, VerifyKeyResult } from '../src/lib/server-api';
import { POST as saveSettingsHandler, GET as getSettingsHandler } from '../src/app/api/settings/route';
import { GET as getAuthStatusHandler } from '../src/app/api/auth/status/route';

const TEST_DB_PATH: string = path.resolve(__dirname, './test_auth_client.sqlite');

describe('Client Auth Integration & Local Data Preservation', (): void => {
  beforeEach((): void => {
    resetClientDbForTest();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch {
        // ignore
      }
    }
    process.env.DATABASE_PATH = TEST_DB_PATH;
  });

  afterEach((): void => {
    resetClientDbForTest();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch {
        // ignore
      }
    }
    vi.restoreAllMocks();
  });

  describe('verifyServerKey helper', (): void => {
    it('returns valid: true when server responds 200 with user', async (): Promise<void> => {
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        valid: true,
        user: { id: 'usr-1', username: 'timon' },
      }), { status: 200 }));

      const result: VerifyKeyResult = await verifyServerKey('http://localhost:4000', 'gta_live_validkey');
      expect(result.valid).toBe(true);
      expect(result.user?.username).toBe('timon');
    });

    it('returns valid: false and statusCode 401 when central server rejects key', async (): Promise<void> => {
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        valid: false,
        error: 'Invalid or expired client auth key',
      }), { status: 401 }));

      const result: VerifyKeyResult = await verifyServerKey('http://localhost:4000', 'gta_live_invalid');
      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Invalid or expired');
    });
  });

  describe('fetchWithServerAuth & 401 detection', (): void => {
    it('throws UnauthorizedError when no key is set', async (): Promise<void> => {
      await expect(
        fetchWithServerAuth(TEST_DB_PATH, '/api/snapshots/today')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when server returns 401', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      setServerAuthKey('expired_key', db);

      global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

      await expect(
        fetchWithServerAuth(TEST_DB_PATH, '/api/snapshots/today')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('Settings API & Local Data Retention Invariant', (): void => {
    it('preserves existing snapshots, sessions, and archives when changing server_auth_key', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);

      saveLocalSnapshot(
        '2026-11-10',
        [{
          rank: 1,
          name: 'next.js',
          full_name: 'vercel/next.js',
          url: 'https://github.com/vercel/next.js',
          description: 'The React Framework',
          language: 'JavaScript',
          total_stars: 120000,
          daily_stars: 450,
        }],
        'local-scraper',
        db
      );

      saveDiscussionSession(
        {
          id: 'session-preserve-1',
          repo_full_name: 'vercel/next.js',
          repo_url: 'https://github.com/vercel/next.js',
          messages: [{ id: 'm-1', role: 'user', content: 'What is Next.js?', timestamp: new Date().toISOString() }],
        },
        db
      );

      saveLocalArchive(
        {
          id: 'archive-preserve-1',
          user_id: 'usr-1',
          snapshot_date: '2026-11-10',
          repo_full_name: 'vercel/next.js',
          repo_url: 'https://github.com/vercel/next.js',
          repo_digest: 'Next.js digest',
          discussion_summary: 'Discussed architectural advantages',
          messages: [],
          is_public: true,
          synced_with_server: false,
        },
        db
      );

      expect(db.prepare('SELECT COUNT(*) as c FROM local_snapshots').get()).toEqual({ c: 1 });
      expect(db.prepare('SELECT COUNT(*) as c FROM discussion_sessions').get()).toEqual({ c: 1 });
      expect(db.prepare('SELECT COUNT(*) as c FROM local_archives').get()).toEqual({ c: 1 });

      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        valid: true,
        user: { id: 'usr-new', username: 'timon_new' },
      }), { status: 200 }));

      const req: Request = new Request('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_url: 'http://localhost:4000',
          server_auth_key: 'gta_live_brand_new_key_9999',
          verify: true,
        }),
      });

      const res: Response = await saveSettingsHandler(req);
      expect(res.status).toBe(200);
      const resData: { success: boolean } = (await res.json()) as { success: boolean };
      expect(resData.success).toBe(true);

      const updatedKey: string | null = getServerAuthKey(db);
      expect(updatedKey).toBe('gta_live_brand_new_key_9999');

      const afterSnapshots: unknown = db.prepare('SELECT COUNT(*) as c FROM local_snapshots').get();
      const afterSessions: unknown = db.prepare('SELECT COUNT(*) as c FROM discussion_sessions').get();
      const afterArchives: unknown = db.prepare('SELECT COUNT(*) as c FROM local_archives').get();

      expect(afterSnapshots).toEqual({ c: 1 });
      expect(afterSessions).toEqual({ c: 1 });
      expect(afterArchives).toEqual({ c: 1 });

      const getRes: Response = await getSettingsHandler();
      const getData: {
        settings: { server_auth_key: string; client_auth_key: string; server_url: string; is_key_set: boolean };
        stats: { snapshotCount: number; sessionCount: number; archiveCount: number };
      } = (await getRes.json()) as {
        settings: { server_auth_key: string; client_auth_key: string; server_url: string; is_key_set: boolean };
        stats: { snapshotCount: number; sessionCount: number; archiveCount: number };
      };
      expect(getData.stats.snapshotCount).toBe(1);
      expect(getData.stats.sessionCount).toBe(1);
      expect(getData.stats.archiveCount).toBe(1);
      expect(getData.settings.server_auth_key).toBe('gta_live_brand_new_key_9999');
      expect(getData.settings.client_auth_key).toBe('gta_live_brand_new_key_9999');
      expect(getData.settings.is_key_set).toBe(true);
    });

    it('supports client_auth_key in POST /api/settings interchangeably (#43)', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        valid: true,
        user: { id: 'usr-dual', username: 'dual_user' },
      }), { status: 200 }));

      const req: Request = new Request('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_url: 'http://localhost:4000',
          client_auth_key: 'gta_live_dual_key_7777',
          verify: true,
        }),
      });

      const res: Response = await saveSettingsHandler(req);
      expect(res.status).toBe(200);

      const savedKey: string | null = getServerAuthKey(db);
      expect(savedKey).toBe('gta_live_dual_key_7777');

      const getRes: Response = await getSettingsHandler();
      const getData: { settings: { client_auth_key: string; server_auth_key: string } } =
        (await getRes.json()) as { settings: { client_auth_key: string; server_auth_key: string } };
      expect(getData.settings.client_auth_key).toBe('gta_live_dual_key_7777');
      expect(getData.settings.server_auth_key).toBe('gta_live_dual_key_7777');
    });
  });

  describe('Auth Status API', (): void => {
    it('returns authenticated: false when key is not registered', async (): Promise<void> => {
      const res: Response = await getAuthStatusHandler(new Request('http://localhost:3000/api/auth/status'));
      const data: { authenticated: boolean; error: string } =
        (await res.json()) as { authenticated: boolean; error: string };
      expect(data.authenticated).toBe(false);
      expect(data.error).toContain('인증 키가 등록되지 않았습니다');
    });

    it('returns authenticated: true when valid key is verified', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      setServerAuthKey('gta_live_test', db);

      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        valid: true,
        user: { id: 'usr-1', username: 'timon' },
      }), { status: 200 }));

      const res: Response = await getAuthStatusHandler(new Request('http://localhost:3000/api/auth/status'));
      const data: { authenticated: boolean; user: { username: string } } =
        (await res.json()) as { authenticated: boolean; user: { username: string } };
      expect(data.authenticated).toBe(true);
      expect(data.user.username).toBe('timon');
    });

    it('returns valid: true and configured: true matching UI AuthGate expectations (#39)', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      setServerAuthKey('gta_live_test', db);

      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        valid: true,
        user: { id: 'usr-1', username: 'timon' },
      }), { status: 200 }));

      const res: Response = await getAuthStatusHandler(new Request('http://localhost:3000/api/auth/status'));
      const data: { valid: boolean; configured: boolean; authenticated: boolean } =
        (await res.json()) as { valid: boolean; configured: boolean; authenticated: boolean };
      expect(data.valid).toBe(true);
      expect(data.configured).toBe(true);
      expect(data.authenticated).toBe(true);
    });
  });
});
