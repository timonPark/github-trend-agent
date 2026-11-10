import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { runSubprocessCli } from './subprocess';
import { toErrorMessage } from '../../types/error';

export class GeminiCliAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime: number = Date.now();
    const fullPrompt: string = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;
    const cmd: string = this.config.cliPath || 'gemini';
    const model: string = this.config.model || 'gemini-local-cli';

    try {
      const output: string = await runSubprocessCli(cmd, ['--prompt', fullPrompt], '');
      const latencyMs: number = Date.now() - startTime;
      const result: AiExecutionResult = {
        success: true,
        response: output,
        modelUsed: model,
        providerUsed: 'cli-gemini',
        latencyMs,
      };
      return result;
    } catch (err: unknown) {
      const latencyMs: number = Date.now() - startTime;
      const result: AiExecutionResult = {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'cli-gemini',
        latencyMs,
        error: `Gemini CLI execution failed: ${toErrorMessage(err)}`,
      };
      return result;
    }
  }
}
