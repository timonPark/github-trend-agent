import { describe, it, expect } from 'vitest';
import { createAiAdapter } from '../src/lib/ai/factory';
import { NoneAdapter } from '../src/lib/ai/adapters/none';
import { MockAdapter } from '../src/lib/ai/adapters/mock';
import { AiAgentConfig } from '../src/lib/ai/types';

describe('AI Provider Adapters & Factory (TDD)', () => {
  describe('NoneAdapter (Gating)', () => {
    it('returns capability gating error when provider is none', async () => {
      const adapter = new NoneAdapter();
      const result = await adapter.execute('Hello world');

      expect(result.success).toBe(false);
      expect(result.providerUsed).toBe('none');
      expect(result.error).toContain('AI 에이전트가 연동되지 않았습니다');
      expect(result.response).toBe('');
    });
  });

  describe('MockAdapter (Deterministic Local Dev)', () => {
    it('returns deterministic simulated response with model info', async () => {
      const config: AiAgentConfig = {
        provider: 'mock',
        model: 'test-gpt-model',
      };
      const adapter = new MockAdapter(config);
      const result = await adapter.execute('Analyze this repo', 'README preview text');

      expect(result.success).toBe(true);
      expect(result.providerUsed).toBe('mock');
      expect(result.modelUsed).toBe('test-gpt-model');
      expect(result.response).toContain('Mock AI Response: test-gpt-model');
      expect(result.response).toContain('Analyze this repo');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createAiAdapter Factory', () => {
    it('creates NoneAdapter for none provider', () => {
      const adapter = createAiAdapter({ provider: 'none', model: 'none' });
      expect(adapter).toBeInstanceOf(NoneAdapter);
    });

    it('creates MockAdapter for mock provider', () => {
      const adapter = createAiAdapter({ provider: 'mock', model: 'mock-1' });
      expect(adapter).toBeInstanceOf(MockAdapter);
    });
  });
});
