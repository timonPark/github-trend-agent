import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getClientDb, resetClientDbForTest } from '../src/lib/db';
import { getAiConfig, saveAiConfig } from '../src/lib/ai/config';
import { executeAiRequest } from '../src/lib/ai/runner';
import { GET as getAiStatusHandler, POST as saveAiStatusHandler } from '../src/app/api/ai/status/route';
import { POST as testAiHandler } from '../src/app/api/ai/test/route';

const TEST_DB_PATH = path.resolve(__dirname, './test_ai_client.sqlite');

describe('Local AI Agent Integration & Runner (#7)', () => {
  beforeEach(() => {
    resetClientDbForTest();
    if (fs.existsSync(TEST_DB_PATH)) try { fs.unlinkSync(TEST_DB_PATH); } catch {}
    process.env.DATABASE_PATH = TEST_DB_PATH;
  });

  afterEach(() => {
    resetClientDbForTest();
    if (fs.existsSync(TEST_DB_PATH)) try { fs.unlinkSync(TEST_DB_PATH); } catch {}
  });

  describe('AI Configuration Management', () => {
    it('returns default config (none) initially', () => {
      const db = getClientDb(TEST_DB_PATH);
      const config = getAiConfig(db);
      expect(config.provider).toBe('none');
      expect(config.model).toBe('default');
    });

    it('saves and retrieves AI provider settings in SQLite', () => {
      const db = getClientDb(TEST_DB_PATH);
      const saved = saveAiConfig({
        provider: 'cli-claude',
        model: 'claude-3-5-sonnet',
        apiKey: 'test-key-123',
      }, db);

      expect(saved.provider).toBe('cli-claude');
      expect(saved.model).toBe('claude-3-5-sonnet');

      const reloaded = getAiConfig(db);
      expect(reloaded.provider).toBe('cli-claude');
      expect(reloaded.model).toBe('claude-3-5-sonnet');
      expect(reloaded.apiKey).toBe('test-key-123');
    });
  });

  describe('executeAiRequest Runner', () => {
    it('blocks execution when provider is none (Capability Gated)', async () => {
      const result = await executeAiRequest(
        { provider: 'none', model: 'default' },
        'Analyze this repository'
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('AI 에이전트가 연동되지 않았습니다');
    });

    it('executes mock provider successfully with context', async () => {
      const result = await executeAiRequest(
        { provider: 'mock', model: 'gpt-4o-mini' },
        'Analyze architecture',
        'README content here'
      );
      expect(result.success).toBe(true);
      expect(result.providerUsed).toBe('mock');
      expect(result.response).toContain('[Mock AI Response: gpt-4o-mini]');
      expect(result.response).toContain('Analyze architecture');
    });

    it('returns error when API key is missing for direct API provider', async () => {
      const result = await executeAiRequest(
        { provider: 'api-openai', model: 'gpt-4o', apiKey: '' },
        'Hello'
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenAI API Key가 설정되지 않았습니다');
    });
  });

  describe('AI API Routes', () => {
    it('GET /api/ai/status returns config and detected CLIs', async () => {
      const res = await getAiStatusHandler();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.config.provider).toBe('none');
      expect(data.isGated).toBe(true);
      expect(Array.isArray(data.detectedClis)).toBe(true);
    });

    it('POST /api/ai/status updates AI config in SQLite', async () => {
      const req = new Request('http://localhost:3000/api/ai/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'mock',
          model: 'test-model-alpha',
        }),
      });

      const res = await saveAiStatusHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.config.provider).toBe('mock');
      expect(data.config.model).toBe('test-model-alpha');

      // Verify in DB
      const db = getClientDb(TEST_DB_PATH);
      const config = getAiConfig(db);
      expect(config.provider).toBe('mock');
    });

    it('POST /api/ai/test runs an instant ping test', async () => {
      const req = new Request('http://localhost:3000/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'mock',
          model: 'ping-test-model',
          prompt: 'ping',
        }),
      });

      const res = await testAiHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.response).toContain('[Mock AI Response: ping-test-model]');
    });
  });
});
