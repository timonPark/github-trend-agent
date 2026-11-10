import { describe, it, expect } from 'vitest';
import { createAiAdapter } from '../src/lib/ai/factory';
import { NoneAdapter } from '../src/lib/ai/adapters/none';
import { MockAdapter } from '../src/lib/ai/adapters/mock';
import { AiAgentConfig, AiExecutionResult } from '../src/lib/ai/types';
import { AiProviderAdapter } from '../src/lib/ai/adapter';

describe('AI Provider Adapters & Factory (TDD)', (): void => {
  describe('NoneAdapter (Gating)', (): void => {
    it('returns capability gating error when provider is none', async (): Promise<void> => {
      const adapter: NoneAdapter = new NoneAdapter();
      const result: AiExecutionResult = await adapter.execute();

      expect(result.success).toBe(false);
      expect(result.providerUsed).toBe('none');
      expect(result.error).toContain('AI 에이전트가 연동되지 않았습니다');
      expect(result.response).toBe('');
    });
  });

  describe('MockAdapter (Deterministic Local Dev)', (): void => {
    it('returns deterministic simulated response with model info', async (): Promise<void> => {
      const config: AiAgentConfig = {
        provider: 'mock',
        model: 'test-gpt-model',
      };
      const adapter: MockAdapter = new MockAdapter(config);
      const result: AiExecutionResult = await adapter.execute('Analyze this repo', 'README preview text');

      expect(result.success).toBe(true);
      expect(result.providerUsed).toBe('mock');
      expect(result.modelUsed).toBe('test-gpt-model');
      expect(result.response).toContain('Mock AI Response: test-gpt-model');
      expect(result.response).toContain('Analyze this repo');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createAiAdapter Factory', (): void => {
    it('creates NoneAdapter for none provider', (): void => {
      const adapter: AiProviderAdapter = createAiAdapter({ provider: 'none', model: 'none' });
      expect(adapter).toBeInstanceOf(NoneAdapter);
    });

    it('creates MockAdapter for mock provider', (): void => {
      const adapter: AiProviderAdapter = createAiAdapter({ provider: 'mock', model: 'mock-1' });
      expect(adapter).toBeInstanceOf(MockAdapter);
    });
  });
});
