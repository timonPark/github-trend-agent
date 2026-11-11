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
  return process.env.NODE_ENV !== 'production';
}

export function getOAuthAuthorizeUrl(
  provider: OAuthProvider,
  state: string,
  redirectUri: string
): string {
  if (isDevOAuthEnabled(provider)) {
    return `/auth/oauth-simulator?provider=${provider}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }
  if (provider === 'github') {
    const clientId: string = process.env.GITHUB_CLIENT_ID || '';
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user,user:email&state=${encodeURIComponent(state)}`;
  }
  if (provider === 'google') {
    const clientId: string = process.env.GOOGLE_CLIENT_ID || '';
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&state=${encodeURIComponent(state)}`;
  }
  throw new Error(`Unsupported OAuth provider: ${provider}`);
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
