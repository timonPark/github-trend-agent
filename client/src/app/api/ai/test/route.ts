import { NextResponse } from 'next/server';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb } from '@/lib/db';
import { getAiConfig } from '@/lib/ai/config';
import { executeAiRequest } from '@/lib/ai/runner';
import { AiAgentConfig, AiExecutionResult } from '@/lib/ai/types';
import { toErrorMessage } from '@/lib/types/error';

interface AiTestRequestBody {
  provider?: AiAgentConfig['provider'];
  model?: string;
  apiKey?: string;
  cliPath?: string;
  prompt?: string;
}

export async function POST(request: Request): Promise<NextResponse<AiExecutionResult>> {
  try {
    const body: AiTestRequestBody = (await request.json().catch((): AiTestRequestBody => ({}))) as AiTestRequestBody;

    let config: AiAgentConfig;
    if (body.provider) {
      config = {
        provider: body.provider,
        model: body.model || 'default',
        apiKey: body.apiKey || '',
        cliPath: body.cliPath || '',
      };
    } else {
      const db: DatabaseInstance = getClientDb();
      config = getAiConfig(db);
    }

    const testPrompt: string =
      body.prompt || 'Hello! Reply with a brief confirmation message if you can process this instruction.';
    const result: AiExecutionResult = await executeAiRequest(config, testPrompt);

    return NextResponse.json<AiExecutionResult>(result, { status: result.success ? 200 : 400 });
  } catch (err: unknown) {
    const errorResult: AiExecutionResult = {
      success: false,
      response: '',
      modelUsed: 'unknown',
      providerUsed: 'none',
      latencyMs: 0,
      error: toErrorMessage(err),
    };
    return NextResponse.json<AiExecutionResult>(errorResult, { status: 500 });
  }
}
