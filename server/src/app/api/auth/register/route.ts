import { NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { hashPassword, createSessionToken } from '@/lib/auth';
import { toErrorMessage } from '@/lib/types/error';
import { User } from '@/lib/types';
import { RegisterRequestDto } from '@/lib/types/api';

interface AuthResponsePayload {
  user?: {
    id: string;
    username: string;
    client_auth_key: string;
    created_at: string;
  };
  token?: string;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<AuthResponsePayload>> {
  try {
    const body: RegisterRequestDto = (await request.json()) as RegisterRequestDto;
    const { username, password } = body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json<AuthResponsePayload>(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json<AuthResponsePayload>(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const db: ServerDbAdapter = getServerDb();
    const existing: User | null = await db.findUserByUsername(username.trim());
    if (existing) {
      return NextResponse.json<AuthResponsePayload>(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    const passwordHash: string = hashPassword(password);
    const user: User = await db.createUser(username.trim(), passwordHash);
    const token: string = createSessionToken(user.id, user.username);

    const response: NextResponse<AuthResponsePayload> = NextResponse.json<AuthResponsePayload>(
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
  } catch (err: unknown) {
    return NextResponse.json<AuthResponsePayload>(
      { error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
