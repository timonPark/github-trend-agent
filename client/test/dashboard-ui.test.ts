import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, resetClientDbForTest, saveLocalSnapshot, getLocalSnapshot } from '../src/lib/db';
import { GET as getTrendingHandler } from '../src/app/api/trending/route';
import {
  getTodayString,
  getAdjacentDate,
  isTodayDate,
  formatDateDisplay,
  isValidDateString,
} from '../src/lib/date-utils';
import { TrendingRepository } from '../src/lib/types';

const TEST_DB_PATH: string = path.resolve(__dirname, './test_dashboard_client.sqlite');

const mockPastRepo: TrendingRepository = {
  rank: 1,
  name: 'past-project',
  full_name: 'test-org/past-project',
  url: 'https://github.com/test-org/past-project',
  description: 'Past trending repository',
  language: 'Go',
  total_stars: 5400,
  daily_stars: 210,
};

describe('Trending Dashboard Date Navigation (#9)', (): void => {
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
  });

  describe('1. Date Utility Helpers (20 lines per function rule)', (): void => {
    it('returns today string in YYYY-MM-DD format', (): void => {
      const today: string = getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isTodayDate(today)).toBe(true);
    });

    it('calculates yesterday and tomorrow correctly', (): void => {
      const base: string = '2026-11-10';
      const yesterday: string = getAdjacentDate(base, -1);
      const tomorrow: string = getAdjacentDate(base, 1);
      expect(yesterday).toBe('2026-11-09');
      expect(tomorrow).toBe('2026-11-11');
      expect(isTodayDate(base)).toBe(false);
    });

    it('formats date to Korean display text', (): void => {
      const display: string = formatDateDisplay('2026-11-10');
      expect(display).toBe('2026년 11월 10일');
    });

    it('validates YYYY-MM-DD format', (): void => {
      expect(isValidDateString('2026-11-10')).toBe(true);
      expect(isValidDateString('invalid-date')).toBe(false);
      expect(isValidDateString('')).toBe(false);
    });
  });

  describe('2. Specific Date Snapshot Retrieval (/api/trending?date=...)', (): void => {
    it('retrieves snapshot for specific past date from local SQLite cache', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      const pastDate: string = '2026-11-01';
      saveLocalSnapshot(pastDate, [mockPastRepo], 'local-scraper', db);

      const req: Request = new Request(`http://localhost:3000/api/trending?date=${pastDate}`);
      const res: Response = await getTrendingHandler(req);
      expect(res.status).toBe(200);

      const json: { success: boolean; repositories?: TrendingRepository[]; source?: string } =
        (await res.json()) as { success: boolean; repositories?: TrendingRepository[]; source?: string };

      expect(json.success).toBe(true);
      expect(json.source).toBe('local-cache');
      expect(json.repositories).toHaveLength(1);
      expect(json.repositories?.[0].full_name).toBe(mockPastRepo.full_name);
    });
  });
});
