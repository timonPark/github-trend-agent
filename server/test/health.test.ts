import { describe, it, expect } from 'vitest';
import { GET } from '../src/app/api/health/route';

describe('Server Health Check API', (): void => {
  it('returns status ok and service identifier', async (): Promise<void> => {
    const response: Response = await GET();
    const data: { status: string; service: string; timestamp: string } =
      (await response.json()) as { status: string; service: string; timestamp: string };

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.service).toBe('github-trend-agent-server');
    expect(data.timestamp).toBeDefined();
  });
});
