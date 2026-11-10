import { execSync } from 'child_process';
import { DetectedCli } from './types';

interface CliTarget {
  id: 'claude' | 'gemini' | 'ollama';
  name: string;
  command: string;
}

const CLI_TARGETS: CliTarget[] = [
  { id: 'claude', name: 'Claude Code CLI', command: 'claude' },
  { id: 'gemini', name: 'Google Gemini / AGY CLI', command: 'gemini' },
  { id: 'ollama', name: 'Ollama Local LLM', command: 'ollama' },
];

/**
 * Detects whether supported AI CLIs are installed and accessible on the local system.
 */
export function detectLocalAiClis(): DetectedCli[] {
  return CLI_TARGETS.map((target: CliTarget): DetectedCli => {
    try {
      const binaryPath: string = execSync(`which ${target.command}`, {
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf-8',
        timeout: 1000,
      }).trim();

      let version: string = '';
      try {
        const rawVersion: string = execSync(`${binaryPath} --version`, {
          stdio: ['ignore', 'pipe', 'ignore'],
          encoding: 'utf-8',
          timeout: 1500,
        }).trim();
        version = rawVersion.split('\n')[0];
      } catch {
        version = 'detected';
      }

      const detected: DetectedCli = {
        id: target.id,
        name: target.name,
        command: target.command,
        installed: Boolean(binaryPath),
        path: binaryPath,
        version: version || 'available',
      };
      return detected;
    } catch {
      const fallback: DetectedCli = {
        id: target.id,
        name: target.name,
        command: target.command,
        installed: false,
      };
      return fallback;
    }
  });
}
