import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getClientDb,
  resetClientDbForTest,
  saveLocalSnapshot,
  saveDiscussionSession,
  saveLocalArchive,
  getServerAuthKey,
  setServerAuthKey,
} from '../src/lib/db';
import { verifyServerKey, fetchWithServerAuth, UnauthorizedError } from '../src/lib/server-api';
import { POST as saveSettingsHandler, GET as getSettingsHandler } from '../src/app/api/settings/route';
import { GET as getAuthStatusHandler } from '../src/app/api/auth/status/route';

const TEST_DB_PATH = path.resolve(__dirname, './test_auth_client.sqlite');

describe('Client Auth Integration & Local Data Preservation', () => {
  beforeEach(() => {
    resetClientDbForTest();
    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch {}
    }
    process.env.DATABASE_PATH = TEST_DB_PATH;
  });

  afterEach(() => {
    resetClientDbForTest();
    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch {}
    }
    vi.restoreAllMocks();
  });

  describe('verifyServerKey helper', () => {
    it('returns valid: true when server responds 200 with user', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          valid: true,
          user: { id: 'usr-1', username: 'timon' },
        }),
      } as any);

      const result = await verifyServerKey('http://localhost:4000', 'gta_live_validkey');
      expect(result.valid).toBe(true);
      expect(result.user?.username).toBe('timon');
    });

    it('returns valid: false and statusCode 401 when central server rejects key', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({
          valid: false,
          error: 'Invalid or expired client auth key',
        }),
      } as any);

      const result = await verifyServerKey('http://localhost:4000', 'gta_live_invalid');
      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Invalid or expired');
    });
  });

  describe('fetchWithServerAuth & 401 detection', () => {
    it('throws UnauthorizedError when no key is set', async () => {
      await expect(
        fetchWithServerAuth(TEST_DB_PATH, '/api/snapshots/today')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when server returns 401', async () => {
      const db = getClientDb(TEST_DB_PATH);
      setServerAuthKey('expired_key', db);

      global.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
      } as any);

      await expect(
        fetchWithServerAuth(TEST_DB_PATH, '/api/snapshots/today')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('Settings API & Local Data Retention Invariant', () => {
    it('preserves existing snapshots, sessions, and archives when changing server_auth_key', async () => {
      const db = getClientDb(TEST_DB_PATH);

      // Seed local data
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

      // Verify data exists
      expect(db.prepare('SELECT COUNT(*) as c FROM local_snapshots').get()).toEqual({ c: 1 });
      expect(db.prepare('SELECT COUNT(*) as c FROM discussion_sessions').get()).toEqual({ c: 1 });
      expect(db.prepare('SELECT COUNT(*) as c FROM local_archives').get()).toEqual({ c: 1 });

      // Mock verifyServerKey to accept the new key
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          valid: true,
          user: { id: 'usr-new', username: 'timon_new' },
        }),
      } as any);

      // Change auth key via Settings POST
      const req = new Request('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_url: 'http://localhost:4000',
          server_auth_key: 'gta_live_brand_new_key_9999',
          verify: true,
        }),
      });

      const res = await saveSettingsHandler(req);
      expect(res.status).toBe(200);
      const resData = await res.json();
      expect(resData.success).toBe(true);

      // Verify key was updated in user_settings
      const updatedKey = getServerAuthKey(db);
      expect(updatedKey).toBe('gta_live_brand_new_key_9999');

      // CRITICAL ASSERTION: Existing local data must remain 100% intact!
      const afterSnapshots = db.prepare('SELECT COUNT(*) as c FROM local_snapshots').get();
      const afterSessions = db.prepare('SELECT COUNT(*) as c FROM discussion_sessions').get();
      const afterArchives = db.prepare('SELECT COUNT(*) as c FROM local_archives').get();

      expect(afterSnapshots).toEqual({ c: 1 });
      expect(afterSessions).toEqual({ c: 1 });
      expect(afterArchives).toEqual({ c: 1 });

      // GET settings stats also reflect this
      const getRes = await getSettingsHandler();
      const getData = await getRes.json();
      expect(getData.stats.snapshotCount).toBe(1);
      expect(getData.stats.sessionCount).toBe(1);
      expect(getData.stats.archiveCount).toBe(1);
    });
  });

  describe('Auth Status API', () => {
    it('returns authenticated: false when key is not registered', async () => {
      const res = await getAuthStatusHandler(new Request('http://localhost:3000/api/auth/status'));
      const data = await res.json();
      expect(data.authenticated).toBe(false);
      expect(data.error).toContain('인증 키가 등록되지 않았습니다');
    });

    it('returns authenticated: true when valid key is verified', async () => {
      const db = getClientDb(TEST_DB_PATH);
      setServerAuthKey('gta_live_test', db);

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          valid: true,
          user: { id: 'usr-1', username: 'timon' },
        }),
      } as any);

      const res = await getAuthStatusHandler(new Request('http://localhost:3000/api/auth/status'));
      const data = await res.json();
      expect(data.authenticated).toBe(true);
      expect(data.user.username).toBe('timon');
    });
  });
});
