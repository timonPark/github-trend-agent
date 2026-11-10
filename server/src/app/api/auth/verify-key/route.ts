import { NextResponse } from 'next/server';
import { authenticateClientKey } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    let key: string | null = null;

    // 1. Try Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      key = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    }

    // 2. Try JSON body if not in header
    if (!key) {
      try {
        const body = await request.json();
        if (body && typeof body.client_auth_key === 'string') {
          key = body.client_auth_key.trim();
        }
      } catch {
        // Body might be empty, ignore
      }
    }

    if (!key) {
      return NextResponse.json(
        { valid: false, error: 'Client authentication key is required' },
        { status: 401 }
      );
    }

    const user = await authenticateClientKey(key);
    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired client authentication key' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
