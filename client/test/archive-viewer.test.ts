import { describe, it, expect } from 'vitest';
import { LocalArchive, ChatMessage } from '../src/lib/types';
import { filterArchives, ArchiveVisibilityFilter } from '../src/lib/archive-filter';

const mockArchives: LocalArchive[] = [
  {
    id: 'arch-1',
    user_id: 'user-1',
    snapshot_date: '2026-11-10',
    repo_full_name: 'facebook/react',
    repo_url: 'https://github.com/facebook/react',
    repo_digest: 'UI 컴포넌트 라이브러리',
    discussion_summary: '가상 돔 기반의 선언적 렌더링이 강점입니다.',
    messages: [
      { id: 'm1', role: 'user', content: 'React 장점은?', timestamp: '2026-11-10T10:00:00Z' },
      { id: 'm2', role: 'assistant', content: '생태계와 선언적 UI입니다.', timestamp: '2026-11-10T10:00:05Z' },
    ],
    is_public: true,
    synced_with_server: true,
    created_at: '2026-11-10T10:01:00Z',
  },
  {
    id: 'arch-2',
    user_id: 'user-1',
    snapshot_date: '2026-11-11',
    repo_full_name: 'vercel/next.js',
    repo_url: 'https://github.com/vercel/next.js',
    repo_digest: 'Fullstack React Framework',
    discussion_summary: 'SSR과 Server Component를 통한 최적화가 탁월합니다.',
    messages: [
      { id: 'm3', role: 'user', content: 'Next.js의 특성은?', timestamp: '2026-11-11T09:00:00Z' },
    ],
    is_public: false,
    synced_with_server: false,
    created_at: '2026-11-11T09:05:00Z',
  },
  {
    id: 'arch-3',
    user_id: 'user-1',
    snapshot_date: '2026-11-11',
    repo_full_name: 'anthropics/anthropic-sdk-typescript',
    repo_url: 'https://github.com/anthropics/anthropic-sdk-typescript',
    repo_digest: 'TypeScript SDK for Claude API',
    discussion_summary: '스트리밍 및 도구 호출 지원이 안정적입니다.',
    messages: [],
    is_public: true,
    synced_with_server: true,
    created_at: '2026-11-11T09:30:00Z',
  },
];

describe('Archive Viewer Filtering & Business Logic (#12)', (): void => {
  it('returns all archives when search query is empty and visibility is all', (): void => {
    const result: LocalArchive[] = filterArchives(mockArchives, '', 'all');
    expect(result).toHaveLength(3);
  });

  it('filters archives by repository name (case-insensitive)', (): void => {
    const result: LocalArchive[] = filterArchives(mockArchives, 'FACEBOOK', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('arch-1');
  });

  it('filters archives by keywords in discussion summary', (): void => {
    const result: LocalArchive[] = filterArchives(mockArchives, 'Server Component', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('arch-2');
  });

  it('filters by public visibility only', (): void => {
    const result: LocalArchive[] = filterArchives(mockArchives, '', 'public');
    expect(result).toHaveLength(2);
    expect(result.every((a: LocalArchive): boolean => a.is_public)).toBe(true);
  });

  it('filters by private visibility only', (): void => {
    const result: LocalArchive[] = filterArchives(mockArchives, '', 'private');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('arch-2');
    expect(result[0].is_public).toBe(false);
  });

  it('combines search query with visibility filter', (): void => {
    const result: LocalArchive[] = filterArchives(mockArchives, 'typescript', 'public');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('arch-3');
  });
});
