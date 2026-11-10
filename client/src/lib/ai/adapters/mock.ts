import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';

export class MockAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, _context?: string): Promise<AiExecutionResult> {
    const startTime: number = Date.now();
    const model: string = this.config.model || 'mock-model';
    const simulatedResponse: string = `[Mock AI Response: ${model}]\n주어진 저장소 컨텍스트에 대한 분석 및 토론 결과입니다.\n- 핵심 기술: 모던 웹 아키텍처 및 고성능 런타임\n- 프롬프트 반영: "${prompt.slice(0, 50)}..."`;
    const latencyMs: number = Date.now() - startTime;

    const result: AiExecutionResult = {
      success: true,
      response: simulatedResponse,
      modelUsed: model,
      providerUsed: 'mock',
      latencyMs,
    };
    return result;
  }
}
