import { describe, it, expect } from 'vitest';
import { DiscussionArchive } from '../src/lib/types';
import { filterPublicArchives, matchArchiveQuery, matchArchiveDate } from '../src/lib/feed-filter';

describe('Public Discussion Feed Filter (#29)', (): void => {
  const sampleArchives: DiscussionArchive[] = [
    {
      id: 'arch-1',
      user_id: 'user-1',
      username: 'alice',
      snapshot_date: '2026-11-11',
      repo_name: 'next.js',
      repo_full_name: 'vercel/next.js',
      repo_digest: 'Next.js 프레임워크',
      discussion_summary: 'App Router 아키텍처와 성능 이점 논의',
      messages: [
        { id: 'm1', role: 'user', content: 'Next.js 질문', timestamp: '2026-11-11T10:00:00Z' },
        { id: 'm2', role: 'assistant', content: 'Next.js 답변', timestamp: '2026-11-11T10:01:00Z' },
      ],
      is_public: true,
      created_at: '2026-11-11T10:05:00Z',
    },
    {
      id: 'arch-2',
      user_id: 'user-2',
      username: 'bob',
      snapshot_date: '2026-11-10',
      repo_name: 'react',
      repo_full_name: 'facebook/react',
      repo_digest: 'UI 라이브러리',
      discussion_summary: 'React 19 컴파일러 기능 고찰',
      messages: [],
      is_public: true,
      created_at: '2026-11-10T12:00:00Z',
    },
    {
      id: 'arch-3',
      user_id: 'user-3',
      username: 'charlie',
      snapshot_date: '2026-11-11',
      repo_name: 'tailwind',
      repo_full_name: 'tailwindlabs/tailwindcss',
      repo_digest: 'CSS 프레임워크',
      discussion_summary: 'Tailwind v4 신기능 분석',
      messages: [],
      is_public: true,
      created_at: '2026-11-11T11:00:00Z',
    },
  ];

  it('filters archives by repository keyword case-insensitively', (): void => {
    const results: DiscussionArchive[] = filterPublicArchives(sampleArchives, 'VERCEL', '');
    expect(results).toHaveLength(1);
    expect(results[0].repo_full_name).toBe('vercel/next.js');
  });

  it('filters archives by author username keyword', (): void => {
    const results: DiscussionArchive[] = filterPublicArchives(sampleArchives, 'bob', '');
    expect(results).toHaveLength(1);
    expect(results[0].username).toBe('bob');
  });

  it('filters archives by summary keyword', (): void => {
    const results: DiscussionArchive[] = filterPublicArchives(sampleArchives, '컴파일러', '');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('arch-2');
  });

  it('filters archives by date and sorts descending by created_at', (): void => {
    const results: DiscussionArchive[] = filterPublicArchives(sampleArchives, '', '2026-11-11');
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('arch-3'); // 11:00:00
    expect(results[1].id).toBe('arch-1'); // 10:05:00
  });

  it('returns all items sorted if no query and no date provided', (): void => {
    const results: DiscussionArchive[] = filterPublicArchives(sampleArchives, '   ', '');
    expect(results).toHaveLength(3);
    expect(results[0].id).toBe('arch-3');
    expect(results[1].id).toBe('arch-1');
    expect(results[2].id).toBe('arch-2');
  });
});
