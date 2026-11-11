import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { authenticateClientKey } from '@/lib/auth';
import { toErrorMessage } from '@/lib/types/error';
import { User, DiscussionArchive } from '@/lib/types';
import {
  ApiResponse,
  CreateArchiveRequestDto,
  CreateArchiveResponseDto,
  GetArchivesResponseDto,
  UpdateArchiveVisibilityRequestDto,
  UpdateArchiveVisibilityResponseDto,
} from '@/lib/types/api';

function extractAuthKey(req: Request): string | null {
  return req.headers.get('x-client-auth-key') || req.headers.get('authorization');
}

async function resolveUserAuth(
  req: Request
): Promise<{ error?: string; status?: number; user?: User }> {
  const authKey: string | null = extractAuthKey(req);
  if (!authKey) {
    return { error: 'Authentication required: missing client key', status: 401 };
  }
  const user: User | null = await authenticateClientKey(authKey);
  if (!user) {
    return { error: 'Invalid client authentication key', status: 401 };
  }
  return { user };
}

export async function GET(
  req: Request
): Promise<NextResponse<ApiResponse<GetArchivesResponseDto>>> {
  const url: URL = new URL(req.url);
  const isPublicQuery: boolean = url.searchParams.get('public') === 'true';
  const db: ServerDbAdapter = getServerDb();

  if (isPublicQuery) {
    const publicArchives: DiscussionArchive[] = await db.listPublicDiscussionArchives();
    return NextResponse.json<ApiResponse<GetArchivesResponseDto>>({
      success: true,
      data: { archives: publicArchives },
    });
  }

  const auth = await resolveUserAuth(req);
  if (!auth.user) {
    return NextResponse.json<ApiResponse<GetArchivesResponseDto>>(
      { success: false, error: auth.error },
      { status: auth.status || 401 }
    );
  }
  const userArchives: DiscussionArchive[] = await db.listDiscussionArchivesByUser(auth.user.id);
  return NextResponse.json<ApiResponse<GetArchivesResponseDto>>({
    success: true,
    data: { archives: userArchives },
  });
}

function validateCreatePayload(
  body: unknown
): { error?: string; payload?: CreateArchiveRequestDto } {
  const p: CreateArchiveRequestDto = body as CreateArchiveRequestDto;
  if (!p || !p.snapshot_date || !p.repo_full_name || !p.discussion_summary || !Array.isArray(p.messages)) {
    return { error: 'Invalid payload: snapshot_date, repo_full_name, discussion_summary, messages required' };
  }
  return { payload: p };
}

export async function POST(
  req: Request
): Promise<NextResponse<ApiResponse<CreateArchiveResponseDto>>> {
  const auth = await resolveUserAuth(req);
  if (!auth.user) {
    return NextResponse.json<ApiResponse<CreateArchiveResponseDto>>(
      { success: false, error: auth.error },
      { status: auth.status || 401 }
    );
  }
  const body: unknown = await req.json().catch((): null => null);
  const validation = validateCreatePayload(body);
  if (!validation.payload) {
    return NextResponse.json<ApiResponse<CreateArchiveResponseDto>>(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }
  const p: CreateArchiveRequestDto = validation.payload;
  const db: ServerDbAdapter = getServerDb();
  const created: DiscussionArchive = await db.createDiscussionArchive({
    id: p.id || randomUUID(),
    user_id: auth.user.id,
    username: auth.user.username,
    snapshot_date: p.snapshot_date,
    repo_full_name: p.repo_full_name,
    repo_url: p.repo_url || `https://github.com/${p.repo_full_name}`,
    repo_digest: p.repo_digest || '',
    discussion_summary: p.discussion_summary,
    messages: p.messages,
    is_public: p.is_public ?? true,
  });
  return NextResponse.json<ApiResponse<CreateArchiveResponseDto>>({
    success: true,
    data: { archive: created },
  });
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
  const auth = await resolveUserAuth(req);
  if (!auth.user) {
    return NextResponse.json<ApiResponse<UpdateArchiveVisibilityResponseDto>>(
      { success: false, error: auth.error },
      { status: auth.status || 401 }
    );
  }
  const body: unknown = await req.json().catch((): null => null);
  const validation = validatePatchPayload(body);
  if (!validation.payload) {
    return NextResponse.json<ApiResponse<UpdateArchiveVisibilityResponseDto>>(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }
  const db: ServerDbAdapter = getServerDb();
  const updated: DiscussionArchive | null = await db.updateArchiveVisibility(
    validation.payload.id,
    auth.user.id,
    validation.payload.is_public
  );
  if (!updated) {
    return NextResponse.json<ApiResponse<UpdateArchiveVisibilityResponseDto>>(
      { success: false, error: 'Archive not found or not owned by user' },
      { status: 404 }
    );
  }
  return NextResponse.json<ApiResponse<UpdateArchiveVisibilityResponseDto>>({
    success: true,
    data: { archive: updated },
  });
}
