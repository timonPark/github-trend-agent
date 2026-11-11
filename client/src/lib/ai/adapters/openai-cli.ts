import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { runSubprocessCli } from './subprocess';
import { toErrorMessage } from '../../types/error';

function buildOpenaiArgs(model: string, prompt: string): string[] {
  return ['api', 'chat.completions.create', '-m', model, '-g', 'user', prompt];
}

export class OpenaiCliAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime: number = Date.now();
    const fullPrompt: string = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;
    const cmd: string = this.config.cliPath || 'openai';
    const model: string = this.config.model || 'gpt-4o';
    const args: string[] = buildOpenaiArgs(model, fullPrompt);

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
