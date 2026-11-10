import { spawn } from 'child_process';

/**
 * Runs a prompt through a local CLI in headless non-interactive mode.
 */
export function runSubprocessCli(
  command: string,
  args: string[],
  input: string,
  timeoutMs = 30000
): Promise<string> {
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

    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();
  });
}
