import { AiAgentConfig, AiExecutionResult } from './types';
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
  const adapter = createAiAdapter(config);
  return adapter.execute(prompt, context);
}
