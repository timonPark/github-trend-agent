import { NextResponse } from 'next/server';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, getLocalSnapshot, updateLocalRepoDigest } from '@/lib/db';
import { getAiConfig } from '@/lib/ai/config';
import { checkAiCapability, generateRepoDigest, syncSnapshotToServer } from '@/lib/ai/digest';
import { toErrorMessage } from '@/lib/types/error';
import { TrendingRepository, LocalSnapshot } from '@/lib/types';
import {
  ApiResponse,
  CapabilityGateStatusDto,
  GenerateDigestRequestDto,
  GenerateDigestResponseDto,
} from '@/lib/types/api';
import { AiAgentConfig } from '@/lib/ai/types';

function validatePayload(body: unknown): { error?: string; payload?: GenerateDigestRequestDto } {
  const p: GenerateDigestRequestDto = body as GenerateDigestRequestDto;
  if (!p || !p.snapshot_date || !p.repo_full_name) {
    return { error: 'Invalid payload: snapshot_date and repo_full_name are required' };
  }
  return { payload: p };
}

function verifyAiCapability(db: DatabaseInstance): { error?: string; config?: AiAgentConfig } {
  const config: AiAgentConfig = getAiConfig(db);
  const capability: CapabilityGateStatusDto = checkAiCapability(config);
  if (!capability.enabled) {
    return { error: capability.reason || 'AI capability is disabled' };
  }
  return { config };
}

function findRepoInSnapshot(
  db: DatabaseInstance,
  date: string,
  repoName: string
): { error?: string; repo?: TrendingRepository } {
  const snapshot: LocalSnapshot | null = getLocalSnapshot(date, db);
  if (!snapshot) {
    return { error: `Snapshot not found for date ${date}` };
  }
  const repo: TrendingRepository | undefined = snapshot.repositories.find(
    (r: TrendingRepository): boolean => r.full_name === repoName
  );
  if (!repo) {
    return { error: `Repository not found: ${repoName}` };
  }
  return { repo };
}

async function saveDigestAndSync(
  db: DatabaseInstance,
  date: string,
  repoName: string,
  digest: string
): Promise<boolean> {
  const updatedSnapshot: LocalSnapshot | null = updateLocalRepoDigest(date, repoName, digest, db);
  if (!updatedSnapshot) {
    return false;
  }
  return syncSnapshotToServer(date, updatedSnapshot.repositories, db);
}

function createErrorResponse(
  error: string,
  status: number
): NextResponse<ApiResponse<GenerateDigestResponseDto>> {
  return NextResponse.json<ApiResponse<GenerateDigestResponseDto>>({ success: false, error }, { status });
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<GenerateDigestResponseDto>>> {
  try {
    const { error: valErr, payload } = validatePayload(await request.json());
    if (valErr || !payload) return createErrorResponse(valErr || 'Invalid payload', 400);

    const db: DatabaseInstance = getClientDb();
    const { error: capErr, config } = verifyAiCapability(db);
    if (capErr || !config) return createErrorResponse(capErr || 'AI disabled', 403);

    const { error: findErr, repo } = findRepoInSnapshot(db, payload.snapshot_date, payload.repo_full_name);
    if (findErr || !repo) return createErrorResponse(findErr || 'Repo not found', 404);

    const { digest, provider, model } = await generateRepoDigest(config, repo);
    const synced: boolean = await saveDigestAndSync(db, payload.snapshot_date, payload.repo_full_name, digest);

    return NextResponse.json<ApiResponse<GenerateDigestResponseDto>>({
      success: true,
      data: { snapshot_date: payload.snapshot_date, repo_full_name: payload.repo_full_name, digest, provider, model, synced_with_server: synced },
    });
  } catch (err: unknown) {
    return createErrorResponse(toErrorMessage(err), 500);
  }
}
