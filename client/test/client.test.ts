import { describe, it, expect } from 'vitest';
import { GET } from '../src/app/api/health/route';
import fs from 'fs';
import path from 'path';

describe('Client Health Check & Primer Primitives Setup', (): void => {
  it('returns client status ok and design system info', async (): Promise<void> => {
    const response: Response = await GET();
    const data: { status: string; service: string; designSystem: string } =
      (await response.json()) as { status: string; service: string; designSystem: string };

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.service).toBe('github-trend-agent-client');
    expect(data.designSystem).toBe('@primer/primitives');
  });

  it('imports @primer/primitives in globals.css', (): void => {
    const cssPath: string = path.resolve(__dirname, '../src/app/globals.css');
    const cssContent: string = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toContain('@primer/primitives/dist/css/primitives.css');
    expect(cssContent).toContain('@primer/primitives/dist/css/functional/themes/light.css');
    expect(cssContent).toContain('@primer/primitives/dist/css/functional/themes/dark.css');
    expect(cssContent).toContain('.primer-btn');
    expect(cssContent).toContain('.primer-card');
  });
});
