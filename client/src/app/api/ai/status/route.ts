import { NextResponse } from 'next/server';
import { getClientDb } from '@/lib/db';
import { getAiConfig, saveAiConfig } from '@/lib/ai/config';
import { detectLocalAiClis } from '@/lib/ai/detector';

export async function GET() {
  try {
    const db = getClientDb();
    const config = getAiConfig(db);
    const detectedClis = detectLocalAiClis();

    return NextResponse.json({
      config: {
        provider: config.provider,
        model: config.model,
        hasApiKey: !!config.apiKey,
        cliPath: config.cliPath,
      },
      detectedClis,
      isGated: config.provider === 'none',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to get AI status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getClientDb();
    const saved = saveAiConfig(body, db);

    return NextResponse.json({
      success: true,
      message: 'AI 에이전트 설정이 성공적으로 저장되었습니다.',
      config: {
        provider: saved.provider,
        model: saved.model,
        hasApiKey: !!saved.apiKey,
        cliPath: saved.cliPath,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save AI config' }, { status: 500 });
  }
}
