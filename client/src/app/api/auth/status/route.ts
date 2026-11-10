import { NextResponse } from 'next/server';
import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, getSetting, getServerAuthKey } from '@/lib/db';
import { verifyServerKey } from '@/lib/server-api';
import { toErrorMessage } from '@/lib/types/error';

interface AuthStatusPayload {
  authenticated: boolean;
  server_url?: string;
  statusCode?: number;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
}

export async function GET(_request: Request): Promise<NextResponse<AuthStatusPayload>> {
  try {
    const db: DatabaseInstance = getClientDb();
    const serverUrl: string =
      getSetting('server_url', db) || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    const serverAuthKey: string | null = getServerAuthKey(db);

    if (!serverAuthKey) {
      return NextResponse.json<AuthStatusPayload>({
        authenticated: false,
        server_url: serverUrl,
        error: '인증 키가 등록되지 않았습니다. 중앙 서버에서 발급받은 키를 등록해주세요.',
      });
    }

    const verification = await verifyServerKey(serverUrl, serverAuthKey);

    if (!verification.valid) {
      return NextResponse.json<AuthStatusPayload>(
        {
          authenticated: false,
          server_url: serverUrl,
          statusCode: verification.statusCode || 401,
          error: verification.error || '인증 키가 유효하지 않거나 만료되었습니다.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json<AuthStatusPayload>({
      authenticated: true,
      server_url: serverUrl,
      user: verification.user,
    });
  } catch (err: unknown) {
    return NextResponse.json<AuthStatusPayload>(
      {
        authenticated: false,
        error: toErrorMessage(err),
      },
      { status: 500 }
    );
  }
}
