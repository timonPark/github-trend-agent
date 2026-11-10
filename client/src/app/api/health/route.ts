import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'github-trend-agent-client',
    designSystem: '@primer/primitives',
    timestamp: new Date().toISOString()
  });
}
