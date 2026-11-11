import { execSync } from 'child_process';
import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { runSubprocessCli } from './subprocess';
import { toErrorMessage } from '../../types/error';

function resolveGeminiCommand(configuredPath?: string): string {
  if (configuredPath && configuredPath.trim().length > 0) {
    return configuredPath.trim();
  }
  try {
    const agyPath: string = execSync('which agy', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();
    if (agyPath) {
      return agyPath;
    }
  } catch {
    // fallback to gemini
  }
  return 'gemini';
}

export class GeminiCliAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime: number = Date.now();
    const fullPrompt: string = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;
    const cmd: string = resolveGeminiCommand(this.config.cliPath);
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
