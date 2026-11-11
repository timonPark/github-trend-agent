import { NextResponse } from 'next/server';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, getSetting, setSetting, getServerAuthKey, setServerAuthKey } from '@/lib/db';
import { verifyServerKey, VerifyKeyResult } from '@/lib/server-api';
import { toErrorMessage } from '@/lib/types/error';
import { saveAiConfig } from '@/lib/ai/config';
import { AiProviderType } from '@/lib/ai/types';

interface CountRow {
  cnt: number;
}

interface SettingsGetResponse {
  settings: {
    server_url: string;
    server_auth_key: string;
    client_auth_key: string;
    is_key_set: boolean;
  };
  stats: {
    snapshotCount: number;
    sessionCount: number;
    archiveCount: number;
  };
  error?: string;
}

interface SettingsPostResponse {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  verifiedUser?: {
    id: string;
    username: string;
  };
}

interface SettingsRequestBody {
  server_url?: string;
  server_auth_key?: string;
  client_auth_key?: string;
  ai_provider?: AiProviderType;
  ai_model?: string;
  ai_api_key?: string;
  verify?: boolean;
}

export async function GET(): Promise<NextResponse<SettingsGetResponse>> {
  try {
    const db: DatabaseInstance = getClientDb();
    const serverUrl: string =
      getSetting('server_url', db) || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    const serverAuthKey: string = getServerAuthKey(db) || '';

    const snapRow: CountRow | undefined = db
      .prepare('SELECT COUNT(*) as cnt FROM local_snapshots')
      .get() as CountRow | undefined;
    const sessRow: CountRow | undefined = db
      .prepare('SELECT COUNT(*) as cnt FROM discussion_sessions')
      .get() as CountRow | undefined;
    const archRow: CountRow | undefined = db
      .prepare('SELECT COUNT(*) as cnt FROM local_archives')
      .get() as CountRow | undefined;

    const snapshotCount: number = snapRow?.cnt || 0;
    const sessionCount: number = sessRow?.cnt || 0;
    const archiveCount: number = archRow?.cnt || 0;

    return NextResponse.json<SettingsGetResponse>({
      settings: {
        server_url: serverUrl,
        server_auth_key: serverAuthKey,
        client_auth_key: serverAuthKey,
        is_key_set: Boolean(serverAuthKey),
      },
      stats: {
        snapshotCount,
        sessionCount,
        archiveCount,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json<SettingsGetResponse>(
      {
        settings: { server_url: '', server_auth_key: '', client_auth_key: '', is_key_set: false },
        stats: { snapshotCount: 0, sessionCount: 0, archiveCount: 0 },
        error: toErrorMessage(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<SettingsPostResponse>> {
  try {
    const body: SettingsRequestBody = (await request.json()) as SettingsRequestBody;
    const {
      server_url,
      server_auth_key,
      client_auth_key,
      ai_provider,
      ai_model,
      ai_api_key,
      verify = true,
    } = body;

    const db: DatabaseInstance = getClientDb();

    if (server_url && typeof server_url === 'string') {
      setSetting('server_url', server_url.trim(), db);
    }

    if (ai_provider !== undefined || ai_model !== undefined || ai_api_key !== undefined) {
      saveAiConfig(
        {
          provider: ai_provider,
          model: ai_model,
          apiKey: ai_api_key,
        },
        db
      );
    }

    const targetUrl: string = server_url
      ? server_url.trim()
      : getSetting('server_url', db) || 'http://localhost:4000';

    const inputKey: string | undefined = server_auth_key !== undefined ? server_auth_key : client_auth_key;

    if (inputKey !== undefined && typeof inputKey === 'string') {
      const trimmedKey: string = inputKey.trim();

      let verification: VerifyKeyResult = { valid: true };
      if (verify && trimmedKey.length > 0) {
        verification = await verifyServerKey(targetUrl, trimmedKey);
        if (!verification.valid) {
          return NextResponse.json<SettingsPostResponse>(
            {
              success: false,
              statusCode: 401,
              error: verification.error || '중앙 서버 인증에 실패했습니다. 키를 다시 확인해주세요.',
            },
            { status: 400 }
          );
        }
      }

      setServerAuthKey(trimmedKey, db);

      return NextResponse.json<SettingsPostResponse>({
        success: true,
        message: '설정이 성공적으로 저장되었습니다. 로컬 데이터는 모두 안전하게 유지됩니다.',
        verifiedUser: verification.user,
      });
    }

    return NextResponse.json<SettingsPostResponse>({ success: true, message: '설정이 저장되었습니다.' });
  } catch (err: unknown) {
    return NextResponse.json<SettingsPostResponse>(
      { success: false, error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
