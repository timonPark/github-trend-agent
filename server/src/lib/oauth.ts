import { ServerDbAdapter } from './db';
import { User } from './types';

export type OAuthProvider = 'github' | 'google' | 'kakao' | 'naver';

export interface OAuthProfile {
  provider: OAuthProvider;
  id: string;
  username: string;
  email: string | null;
}

export interface OAuthConfig {
  clientId?: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

export function isDevOAuthEnabled(provider: OAuthProvider): boolean {
  if (process.env.ENABLE_DEV_OAUTH === 'true') return true;
  if (provider === 'github') return !process.env.GITHUB_CLIENT_ID;
  if (provider === 'google') return !process.env.GOOGLE_CLIENT_ID;
  if (provider === 'kakao') return !process.env.KAKAO_CLIENT_ID;
  if (provider === 'naver') return !process.env.NAVER_CLIENT_ID;
  return process.env.NODE_ENV !== 'production';
}

function getProductionAuthorizeUrl(
  provider: OAuthProvider,
  state: string,
  redirectUri: string
): string {
  const encState: string = encodeURIComponent(state);
  const encRedirect: string = encodeURIComponent(redirectUri);
  if (provider === 'github') {
    const id: string = process.env.GITHUB_CLIENT_ID || '';
    return `https://github.com/login/oauth/authorize?client_id=${id}&redirect_uri=${encRedirect}&scope=read:user,user:email&state=${encState}`;
  }
  if (provider === 'google') {
    const id: string = process.env.GOOGLE_CLIENT_ID || '';
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${id}&redirect_uri=${encRedirect}&response_type=code&scope=openid%20profile%20email&state=${encState}`;
  }
  if (provider === 'kakao') {
    const id: string = process.env.KAKAO_CLIENT_ID || '';
    return `https://kauth.kakao.com/oauth/authorize?client_id=${id}&redirect_uri=${encRedirect}&response_type=code&state=${encState}`;
  }
  if (provider === 'naver') {
    const id: string = process.env.NAVER_CLIENT_ID || '';
    return `https://nid.naver.com/oauth2.0/authorize?client_id=${id}&redirect_uri=${encRedirect}&response_type=code&state=${encState}`;
  }
  throw new Error(`Unsupported OAuth provider: ${provider}`);
}

export function getOAuthAuthorizeUrl(
  provider: OAuthProvider,
  state: string,
  redirectUri: string
): string {
  if (isDevOAuthEnabled(provider)) {
    return `/auth/oauth-simulator?provider=${provider}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }
  return getProductionAuthorizeUrl(provider, state, redirectUri);
}

function getMockProfile(provider: OAuthProvider, code: string): OAuthProfile {
  const customIdMatch: RegExpMatchArray | null = code.match(/dev-mock-(?:code-)?([a-zA-Z0-9_-]+)/);
  const suffix: string = customIdMatch ? customIdMatch[1] : 'user';
  if (provider === 'github') {
    return { provider: 'github', id: `gh_${suffix}`, username: `gh_${suffix}`, email: `${suffix}@github.mock` };
  }
  if (provider === 'google') {
    return { provider: 'google', id: `google_${suffix}`, username: `google_${suffix}`, email: `${suffix}@google.mock` };
  }
  return { provider, id: `${provider}_${suffix}`, username: `${provider}_${suffix}`, email: `${suffix}@${provider}.mock` };
}

async function exchangeGitHubToken(code: string, redirectUri: string): Promise<string> {
  const res: Response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data: { access_token?: string; error?: string } = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) throw new Error(data.error || 'Failed to exchange GitHub access token');
  return data.access_token;
}

async function fetchGitHubProfile(accessToken: string): Promise<OAuthProfile> {
  const userRes: Response = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
  });
  const userData: { id: number; login: string; email?: string | null } = (await userRes.json()) as { id: number; login: string; email?: string | null };
  return {
    provider: 'github',
    id: String(userData.id),
    username: userData.login,
    email: userData.email || null,
  };
}

async function exchangeGoogleToken(code: string, redirectUri: string): Promise<string> {
  const res: Response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });
  const data: { access_token?: string; error?: string } = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) throw new Error(data.error || 'Failed to exchange Google access token');
  return data.access_token;
}

async function fetchGoogleProfile(accessToken: string): Promise<OAuthProfile> {
  const userRes: Response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data: { sub: string; email?: string; name?: string } = (await userRes.json()) as { sub: string; email?: string; name?: string };
  const username: string = data.email ? data.email.split('@')[0] : `google_${data.sub.slice(0, 8)}`;
  return {
    provider: 'google',
    id: data.sub,
    username,
    email: data.email || null,
  };
}

async function exchangeKakaoToken(code: string, redirectUri: string): Promise<string> {
  const body: URLSearchParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.KAKAO_CLIENT_ID || '',
    redirect_uri: redirectUri,
    code,
  });
  if (process.env.KAKAO_CLIENT_SECRET) {
    body.set('client_secret', process.env.KAKAO_CLIENT_SECRET);
  }
  const res: Response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: body.toString(),
  });
  const data: { access_token?: string; error?: string } = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) throw new Error(data.error || 'Failed to exchange Kakao access token');
  return data.access_token;
}

interface KakaoUserResponse {
  id: number;
  properties?: { nickname?: string };
  kakao_account?: { email?: string; profile?: { nickname?: string } };
}

async function fetchKakaoProfile(accessToken: string): Promise<OAuthProfile> {
  const res: Response = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data: KakaoUserResponse = (await res.json()) as KakaoUserResponse;
  const username: string = data.properties?.nickname || data.kakao_account?.profile?.nickname || `kakao_${data.id}`;
  return {
    provider: 'kakao',
    id: String(data.id),
    username,
    email: data.kakao_account?.email || null,
  };
}

async function exchangeNaverToken(code: string, redirectUri: string): Promise<string> {
  const params: URLSearchParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.NAVER_CLIENT_ID || '',
    client_secret: process.env.NAVER_CLIENT_SECRET || '',
    code,
  });
  const res: Response = await fetch(`https://nid.naver.com/oauth2.0/token?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const data: { access_token?: string; error?: string } = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) throw new Error(data.error || 'Failed to exchange Naver access token');
  return data.access_token;
}

interface NaverUserResponse {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
  };
}

async function fetchNaverProfile(accessToken: string): Promise<OAuthProfile> {
  const res: Response = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data: NaverUserResponse = (await res.json()) as NaverUserResponse;
  const username: string = data.response.nickname || data.response.name || `naver_${data.response.id.slice(0, 8)}`;
  return {
    provider: 'naver',
    id: data.response.id,
    username,
    email: data.response.email || null,
  };
}

export async function exchangeOAuthCodeForProfile(
  provider: OAuthProvider,
  code: string,
  redirectUri: string
): Promise<OAuthProfile> {
  if (code.startsWith('dev-mock') || isDevOAuthEnabled(provider)) {
    return getMockProfile(provider, code);
  }
  if (provider === 'github') {
    const token: string = await exchangeGitHubToken(code, redirectUri);
    return fetchGitHubProfile(token);
  }
  if (provider === 'google') {
    const token: string = await exchangeGoogleToken(code, redirectUri);
    return fetchGoogleProfile(token);
  }
  if (provider === 'kakao') {
    const token: string = await exchangeKakaoToken(code, redirectUri);
    return fetchKakaoProfile(token);
  }
  if (provider === 'naver') {
    const token: string = await exchangeNaverToken(code, redirectUri);
    return fetchNaverProfile(token);
  }
  throw new Error(`Provider ${provider} is not supported yet`);
}

async function generateUniqueUsername(db: ServerDbAdapter, baseUsername: string): Promise<string> {
  let candidate: string = baseUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (candidate.length < 3) candidate = `user_${candidate}`;
  let count: number = 1;
  while (await db.findUserByUsername(candidate)) {
    candidate = `${baseUsername}_${count}`;
    count++;
  }
  return candidate;
}

export async function getOrCreateOAuthUser(
  db: ServerDbAdapter,
  profile: OAuthProfile
): Promise<User> {
  const existingUser: User | null = await db.findUserByOAuth(profile.provider, profile.id);
  if (existingUser) return existingUser;

  const uniqueUsername: string = await generateUniqueUsername(db, profile.username);
  const termsAgreedAt: string = new Date().toISOString();
  return db.createOAuthUser({
    username: uniqueUsername,
    oauth_provider: profile.provider,
    oauth_id: profile.id,
    email: profile.email || undefined,
    terms_agreed_at: termsAgreedAt,
  });
}
