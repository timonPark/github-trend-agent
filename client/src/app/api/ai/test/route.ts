import { NextResponse } from 'next/server';
import { getClientDb } from '@/lib/db';
import { getAiConfig } from '@/lib/ai/config';
import { executeAiRequest } from '@/lib/ai/runner';
import { AiAgentConfig } from '@/lib/ai/types';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // If config is passed directly in body, use it for on-the-fly testing before saving
    let config: AiAgentConfig;
    if (body.provider) {
      config = {
        provider: body.provider,
        model: body.model || 'default',
        apiKey: body.apiKey || '',
        cliPath: body.cliPath || '',
      };
    } else {
      const db = getClientDb();
      config = getAiConfig(db);
    }

    const testPrompt = body.prompt || 'Hello! Reply with a brief confirmation message if you can process this instruction.';
    const result = await executeAiRequest(config, testPrompt);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal AI test error',
      },
      { status: 500 }
    );
  }
}
