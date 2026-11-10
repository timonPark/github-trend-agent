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
    const startTime: number = Date.now();
    const model: string = this.config.model || 'gpt-4o';

    if (!this.config.apiKey) {
      const result: AiExecutionResult = {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'api-openai',
        latencyMs: Date.now() - startTime,
        error: 'OpenAI API Key가 설정되지 않았습니다.',
      };
      return result;
    }

    const fullPrompt: string = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;

    try {
      const res: Response = await fetch('https://api.openai.com/v1/chat/completions', {
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

      const data: OpenAiChatCompletionResponse = (await res.json()) as OpenAiChatCompletionResponse;
      if (!res.ok) {
        throw new Error(data.error?.message || 'OpenAI API request failed');
      }

      const latencyMs: number = Date.now() - startTime;
      const result: AiExecutionResult = {
        success: true,
        response: data.choices?.[0]?.message?.content || '',
        modelUsed: model,
        providerUsed: 'api-openai',
        latencyMs,
      };
      return result;
    } catch (err: unknown) {
      const latencyMs: number = Date.now() - startTime;
      const result: AiExecutionResult = {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'api-openai',
        latencyMs,
        error: toErrorMessage(err),
      };
      return result;
    }
  }
}
