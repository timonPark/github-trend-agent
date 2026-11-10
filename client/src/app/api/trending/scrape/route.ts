import { NextResponse } from 'next/server';
import { getClientDb, getLocalSnapshot, saveLocalSnapshot } from '@/lib/db';
import { scrapeGitHubTrending, fetchRepositoryReadme } from '@/lib/scraper';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const today = dateParam || new Date().toISOString().split('T')[0];

    const db = getClientDb();
    const existing = getLocalSnapshot(today, db);
    if (existing) {
      return NextResponse.json({
        cached: true,
        snapshot: existing,
      });
    }

    // If not cached, scrape live
    const repositories = await scrapeGitHubTrending({ max: 10 });
    const saved = saveLocalSnapshot(today, repositories, 'local-scraper', db);

    return NextResponse.json({
      cached: false,
      snapshot: saved,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scraping failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const today = body.date || new Date().toISOString().split('T')[0];
    const fetchReadme = body.fetchReadme ?? false;

    const repositories = await scrapeGitHubTrending({ max: 10 });

    if (fetchReadme) {
      for (const repo of repositories) {
        try {
          repo.readme = await fetchRepositoryReadme(repo.full_name);
        } catch {
          // ignore individual readme failure
        }
      }
    }

    const db = getClientDb();
    const saved = saveLocalSnapshot(today, repositories, 'local-scraper', db);

    return NextResponse.json({
      success: true,
      snapshot: saved,
      count: saved.repositories.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scraping failed' }, { status: 500 });
  }
}
