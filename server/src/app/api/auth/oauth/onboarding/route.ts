import { NextRequest, NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { createSessionToken, verifyOAuthOnboardingToken } from '@/lib/auth';
import { OAuthOnboardingRequestDto, OAuthOnboardingResponseDto, OAuthOnboardingTicket } from '@/lib/types/api';
import { User } from '@/lib/types';
import { toErrorMessage } from '@/lib/types/error';

const USERNAME_REGEX: RegExp = /^[a-zA-Z0-9_-]{3,30}$/;

function validateOnboardingInput(body: OAuthOnboardingRequestDto, ticket: OAuthOnboardingTicket | null): string | null {
  if (!ticket) return '유효하지 않거나 만료된 온보딩 세션입니다.';
  if (!body.terms_agreed) return '서비스 이용약관 및 개인정보 수집에 동의해야 합니다.';
  const trimmedUser: string = (body.username || '').trim();
  if (!USERNAME_REGEX.test(trimmedUser)) {
    return '아이디는 3~30자의 영문, 숫자, 밑줄(_), 하이픈(-)만 가능합니다.';
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: OAuthOnboardingRequestDto = (await req.json()) as OAuthOnboardingRequestDto;
    const ticket: OAuthOnboardingTicket | null = verifyOAuthOnboardingToken(body.onboarding_token || '');
    const validationError: string | null = validateOnboardingInput(body, ticket);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const cleanUsername: string = body.username.trim();
    const db: ServerDbAdapter = getServerDb();
    if (await db.findUserByUsername(cleanUsername)) {
      return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 409 });
    }

    const user: User = await db.createOAuthUser({
      username: cleanUsername,
      oauth_provider: ticket!.provider,
      oauth_id: ticket!.oauth_id,
      email: body.email ? body.email.trim() : ticket!.email || undefined,
      terms_agreed_at: new Date().toISOString(),
    });

    const token: string = createSessionToken(user.id, user.username);
    const res: NextResponse<OAuthOnboardingResponseDto> = NextResponse.json({ user, token }, { status: 200 });
    res.cookies.set('gta_session', token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: toErrorMessage(err) }, { status: 500 });
  }
}
