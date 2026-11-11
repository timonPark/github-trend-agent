import { NextRequest, NextResponse } from 'next/server';
import { OAuthProvider, getOAuthAuthorizeUrl } from '@/lib/oauth';

const SUPPORTED_PROVIDERS: OAuthProvider[] = ['github', 'google'];

function isValidProvider(provider: string): provider is OAuthProvider {
  return SUPPORTED_PROVIDERS.includes(provider as OAuthProvider);
}

function resolveRedirectUri(req: NextRequest, provider: OAuthProvider): string {
  const host: string = req.headers.get('host') || 'localhost:4000';
  const proto: string = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}/api/auth/oauth/${provider}/callback`;
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  const { provider } = await props.params;
  if (!isValidProvider(provider)) {
    return NextResponse.json({ error: `지원하지 않는 소셜 로그인 제공자입니다: ${provider}` }, { status: 400 });
  }

  const state: string = crypto.randomUUID();
  const redirectUri: string = resolveRedirectUri(req, provider);
  const authUrl: string = getOAuthAuthorizeUrl(provider, state, redirectUri);
  const targetUrl: URL = authUrl.startsWith('http') ? new URL(authUrl) : new URL(authUrl, req.nextUrl.origin);

  const res: NextResponse = NextResponse.redirect(targetUrl, { status: 302 });
  res.cookies.set('oauth_state', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
  });
  return res;
}
