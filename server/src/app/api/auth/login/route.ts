import { NextResponse } from 'next/server';
import { getServerDb } from '@/lib/db';
import { verifyPassword, createSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const db = getServerDb();
    const user = await db.findUserByUsername(username.trim());
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const token = createSessionToken(user.id, user.username);
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          client_auth_key: user.client_auth_key,
          created_at: user.created_at,
        },
        token,
      },
      { status: 200 }
    );

    response.cookies.set('gta_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
