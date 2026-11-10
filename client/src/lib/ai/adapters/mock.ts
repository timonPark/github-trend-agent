import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';

export class MockAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime = Date.now();
    const model = this.config.model || 'mock-model';
    const simulatedResponse = `[Mock AI Response: ${model}]\n주어진 저장소 컨텍스트에 대한 분석 및 토론 결과입니다.\n- 핵심 기술: 모던 웹 아키텍처 및 고성능 런타임\n- 프롬프트 반영: "${prompt.slice(0, 50)}..."`;

    return {
      success: true,
      response: simulatedResponse,
      modelUsed: model,
      providerUsed: 'mock',
      latencyMs: Date.now() - startTime,
    };
  }
}
