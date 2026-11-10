import { NextResponse } from 'next/server';
import { getServerDb } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

function extractUserId(request: Request): string | null {
  // Check Authorization Bearer header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = verifySessionToken(token);
    if (session) return session.userId;
  }

  // Check cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/gta_session=([^;]+)/);
  if (match) {
    const token = decodeURIComponent(match[1]);
    const session = verifySessionToken(token);
    if (session) return session.userId;
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const userId = extractUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getServerDb();
    const user = await db.findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ client_auth_key: user.client_auth_key });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = extractUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getServerDb();
    const newKey = await db.rotateClientAuthKey(userId);
    return NextResponse.json({ client_auth_key: newKey });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
