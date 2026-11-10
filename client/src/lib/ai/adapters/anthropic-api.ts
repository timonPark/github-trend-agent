import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { toErrorMessage } from '../../types/error';

interface AnthropicMessagesResponse {
  content?: Array<{
    text?: string;
  }>;
  error?: {
    message?: string;
  };
}

export class AnthropicApiAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime = Date.now();
    const model = this.config.model || 'claude-3-5-sonnet-20241022';

    if (!this.config.apiKey) {
      return {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'api-anthropic',
        latencyMs: Date.now() - startTime,
        error: 'Anthropic API Key가 설정되지 않았습니다.',
      };
    }

    const fullPrompt = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: fullPrompt }],
        }),
      });

      const data = (await res.json()) as AnthropicMessagesResponse;
      if (!res.ok) {
        throw new Error(data.error?.message || 'Anthropic API request failed');
      }

      return {
        success: true,
        response: data.content?.[0]?.text || '',
        modelUsed: model,
        providerUsed: 'api-anthropic',
        latencyMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      return {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'api-anthropic',
        latencyMs: Date.now() - startTime,
        error: toErrorMessage(err),
      };
    }
  }
}
