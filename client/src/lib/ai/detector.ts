import { execSync } from 'child_process';
import { DetectedCli } from './types';

interface CliTarget {
  id: 'claude' | 'gemini' | 'ollama' | 'openai';
  name: string;
  command: string;
  alternativeCommands?: string[];
}

const CLI_TARGETS: CliTarget[] = [
  { id: 'claude', name: 'Claude Code CLI', command: 'claude' },
  { id: 'gemini', name: 'Google Gemini / AGY CLI', command: 'gemini', alternativeCommands: ['agy', 'antigravity'] },
  { id: 'ollama', name: 'Ollama Local LLM', command: 'ollama' },
  { id: 'openai', name: 'OpenAI CLI', command: 'openai' },
];

function findBinary(command: string): string {
  try {
    return execSync(`which ${command}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
      timeout: 1000,
    }).trim();
  } catch {
    return '';
  }
}

function resolveBinaryPath(target: CliTarget): { binaryPath: string; activeCommand: string } {
  const primaryPath: string = findBinary(target.command);
  if (primaryPath) {
    return { binaryPath: primaryPath, activeCommand: target.command };
  }

  if (target.alternativeCommands) {
    for (const alt of target.alternativeCommands) {
      const altPath: string = findBinary(alt);
      if (altPath) {
        return { binaryPath: altPath, activeCommand: alt };
      }
    }
  }

  return { binaryPath: '', activeCommand: target.command };
}

function resolveVersion(binaryPath: string): string {
  try {
    const rawVersion: string = execSync(`${binaryPath} --version`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
      timeout: 1500,
    }).trim();
    return rawVersion.split('\n')[0] || 'available';
  } catch {
    return 'detected';
  }
}

function detectTarget(target: CliTarget): DetectedCli {
  const { binaryPath, activeCommand } = resolveBinaryPath(target);
  if (!binaryPath) {
    return { id: target.id, name: target.name, command: target.command, installed: false };
  }

  const version: string = resolveVersion(binaryPath);
  return {
    id: target.id,
    name: target.name,
    command: activeCommand,
    installed: true,
    path: binaryPath,
    version,
  };
}

/**
 * Detects whether supported AI CLIs are installed and accessible on the local system.
 */
export function detectLocalAiClis(): DetectedCli[] {
  return CLI_TARGETS.map(detectTarget);
}
