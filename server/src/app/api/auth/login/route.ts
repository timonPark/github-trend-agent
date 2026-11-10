import { NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { verifyPassword, createSessionToken } from '@/lib/auth';
import { toErrorMessage } from '@/lib/types/error';
import { User } from '@/lib/types';
import { LoginRequestDto } from '@/lib/types/api';

interface LoginResponsePayload {
  user?: {
    id: string;
    username: string;
    client_auth_key: string;
    created_at: string;
  };
  token?: string;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<LoginResponsePayload>> {
  try {
    const body: LoginRequestDto = (await request.json()) as LoginRequestDto;
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json<LoginResponsePayload>(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const db: ServerDbAdapter = getServerDb();
    const user: User | null = await db.findUserByUsername(username.trim());
    if (!user) {
      return NextResponse.json<LoginResponsePayload>(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const isMatch: boolean = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json<LoginResponsePayload>(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const token: string = createSessionToken(user.id, user.username);
    const response: NextResponse<LoginResponsePayload> = NextResponse.json<LoginResponsePayload>(
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
  } catch (err: unknown) {
    return NextResponse.json<LoginResponsePayload>(
      { error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
