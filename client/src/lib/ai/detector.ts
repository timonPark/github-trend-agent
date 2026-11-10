import { execSync } from 'child_process';
import { DetectedCli } from './types';

const CLI_TARGETS: Array<{ id: 'claude' | 'gemini' | 'ollama'; name: string; command: string }> = [
  { id: 'claude', name: 'Claude Code CLI', command: 'claude' },
  { id: 'gemini', name: 'Google Gemini / AGY CLI', command: 'gemini' },
  { id: 'ollama', name: 'Ollama Local LLM', command: 'ollama' },
];

/**
 * Detects whether supported AI CLIs are installed and accessible on the local system.
 */
export function detectLocalAiClis(): DetectedCli[] {
  return CLI_TARGETS.map((target) => {
    try {
      // Find binary path using 'which'
      const binaryPath = execSync(`which ${target.command}`, {
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf-8',
        timeout: 1000,
      }).trim();

      let version = '';
      try {
        version = execSync(`${binaryPath} --version`, {
          stdio: ['ignore', 'pipe', 'ignore'],
          encoding: 'utf-8',
          timeout: 1500,
        }).trim().split('\n')[0];
      } catch {
        version = 'detected';
      }

      return {
        id: target.id,
        name: target.name,
        command: target.command,
        installed: !!binaryPath,
        path: binaryPath,
        version: version || 'available',
      };
    } catch {
      return {
        id: target.id,
        name: target.name,
        command: target.command,
        installed: false,
      };
    }
  });
}
