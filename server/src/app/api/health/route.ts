import { NextResponse } from 'next/server';

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  return NextResponse.json<HealthResponse>({
    status: 'ok',
    service: 'github-trend-agent-server',
    timestamp: new Date().toISOString(),
  });
}
