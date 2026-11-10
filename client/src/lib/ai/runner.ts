import { spawn } from 'child_process';
import { AiAgentConfig, AiExecutionResult } from './types';

/**
 * Runs a prompt through a local CLI in headless non-interactive mode.
 */
function runSubprocessCli(command: string, args: string[], input: string, timeoutMs = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`CLI execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.stdout.on('data', (data) => {
      stdout += data.toString('utf-8');
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString('utf-8');
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`CLI exited with code ${code}: ${stderr || stdout}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    // Write input to stdin and close
    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();
  });
}

/**
 * Main execution entry point for Local AI Agent.
 */
export async function executeAiRequest(
  config: AiAgentConfig,
  prompt: string,
  context?: string
): Promise<AiExecutionResult> {
  const startTime = Date.now();
  const fullPrompt = context
    ? `[Reference Context / README]\n${context}\n\n[Instruction]\n${prompt}`
    : prompt;

  // 1. None: Capability Gated
  if (config.provider === 'none') {
    return {
      success: false,
      response: '',
      modelUsed: 'none',
      providerUsed: 'none',
      latencyMs: Date.now() - startTime,
      error: 'AI 에이전트가 연동되지 않았습니다. 설정 화면에서 로컬 CLI 또는 API Key를 연동해주세요.',
    };
  }

  // 2. Mock Provider (for deterministic testing & offline local dev)
  if (config.provider === 'mock') {
    const simulatedResponse = `[Mock AI Response: ${config.model}]\n주어진 저장소 컨텍스트에 대한 분석 및 토론 결과입니다.\n- 핵심 기술: 모던 웹 아키텍처 및 고성능 런타임\n- 프롬프트 반영: "${prompt.slice(0, 50)}..."`;
    return {
      success: true,
      response: simulatedResponse,
      modelUsed: config.model || 'mock-model',
      providerUsed: 'mock',
      latencyMs: Date.now() - startTime,
    };
  }

  // 3. Local CLI: Claude Code CLI
  if (config.provider === 'cli-claude') {
    const cmd = config.cliPath || 'claude';
    try {
      // Claude headless print mode: claude -p "<prompt>"
      const output = await runSubprocessCli(cmd, ['-p', fullPrompt], '');
      return {
        success: true,
        response: output,
        modelUsed: config.model || 'claude-local-cli',
        providerUsed: 'cli-claude',
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        response: '',
        modelUsed: config.model || 'claude-local-cli',
        providerUsed: 'cli-claude',
        latencyMs: Date.now() - startTime,
        error: `Claude CLI execution failed: ${err.message}`,
      };
    }
  }

  // 4. Local CLI: Gemini / AGY CLI
  if (config.provider === 'cli-gemini') {
    const cmd = config.cliPath || 'gemini';
    try {
      const output = await runSubprocessCli(cmd, ['--prompt', fullPrompt], '');
      return {
        success: true,
        response: output,
        modelUsed: config.model || 'gemini-local-cli',
        providerUsed: 'cli-gemini',
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        response: '',
        modelUsed: config.model || 'gemini-local-cli',
        providerUsed: 'cli-gemini',
        latencyMs: Date.now() - startTime,
        error: `Gemini CLI execution failed: ${err.message}`,
      };
    }
  }

  // 5. Local CLI: Ollama
  if (config.provider === 'cli-ollama') {
    const model = config.model || 'llama3';
    try {
      // Prefer Ollama local HTTP API (faster & standard)
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
        const data = await res.json();
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
      // Fallback to ollama run subprocess
      try {
        const output = await runSubprocessCli(config.cliPath || 'ollama', ['run', model, fullPrompt], '');
        return {
          success: true,
          response: output,
          modelUsed: model,
          providerUsed: 'cli-ollama',
          latencyMs: Date.now() - startTime,
        };
      } catch (err: any) {
        return {
          success: false,
          response: '',
          modelUsed: model,
          providerUsed: 'cli-ollama',
          latencyMs: Date.now() - startTime,
          error: `Ollama execution failed: ${err.message}`,
        };
      }
    }
  }

  // 6. Direct API: OpenAI
  if (config.provider === 'api-openai') {
    if (!config.apiKey) {
      return {
        success: false,
        response: '',
        modelUsed: config.model || 'gpt-4o',
        providerUsed: 'api-openai',
        latencyMs: Date.now() - startTime,
        error: 'OpenAI API Key가 설정되지 않았습니다.',
      };
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o',
          messages: [{ role: 'user', content: fullPrompt }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'OpenAI API request failed');

      return {
        success: true,
        response: data.choices?.[0]?.message?.content || '',
        modelUsed: config.model || 'gpt-4o',
        providerUsed: 'api-openai',
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        response: '',
        modelUsed: config.model || 'gpt-4o',
        providerUsed: 'api-openai',
        latencyMs: Date.now() - startTime,
        error: err.message,
      };
    }
  }

  // 7. Direct API: Anthropic Claude
  if (config.provider === 'api-anthropic') {
    if (!config.apiKey) {
      return {
        success: false,
        response: '',
        modelUsed: config.model || 'claude-3-5-sonnet-20241022',
        providerUsed: 'api-anthropic',
        latencyMs: Date.now() - startTime,
        error: 'Anthropic API Key가 설정되지 않았습니다.',
      };
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: [{ role: 'user', content: fullPrompt }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Anthropic API request failed');

      return {
        success: true,
        response: data.content?.[0]?.text || '',
        modelUsed: config.model || 'claude-3-5-sonnet',
        providerUsed: 'api-anthropic',
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        response: '',
        modelUsed: config.model || 'claude-3-5-sonnet',
        providerUsed: 'api-anthropic',
        latencyMs: Date.now() - startTime,
        error: err.message,
      };
    }
  }

  // 8. Direct API: Google Gemini
  if (config.provider === 'api-gemini') {
    if (!config.apiKey) {
      return {
        success: false,
        response: '',
        modelUsed: config.model || 'gemini-1.5-pro',
        providerUsed: 'api-gemini',
        latencyMs: Date.now() - startTime,
        error: 'Google Gemini API Key가 설정되지 않았습니다.',
      };
    }

    const model = config.model || 'gemini-1.5-pro';
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gemini API request failed');

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        success: true,
        response: responseText,
        modelUsed: model,
        providerUsed: 'api-gemini',
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        response: '',
        modelUsed: model,
        providerUsed: 'api-gemini',
        latencyMs: Date.now() - startTime,
        error: err.message,
      };
    }
  }

  return {
    success: false,
    response: '',
    modelUsed: 'unknown',
    providerUsed: config.provider,
    latencyMs: Date.now() - startTime,
    error: `Unsupported provider: ${config.provider}`,
  };
}
