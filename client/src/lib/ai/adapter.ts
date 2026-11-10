import { AiExecutionResult } from './types';

/**
 * Universal Interface for AI Provider Adapters.
 * Each provider (Mock, CLI Claude/Gemini/Ollama, API OpenAI/Anthropic/Gemini, None)
 * implements this interface with single responsibility.
 */
export interface AiProviderAdapter {
  execute(prompt: string, context?: string): Promise<AiExecutionResult>;
}
