import { AiProviderAdapter } from '../adapter';
import { AiAgentConfig, AiExecutionResult } from '../types';
import { runSubprocessCli } from './subprocess';
import { toErrorMessage } from '../../types/error';

export class OllamaAdapter implements AiProviderAdapter {
  constructor(private readonly config: AiAgentConfig) {}

  async execute(prompt: string, context?: string): Promise<AiExecutionResult> {
    const startTime = Date.now();
    const fullPrompt = context
      ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
      : prompt;
    const model = this.config.model || 'llama3';

    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: fullPrompt,
          stream: false,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { response?: string };
        return {
          success: true,
          response: data.response || '',
          modelUsed: model,
          providerUsed: 'cli-ollama',
          latencyMs: Date.now() - startTime,
        };
      }
      throw new Error(`Ollama returned status ${res.status}`);
    } catch {
      // Subprocess fallback
      try {
        const output = await runSubprocessCli(
          this.config.cliPath || 'ollama',
          ['run', model, fullPrompt],
          ''
        );
        return {
          success: true,
          response: output,
          modelUsed: model,
          providerUsed: 'cli-ollama',
          latencyMs: Date.now() - startTime,
        };
      } catch (err: unknown) {
        return {
          success: false,
          response: '',
          modelUsed: model,
          providerUsed: 'cli-ollama',
          latencyMs: Date.now() - startTime,
          error: `Ollama execution failed: ${toErrorMessage(err)}`,
        };
      }
    }
  }
}
