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
    terms_agreed_at?: string | null;
    created_at: string;
  };
  token?: string;
  error?: string;
}

function validateRegisterInput(body: RegisterRequestDto): string | null {
  const { username, password, terms_agreed } = body;
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return 'Username must be at least 3 characters long';
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  if (!terms_agreed) {
    return '이용약관 및 개인정보 수집·이용에 동의해야 합니다.';
  }
  return null;
}

function createAuthCookieResponse(user: User, token: string): NextResponse<AuthResponsePayload> {
  const response: NextResponse<AuthResponsePayload> = NextResponse.json<AuthResponsePayload>(
    {
      user: {
        id: user.id,
        username: user.username,
        client_auth_key: user.client_auth_key,
        terms_agreed_at: user.terms_agreed_at,
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
}

export async function POST(request: Request): Promise<NextResponse<AuthResponsePayload>> {
  try {
    const body: RegisterRequestDto = (await request.json()) as RegisterRequestDto;
    const validationError: string | null = validateRegisterInput(body);
    if (validationError) {
      return NextResponse.json<AuthResponsePayload>({ error: validationError }, { status: 400 });
    }

    const db: ServerDbAdapter = getServerDb();
    const existing: User | null = await db.findUserByUsername(body.username.trim());
    if (existing) {
      return NextResponse.json<AuthResponsePayload>({ error: 'Username is already taken' }, { status: 409 });
    }

    const passwordHash: string = hashPassword(body.password as string);
    const termsAgreedAt: string = new Date().toISOString();
    const user: User = await db.createUser(body.username.trim(), passwordHash, undefined, body.email?.trim(), termsAgreedAt);
    const token: string = createSessionToken(user.id, user.username);

    return createAuthCookieResponse(user, token);
  } catch (err: unknown) {
    return NextResponse.json<AuthResponsePayload>({ error: toErrorMessage(err) }, { status: 500 });
  }
}
