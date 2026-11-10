import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { toErrorMessage } from '../../types/error';

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class OpenAiApiAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime = Date.now();
    const model = this.config.model || 'gpt-4o';

    if (!this.config.apiKey) {
      return {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'api-openai',
        latencyMs: Date.now() - startTime,
        error: 'OpenAI API Key가 설정되지 않았습니다.',
      };
    }

    const fullPrompt = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: fullPrompt }],
        }),
      });

      const data = (await res.json()) as OpenAiChatCompletionResponse;
      if (!res.ok) {
        throw new Error(data.error?.message || 'OpenAI API request failed');
      }

      return {
        success: true,
        response: data.choices?.[0]?.message?.content || '',
        modelUsed: model,
        providerUsed: 'api-openai',
        latencyMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      return {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'api-openai',
        latencyMs: Date.now() - startTime,
        error: toErrorMessage(err),
      };
    }
  }
}
