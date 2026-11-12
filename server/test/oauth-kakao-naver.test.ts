import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

describe('OAuth Kakao & Naver Integration (#52)', (): void => {
  beforeEach((): void => {
    resetServerDbForTest();
    delete process.env.KAKAO_CLIENT_ID;
    delete process.env.NAVER_CLIENT_ID;
    delete process.env.ENABLE_DEV_OAUTH;
  });

  afterEach((): void => {
    vi.restoreAllMocks();
  });

  describe('OAuth Helper & Dev Simulator Logic', (): void => {
    it('detects dev oauth mode for kakao and naver when client credentials are missing', (): void => {
      delete process.env.KAKAO_CLIENT_ID;
      delete process.env.NAVER_CLIENT_ID;
      expect(isDevOAuthEnabled('kakao')).toBe(true);
      expect(isDevOAuthEnabled('naver')).toBe(true);
    });

    it('generates dev simulator url for kakao and naver', (): void => {
      const kakaoUrl: string = getOAuthAuthorizeUrl('kakao', 'state-kakao-123', 'http://localhost:4000/callback');
      expect(kakaoUrl).toContain('/auth/oauth-simulator');
      expect(kakaoUrl).toContain('provider=kakao');
      expect(kakaoUrl).toContain('state=state-kakao-123');

      const naverUrl: string = getOAuthAuthorizeUrl('naver', 'state-naver-123', 'http://localhost:4000/callback');
      expect(naverUrl).toContain('/auth/oauth-simulator');
      expect(naverUrl).toContain('provider=naver');
      expect(naverUrl).toContain('state=state-naver-123');
    });

    it('generates production oauth authorize url for kakao and naver when credentials exist', (): void => {
      const origKakaoId: string | undefined = process.env.KAKAO_CLIENT_ID;
      const origNaverId: string | undefined = process.env.NAVER_CLIENT_ID;
      const origEnv: string | undefined = process.env.NODE_ENV;

      try {
        process.env.KAKAO_CLIENT_ID = 'test-kakao-client-id';
        process.env.NAVER_CLIENT_ID = 'test-naver-client-id';
        // @ts-expect-error override readonly NODE_ENV for test
        process.env.NODE_ENV = 'production';

        const kakaoUrl: string = getOAuthAuthorizeUrl('kakao', 'state-k', 'http://localhost:4000/callback');
        expect(kakaoUrl).toContain('kauth.kakao.com/oauth/authorize');
        expect(kakaoUrl).toContain('client_id=test-kakao-client-id');

        const naverUrl: string = getOAuthAuthorizeUrl('naver', 'state-n', 'http://localhost:4000/callback');
        expect(naverUrl).toContain('nid.naver.com/oauth2.0/authorize');
        expect(naverUrl).toContain('client_id=test-naver-client-id');
      } finally {
        if (origKakaoId === undefined) delete process.env.KAKAO_CLIENT_ID;
        else process.env.KAKAO_CLIENT_ID = origKakaoId;
        if (origNaverId === undefined) delete process.env.NAVER_CLIENT_ID;
        else process.env.NAVER_CLIENT_ID = origNaverId;
        // @ts-expect-error restore NODE_ENV
        process.env.NODE_ENV = origEnv;
      }
    });

    it('exchanges dev mock code for kakao and naver profiles', async (): Promise<void> => {
      const kakaoProfile: OAuthProfile = await exchangeOAuthCodeForProfile('kakao', 'dev-mock-ryan', 'http://localhost:4000/callback');
      expect(kakaoProfile.provider).toBe('kakao');
      expect(kakaoProfile.id).toBe('kakao_ryan');
      expect(kakaoProfile.username).toBe('kakao_ryan');
      expect(kakaoProfile.email).toContain('@kakao.mock');

      const naverProfile: OAuthProfile = await exchangeOAuthCodeForProfile('naver', 'dev-mock-brown', 'http://localhost:4000/callback');
      expect(naverProfile.provider).toBe('naver');
      expect(naverProfile.id).toBe('naver_brown');
      expect(naverProfile.username).toBe('naver_brown');
      expect(naverProfile.email).toContain('@naver.mock');
    });

    it('exchanges real kakao code for profile in production mode', async (): Promise<void> => {
      const origEnv: string | undefined = process.env.NODE_ENV;
      const origKakaoId: string | undefined = process.env.KAKAO_CLIENT_ID;
      try {
        // @ts-expect-error override readonly NODE_ENV for test
        process.env.NODE_ENV = 'production';
        process.env.KAKAO_CLIENT_ID = 'kakao-client-id';

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL): Promise<Response> => {
          const url: string = String(input);
          if (url.includes('kauth.kakao.com/oauth/token')) {
            return Promise.resolve(new Response(JSON.stringify({ access_token: 'kakao-token-xyz' }), { status: 200 }));
          }
          if (url.includes('kapi.kakao.com/v2/user/me')) {
            return Promise.resolve(new Response(JSON.stringify({
              id: 987654321,
              properties: { nickname: 'kakao_lion' },
              kakao_account: { email: 'lion@kakao.com' },
            }), { status: 200 }));
          }
          return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
        });

        const profile: OAuthProfile = await exchangeOAuthCodeForProfile('kakao', 'real-auth-code', 'http://localhost:4000/callback');
        expect(profile.provider).toBe('kakao');
        expect(profile.id).toBe('987654321');
        expect(profile.username).toBe('kakao_lion');
        expect(profile.email).toBe('lion@kakao.com');
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      } finally {
        // @ts-expect-error restore NODE_ENV
        process.env.NODE_ENV = origEnv;
        if (origKakaoId === undefined) delete process.env.KAKAO_CLIENT_ID;
        else process.env.KAKAO_CLIENT_ID = origKakaoId;
      }
    });

    it('exchanges real naver code for profile in production mode', async (): Promise<void> => {
      const origEnv: string | undefined = process.env.NODE_ENV;
      const origNaverId: string | undefined = process.env.NAVER_CLIENT_ID;
      try {
        // @ts-expect-error override readonly NODE_ENV for test
        process.env.NODE_ENV = 'production';
        process.env.NAVER_CLIENT_ID = 'naver-client-id';

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL): Promise<Response> => {
          const url: string = String(input);
          if (url.includes('nid.naver.com/oauth2.0/token')) {
            return Promise.resolve(new Response(JSON.stringify({ access_token: 'naver-token-xyz' }), { status: 200 }));
          }
          if (url.includes('openapi.naver.com/v1/nid/me')) {
            return Promise.resolve(new Response(JSON.stringify({
              resultcode: '00',
              message: 'success',
              response: {
                id: 'naver-uid-12345',
                nickname: 'green_naver',
                email: 'green@naver.com',
              },
            }), { status: 200 }));
          }
          return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
        });

        const profile: OAuthProfile = await exchangeOAuthCodeForProfile('naver', 'real-auth-code', 'http://localhost:4000/callback');
        expect(profile.provider).toBe('naver');
        expect(profile.id).toBe('naver-uid-12345');
        expect(profile.username).toBe('green_naver');
        expect(profile.email).toBe('green@naver.com');
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      } finally {
        // @ts-expect-error restore NODE_ENV
        process.env.NODE_ENV = origEnv;
        if (origNaverId === undefined) delete process.env.NAVER_CLIENT_ID;
        else process.env.NAVER_CLIENT_ID = origNaverId;
      }
    });

    it('creates and persists kakao and naver users in database', async (): Promise<void> => {
      const db: ServerDbAdapter = getServerDb();
      const profile: OAuthProfile = {
        provider: 'kakao',
        id: 'kakao_unique_999',
        username: 'kakao_user',
        email: 'kakao@example.com',
      };

      const user: User = await getOrCreateOAuthUser(db, profile);
      expect(user.username).toBe('kakao_user');
      expect(user.oauth_provider).toBe('kakao');
      expect(user.oauth_id).toBe('kakao_unique_999');
      expect(user.email).toBe('kakao@example.com');
      expect(user.client_auth_key).toMatch(/^gta_live_/);

      const existingUser: User | null = await db.findUserByOAuth('kakao', 'kakao_unique_999');
      expect(existingUser).toBeDefined();
      expect(existingUser?.id).toBe(user.id);
    });
  });

  describe('OAuth API Routes for Kakao & Naver', (): void => {
    it('redirects to authorize url on GET /api/auth/oauth/kakao', async (): Promise<void> => {
      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/kakao');
      const res: Response = await oauthAuthorizeHandler(req, {
        params: Promise.resolve({ provider: 'kakao' }),
      });
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toContain('/auth/oauth-simulator');
      expect(res.headers.get('location')).toContain('provider=kakao');
      expect(res.headers.get('set-cookie')).toContain('oauth_state=');
    });

    it('redirects to authorize url on GET /api/auth/oauth/naver', async (): Promise<void> => {
      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/naver');
      const res: Response = await oauthAuthorizeHandler(req, {
        params: Promise.resolve({ provider: 'naver' }),
      });
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toContain('/auth/oauth-simulator');
      expect(res.headers.get('location')).toContain('provider=naver');
      expect(res.headers.get('set-cookie')).toContain('oauth_state=');
    });

    it('completes full callback flow and issues gta_session for kakao', async (): Promise<void> => {
      const db: ServerDbAdapter = getServerDb();
      await db.createOAuthUser({
        username: 'kakao_kakaotester',
        oauth_provider: 'kakao',
        oauth_id: 'kakao_kakaotester',
        email: 'kakaotester@kakao.mock',
      });

      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/kakao/callback?code=dev-mock-kakaotester');
      const res: Response = await oauthCallbackHandler(req, {
        params: Promise.resolve({ provider: 'kakao' }),
      });
      expect(res.status).toBe(200);
      const html: string = await res.text();
      expect(html).toContain('GTA_OAUTH_SUCCESS');
      expect(html).toContain('kakao_kakaotester');

      const setCookieHeader: string | null = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('gta_session=');

      const tokenMatch: RegExpMatchArray | null = (setCookieHeader || '').match(/gta_session=([^;]+)/);
      expect(tokenMatch).not.toBeNull();
      const verified = verifySessionToken(tokenMatch![1]);
      expect(verified).not.toBeNull();
      expect(verified?.username).toBe('kakao_kakaotester');
    });

    it('completes full callback flow and issues gta_session for naver', async (): Promise<void> => {
      const db: ServerDbAdapter = getServerDb();
      await db.createOAuthUser({
        username: 'naver_navertester',
        oauth_provider: 'naver',
        oauth_id: 'naver_navertester',
        email: 'navertester@naver.mock',
      });

      const req: NextRequest = new NextRequest('http://localhost:4000/api/auth/oauth/naver/callback?code=dev-mock-navertester');
      const res: Response = await oauthCallbackHandler(req, {
        params: Promise.resolve({ provider: 'naver' }),
      });
      expect(res.status).toBe(200);
      const html: string = await res.text();
      expect(html).toContain('GTA_OAUTH_SUCCESS');
      expect(html).toContain('naver_navertester');

      const setCookieHeader: string | null = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('gta_session=');
    });
  });
});
