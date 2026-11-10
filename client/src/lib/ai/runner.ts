import { AiAgentConfig, AiExecutionResult } from './types';
import { AiProviderAdapter } from './adapter';
import { createAiAdapter } from './factory';

/**
 * Main execution entry point for Local AI Agent.
 * Delegates execution to the appropriate AiProviderAdapter via Factory.
 */
export async function executeAiRequest(
  config: AiAgentConfig,
  prompt: string,
  context?: string
): Promise<AiExecutionResult> {
  const adapter: AiProviderAdapter = createAiAdapter(config);
  return adapter.execute(prompt, context);
}
