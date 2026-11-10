import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { runSubprocessCli } from './subprocess';
import { toErrorMessage } from '../../types/error';

export class ClaudeCliAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime: number = Date.now();
    const fullPrompt: string = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;
    const cmd: string = this.config.cliPath || 'claude';
    const model: string = this.config.model || 'claude-local-cli';

    try {
      const output: string = await runSubprocessCli(cmd, ['-p', fullPrompt], '');
      const latencyMs: number = Date.now() - startTime;
      const result: AiExecutionResult = {
        success: true,
        response: output,
        modelUsed: model,
        providerUsed: 'cli-claude',
        latencyMs,
      };
      return result;
    } catch (err: unknown) {
      const latencyMs: number = Date.now() - startTime;
      const result: AiExecutionResult = {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'cli-claude',
        latencyMs,
        error: `Claude CLI execution failed: ${toErrorMessage(err)}`,
      };
      return result;
    }
  }
}
