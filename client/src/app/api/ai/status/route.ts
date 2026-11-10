import { NextResponse } from 'next/server';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb } from '@/lib/db';
import { getAiConfig, saveAiConfig } from '@/lib/ai/config';
import { detectLocalAiClis } from '@/lib/ai/detector';
import { AiAgentConfig, DetectedCli } from '@/lib/ai/types';
import { toErrorMessage } from '@/lib/types/error';

interface AiStatusPayload {
  config: {
    provider: AiAgentConfig['provider'];
    model: string;
    hasApiKey: boolean;
    cliPath?: string;
  };
  detectedClis: DetectedCli[];
  isGated: boolean;
  error?: string;
}

interface AiSaveResponse {
  success: boolean;
  message?: string;
  config?: {
    provider: AiAgentConfig['provider'];
    model: string;
    hasApiKey: boolean;
    cliPath?: string;
  };
  error?: string;
}

export async function GET(): Promise<NextResponse<AiStatusPayload>> {
  try {
    const db: DatabaseInstance = getClientDb();
    const config: AiAgentConfig = getAiConfig(db);
    const detectedClis: DetectedCli[] = detectLocalAiClis();

    return NextResponse.json<AiStatusPayload>({
      config: {
        provider: config.provider,
        model: config.model,
        hasApiKey: Boolean(config.apiKey),
        cliPath: config.cliPath,
      },
      detectedClis,
      isGated: config.provider === 'none',
    });
  } catch (err: unknown) {
    return NextResponse.json<AiStatusPayload>(
      {
        config: { provider: 'none', model: 'default', hasApiKey: false },
        detectedClis: [],
        isGated: true,
        error: toErrorMessage(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<AiSaveResponse>> {
  try {
    const body: Partial<AiAgentConfig> = (await request.json()) as Partial<AiAgentConfig>;
    const db: DatabaseInstance = getClientDb();
    const saved: AiAgentConfig = saveAiConfig(body, db);

    return NextResponse.json<AiSaveResponse>({
      success: true,
      message: 'AI 에이전트 설정이 성공적으로 저장되었습니다.',
      config: {
        provider: saved.provider,
        model: saved.model,
        hasApiKey: Boolean(saved.apiKey),
        cliPath: saved.cliPath,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json<AiSaveResponse>(
      { success: false, error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
