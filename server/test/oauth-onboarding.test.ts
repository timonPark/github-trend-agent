import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { resetServerDbForTest, getServerDb, ServerDbAdapter } from '../src/lib/db';
import {
  createOAuthOnboardingToken,
  verifyOAuthOnboardingToken,
} from '../src/lib/auth';
import { OAuthOnboardingTicket } from '../src/lib/types/api';
import { GET as checkUsernameHandler } from '../src/app/api/auth/check-username/route';
import { POST as onboardingHandler } from '../src/app/api/auth/oauth/onboarding/route';
import { GET as oauthCallbackHandler } from '../src/app/api/auth/oauth/[provider]/callback/route';
import { User } from '../src/lib/types';

describe('OAuth Onboarding Flow (#54)', (): void => {
  beforeEach((): void => {
    resetServerDbForTest();
  });

  describe('OAuth Onboarding Token Utility', (): void => {
    it('creates and verifies a valid onboarding token', (): void => {
      const ticket: OAuthOnboardingTicket = {
        provider: 'github',
        oauth_id: 'gh_12345',
        suggested_username: 'octocat_dev',
        email: 'octo@github.com',
      };
      const token: string = createOAuthOnboardingToken(ticket);
      expect(typeof token).toBe('string');

      const verified: OAuthOnboardingTicket | null = verifyOAuthOnboardingToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.provider).toBe('github');
      expect(verified?.oauth_id).toBe('gh_12345');
      expect(verified?.suggested_username).toBe('octocat_dev');
      expect(verified?.email).toBe('octo@github.com');
    });

    it('rejects tampered or malformed onboarding tokens', (): void => {
      const ticket: OAuthOnboardingTicket = {
        provider: 'google',
        oauth_id: 'google_777',
        suggested_username: 'googler',
        email: 'googler@gmail.com',
      };
      const token: string = createOAuthOnboardingToken(ticket);
      const tampered: string = token.slice(0, 10) + 'X' + token.slice(11);
      expect(verifyOAuthOnboardingToken(tampered)).toBeNull();
      expect(verifyOAuthOnboardingToken('invalid.token.structure')).toBeNull();
    });
  });

  describe('GET /api/auth/check-username', (): void => {
    it('returns available: true for unused username', async (): Promise<void> => {
      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/check-username?username=fresh_coder');
      const res: Response = await checkUsernameHandler(req);
      expect(res.status).toBe(200);
      const data: { available: boolean } = (await res.json()) as { available: boolean };
      expect(data.available).toBe(true);
    });

    it('returns available: false when username already exists', async (): Promise<void> => {
      const db: ServerDbAdapter = getServerDb();
      await db.createUser('existing_user', 'hashed_pass_123');

      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/check-username?username=existing_user');
      const res: Response = await checkUsernameHandler(req);
      expect(res.status).toBe(200);
      const data: { available: boolean; message?: string } = (await res.json()) as { available: boolean; message?: string };
      expect(data.available).toBe(false);
      expect(data.message).toBeDefined();
    });

    it('returns 400 for invalid username formats', async (): Promise<void> => {
      const reqShort: NextRequest = new NextRequest('http://localhost:4000/api/auth/check-username?username=ab');
      const resShort: Response = await checkUsernameHandler(reqShort);
      expect(resShort.status).toBe(400);

      const reqEmpty: NextRequest = new NextRequest('http://localhost:4000/api/auth/check-username?username=');
      const resEmpty: Response = await checkUsernameHandler(reqEmpty);
      expect(resEmpty.status).toBe(400);
    });
  });

  describe('Social Callback Redirection to Onboarding for New Users', (): void => {
    it('redirects new social users to /oauth/onboarding with token', async (): Promise<void> => {
      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/github/callback?code=dev-mock-newbiesocial');
      const res: Response = await oauthCallbackHandler(req, {
        params: Promise.resolve({ provider: 'github' }),
      });
      expect(res.status).toBe(302);
      const location: string | null = res.headers.get('location');
      expect(location).toContain('/oauth/onboarding');
      expect(location).toContain('token=');
    });

    it('immediately logs in existing social users without onboarding redirect', async (): Promise<void> => {
      const db: ServerDbAdapter = getServerDb();
      await db.createOAuthUser({
        username: 'existing_socialite',
        oauth_provider: 'github',
        oauth_id: 'gh_existinguser',
        email: 'social@example.com',
      });

      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/github/callback?code=dev-mock-existinguser');
      const res: Response = await oauthCallbackHandler(req, {
        params: Promise.resolve({ provider: 'github' }),
      });
      expect(res.status).toBe(200);
      const html: string = await res.text();
      expect(html).toContain('GTA_OAUTH_SUCCESS');
      expect(res.headers.get('set-cookie')).toContain('gta_session=');
    });
  });

  describe('POST /api/auth/oauth/onboarding', (): void => {
    it('completes onboarding and creates oauth user with client key and session', async (): Promise<void> => {
      const ticket: OAuthOnboardingTicket = {
        provider: 'naver',
        oauth_id: 'naver_1001',
        suggested_username: 'naver_suggested',
        email: 'naver_user@naver.com',
      };
      const token: string = createOAuthOnboardingToken(ticket);

      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboarding_token: token,
          username: 'my_custom_nickname',
          email: 'custom_email@naver.com',
          terms_agreed: true,
        }),
      });

      const res: Response = await onboardingHandler(req);
      expect(res.status).toBe(200);
      const data: { user: User; token: string } = (await res.json()) as { user: User; token: string };
      expect(data.user.username).toBe('my_custom_nickname');
      expect(data.user.email).toBe('custom_email@naver.com');
      expect(data.user.oauth_provider).toBe('naver');
      expect(data.user.oauth_id).toBe('naver_1001');
      expect(data.user.client_auth_key).toMatch(/^gta_live_/);
      expect(data.user.terms_agreed_at).toBeDefined();
      expect(res.headers.get('set-cookie')).toContain('gta_session=');

      // Verify in DB
      const db: ServerDbAdapter = getServerDb();
      const userInDb: User | null = await db.findUserByUsername('my_custom_nickname');
      expect(userInDb).not.toBeNull();
      expect(userInDb?.oauth_id).toBe('naver_1001');
    });

    it('blocks onboarding when username is already taken', async (): Promise<void> => {
      const db: ServerDbAdapter = getServerDb();
      await db.createUser('taken_nick', 'hashed_pass');

      const ticket: OAuthOnboardingTicket = {
        provider: 'kakao',
        oauth_id: 'kakao_2002',
        suggested_username: 'kakao_user',
        email: 'k@kakao.com',
      };
      const token: string = createOAuthOnboardingToken(ticket);

      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboarding_token: token,
          username: 'taken_nick',
          email: 'k@kakao.com',
          terms_agreed: true,
        }),
      });

      const res: Response = await onboardingHandler(req);
      expect(res.status).toBe(409);
    });

    it('rejects onboarding without terms agreement', async (): Promise<void> => {
      const ticket: OAuthOnboardingTicket = {
        provider: 'google',
        oauth_id: 'g_3003',
        suggested_username: 'g_user',
        email: 'g@gmail.com',
      };
      const token: string = createOAuthOnboardingToken(ticket);

      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboarding_token: token,
          username: 'valid_nick_123',
          terms_agreed: false,
        }),
      });

      const res: Response = await onboardingHandler(req);
      expect(res.status).toBe(400);
    });
  });
});
