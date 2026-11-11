import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, getDiscussionSession, saveDiscussionSession } from '@/lib/db';
import { getAiConfig } from '@/lib/ai/config';
import { checkAiCapability } from '@/lib/ai/digest';
import { buildDiscussionSystemPrompt, executeDiscussionChat } from '@/lib/ai/discussion';
import { toErrorMessage } from '@/lib/types/error';
import { DiscussionSession, ChatMessage } from '@/lib/types';
import {
  ApiResponse,
  CapabilityGateStatusDto,
  GetDiscussionResponseDto,
  SendDiscussionMessageRequestDto,
  SendDiscussionMessageResponseDto,
} from '@/lib/types/api';
import { AiAgentConfig } from '@/lib/ai/types';

function parseGetQueryParams(urlString: string): { repo: string; repoUrl: string } | null {
  const url: URL = new URL(urlString);
  const repo: string = url.searchParams.get('repo') || url.searchParams.get('repo_full_name') || '';
  const repoUrl: string = url.searchParams.get('url') || url.searchParams.get('repo_url') || '';
  if (!repo) {
    return null;
  }
  return { repo, repoUrl: repoUrl || `https://github.com/${repo}` };
}

function createDefaultSession(repo: string, repoUrl: string): DiscussionSession {
  const now: string = new Date().toISOString();
  return {
    id: repo,
    repo_full_name: repo,
    repo_url: repoUrl,
    messages: [],
    created_at: now,
    updated_at: now,
  };
}

export async function GET(
  req: Request
): Promise<NextResponse<ApiResponse<GetDiscussionResponseDto>>> {
  const params: { repo: string; repoUrl: string } | null = parseGetQueryParams(req.url);
  if (!params) {
    return NextResponse.json<ApiResponse<GetDiscussionResponseDto>>(
      { success: false, error: 'repo (or repo_full_name) is required' },
      { status: 400 }
    );
  }
  const db: DatabaseInstance = getClientDb();
  const existing: DiscussionSession | null = getDiscussionSession(params.repo, db);
  const session: DiscussionSession = existing || createDefaultSession(params.repo, params.repoUrl);
  const config: AiAgentConfig = getAiConfig(db);
  const capability: CapabilityGateStatusDto = checkAiCapability(config);

  return NextResponse.json<ApiResponse<GetDiscussionResponseDto>>({
    success: true,
    data: { session, isGated: !capability.enabled },
  });
}

function validatePostPayload(
  body: unknown
): { error?: string; payload?: SendDiscussionMessageRequestDto } {
  const p: SendDiscussionMessageRequestDto = body as SendDiscussionMessageRequestDto;
  if (!p || !p.repo_full_name || !p.message || p.message.trim().length === 0) {
    return { error: 'Invalid payload: repo_full_name and non-empty message are required' };
  }
  return { payload: p };
}

async function parseAndValidatePost(
  req: Request
): Promise<{ error?: string; status?: number; payload?: SendDiscussionMessageRequestDto }> {
  const body: unknown = await req.json().catch((): null => null);
  const validation: { error?: string; payload?: SendDiscussionMessageRequestDto } = validatePostPayload(body);
  if (!validation.payload) {
    return { error: validation.error || 'Invalid request body', status: 400 };
  }
  return { payload: validation.payload };
}

function ensureAiCapability(db: DatabaseInstance): { error?: string; config?: AiAgentConfig } {
  const config: AiAgentConfig = getAiConfig(db);
  const capability: CapabilityGateStatusDto = checkAiCapability(config);
  if (!capability.enabled) {
    return { error: capability.reason || 'AI capability is disabled' };
  }
  return { config };
}

function resolveSession(
  repoFullName: string,
  repoUrl: string,
  db: DatabaseInstance
): DiscussionSession {
  const existing: DiscussionSession | null = getDiscussionSession(repoFullName, db);
  if (existing) {
    return existing;
  }
  return createDefaultSession(repoFullName, repoUrl);
}

function createChatPair(
  userText: string,
  assistantText: string
): { userMsg: ChatMessage; assistantMsg: ChatMessage } {
  const now: string = new Date().toISOString();
  const userMsg: ChatMessage = {
    id: randomUUID(),
    role: 'user',
    content: userText,
    timestamp: now,
  };
  const assistantMsg: ChatMessage = {
    id: randomUUID(),
    role: 'assistant',
    content: assistantText,
    timestamp: now,
  };
  return { userMsg, assistantMsg };
}

async function processDiscussionTurn(
  config: AiAgentConfig,
  p: SendDiscussionMessageRequestDto,
  db: DatabaseInstance
): Promise<{ session: DiscussionSession; latest_message: ChatMessage }> {
  const currentSession: DiscussionSession = resolveSession(p.repo_full_name, p.repo_url, db);
  const systemPrompt: string = buildDiscussionSystemPrompt({
    full_name: p.repo_full_name,
    url: p.repo_url,
    digest: p.digest,
    readme: p.readme,
  });
  const replyText: string = await executeDiscussionChat(
    config,
    systemPrompt,
    currentSession.messages,
    p.message
  );
  const pair: { userMsg: ChatMessage; assistantMsg: ChatMessage } = createChatPair(p.message, replyText);
  const updatedMessages: ChatMessage[] = [...currentSession.messages, pair.userMsg, pair.assistantMsg];
  const savedSession: DiscussionSession = saveDiscussionSession(
    { id: p.repo_full_name, repo_full_name: p.repo_full_name, repo_url: p.repo_url, messages: updatedMessages },
    db
  );
  return { session: savedSession, latest_message: pair.assistantMsg };
}

export async function POST(
  req: Request
): Promise<NextResponse<ApiResponse<SendDiscussionMessageResponseDto>>> {
  const parsed = await parseAndValidatePost(req);
  if (!parsed.payload) {
    return NextResponse.json<ApiResponse<SendDiscussionMessageResponseDto>>(
      { success: false, error: parsed.error },
      { status: parsed.status || 400 }
    );
  }
  const db: DatabaseInstance = getClientDb();
  const cap = ensureAiCapability(db);
  if (!cap.config) {
    return NextResponse.json<ApiResponse<SendDiscussionMessageResponseDto>>(
      { success: false, error: cap.error },
      { status: 403 }
    );
  }
  try {
    const result = await processDiscussionTurn(cap.config, parsed.payload, db);
    return NextResponse.json<ApiResponse<SendDiscussionMessageResponseDto>>({ success: true, data: result });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse<SendDiscussionMessageResponseDto>>(
      { success: false, error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
