import { NextResponse } from 'next/server';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, getLocalSnapshot, saveLocalSnapshot } from '@/lib/db';
import { scrapeGitHubTrending, fetchRepositoryReadme } from '@/lib/scraper';
import { toErrorMessage } from '@/lib/types/error';
import { LocalSnapshot, TrendingRepository } from '@/lib/types';

interface ScrapeGetResponse {
  cached: boolean;
  snapshot?: LocalSnapshot;
  error?: string;
}

interface ScrapePostResponse {
  success: boolean;
  snapshot?: LocalSnapshot;
  repositories?: TrendingRepository[];
  count?: number;
  error?: string;
}

interface ScrapeRequestBody {
  date?: string;
  fetchReadme?: boolean;
}

export async function GET(request: Request): Promise<NextResponse<ScrapeGetResponse>> {
  try {
    const url: URL = new URL(request.url);
    const dateParam: string | null = url.searchParams.get('date');
    const today: string = dateParam || new Date().toISOString().split('T')[0];

    const db: DatabaseInstance = getClientDb();
    const existing: LocalSnapshot | null = getLocalSnapshot(today, db);
    if (existing) {
      return NextResponse.json<ScrapeGetResponse>({
        cached: true,
        snapshot: existing,
      });
    }

    const repositories: TrendingRepository[] = await scrapeGitHubTrending({ max: 10 });
    const saved: LocalSnapshot = saveLocalSnapshot(today, repositories, 'local-scraper', db);

    return NextResponse.json<ScrapeGetResponse>({
      cached: false,
      snapshot: saved,
    });
  } catch (err: unknown) {
    return NextResponse.json<ScrapeGetResponse>(
      { cached: false, error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<ScrapePostResponse>> {
  try {
    const body: ScrapeRequestBody = (await request.json().catch((): ScrapeRequestBody => ({}))) as ScrapeRequestBody;
    const today: string = body.date || new Date().toISOString().split('T')[0];
    const fetchReadme: boolean = body.fetchReadme ?? false;

    const repositories: TrendingRepository[] = await scrapeGitHubTrending({ max: 10 });

    if (fetchReadme) {
      for (const repo of repositories) {
        try {
          repo.readme = await fetchRepositoryReadme(repo.full_name);
        } catch {
          // ignore individual readme failure
        }
      }
    }

    const db: DatabaseInstance = getClientDb();
    const saved: LocalSnapshot = saveLocalSnapshot(today, repositories, 'local-scraper', db);

    return NextResponse.json<ScrapePostResponse>({
      success: true,
      snapshot: saved,
      repositories: saved.repositories,
      count: saved.repositories.length,
    });
  } catch (err: unknown) {
    return NextResponse.json<ScrapePostResponse>(
      { success: false, error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
