import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, resetClientDbForTest, getLocalArchive, setSetting } from '../src/lib/db';
import { saveAiConfig } from '../src/lib/ai/config';
import { generateDiscussionSummary } from '../src/lib/ai/discussion';
import {
  GET as getArchivesHandler,
  POST as createArchiveHandler,
  PATCH as updateArchiveHandler,
} from '../src/app/api/archives/route';
import { TrendingRepository, ChatMessage, LocalArchive } from '../src/lib/types';
import {
  ApiResponse,
  CreateLocalArchiveRequestDto,
  CreateLocalArchiveResponseDto,
  GetLocalArchivesResponseDto,
  UpdateArchiveVisibilityResponseDto,
} from '../src/lib/types/api';

const TEST_DB_PATH: string = path.resolve(__dirname, './test_archives_client.sqlite');

const mockRepo: TrendingRepository = {
  rank: 1,
  name: 'test-agent',
  full_name: 'test-org/test-agent',
  url: 'https://github.com/test-org/test-agent',
  description: 'An autonomous agent platform',
  language: 'TypeScript',
  total_stars: 9500,
  daily_stars: 320,
  digest: '1. 목적: 자율 에이전트\n2. 주요 기능: 멀티 에이전트\n3. 가치: 생산성 혁신',
};

const mockMessages: ChatMessage[] = [
  { id: '1', role: 'user', content: '프로젝트의 아키텍처 특성은?', timestamp: '2026-11-11T00:00:00Z' },
  { id: '2', role: 'assistant', content: '경량 런타임과 모듈형 어댑터를 제공합니다.', timestamp: '2026-11-11T00:00:01Z' },
];

describe('Client Discussion Archives API (#11)', (): void => {
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
    vi.restoreAllMocks();
  });

  describe('1. AI Discussion Summary Generator', (): void => {
    it('generates 3-5 line summary from conversation history', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'mock', model: 'gpt-4o-mini' }, db);

      const summary: string = await generateDiscussionSummary(
        { provider: 'mock', model: 'gpt-4o-mini' },
        mockRepo,
        mockMessages
      );
      expect(summary).toBeDefined();
      expect(summary.length).toBeGreaterThan(10);
      expect(summary).toContain('[Mock AI Response: gpt-4o-mini]');
    });
  });

  describe('2. Client Archives API Endpoints', (): void => {
    it('POST /api/archives saves archive locally and generates summary if missing', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'mock', model: 'gpt-4o-mini' }, db);
      setSetting('user_id', 'client-user-123', db);

      const body: CreateLocalArchiveRequestDto = {
        snapshot_date: '2026-11-11',
        repo_full_name: mockRepo.full_name,
        repo_url: mockRepo.url,
        repo_digest: mockRepo.digest,
        messages: mockMessages,
        is_public: true,
      };

      const req: Request = new Request('http://localhost:3000/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const res: Response = await createArchiveHandler(req);
      expect(res.status).toBe(200);

      const json: ApiResponse<CreateLocalArchiveResponseDto> =
        (await res.json()) as ApiResponse<CreateLocalArchiveResponseDto>;
      expect(json.success).toBe(true);
      expect(json.data?.archive.repo_full_name).toBe(mockRepo.full_name);
      expect(json.data?.archive.discussion_summary).toContain('[Mock AI Response: gpt-4o-mini]');

      // Verify persisted in SQLite
      const saved: LocalArchive | null = getLocalArchive(json.data!.archive.id, db);
      expect(saved).not.toBeNull();
      expect(saved?.is_public).toBe(true);
    });

    it('syncArchiveToServer synchronizes to central server using server_auth_key (#47)', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'mock', model: 'gpt-4o-mini' }, db);
      setSetting('server_auth_key', 'gta_live_sync_key_999', db);

      let capturedHeader: string | null = null;
      let capturedBody: unknown = null;

      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit): Promise<Response> => {
        if (url.includes('/api/archives')) {
          capturedHeader = (init?.headers as Record<string, string>)?.['x-client-auth-key'] || null;
          capturedBody = JSON.parse(init?.body as string);
          return new Response(JSON.stringify({ success: true, archive: capturedBody }), { status: 201 });
        }
        return new Response(null, { status: 404 });
      });

      const body: CreateLocalArchiveRequestDto = {
        snapshot_date: '2026-11-11',
        repo_full_name: 'test/synced-repo',
        repo_url: 'https://github.com/test/synced-repo',
        discussion_summary: '동기화 테스트 요약',
        messages: mockMessages,
        is_public: true,
      };

      const req: Request = new Request('http://localhost:3000/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const res: Response = await createArchiveHandler(req);
      expect(res.status).toBe(200);

      const json: ApiResponse<CreateLocalArchiveResponseDto> =
        (await res.json()) as ApiResponse<CreateLocalArchiveResponseDto>;
      expect(json.success).toBe(true);
      expect(json.data?.synced_with_server).toBe(true);
      expect(capturedHeader).toBe('gta_live_sync_key_999');
      expect((capturedBody as { repo_full_name: string })?.repo_full_name).toBe('test/synced-repo');
    });

    it('GET /api/archives returns all local archives sorted by created_at DESC', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'mock', model: 'gpt-4o-mini' }, db);

      const postReq: Request = new Request('http://localhost:3000/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot_date: '2026-11-11',
          repo_full_name: 'org/repo-1',
          repo_url: 'https://github.com/org/repo-1',
          discussion_summary: '기존 요약',
          messages: mockMessages,
          is_public: false,
        }),
      });
      await createArchiveHandler(postReq);

      const getReq: Request = new Request('http://localhost:3000/api/archives');
      const getRes: Response = await getArchivesHandler(getReq);
      expect(getRes.status).toBe(200);

      const json: ApiResponse<GetLocalArchivesResponseDto> =
        (await getRes.json()) as ApiResponse<GetLocalArchivesResponseDto>;
      expect(json.success).toBe(true);
      expect(json.data?.archives.length).toBe(1);
      expect(json.data?.archives[0].repo_full_name).toBe('org/repo-1');
    });

    it('PATCH /api/archives toggles is_public state in local SQLite', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'mock', model: 'gpt-4o-mini' }, db);

      const postReq: Request = new Request('http://localhost:3000/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test-patch-arch',
          snapshot_date: '2026-11-11',
          repo_full_name: 'org/patch-repo',
          repo_url: 'https://github.com/org/patch-repo',
          discussion_summary: '토글 테스트 요약',
          messages: mockMessages,
          is_public: false,
        }),
      });
      await createArchiveHandler(postReq);

      const patchReq: Request = new Request('http://localhost:3000/api/archives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'test-patch-arch', is_public: true }),
      });
      const patchRes: Response = await updateArchiveHandler(patchReq);
      expect(patchRes.status).toBe(200);

      const json: ApiResponse<UpdateArchiveVisibilityResponseDto> =
        (await patchRes.json()) as ApiResponse<UpdateArchiveVisibilityResponseDto>;
      expect(json.success).toBe(true);
      expect(json.data?.archive.is_public).toBe(true);

      const updated: LocalArchive | null = getLocalArchive('test-patch-arch', db);
      expect(updated?.is_public).toBe(true);
    });
  });
});
