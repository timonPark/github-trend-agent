import { spawn, ChildProcess } from 'child_process';

/**
 * Runs a prompt through a local CLI in headless non-interactive mode.
 */
export function runSubprocessCli(
  command: string,
  args: string[],
  input: string,
  timeoutMs: number = 30000
): Promise<string> {
  return new Promise<string>((resolve: (value: string) => void, reject: (reason?: unknown) => void): void => {
    const proc: ChildProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout: string = '';
    let stderr: string = '';

    const timer: NodeJS.Timeout = setTimeout((): void => {
      proc.kill('SIGTERM');
      reject(new Error(`CLI execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.stdout?.on('data', (data: Buffer): void => {
      stdout += data.toString('utf-8');
    });

    proc.stderr?.on('data', (data: Buffer): void => {
      stderr += data.toString('utf-8');
    });

    proc.on('close', (code: number | null): void => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`CLI exited with code ${code}: ${stderr || stdout}`));
      }
    });

    proc.on('error', (err: Error): void => {
      clearTimeout(timer);
      reject(err);
    });

    if (input && proc.stdin) {
      proc.stdin.write(input);
    }
    proc.stdin?.end();
  });
}
