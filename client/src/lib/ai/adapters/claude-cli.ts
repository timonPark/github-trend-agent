import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { runSubprocessCli } from './subprocess';
import { toErrorMessage } from '../../types/error';

export class ClaudeCliAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime = Date.now();
    const fullPrompt = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;
    const cmd = this.config.cliPath || 'claude';
    const model = this.config.model || 'claude-local-cli';

    try {
      const output = await runSubprocessCli(cmd, ['-p', fullPrompt], '');
      return {
        success: true,
        response: output,
        modelUsed: model,
        providerUsed: 'cli-claude',
        latencyMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      return {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'cli-claude',
        latencyMs: Date.now() - startTime,
        error: `Claude CLI execution failed: ${toErrorMessage(err)}`,
      };
    }
  }
}
