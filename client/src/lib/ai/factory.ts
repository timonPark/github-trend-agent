import { AiProviderAdapter } from './adapter';
import { AiAgentConfig, AiExecutionResult } from './types';
import { NoneAdapter } from './adapters/none';
import { MockAdapter } from './adapters/mock';
import { ClaudeCliAdapter } from './adapters/claude-cli';
import { GeminiCliAdapter } from './adapters/gemini-cli';
import { OllamaAdapter } from './adapters/ollama';
import { OpenAiApiAdapter } from './adapters/openai-api';
import { AnthropicApiAdapter } from './adapters/anthropic-api';
import { GeminiApiAdapter } from './adapters/gemini-api';

class UnsupportedAdapter implements AiProviderAdapter {
  constructor(private readonly provider: string) {}
  async execute(): Promise<AiExecutionResult> {
    const result: AiExecutionResult = {
      success: false,
      response: '',
      modelUsed: 'unknown',
      providerUsed: 'none',
      latencyMs: 0,
      error: `Unsupported provider: ${this.provider}`,
    };
    return result;
  }
}

export function createAiAdapter(config: AiAgentConfig): AiProviderAdapter {
  switch (config.provider) {
    case 'none':
      return new NoneAdapter();
    case 'mock':
      return new MockAdapter(config);
    case 'cli-claude':
      return new ClaudeCliAdapter(config);
    case 'cli-gemini':
      return new GeminiCliAdapter(config);
    case 'cli-ollama':
      return new OllamaAdapter(config);
    case 'api-openai':
      return new OpenAiApiAdapter(config);
    case 'api-anthropic':
      return new AnthropicApiAdapter(config);
    case 'api-gemini':
      return new GeminiApiAdapter(config);
    default:
      return new UnsupportedAdapter(config.provider);
  }
}
