export type AiProviderType =
  | 'none'
  | 'cli-claude'
  | 'cli-gemini'
  | 'cli-ollama'
  | 'cli-openai'
  | 'api-openai'
  | 'api-anthropic'
  | 'api-gemini'
  | 'mock';

export interface AiAgentConfig {
  provider: AiProviderType;
  model: string;
  apiKey?: string;
  cliPath?: string;
  systemPrompt?: string;
}

export interface AiExecutionResult {
  success: boolean;
  response: string;
  modelUsed: string;
  providerUsed: AiProviderType;
  latencyMs: number;
  error?: string;
}

export interface DetectedCli {
  id: 'claude' | 'gemini' | 'ollama' | 'openai';
  name: string;
  command: string;
  installed: boolean;
  version?: string;
  path?: string;
}
