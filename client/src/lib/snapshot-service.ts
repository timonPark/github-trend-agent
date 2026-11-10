import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, getLocalSnapshot, saveLocalSnapshot } from './db';
import { fetchWithServerAuth, UnauthorizedError } from './server-api';
import { scrapeGitHubTrending } from './scraper';
import { LocalSnapshot, TrendingRepository } from './types';

export type SnapshotCacheSource = 'local-cache' | 'remote-server' | 'fresh-scraped';

export interface SnapshotFetchResult {
  source: SnapshotCacheSource;
  snapshot: LocalSnapshot;
  syncedWithServer: boolean;
}

interface RemoteSnapshotResponse {
  snapshot?: {
    snapshot_date: string;
    repositories: TrendingRepository[];
  };
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
  const targetDate: string = date || new Date().toISOString().split('T')[0];
  const db: DatabaseInstance = getClientDb(options.dbPath);

  // 1. Tier 1: Local SQLite Cache
  if (!options.forceRefresh) {
    const local: LocalSnapshot | null = getLocalSnapshot(targetDate, db);
    if (local && local.repositories.length > 0) {
      const hitResult: SnapshotFetchResult = {
        source: 'local-cache',
        snapshot: local,
        syncedWithServer: local.source === 'remote-server',
      };
      return hitResult;
    }
  }

  // 2. Tier 2: Remote Central Server
  try {
    const res: Response = await fetchWithServerAuth(options.dbPath, `/api/snapshots?date=${targetDate}`, {
      method: 'GET',
    });

    if (res.ok) {
      const data: RemoteSnapshotResponse = (await res.json()) as RemoteSnapshotResponse;
      if (data.snapshot && Array.isArray(data.snapshot.repositories) && data.snapshot.repositories.length > 0) {
        const cached: LocalSnapshot = saveLocalSnapshot(targetDate, data.snapshot.repositories, 'remote-server', db);
        const serverResult: SnapshotFetchResult = {
          source: 'remote-server',
          snapshot: cached,
          syncedWithServer: true,
        };
        return serverResult;
      }
    }
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }
  }

  // 3. Tier 3: Fresh Local Scrape & Dual-DB Sync
  const scrapedRepos: TrendingRepository[] = await scrapeGitHubTrending({ max: 10 });
  const localSaved: LocalSnapshot = saveLocalSnapshot(targetDate, scrapedRepos, 'local-scraper', db);

  let synced: boolean = false;
  try {
    const syncRes: Response = await fetchWithServerAuth(options.dbPath, '/api/snapshots', {
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
    // Offline fallback
  }

  const freshResult: SnapshotFetchResult = {
    source: 'fresh-scraped',
    snapshot: localSaved,
    syncedWithServer: synced,
  };
  return freshResult;
}
