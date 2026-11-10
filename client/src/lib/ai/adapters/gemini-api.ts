import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { toErrorMessage } from '../../types/error';

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class GeminiApiAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime = Date.now();
    const model = this.config.model || 'gemini-1.5-pro';

    if (!this.config.apiKey) {
      return {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'api-gemini',
        latencyMs: Date.now() - startTime,
        error: 'Google Gemini API Key가 설정되지 않았습니다.',
      };
    }

    const fullPrompt = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
          }),
        }
      );

      const data = (await res.json()) as GeminiGenerateResponse;
      if (!res.ok) {
        throw new Error(data.error?.message || 'Gemini API request failed');
      }

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        success: true,
        response: responseText,
        modelUsed: model,
        providerUsed: 'api-gemini',
        latencyMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      return {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'api-gemini',
        latencyMs: Date.now() - startTime,
        error: toErrorMessage(err),
      };
    }
  }
}
