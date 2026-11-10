import { NextResponse } from 'next/server';
import { getServerDb } from '@/lib/db';
import { hashPassword, createSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const db = getServerDb();
    const existing = await db.findUserByUsername(username.trim());
    if (existing) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const user = await db.createUser(username.trim(), passwordHash);
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
      { status: 201 }
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
