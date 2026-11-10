import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseTrendingHtml,
  cleanMarkdownReadme,
  fetchRepositoryReadme,
  scrapeGitHubTrending,
  getFallbackTrendingRepositories,
} from '../src/lib/scraper';

const MOCK_TRENDING_HTML = `
<!DOCTYPE html>
<html>
<body>
  <div class="explore-pjax-container">
    <article class="Box-row">
      <h2 class="h3 lh-condensed">
        <a href="/owner1/repo-alpha">
          <span class="text-normal">owner1 / </span> repo-alpha
        </a>
      </h2>
      <p class="col-9 color-fg-muted my-1 pr-4">
        Awesome open source project for <b>AI agents</b> &amp; LLMs
      </p>
      <div class="f6 color-fg-muted mt-2">
        <span class="d-inline-block ml-0 mr-3">
          <span itemprop="programmingLanguage">TypeScript</span>
        </span>
        <a href="/owner1/repo-alpha/stargazers" class="Link--muted mr-3">
          15,420
        </a>
        <span class="d-inline-block float-sm-right">
          780 stars today
        </span>
      </div>
    </article>

    <article class="Box-row">
      <h2 class="h3 lh-condensed">
        <a href="/owner2/repo-beta">
          <span class="text-normal">owner2 / </span> repo-beta
        </a>
      </h2>
      <p class="col-9 color-fg-muted my-1 pr-4">
        Lightweight Python library
      </p>
      <div class="f6 color-fg-muted mt-2">
        <span class="d-inline-block ml-0 mr-3">
          <span itemprop="programmingLanguage">Python</span>
        </span>
        <a href="/owner2/repo-beta/stargazers" class="Link--muted mr-3">
          3,800
        </a>
        <span class="d-inline-block float-sm-right">
          320 stars today
        </span>
      </div>
    </article>

    <article class="Box-row">
      <h2 class="h3 lh-condensed">
        <a href="/owner3/repo-gamma">
          <span class="text-normal">owner3 / </span> repo-gamma
        </a>
      </h2>
      <p class="col-9 color-fg-muted my-1 pr-4">
        High performance Go runtime
      </p>
      <div class="f6 color-fg-muted mt-2">
        <span class="d-inline-block ml-0 mr-3">
          <span itemprop="programmingLanguage">Go</span>
        </span>
        <a href="/owner3/repo-gamma/stargazers" class="Link--muted mr-3">
          42,100
        </a>
        <span class="d-inline-block float-sm-right">
          210 stars today
        </span>
      </div>
    </article>
  </div>
</body>
</html>
`;

describe('GitHub Trending Headless Scraper (#5)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseTrendingHtml', () => {
    it('parses repositories accurately from trending HTML', () => {
      const repos = parseTrendingHtml(MOCK_TRENDING_HTML, 10);
      expect(repos).toHaveLength(3);

      expect(repos[0]).toEqual({
        rank: 1,
        name: 'repo-alpha',
        full_name: 'owner1/repo-alpha',
        url: 'https://github.com/owner1/repo-alpha',
        description: 'Awesome open source project for AI agents & LLMs',
        language: 'TypeScript',
        total_stars: 15420,
        daily_stars: 780,
      });

      expect(repos[1]).toEqual({
        rank: 2,
        name: 'repo-beta',
        full_name: 'owner2/repo-beta',
        url: 'https://github.com/owner2/repo-beta',
        description: 'Lightweight Python library',
        language: 'Python',
        total_stars: 3800,
        daily_stars: 320,
      });

      expect(repos[2].rank).toBe(3);
      expect(repos[2].total_stars).toBe(42100);
      expect(repos[2].daily_stars).toBe(210);
    });

    it('respects the max limit parameter', () => {
      const repos = parseTrendingHtml(MOCK_TRENDING_HTML, 2);
      expect(repos).toHaveLength(2);
      expect(repos[0].rank).toBe(1);
      expect(repos[1].rank).toBe(2);
    });

    it('handles empty or corrupted HTML gracefully without throwing', () => {
      expect(parseTrendingHtml('')).toEqual([]);
      expect(parseTrendingHtml('<div>No articles here</div>')).toEqual([]);
      expect(parseTrendingHtml(null as any)).toEqual([]);
    });
  });

  describe('cleanMarkdownReadme', () => {
    it('removes badge images, raw HTML tags and comments', () => {
      const rawReadme = `
# Awesome Project

<!-- Some internal comments -->
[![Build](https://github.com/owner/repo/actions/workflows/ci.yml/badge.svg)](https://github.com)
![Stars](https://img.shields.io/github/stars/owner/repo.svg)

<div align="center">
  <h2>Super Fast Engine</h2>
</div>

Here is the primary description of the project.
`;

      const cleaned = cleanMarkdownReadme(rawReadme);
      expect(cleaned).not.toContain('<!--');
      expect(cleaned).not.toContain('shields.io');
      expect(cleaned).not.toContain('<div');
      expect(cleaned).not.toContain('</div>');
      expect(cleaned).toContain('Super Fast Engine');
      expect(cleaned).toContain('Here is the primary description of the project.');
    });

    it('truncates long READMEs to maxChars with notice', () => {
      const longText = 'A'.repeat(500);
      const cleaned = cleanMarkdownReadme(longText, 200);
      expect(cleaned.length).toBeLessThan(350);
      expect(cleaned).toContain('... (README truncated for context length optimization)');
    });
  });

  describe('fetchRepositoryReadme', () => {
    it('fetches raw README from GitHub and cleans it', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '# Test Repo\n\nThis is a test readme with ![badge](https://badge.com)',
      } as any);

      const readme = await fetchRepositoryReadme('owner/test-repo');
      expect(readme).toContain('# Test Repo');
      expect(readme).not.toContain('badge.com');
    });

    it('returns empty string when all branches fail', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as any);

      const readme = await fetchRepositoryReadme('owner/non-existent');
      expect(readme).toBe('');
    });
  });

  describe('scrapeGitHubTrending', () => {
    it('returns parsed trending repos when live fetch succeeds', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => MOCK_TRENDING_HTML,
      } as any);

      const repos = await scrapeGitHubTrending({ max: 2 });
      expect(repos).toHaveLength(2);
      expect(repos[0].name).toBe('repo-alpha');
    });

    it('falls back to seed dataset when live fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline or rate limit'));

      const repos = await scrapeGitHubTrending({ max: 5, fallbackSample: true });
      expect(repos).toHaveLength(5);
      expect(repos[0].rank).toBe(1);
      expect(repos[0].total_stars).toBeGreaterThan(0);
    });

    it('provides exactly 10 fallback trending repositories', () => {
      const samples = getFallbackTrendingRepositories(10);
      expect(samples).toHaveLength(10);
      expect(samples[0].rank).toBe(1);
      expect(samples[9].rank).toBe(10);
    });
  });
});
