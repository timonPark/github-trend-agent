import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, resetClientDbForTest } from '../src/lib/db';
import { getAiConfig, saveAiConfig } from '../src/lib/ai/config';
import { executeAiRequest } from '../src/lib/ai/runner';
import { createAiAdapter } from '../src/lib/ai/factory';
import { detectLocalAiClis } from '../src/lib/ai/detector';
import { OpenaiCliAdapter } from '../src/lib/ai/adapters/openai-cli';
import { GeminiCliAdapter } from '../src/lib/ai/adapters/gemini-cli';
import { GET as getAiStatusHandler, POST as saveAiStatusHandler } from '../src/app/api/ai/status/route';
import { POST as testAiHandler } from '../src/app/api/ai/test/route';
import { AiAgentConfig, AiExecutionResult, DetectedCli } from '../src/lib/ai/types';

const TEST_DB_PATH: string = path.resolve(__dirname, './test_ai_client.sqlite');

describe('Local AI Agent Integration & Runner (#7)', (): void => {
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

  describe('AI Configuration Management', (): void => {
    it('returns default config (none) initially', (): void => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      const config: AiAgentConfig = getAiConfig(db);
      expect(config.provider).toBe('none');
      expect(config.model).toBe('default');
    });

    it('saves and retrieves AI provider settings in SQLite', (): void => {
      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      const saved: AiAgentConfig = saveAiConfig({
        provider: 'cli-claude',
        model: 'claude-3-5-sonnet',
        apiKey: 'test-key-123',
      }, db);

      expect(saved.provider).toBe('cli-claude');
      expect(saved.model).toBe('claude-3-5-sonnet');

      const reloaded: AiAgentConfig = getAiConfig(db);
      expect(reloaded.provider).toBe('cli-claude');
      expect(reloaded.model).toBe('claude-3-5-sonnet');
      expect(reloaded.apiKey).toBe('test-key-123');
    });
  });

  describe('executeAiRequest Runner', (): void => {
    it('blocks execution when provider is none (Capability Gated)', async (): Promise<void> => {
      const result: AiExecutionResult = await executeAiRequest(
        { provider: 'none', model: 'default' },
        'Analyze this repository'
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('AI 에이전트가 연동되지 않았습니다');
    });

    it('executes mock provider successfully with context', async (): Promise<void> => {
      const result: AiExecutionResult = await executeAiRequest(
        { provider: 'mock', model: 'gpt-4o-mini' },
        'Analyze architecture',
        'README content here'
      );
      expect(result.success).toBe(true);
      expect(result.providerUsed).toBe('mock');
      expect(result.response).toContain('[Mock AI Response: gpt-4o-mini]');
      expect(result.response).toContain('Analyze architecture');
    });

    it('returns error when API key is missing for direct API provider', async (): Promise<void> => {
      const result: AiExecutionResult = await executeAiRequest(
        { provider: 'api-openai', model: 'gpt-4o', apiKey: '' },
        'Hello'
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenAI API Key가 설정되지 않았습니다');
    });
  });

  describe('AI API Routes', (): void => {
    it('GET /api/ai/status returns config and detected CLIs', async (): Promise<void> => {
      const res: Response = await getAiStatusHandler();
      expect(res.status).toBe(200);
      const data: { config: { provider: string }; isGated: boolean; detectedClis: unknown[] } =
        (await res.json()) as { config: { provider: string }; isGated: boolean; detectedClis: unknown[] };
      expect(data.config.provider).toBe('none');
      expect(data.isGated).toBe(true);
      expect(Array.isArray(data.detectedClis)).toBe(true);
    });

    it('POST /api/ai/status updates AI config in SQLite', async (): Promise<void> => {
      const req: Request = new Request('http://localhost:3000/api/ai/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'mock',
          model: 'test-model-alpha',
        }),
      });

      const res: Response = await saveAiStatusHandler(req);
      expect(res.status).toBe(200);
      const data: { config: { provider: string; model: string } } =
        (await res.json()) as { config: { provider: string; model: string } };
      expect(data.config.provider).toBe('mock');
      expect(data.config.model).toBe('test-model-alpha');

      const db: DatabaseInstance = getClientDb(TEST_DB_PATH);
      const config: AiAgentConfig = getAiConfig(db);
      expect(config.provider).toBe('mock');
    });

    it('POST /api/ai/test runs an instant ping test', async (): Promise<void> => {
      const req: Request = new Request('http://localhost:3000/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'mock',
          model: 'ping-test-model',
          prompt: 'ping',
        }),
      });

      const res: Response = await testAiHandler(req);
      expect(res.status).toBe(200);
      const data: AiExecutionResult = (await res.json()) as AiExecutionResult;
      expect(data.success).toBe(true);
      expect(data.response).toContain('[Mock AI Response: ping-test-model]');
    });

    it('detects local CLIs including agy fallback and openai target (#43)', (): void => {
      const clis: DetectedCli[] = detectLocalAiClis();
      expect(clis.length).toBeGreaterThanOrEqual(4);

      const geminiCli = clis.find((c: DetectedCli): boolean => c.id === 'gemini');
      expect(geminiCli).toBeDefined();
      expect(geminiCli?.name).toContain('Google Gemini / AGY CLI');

      const openaiCli = clis.find((c: DetectedCli): boolean => c.id === 'openai');
      expect(openaiCli).toBeDefined();
      expect(openaiCli?.name).toBe('OpenAI CLI');
    });

    it('creates OpenaiCliAdapter and GeminiCliAdapter correctly (#43)', (): void => {
      const openaiAdapter = createAiAdapter({ provider: 'cli-openai', model: 'gpt-4o' });
      expect(openaiAdapter).toBeInstanceOf(OpenaiCliAdapter);

      const geminiAdapter = createAiAdapter({ provider: 'cli-gemini', model: 'gemini-1.5-pro' });
      expect(geminiAdapter).toBeInstanceOf(GeminiCliAdapter);
    });
  });
});
