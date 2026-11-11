import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { resetServerDbForTest, getServerDb, ServerDbAdapter } from '../src/lib/db';
import {
  isDevOAuthEnabled,
  getOAuthAuthorizeUrl,
  exchangeOAuthCodeForProfile,
  getOrCreateOAuthUser,
  OAuthProfile,
} from '../src/lib/oauth';
import { GET as oauthAuthorizeHandler } from '../src/app/api/auth/oauth/[provider]/route';
import { GET as oauthCallbackHandler } from '../src/app/api/auth/oauth/[provider]/callback/route';
import { User } from '../src/lib/types';
import { verifySessionToken } from '../src/lib/auth';

describe('OAuth GitHub & Google Integration (#51)', (): void => {
  beforeEach((): void => {
    resetServerDbForTest();
  });

  describe('OAuth Helper & Simulator Logic', (): void => {
    it('detects dev oauth mode when client credentials are missing', (): void => {
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_ID;
      expect(isDevOAuthEnabled('github')).toBe(true);
      expect(isDevOAuthEnabled('google')).toBe(true);
    });

    it('generates simulator url in dev mode', (): void => {
      const url: string = getOAuthAuthorizeUrl('github', 'random-state-123', 'http://localhost:4000/callback');
      expect(url).toContain('/auth/oauth-simulator');
      expect(url).toContain('provider=github');
      expect(url).toContain('state=random-state-123');
    });

    it('exchanges dev mock code for profile', async (): Promise<void> => {
      const ghProfile: OAuthProfile = await exchangeOAuthCodeForProfile('github', 'dev-mock-octocat', 'http://localhost:4000/callback');
      expect(ghProfile.provider).toBe('github');
      expect(ghProfile.id).toBe('gh_octocat');
      expect(ghProfile.username).toBe('gh_octocat');
      expect(ghProfile.email).toContain('@github.mock');

      const googleProfile: OAuthProfile = await exchangeOAuthCodeForProfile('google', 'dev-mock-tester', 'http://localhost:4000/callback');
      expect(googleProfile.provider).toBe('google');
      expect(googleProfile.id).toBe('google_tester');
      expect(googleProfile.username).toBe('google_tester');
      expect(googleProfile.email).toContain('@google.mock');
    });

    it('creates a new user and returns existing user on subsequent logins', async (): Promise<void> => {
      const db: ServerDbAdapter = getServerDb();
      const profile: OAuthProfile = {
        provider: 'github',
        id: '123456',
        username: 'octocat',
        email: 'octocat@github.com',
      };

      const newUser: User = await getOrCreateOAuthUser(db, profile);
      expect(newUser.username).toBe('octocat');
      expect(newUser.oauth_provider).toBe('github');
      expect(newUser.oauth_id).toBe('123456');
      expect(newUser.client_auth_key).toMatch(/^gta_live_/);
      expect(newUser.terms_agreed_at).toBeDefined();

      const existingUser: User = await getOrCreateOAuthUser(db, profile);
      expect(existingUser.id).toBe(newUser.id);
      expect(existingUser.client_auth_key).toBe(newUser.client_auth_key);
    });

    it('resolves duplicate username conflicts automatically', async (): Promise<void> => {
      const db: ServerDbAdapter = getServerDb();
      await db.createUser('octocat', 'hashedpw123', undefined, 'existing@example.com');

      const profile: OAuthProfile = {
        provider: 'github',
        id: '999999',
        username: 'octocat',
        email: 'new_octocat@github.com',
      };

      const user: User = await getOrCreateOAuthUser(db, profile);
      expect(user.username).toBe('octocat_1');
      expect(user.oauth_id).toBe('999999');
    });
  });

  describe('OAuth API Routes', (): void => {
    it('redirects to authorize url on GET /api/auth/oauth/[provider]', async (): Promise<void> => {
      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/github');
      const res: Response = await oauthAuthorizeHandler(req, {
        params: Promise.resolve({ provider: 'github' }),
      });
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toContain('/auth/oauth-simulator');
      expect(res.headers.get('set-cookie')).toContain('oauth_state=');
    });

    it('rejects unsupported provider on GET /api/auth/oauth/invalid', async (): Promise<void> => {
      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/facebook');
      const res: Response = await oauthAuthorizeHandler(req, {
        params: Promise.resolve({ provider: 'facebook' }),
      });
      expect(res.status).toBe(400);
      const data: { error: string } = (await res.json()) as { error: string };
      expect(data.error).toContain('지원하지 않는');
    });

    it('handles GitHub callback and issues session cookie', async (): Promise<void> => {
      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/github/callback?code=dev-mock-sam&state=abc');
      const res: Response = await oauthCallbackHandler(req, {
        params: Promise.resolve({ provider: 'github' }),
      });
      expect(res.status).toBe(200);
      const html: string = await res.text();
      expect(html).toContain('GTA_OAUTH_SUCCESS');
      expect(html).toContain('gh_sam');

      const cookieHeader: string | null = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('gta_session=');

      const db: ServerDbAdapter = getServerDb();
      const user: User | null = await db.findUserByOAuth('github', 'gh_sam');
      expect(user).not.toBeNull();
      expect(user?.username).toBe('gh_sam');
      expect(user?.client_auth_key).toMatch(/^gta_live_/);
    });

    it('handles Google callback and verifies session token validity', async (): Promise<void> => {
      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/google/callback?code=dev-mock-gtest&state=abc');
      const res: Response = await oauthCallbackHandler(req, {
        params: Promise.resolve({ provider: 'google' }),
      });
      expect(res.status).toBe(200);

      const db: ServerDbAdapter = getServerDb();
      const user: User | null = await db.findUserByOAuth('google', 'google_gtest');
      expect(user).not.toBeNull();

      const cookieHeader: string | null = res.headers.get('set-cookie');
      const tokenMatch: RegExpMatchArray | null = cookieHeader ? cookieHeader.match(/gta_session=([^;]+)/) : null;
      expect(tokenMatch).not.toBeNull();
      const token: string = tokenMatch![1];
      const verified = verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(user?.id);
    });
  });
});
