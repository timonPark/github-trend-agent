import Database, { Database as DatabaseInstance } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import {
  LocalSnapshot,
  TrendingRepository,
  DiscussionSession,
  ChatMessage,
  LocalArchive,
} from './types';

let dbInstance: DatabaseInstance | null = null;

export function resetClientDbForTest(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {}
    dbInstance = null;
  }
}

export function getClientDb(customPath?: string): DatabaseInstance {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const defaultDir = path.resolve(process.cwd(), '.data');
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }

  const dbPath = customPath || process.env.DATABASE_PATH || path.join(defaultDir, 'client.db');
  const db = new Database(dbPath);

  // Enable WAL mode for high concurrency & performance
  db.pragma('journal_mode = WAL');

  // Initialize Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS local_snapshots (
      snapshot_date TEXT PRIMARY KEY,
      repositories TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS discussion_sessions (
      id TEXT PRIMARY KEY,
      repo_full_name TEXT NOT NULL,
      repo_url TEXT NOT NULL,
      messages TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_archives (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      snapshot_date TEXT NOT NULL,
      repo_full_name TEXT NOT NULL,
      repo_url TEXT NOT NULL,
      repo_digest TEXT NOT NULL,
      discussion_summary TEXT NOT NULL,
      messages TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 0,
      synced_with_server INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

// Settings Helpers (Server Auth Key & AI Preferences)
export function getSetting(key: string, db?: DatabaseInstance): string | null {
  const d = db || getClientDb();
  const stmt = d.prepare('SELECT value FROM user_settings WHERE key = ?');
  const row = stmt.get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

export function setSetting(key: string, value: string, db?: DatabaseInstance): void {
  const d = db || getClientDb();
  const stmt = d.prepare(`
    INSERT INTO user_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  stmt.run(key, value, new Date().toISOString());
}

export function getServerAuthKey(db?: DatabaseInstance): string | null {
  return getSetting('server_auth_key', db);
}

export function setServerAuthKey(key: string, db?: DatabaseInstance): void {
  // Sets or updates server authentication key without touching other tables
  setSetting('server_auth_key', key, db);
}

// Local Snapshot Helpers
export function getLocalSnapshot(date: string, db?: DatabaseInstance): LocalSnapshot | null {
  const d = db || getClientDb();
  const stmt = d.prepare('SELECT * FROM local_snapshots WHERE snapshot_date = ?');
  const row = stmt.get(date) as { snapshot_date: string; repositories: string; source: string; created_at: string } | undefined;
  if (!row) return null;
  return {
    snapshot_date: row.snapshot_date,
    repositories: JSON.parse(row.repositories),
    source: row.source as 'local-scraper' | 'remote-server',
    created_at: row.created_at,
  };
}

export function saveLocalSnapshot(
  snapshot_date: string,
  repositories: TrendingRepository[],
  source: 'local-scraper' | 'remote-server',
  db?: DatabaseInstance
): LocalSnapshot {
  const d = db || getClientDb();
  const now = new Date().toISOString();
  const stmt = d.prepare(`
    INSERT INTO local_snapshots (snapshot_date, repositories, source, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(snapshot_date) DO UPDATE SET
      repositories = excluded.repositories,
      source = excluded.source,
      created_at = excluded.created_at
  `);
  stmt.run(snapshot_date, JSON.stringify(repositories), source, now);
  return { snapshot_date, repositories, source, created_at: now };
}

// Discussion Session Helpers (Active Chat Workspace)
export function getDiscussionSession(id: string, db?: DatabaseInstance): DiscussionSession | null {
  const d = db || getClientDb();
  const stmt = d.prepare('SELECT * FROM discussion_sessions WHERE id = ?');
  const row = stmt.get(id) as { id: string; repo_full_name: string; repo_url: string; messages: string; created_at: string; updated_at: string } | undefined;
  if (!row) return null;
  return {
    id: row.id,
    repo_full_name: row.repo_full_name,
    repo_url: row.repo_url,
    messages: JSON.parse(row.messages),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function saveDiscussionSession(
  session: { id: string; repo_full_name: string; repo_url: string; messages: ChatMessage[] },
  db?: DatabaseInstance
): DiscussionSession {
  const d = db || getClientDb();
  const now = new Date().toISOString();
  const existing = getDiscussionSession(session.id, d);
  const createdAt = existing ? existing.created_at : now;

  const stmt = d.prepare(`
    INSERT INTO discussion_sessions (id, repo_full_name, repo_url, messages, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      repo_full_name = excluded.repo_full_name,
      repo_url = excluded.repo_url,
      messages = excluded.messages,
      updated_at = excluded.updated_at
  `);
  stmt.run(session.id, session.repo_full_name, session.repo_url, JSON.stringify(session.messages), createdAt, now);
  return { ...session, created_at: createdAt, updated_at: now };
}

// Local Archive Helpers
export function getLocalArchive(id: string, db?: DatabaseInstance): LocalArchive | null {
  const d = db || getClientDb();
  const stmt = d.prepare('SELECT * FROM local_archives WHERE id = ?');
  const row = stmt.get(id) as {
    id: string;
    user_id: string;
    snapshot_date: string;
    repo_full_name: string;
    repo_url: string;
    repo_digest: string;
    discussion_summary: string;
    messages: string;
    is_public: number;
    synced_with_server: number;
    created_at: string;
  } | undefined;
  if (!row) return null;
  return {
    ...row,
    messages: JSON.parse(row.messages),
    is_public: row.is_public === 1,
    synced_with_server: row.synced_with_server === 1,
  };
}

export function saveLocalArchive(archive: Omit<LocalArchive, 'created_at'>, db?: DatabaseInstance): LocalArchive {
  const d = db || getClientDb();
  const now = new Date().toISOString();
  const stmt = d.prepare(`
    INSERT INTO local_archives (
      id, user_id, snapshot_date, repo_full_name, repo_url, repo_digest,
      discussion_summary, messages, is_public, synced_with_server, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      repo_digest = excluded.repo_digest,
      discussion_summary = excluded.discussion_summary,
      messages = excluded.messages,
      is_public = excluded.is_public,
      synced_with_server = excluded.synced_with_server
  `);
  stmt.run(
    archive.id,
    archive.user_id,
    archive.snapshot_date,
    archive.repo_full_name,
    archive.repo_url,
    archive.repo_digest,
    archive.discussion_summary,
    JSON.stringify(archive.messages),
    archive.is_public ? 1 : 0,
    archive.synced_with_server ? 1 : 0,
    now
  );
  return { ...archive, created_at: now };
}

export function listLocalArchives(db?: DatabaseInstance): LocalArchive[] {
  const d = db || getClientDb();
  const stmt = d.prepare('SELECT * FROM local_archives ORDER BY created_at DESC');
  const rows = stmt.all() as Array<{
    id: string;
    user_id: string;
    snapshot_date: string;
    repo_full_name: string;
    repo_url: string;
    repo_digest: string;
    discussion_summary: string;
    messages: string;
    is_public: number;
    synced_with_server: number;
    created_at: string;
  }>;
  return rows.map((r) => ({
    ...r,
    messages: JSON.parse(r.messages),
    is_public: r.is_public === 1,
    synced_with_server: r.synced_with_server === 1,
  }));
}

export function updateLocalArchiveVisibility(id: string, is_public: boolean, db?: DatabaseInstance): LocalArchive | null {
  const d = db || getClientDb();
  const stmt = d.prepare('UPDATE local_archives SET is_public = ? WHERE id = ?');
  stmt.run(is_public ? 1 : 0, id);
  return getLocalArchive(id, d);
}
