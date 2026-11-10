import { NextResponse } from 'next/server';
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
import { Database as DatabaseInstance } from 'better-sqlite3';

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<GenerateDigestResponseDto>>> {
  try {
    const body: GenerateDigestRequestDto = (await request.json()) as GenerateDigestRequestDto;
    const { snapshot_date, repo_full_name } = body;

    if (!snapshot_date || !repo_full_name) {
      return NextResponse.json<ApiResponse<GenerateDigestResponseDto>>(
        {
          success: false,
          error: 'Invalid payload: snapshot_date and repo_full_name are required',
        },
        { status: 400 }
      );
    }

    const db: DatabaseInstance = getClientDb();
    const config: AiAgentConfig = getAiConfig(db);
    const capability: CapabilityGateStatusDto = checkAiCapability(config);

    if (!capability.enabled) {
      return NextResponse.json<ApiResponse<GenerateDigestResponseDto>>(
        {
          success: false,
          error: capability.reason || 'AI capability is disabled',
        },
        { status: 403 }
      );
    }

    const snapshot: LocalSnapshot | null = getLocalSnapshot(snapshot_date, db);
    if (!snapshot) {
      return NextResponse.json<ApiResponse<GenerateDigestResponseDto>>(
        {
          success: false,
          error: `Snapshot not found for date ${snapshot_date}`,
        },
        { status: 404 }
      );
    }

    const repo: TrendingRepository | undefined = snapshot.repositories.find(
      (r: TrendingRepository): boolean => r.full_name === repo_full_name
    );
    if (!repo) {
      return NextResponse.json<ApiResponse<GenerateDigestResponseDto>>(
        {
          success: false,
          error: `Repository not found: ${repo_full_name}`,
        },
        { status: 404 }
      );
    }

    // Generate 3-line digest using the configured local AI runner
    const { digest, provider, model } = await generateRepoDigest(config, repo);

    // Save digest to local SQLite
    const updatedSnapshot: LocalSnapshot | null = updateLocalRepoDigest(
      snapshot_date,
      repo_full_name,
      digest,
      db
    );

    // Attempt to sync with central server in background / best-effort
    let syncedWithServer: boolean = false;
    if (updatedSnapshot) {
      syncedWithServer = await syncSnapshotToServer(snapshot_date, updatedSnapshot.repositories, db);
    }

    return NextResponse.json<ApiResponse<GenerateDigestResponseDto>>(
      {
        success: true,
        data: {
          snapshot_date,
          repo_full_name,
          digest,
          provider,
          model,
          synced_with_server: syncedWithServer,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse<GenerateDigestResponseDto>>(
      {
        success: false,
        error: toErrorMessage(err),
      },
      { status: 500 }
    );
  }
}
