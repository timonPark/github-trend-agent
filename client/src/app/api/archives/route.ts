import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Database as DatabaseInstance } from 'better-sqlite3';
import {
  getClientDb,
  getLocalArchive,
  saveLocalArchive,
  listLocalArchives,
  updateLocalArchiveVisibility,
  getSetting,
  getServerAuthKey,
} from '@/lib/db';
import { getAiConfig } from '@/lib/ai/config';
import { generateDiscussionSummary } from '@/lib/ai/discussion';
import { toErrorMessage } from '@/lib/types/error';
import { LocalArchive, ChatMessage } from '@/lib/types';
import {
  ApiResponse,
  CreateLocalArchiveRequestDto,
  CreateLocalArchiveResponseDto,
  GetLocalArchivesResponseDto,
  UpdateArchiveVisibilityRequestDto,
  UpdateArchiveVisibilityResponseDto,
} from '@/lib/types/api';

async function syncArchiveToServer(archive: LocalArchive, db: DatabaseInstance): Promise<boolean> {
  const serverUrl: string = getSetting('server_url', db) || 'http://localhost:4000';
  const authKey: string | null = getServerAuthKey(db) || getSetting('client_auth_key', db);
  if (!authKey) return false;

  try {
    const res: Response = await fetch(`${serverUrl}/api/archives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-auth-key': authKey },
      body: JSON.stringify(archive),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function syncPatchToServer(id: string, isPublic: boolean, db: DatabaseInstance): Promise<boolean> {
  const serverUrl: string = getSetting('server_url', db) || 'http://localhost:4000';
  const authKey: string | null = getServerAuthKey(db) || getSetting('client_auth_key', db);
  if (!authKey) return false;

  try {
    const res: Response = await fetch(`${serverUrl}/api/archives`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-client-auth-key': authKey },
      body: JSON.stringify({ id, is_public: isPublic }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<GetLocalArchivesResponseDto>>> {
  const db: DatabaseInstance = getClientDb();
  const archives: LocalArchive[] = listLocalArchives(db);
  return NextResponse.json<ApiResponse<GetLocalArchivesResponseDto>>({
    success: true,
    data: { archives },
  });
}

function validateCreatePayload(
  body: unknown
): { error?: string; payload?: CreateLocalArchiveRequestDto } {
  const p: CreateLocalArchiveRequestDto = body as CreateLocalArchiveRequestDto;
  if (!p || !p.snapshot_date || !p.repo_full_name || !Array.isArray(p.messages)) {
    return { error: 'Invalid payload: snapshot_date, repo_full_name, messages required' };
  }
  return { payload: p };
}

async function resolveSummary(
  p: CreateLocalArchiveRequestDto,
  db: DatabaseInstance
): Promise<string> {
  if (p.discussion_summary && p.discussion_summary.trim().length > 0) {
    return p.discussion_summary.trim();
  }
  const config = getAiConfig(db);
  return generateDiscussionSummary(
    config,
    { full_name: p.repo_full_name, digest: p.repo_digest },
    p.messages
  );
}

export async function POST(
  req: Request
): Promise<NextResponse<ApiResponse<CreateLocalArchiveResponseDto>>> {
  const body: unknown = await req.json().catch((): null => null);
  const validation = validateCreatePayload(body);
  if (!validation.payload) {
    return NextResponse.json<ApiResponse<CreateLocalArchiveResponseDto>>(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }
  const p: CreateLocalArchiveRequestDto = validation.payload;
  const db: DatabaseInstance = getClientDb();
  try {
    const summary: string = await resolveSummary(p, db);
    const userId: string = getSetting('user_id', db) || 'local-user';
    const archiveData: Omit<LocalArchive, 'created_at'> = {
      id: p.id || randomUUID(),
      user_id: userId,
      snapshot_date: p.snapshot_date,
      repo_full_name: p.repo_full_name,
      repo_url: p.repo_url || `https://github.com/${p.repo_full_name}`,
      repo_digest: p.repo_digest || '',
      discussion_summary: summary,
      messages: p.messages,
      is_public: p.is_public ?? true,
      synced_with_server: false,
    };
    let saved: LocalArchive = saveLocalArchive(archiveData, db);
    const synced: boolean = await syncArchiveToServer(saved, db);
    if (synced) {
      saved = saveLocalArchive({ ...saved, synced_with_server: true }, db);
    }
    return NextResponse.json<ApiResponse<CreateLocalArchiveResponseDto>>({
      success: true,
      data: { archive: saved, synced_with_server: synced },
    });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse<CreateLocalArchiveResponseDto>>(
      { success: false, error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}

function validatePatchPayload(
  body: unknown
): { error?: string; payload?: UpdateArchiveVisibilityRequestDto } {
  const p: UpdateArchiveVisibilityRequestDto = body as UpdateArchiveVisibilityRequestDto;
  if (!p || !p.id || typeof p.is_public !== 'boolean') {
    return { error: 'Invalid payload: id and is_public (boolean) are required' };
  }
  return { payload: p };
}

export async function PATCH(
  req: Request
): Promise<NextResponse<ApiResponse<UpdateArchiveVisibilityResponseDto>>> {
  const body: unknown = await req.json().catch((): null => null);
  const validation = validatePatchPayload(body);
  if (!validation.payload) {
    return NextResponse.json<ApiResponse<UpdateArchiveVisibilityResponseDto>>(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }
  const db: DatabaseInstance = getClientDb();
  const updated: LocalArchive | null = updateLocalArchiveVisibility(
    validation.payload.id,
    validation.payload.is_public,
    db
  );
  if (!updated) {
    return NextResponse.json<ApiResponse<UpdateArchiveVisibilityResponseDto>>(
      { success: false, error: 'Archive not found' },
      { status: 404 }
    );
  }
  const synced: boolean = await syncPatchToServer(validation.payload.id, validation.payload.is_public, db);
  return NextResponse.json<ApiResponse<UpdateArchiveVisibilityResponseDto>>({
    success: true,
    data: { archive: updated, synced_with_server: synced },
  });
}
