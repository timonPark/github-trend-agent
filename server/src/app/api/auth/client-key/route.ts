import { NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';
import { toErrorMessage } from '@/lib/types/error';
import { User } from '@/lib/types';

interface ClientKeyResponse {
  client_auth_key?: string;
  error?: string;
}

function extractUserId(request: Request): string | null {
  const authHeader: string | null = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token: string = authHeader.slice(7).trim();
    const session: { userId: string; username: string } | null = verifySessionToken(token);
    if (session) {
      return session.userId;
    }
  }

  const cookieHeader: string = request.headers.get('cookie') || '';
  const match: RegExpMatchArray | null = cookieHeader.match(/gta_session=([^;]+)/);
  if (match) {
    const token: string = decodeURIComponent(match[1]);
    const session: { userId: string; username: string } | null = verifySessionToken(token);
    if (session) {
      return session.userId;
    }
  }

  return null;
}

export async function GET(request: Request): Promise<NextResponse<ClientKeyResponse>> {
  try {
    const userId: string | null = extractUserId(request);
    if (!userId) {
      return NextResponse.json<ClientKeyResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    const db: ServerDbAdapter = getServerDb();
    const user: User | null = await db.findUserById(userId);
    if (!user) {
      return NextResponse.json<ClientKeyResponse>({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json<ClientKeyResponse>({ client_auth_key: user.client_auth_key });
  } catch (err: unknown) {
    return NextResponse.json<ClientKeyResponse>({ error: toErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse<ClientKeyResponse>> {
  try {
    const userId: string | null = extractUserId(request);
    if (!userId) {
      return NextResponse.json<ClientKeyResponse>({ error: 'Unauthorized' }, { status: 401 });
    }

    const db: ServerDbAdapter = getServerDb();
    const newKey: string = await db.rotateClientAuthKey(userId);
    return NextResponse.json<ClientKeyResponse>({ client_auth_key: newKey });
  } catch (err: unknown) {
    return NextResponse.json<ClientKeyResponse>({ error: toErrorMessage(err) }, { status: 500 });
  }
}
