import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, resetClientDbForTest, saveLocalSnapshot, getLocalSnapshot, updateLocalRepoDigest } from '../src/lib/db';
import { saveAiConfig } from '../src/lib/ai/config';
import { checkAiCapability, buildDigestPrompt } from '../src/lib/ai/digest';
import { POST as digestHandler } from '../src/app/api/digest/route';
import { TrendingRepository, LocalSnapshot } from '../src/lib/types';
import { CapabilityGateStatusDto, GenerateDigestResponseDto, ApiResponse } from '../src/lib/types/api';
import { AiAgentConfig } from '../src/lib/ai/types';

const TEST_DB_PATH: string = path.resolve(__dirname, './test_digest_client.sqlite');

const mockRepo: TrendingRepository = {
  rank: 1,
  name: 'awesome-agent',
  full_name: 'test-org/awesome-agent',
  url: 'https://github.com/test-org/awesome-agent',
  description: 'An autonomous agent framework built with TypeScript',
  language: 'TypeScript',
  total_stars: 12500,
  daily_stars: 450,
  readme: '# Awesome Agent\n\nFramework for multi-agent workflows.\n\n## Features\n- Fast execution\n- Local model support',
};

describe('AI Capability Gating & Repository Digest (#8)', (): void => {
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

  describe('1. checkAiCapability (Capability Gating)', (): void => {
    it('returns enabled = false when provider is none', (): void => {
      const config: AiAgentConfig = { provider: 'none', model: 'default' };
      const status: CapabilityGateStatusDto = checkAiCapability(config);
      expect(status.enabled).toBe(false);
      expect(status.provider).toBe('none');
      expect(status.reason).toContain('AI 에이전트가 연동되지 않았습니다');
    });

    it('returns enabled = false when API key is missing for direct API provider', (): void => {
      const config: AiAgentConfig = { provider: 'api-openai', model: 'gpt-4o', apiKey: '' };
      const status: CapabilityGateStatusDto = checkAiCapability(config);
      expect(status.enabled).toBe(false);
      expect(status.provider).toBe('api-openai');
      expect(status.reason).toContain('API Key');
    });

    it('returns enabled = true when provider is mock or properly configured', (): void => {
      const mockConfig: AiAgentConfig = { provider: 'mock', model: 'mock-model' };
      const status: CapabilityGateStatusDto = checkAiCapability(mockConfig);
      expect(status.enabled).toBe(true);
      expect(status.provider).toBe('mock');
    });
  });

  describe('2. buildDigestPrompt (Prompt Engineering)', (): void => {
    it('includes repository metadata, readme, and 3-line format instructions', (): void => {
      const prompt: string = buildDigestPrompt(mockRepo);
      expect(prompt).toContain(mockRepo.full_name);
      expect(prompt).toContain(mockRepo.description);
      expect(prompt).toContain(mockRepo.language);
      expect(prompt).toContain('12,500');
      expect(prompt).toContain('Framework for multi-agent workflows');
      expect(prompt).toContain('3줄');
      expect(prompt).toContain('목적');
      expect(prompt).toContain('주요 기능');
      expect(prompt).toContain('기술적 가치');
    });
  });

  describe('3. updateLocalRepoDigest (DB Helper)', (): void => {
    it('updates digest for specific repository in local snapshot', (): void => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      const today: string = '2026-11-11';
      saveLocalSnapshot(today, [mockRepo], 'local-scraper', db);

      const digestText: string = '1. 목적: 에이전트 프레임워크\n2. 주요 기능: 빠른 실행\n3. 가치: 로컬 모델 지원';
      const updatedSnapshot: LocalSnapshot | null = updateLocalRepoDigest(today, mockRepo.full_name, digestText, db);

      expect(updatedSnapshot).not.toBeNull();
      const updatedRepo: TrendingRepository | undefined = updatedSnapshot?.repositories.find(
        (r: TrendingRepository): boolean => r.full_name === mockRepo.full_name
      );
      expect(updatedRepo?.digest).toBe(digestText);

      // Verify persistence from DB reload
      const reloaded: LocalSnapshot | null = getLocalSnapshot(today, db);
      expect(reloaded?.repositories[0].digest).toBe(digestText);
    });

    it('returns null if snapshot does not exist', (): void => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      const result: LocalSnapshot | null = updateLocalRepoDigest('9999-99-99', mockRepo.full_name, 'digest', db);
      expect(result).toBeNull();
    });
  });

  describe('4. POST /api/digest (API Route Handler)', (): void => {
    it('returns 403 Forbidden when AI is not configured (provider === none)', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'none', model: 'default' }, db);

      const req: Request = new Request('http://localhost:3000/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot_date: '2026-11-11',
          repo_full_name: mockRepo.full_name,
        }),
      });

      const res: Response = await digestHandler(req);
      expect(res.status).toBe(403);
      const json: ApiResponse<GenerateDigestResponseDto> = (await res.json()) as ApiResponse<GenerateDigestResponseDto>;
      expect(json.success).toBe(false);
      expect(json.error).toContain('AI 에이전트가 연동되지 않았습니다');
    });

    it('returns 400 Bad Request when required body fields are missing', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'mock', model: 'default' }, db);

      const req: Request = new Request('http://localhost:3000/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot_date: '',
        }),
      });

      const res: Response = await digestHandler(req);
      expect(res.status).toBe(400);
      const json: ApiResponse<GenerateDigestResponseDto> = (await res.json()) as ApiResponse<GenerateDigestResponseDto>;
      expect(json.success).toBe(false);
      expect(json.error).toContain('snapshot_date and repo_full_name are required');
    });

    it('returns 404 Not Found when repository is not found in snapshot', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'mock', model: 'default' }, db);
      saveLocalSnapshot('2026-11-11', [mockRepo], 'local-scraper', db);

      const req: Request = new Request('http://localhost:3000/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot_date: '2026-11-11',
          repo_full_name: 'non-existent/repo',
        }),
      });

      const res: Response = await digestHandler(req);
      expect(res.status).toBe(404);
      const json: ApiResponse<GenerateDigestResponseDto> = (await res.json()) as ApiResponse<GenerateDigestResponseDto>;
      expect(json.success).toBe(false);
      expect(json.error).toContain('Repository not found');
    });

    it('generates digest with mock AI provider and updates local snapshot successfully', async (): Promise<void> => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      saveAiConfig({ provider: 'mock', model: 'mock-model' }, db);
      const today: string = '2026-11-11';
      saveLocalSnapshot(today, [mockRepo], 'local-scraper', db);

      const req: Request = new Request('http://localhost:3000/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot_date: today,
          repo_full_name: mockRepo.full_name,
        }),
      });

      const res: Response = await digestHandler(req);
      expect(res.status).toBe(200);
      const json: ApiResponse<GenerateDigestResponseDto> = (await res.json()) as ApiResponse<GenerateDigestResponseDto>;
      expect(json.success).toBe(true);
      expect(json.data?.repo_full_name).toBe(mockRepo.full_name);
      expect(json.data?.provider).toBe('mock');
      expect(json.data?.digest).toBeTruthy();

      // Verify that local SQLite is updated
      const reloaded: LocalSnapshot | null = getLocalSnapshot(today, db);
      expect(reloaded?.repositories[0].digest).toBe(json.data?.digest);
    });
  });
});
