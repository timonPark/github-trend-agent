import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getClientDb,
  getSetting,
  setSetting,
  getServerAuthKey,
  setServerAuthKey,
  getLocalSnapshot,
  saveLocalSnapshot,
  getDiscussionSession,
  saveDiscussionSession,
  getLocalArchive,
  saveLocalArchive,
  listLocalArchives,
  updateLocalArchiveVisibility,
} from '../src/lib/db';
import { Database as DatabaseInstance } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { LocalSnapshot, DiscussionSession, LocalArchive, TrendingRepository } from '../src/lib/types';

describe('Client Local SQLite Database Layer', (): void => {
  let testDb: DatabaseInstance;
  const testDbPath: string = path.resolve(__dirname, './test-client.db');

  beforeEach((): void => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    testDb = getClientDb(testDbPath);
  });

  afterEach((): void => {
    testDb.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const walPath: string = `${testDbPath}-wal`;
    const shmPath: string = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) {
      fs.unlinkSync(walPath);
    }
    if (fs.existsSync(shmPath)) {
      fs.unlinkSync(shmPath);
    }
  });

  it('manages settings and server authentication key', (): void => {
    expect(getServerAuthKey(testDb)).toBeNull();

    setServerAuthKey('gta_live_initial_key_123', testDb);
    expect(getServerAuthKey(testDb)).toBe('gta_live_initial_key_123');

    setSetting('ai_provider', 'cli-claude', testDb);
    expect(getSetting('ai_provider', testDb)).toBe('cli-claude');
  });

  it('caches daily snapshots with source tag', (): void => {
    const repos: TrendingRepository[] = [
      {
        rank: 1,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        url: 'https://github.com/owner/test-repo',
        description: 'Repo description',
        language: 'TypeScript',
        total_stars: 5000,
        daily_stars: 300,
        digest: 'AI Digest',
      },
    ];

    saveLocalSnapshot('2026-11-10', repos, 'remote-server', testDb);

    const cached: LocalSnapshot | null = getLocalSnapshot('2026-11-10', testDb);
    expect(cached).not.toBeNull();
    expect(cached?.snapshot_date).toBe('2026-11-10');
    expect(cached?.source).toBe('remote-server');
    expect(cached?.repositories).toHaveLength(1);
    expect(cached?.repositories[0].name).toBe('test-repo');
  });

  it('saves and updates multi-turn discussion sessions', (): void => {
    const session = {
      id: 'session-42',
      repo_full_name: 'facebook/react',
      repo_url: 'https://github.com/facebook/react',
      messages: [
        { id: 'm1', role: 'user' as const, content: 'Explain Server Actions', timestamp: '2026-11-10T12:00:00Z' },
        { id: 'm2', role: 'assistant' as const, content: 'Server Actions allow...', timestamp: '2026-11-10T12:00:05Z' },
      ],
    };

    saveDiscussionSession(session, testDb);

    const loaded: DiscussionSession | null = getDiscussionSession('session-42', testDb);
    expect(loaded?.messages).toHaveLength(2);
    expect(loaded?.repo_full_name).toBe('facebook/react');
  });

  it('saves local archives and toggles public/private visibility', (): void => {
    const archive = {
      id: 'arch-local-1',
      user_id: 'user-abc',
      snapshot_date: '2026-11-10',
      repo_full_name: 'torvalds/linux',
      repo_url: 'https://github.com/torvalds/linux',
      repo_digest: 'Kernel digest',
      discussion_summary: 'Discussion about kernel modules',
      messages: [
        { id: 'msg-1', role: 'user' as const, content: 'How do modules load?', timestamp: '2026-11-10T12:30:00Z' },
      ],
      is_public: false,
      synced_with_server: true,
    };

    saveLocalArchive(archive, testDb);

    const loaded: LocalArchive | null = getLocalArchive('arch-local-1', testDb);
    expect(loaded?.is_public).toBe(false);
    expect(loaded?.synced_with_server).toBe(true);

    const all: LocalArchive[] = listLocalArchives(testDb);
    expect(all).toHaveLength(1);

    const updated: LocalArchive | null = updateLocalArchiveVisibility('arch-local-1', true, testDb);
    expect(updated?.is_public).toBe(true);
  });

  it('PRESERVES all local SQLite data when server authentication key is changed', (): void => {
    setServerAuthKey('gta_live_first_key', testDb);

    saveLocalSnapshot(
      '2026-11-10',
      [{ rank: 1, name: 'r1', full_name: 'o/r1', url: 'https://github.com/o/r1', description: 'd', language: 'JS', total_stars: 10, daily_stars: 5 }],
      'local-scraper',
      testDb
    );

    saveDiscussionSession(
      {
        id: 'session-persist',
        repo_full_name: 'o/r1',
        repo_url: 'https://github.com/o/r1',
        messages: [{ id: 'm1', role: 'user', content: 'test msg', timestamp: '2026-11-10T00:00:00Z' }],
      },
      testDb
    );

    saveLocalArchive(
      {
        id: 'arch-persist',
        user_id: 'user-original',
        snapshot_date: '2026-11-10',
        repo_full_name: 'o/r1',
        repo_url: 'https://github.com/o/r1',
        repo_digest: 'digest',
        discussion_summary: 'summary',
        messages: [{ id: 'm1', role: 'user', content: 'test msg', timestamp: '2026-11-10T00:00:00Z' }],
        is_public: true,
        synced_with_server: true,
      },
      testDb
    );

    setServerAuthKey('gta_live_SECOND_NEW_KEY_999', testDb);

    expect(getServerAuthKey(testDb)).toBe('gta_live_SECOND_NEW_KEY_999');

    const snapshotAfterKeyChange: LocalSnapshot | null = getLocalSnapshot('2026-11-10', testDb);
    expect(snapshotAfterKeyChange).not.toBeNull();
    expect(snapshotAfterKeyChange?.repositories[0].name).toBe('r1');

    const sessionAfterKeyChange: DiscussionSession | null = getDiscussionSession('session-persist', testDb);
    expect(sessionAfterKeyChange).not.toBeNull();
    expect(sessionAfterKeyChange?.messages).toHaveLength(1);

    const archiveAfterKeyChange: LocalArchive | null = getLocalArchive('arch-persist', testDb);
    expect(archiveAfterKeyChange).not.toBeNull();
    expect(archiveAfterKeyChange?.repo_full_name).toBe('o/r1');
    expect(archiveAfterKeyChange?.is_public).toBe(true);
  });
});
