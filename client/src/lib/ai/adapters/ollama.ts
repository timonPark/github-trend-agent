import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { runSubprocessCli } from './subprocess';
import { toErrorMessage } from '../../types/error';

export class OllamaAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime: number = Date.now();
    const fullPrompt: string = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;
    const model: string = this.config.model || 'llama3';

    try {
      const res: Response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: fullPrompt,
          stream: false,
        }),
      });

      if (res.ok) {
        const data: { response?: string } = (await res.json()) as { response?: string };
        const latencyMs: number = Date.now() - startTime;
        const result: AiExecutionResult = {
          success: true,
          response: data.response || '',
          modelUsed: model,
          providerUsed: 'cli-ollama',
          latencyMs,
        };
        return result;
      }
      throw new Error(`Ollama returned status ${res.status}`);
    } catch {
      // Subprocess fallback
      try {
        const output: string = await runSubprocessCli(
          this.config.cliPath || 'ollama',
          ['run', model, fullPrompt],
          ''
        );
        const latencyMs: number = Date.now() - startTime;
        const result: AiExecutionResult = {
          success: true,
          response: output,
          modelUsed: model,
          providerUsed: 'cli-ollama',
          latencyMs,
        };
        return result;
      } catch (err: unknown) {
        const latencyMs: number = Date.now() - startTime;
        const result: AiExecutionResult = {
          success: false,
          response: '',
          modelUsed: model,
          providerUsed: 'cli-ollama',
          latencyMs,
          error: `Ollama execution failed: ${toErrorMessage(err)}`,
        };
        return result;
      }
    }
  }
}
