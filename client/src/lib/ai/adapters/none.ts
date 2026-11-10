import { AiProviderAdapter } from '../adapter';
import { AiExecutionResult } from '../types';

export class NoneAdapter implements AiProviderAdapter {
  async execute(): Promise<AiExecutionResult> {
    return {
      success: false,
      response: '',
      modelUsed: 'none',
      providerUsed: 'none',
      latencyMs: 0,
      error: 'AI 에이전트가 연동되지 않았습니다. 설정 화면에서 로컬 CLI 또는 API Key를 연동해주세요.',
    };
  }
}
