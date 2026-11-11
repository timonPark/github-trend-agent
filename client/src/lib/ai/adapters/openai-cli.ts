import { execSync } from 'child_process';
import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { runSubprocessCli } from './subprocess';
import { toErrorMessage } from '../../types/error';

function resolveOpenaiCommand(configuredPath?: string): string {
  if (configuredPath && configuredPath.trim().length > 0) {
    return configuredPath.trim();
  }
  try {
    const codexPath: string = execSync('which codex', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();
    if (codexPath) {
      return codexPath;
    }
  } catch {
    // fallback
  }
  return 'openai';
}

function buildOpenaiArgs(cmd: string, model: string, prompt: string): string[] {
  if (cmd.includes('codex')) {
    return ['exec', '--skip-git-repo-check', '--ephemeral', prompt];
  }
  return ['api', 'chat.completions.create', '-m', model, '-g', 'user', prompt];
}

export class OpenaiCliAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime: number = Date.now();
    const fullPrompt: string = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;
    const cmd: string = resolveOpenaiCommand(this.config.cliPath);
    const model: string = this.config.model || (cmd.includes('codex') ? 'codex-cli' : 'gpt-4o');
    const args: string[] = buildOpenaiArgs(cmd, model, fullPrompt);

    try {
      const output: string = await runSubprocessCli(cmd, args, '');
      const latencyMs: number = Date.now() - startTime;
      const result: AiExecutionResult = {
        success: true,
        response: output,
        modelUsed: model,
        providerUsed: 'cli-openai',
        latencyMs,
      };
      return result;
    } catch (err: unknown) {
      const latencyMs: number = Date.now() - startTime;
      const result: AiExecutionResult = {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'cli-openai',
        latencyMs,
        error: `OpenAI CLI execution failed: ${toErrorMessage(err)}`,
      };
      return result;
    }
  }
}
