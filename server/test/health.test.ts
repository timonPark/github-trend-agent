import { describe, it, expect } from 'vitest';
import { GET } from '../src/app/api/health/route';

describe('Server Health Check API', () => {
  it('returns status ok and service identifier', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.service).toBe('github-trend-agent-server');
    expect(data.timestamp).toBeDefined();
  });
});
