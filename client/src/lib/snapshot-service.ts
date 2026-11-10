import { getClientDb, getLocalSnapshot, saveLocalSnapshot } from './db';
import { fetchWithServerAuth, UnauthorizedError } from './server-api';
import { scrapeGitHubTrending } from './scraper';
import { LocalSnapshot } from './types';

export type SnapshotCacheSource = 'local-cache' | 'remote-server' | 'fresh-scraped';

export interface SnapshotFetchResult {
  source: SnapshotCacheSource;
  snapshot: LocalSnapshot;
  syncedWithServer: boolean;
}

/**
 * Implements ADR-0002 3-tier caching:
 * Tier 1: Local SQLite Cache (zero latency)
 * Tier 2: Remote Central Server (shared snapshot collected by another client)
 * Tier 3: Fresh Scrape (first-time collector, saves locally and syncs to central server)
 */
export async function getOrFetchDailySnapshot(
  date?: string,
  options: { forceRefresh?: boolean; dbPath?: string } = {}
): Promise<SnapshotFetchResult> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const db = getClientDb(options.dbPath);

  // 1. Tier 1: Local SQLite Cache
  if (!options.forceRefresh) {
    const local = getLocalSnapshot(targetDate, db);
    if (local && local.repositories.length > 0) {
      return {
        source: 'local-cache',
        snapshot: local,
        syncedWithServer: local.source === 'remote-server',
      };
    }
  }

  // 2. Tier 2: Remote Central Server
  try {
    const res = await fetchWithServerAuth(options.dbPath, `/api/snapshots?date=${targetDate}`, {
      method: 'GET',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.snapshot && Array.isArray(data.snapshot.repositories) && data.snapshot.repositories.length > 0) {
        // Cache to local SQLite for future Tier 1 hits
        const cached = saveLocalSnapshot(targetDate, data.snapshot.repositories, 'remote-server', db);
        return {
          source: 'remote-server',
          snapshot: cached,
          syncedWithServer: true,
        };
      }
    }
  } catch (err) {
    // If unauthorized, bubble up so caller can redirect to Settings
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    // Network or other server failure: proceed to Tier 3 fallback
  }

  // 3. Tier 3: Fresh Local Scrape & Dual-DB Sync
  const scrapedRepos = await scrapeGitHubTrending({ max: 10 });
  const localSaved = saveLocalSnapshot(targetDate, scrapedRepos, 'local-scraper', db);

  let synced = false;
  try {
    const syncRes = await fetchWithServerAuth(options.dbPath, '/api/snapshots', {
      method: 'POST',
      body: JSON.stringify({
        snapshot_date: targetDate,
        repositories: scrapedRepos,
      }),
    });
    if (syncRes.ok) {
      synced = true;
    }
  } catch {
    // Sync to remote server failed (e.g. offline), but local data is safely stored in SQLite
  }

  return {
    source: 'fresh-scraped',
    snapshot: localSaved,
    syncedWithServer: synced,
  };
}
