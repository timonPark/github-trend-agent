import { NextRequest, NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { createSessionToken, createOAuthOnboardingToken } from '@/lib/auth';
import { OAuthProvider, exchangeOAuthCodeForProfile, OAuthProfile } from '@/lib/oauth';
import { User } from '@/lib/types';
import { toErrorMessage } from '@/lib/types/error';

function resolveRedirectUri(req: NextRequest, provider: OAuthProvider): string {
  const host: string = req.headers.get('host') || 'localhost:4000';
  const proto: string = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}/api/auth/oauth/${provider}/callback`;
}

function buildSuccessHtml(user: User, token: string): string {
  const safeUser: string = JSON.stringify({
    id: user.id,
    username: user.username,
    email: user.email,
    client_auth_key: user.client_auth_key,
  });
  return `<!DOCTYPE html><html><body><script>
    if (window.opener) {
      window.opener.postMessage({ type: 'GTA_OAUTH_SUCCESS', user: ${safeUser}, token: ${JSON.stringify(token)} }, '*');
      window.close();
    } else {
      window.location.href = '/';
    }
  </script><p>로그인 완료 중입니다. 잠시만 기다려주세요...</p></body></html>`;
}

function buildErrorHtml(message: string): string {
  return `<!DOCTYPE html><html><body><script>
    if (window.opener) {
      window.opener.postMessage({ type: 'GTA_OAUTH_ERROR', error: ${JSON.stringify(message)} }, '*');
      window.close();
    } else {
      alert(${JSON.stringify(message)});
      window.location.href = '/';
    }
  </script><p>오류가 발생했습니다: ${message}</p></body></html>`;
}

function handleExistingUserLogin(user: User): NextResponse {
  const token: string = createSessionToken(user.id, user.username);
  const res: NextResponse = new NextResponse(buildSuccessHtml(user, token), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
  res.cookies.set('gta_session', token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 });
  return res;
}

function handleNewUserOnboarding(req: NextRequest, profile: OAuthProfile): NextResponse {
  const onboardingToken: string = createOAuthOnboardingToken({
    provider: profile.provider,
    oauth_id: profile.id,
    suggested_username: profile.username,
    email: profile.email,
  });
  const onboardingUrl: URL = new URL('/oauth/onboarding', req.nextUrl.origin);
  onboardingUrl.searchParams.set('token', onboardingToken);
  return NextResponse.redirect(onboardingUrl, { status: 302 });
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  const { provider } = await props.params;
  const code: string | null = req.nextUrl.searchParams.get('code');
  if (!code) {
    return new NextResponse(buildErrorHtml('인증 코드가 누락되었습니다.'), { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  try {
    const db: ServerDbAdapter = getServerDb();
    const redirectUri: string = resolveRedirectUri(req, provider as OAuthProvider);
    const profile: OAuthProfile = await exchangeOAuthCodeForProfile(provider as OAuthProvider, code, redirectUri);
    const existingUser: User | null = await db.findUserByOAuth(provider as OAuthProvider, profile.id);
    if (existingUser) {
      return handleExistingUserLogin(existingUser);
    }
    return handleNewUserOnboarding(req, profile);
  } catch (err: unknown) {
    return new NextResponse(buildErrorHtml(toErrorMessage(err)), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}
