import { NextResponse } from 'next/server';

interface ClientHealthResponse {
  status: string;
  service: string;
  designSystem: string;
  timestamp: string;
}

export async function GET(): Promise<NextResponse<ClientHealthResponse>> {
  return NextResponse.json<ClientHealthResponse>({
    status: 'ok',
    service: 'github-trend-agent-client',
    designSystem: '@primer/primitives',
    timestamp: new Date().toISOString(),
  });
}
