import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, resetClientDbForTest, getDiscussionSession } from '../src/lib/db';
import { saveAiConfig } from '../src/lib/ai/config';
import { buildDiscussionSystemPrompt, formatConversationHistory } from '../src/lib/ai/discussion';
import { GET as getDiscussionHandler, POST as postDiscussionHandler } from '../src/app/api/discussions/route';
import { DiscussionSession, ChatMessage, TrendingRepository } from '../src/lib/types';
import { ApiResponse, SendDiscussionMessageResponseDto, GetDiscussionResponseDto } from '../src/lib/types/api';

const TEST_DB_PATH: string = path.resolve(__dirname, './test_discussion_client.sqlite');

const mockRepo: TrendingRepository = {
  rank: 1,
  name: 'test-agent',
  full_name: 'test-org/test-agent',
  url: 'https://github.com/test-org/test-agent',
  description: 'An autonomous agent platform',
  language: 'TypeScript',
  total_stars: 9500,
  daily_stars: 320,
  digest: '1. 목적: 자율 에이전트\n2. 주요 기능: 멀티 에이전트\n3. 가치: 개발 생산성 혁신',
  readme: '# Test Agent\n\nHigh-performance AI agent framework.',
};

describe('Web Discussion Session Chat (#10)', (): void => {
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

  describe('1. Prompt & History Helpers (<20 lines rule)', (): void => {
    it('builds system prompt containing repository context and digest', (): void => {
      const prompt: string = buildDiscussionSystemPrompt(mockRepo);
      expect(prompt).toContain(mockRepo.full_name);
      expect(prompt).toContain(mockRepo.description);
      expect(prompt).toContain('Repository Digest');
      expect(prompt).toContain('자율 에이전트');
      expect(prompt).toContain('High-performance AI agent framework');
    });

    it('formats conversation history into readable text', (): void => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: '이 프로젝트의 장점은?', timestamp: '2026-11-11T00:00:00Z' },
        { id: '2', role: 'assistant', content: '경량화된 아키텍처입니다.', timestamp: '2026-11-11T00:00:01Z' },
      ];
      const formatted: string = formatConversationHistory(messages);
      expect(formatted).toContain('User: 이 프로젝트의 장점은?');
      expect(formatted).toContain('Assistant: 경량화된 아키텍처입니다.');
    });
  });

  describe('2. Discussion Session API Routes', (): void => {
    it('GET /api/discussions returns empty session initially', async (): Promise<void> => {
      const req: Request = new Request('http://localhost:3000/api/discussions?repo=test-org/test-agent&url=https://github.com/test-org/test-agent');
      const res: Response = await getDiscussionHandler(req);
      expect(res.status).toBe(200);

      const json: ApiResponse<GetDiscussionResponseDto> =
        (await res.json()) as ApiResponse<GetDiscussionResponseDto>;
      expect(json.success).toBe(true);
      expect(json.data?.session.repo_full_name).toBe('test-org/test-agent');
      expect(json.data?.session.messages).toEqual([]);
    });

    it('POST /api/discussions returns 403 Forbidden when AI is disabled (provider === none)', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'none', model: 'default' }, db);

      const req: Request = new Request('http://localhost:3000/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_full_name: mockRepo.full_name,
          repo_url: mockRepo.url,
          message: '아키텍처 분석해줘',
        }),
      });

      const res: Response = await postDiscussionHandler(req);
      expect(res.status).toBe(403);
      const json: ApiResponse<SendDiscussionMessageResponseDto> =
        (await res.json()) as ApiResponse<SendDiscussionMessageResponseDto>;
      expect(json.success).toBe(false);
      expect(json.error).toContain('AI 에이전트가 연동되지 않았습니다');
    });

    it('POST /api/discussions generates AI response and saves messages to local SQLite', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'mock', model: 'gpt-4o-mini' }, db);

      const req: Request = new Request('http://localhost:3000/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_full_name: mockRepo.full_name,
          repo_url: mockRepo.url,
          message: '이 프로젝트 핵심 기능이 뭐야?',
          digest: mockRepo.digest,
          readme: mockRepo.readme,
        }),
      });

      const res: Response = await postDiscussionHandler(req);
      expect(res.status).toBe(200);

      const json: ApiResponse<SendDiscussionMessageResponseDto> =
        (await res.json()) as ApiResponse<SendDiscussionMessageResponseDto>;
      expect(json.success).toBe(true);
      expect(json.data?.session.messages).toHaveLength(2);
      expect(json.data?.session.messages[0].role).toBe('user');
      expect(json.data?.session.messages[0].content).toBe('이 프로젝트 핵심 기능이 뭐야?');
      expect(json.data?.session.messages[1].role).toBe('assistant');
      expect(json.data?.session.messages[1].content).toContain('[Mock AI Response: gpt-4o-mini]');

      // Verify persistence in SQLite
      const savedSession: DiscussionSession | null = getDiscussionSession(mockRepo.full_name, db);
      expect(savedSession).not.toBeNull();
      expect(savedSession?.messages).toHaveLength(2);
    });

    it('GET /api/discussions returns 400 when repo parameter is missing', async (): Promise<void> => {
      const req: Request = new Request('http://localhost:3000/api/discussions');
      const res: Response = await getDiscussionHandler(req);
      expect(res.status).toBe(400);
      const json: ApiResponse<GetDiscussionResponseDto> =
        (await res.json()) as ApiResponse<GetDiscussionResponseDto>;
      expect(json.success).toBe(false);
      expect(json.error).toContain('repo (or repo_full_name) is required');
    });

    it('POST /api/discussions returns 400 when message is empty or whitespace', async (): Promise<void> => {
      const req: Request = new Request('http://localhost:3000/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_full_name: mockRepo.full_name,
          message: '   ',
        }),
      });
      const res: Response = await postDiscussionHandler(req);
      expect(res.status).toBe(400);
    });

    it('POST /api/discussions appends follow-up turn to existing conversation session', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'mock', model: 'gpt-4o-mini' }, db);

      // Turn 1
      const req1: Request = new Request('http://localhost:3000/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_full_name: mockRepo.full_name,
          repo_url: mockRepo.url,
          message: '첫 번째 질문입니다.',
        }),
      });
      await postDiscussionHandler(req1);

      // Turn 2
      const req2: Request = new Request('http://localhost:3000/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_full_name: mockRepo.full_name,
          repo_url: mockRepo.url,
          message: '두 번째 질문입니다.',
        }),
      });
      const res2: Response = await postDiscussionHandler(req2);
      expect(res2.status).toBe(200);

      const json: ApiResponse<SendDiscussionMessageResponseDto> =
        (await res2.json()) as ApiResponse<SendDiscussionMessageResponseDto>;
      expect(json.data?.session.messages).toHaveLength(4);
      expect(json.data?.session.messages[0].content).toBe('첫 번째 질문입니다.');
      expect(json.data?.session.messages[2].content).toBe('두 번째 질문입니다.');
    });
  });
});
