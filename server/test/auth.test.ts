import { describe, it, expect, beforeEach } from 'vitest';
import { resetServerDbForTest } from '../src/lib/db';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../src/lib/auth';
import { POST as registerHandler } from '../src/app/api/auth/register/route';
import { POST as loginHandler } from '../src/app/api/auth/login/route';
import { POST as rotateClientKeyHandler } from '../src/app/api/auth/client-key/route';
import { POST as verifyKeyHandler } from '../src/app/api/auth/verify-key/route';
import { User } from '../src/lib/types';
import { VerifyKeyResponseDto } from '../src/lib/types/api';

describe('Server Auth & Key Verification', (): void => {
  beforeEach((): void => {
    resetServerDbForTest();
  });

  describe('Password Hashing & Session Token', (): void => {
    it('correctly hashes and verifies passwords', (): void => {
      const password: string = 'mySecretPassword123!';
      const hash: string = hashPassword(password);
      expect(hash).toContain(':');
      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword('wrongPassword', hash)).toBe(false);
    });

    it('creates and verifies session tokens', (): void => {
      const token: string = createSessionToken('user-1', 'octocat');
      const verified: { userId: string; username: string } | null = verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe('user-1');
      expect(verified?.username).toBe('octocat');

      expect(verifySessionToken('invalid.token.here')).toBeNull();
    });
  });

  describe('Auth API Routes', (): void => {
    it('registers a new user and generates a client_auth_key', async (): Promise<void> => {
      const missingTermsReq: Request = new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password123' }),
      });
      const missingTermsRes: Response = await registerHandler(missingTermsReq);
      expect(missingTermsRes.status).toBe(400);

      const req: Request = new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password123', terms_agreed: true }),
      });

      const res: Response = await registerHandler(req);
      expect(res.status).toBe(201);
      const data: { user: User; token: string } = (await res.json()) as { user: User; token: string };
      expect(data.user.username).toBe('timon');
      expect(data.user.client_auth_key).toMatch(/^gta_live_/);
      expect(data.user.terms_agreed_at).toBeDefined();
      expect(data.token).toBeDefined();

      const dupReq: Request = new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password456', terms_agreed: true }),
      });
      const dupRes: Response = await registerHandler(dupReq);
      expect(dupRes.status).toBe(409);
    });

    it('logs in an existing user and fails on bad credentials', async (): Promise<void> => {
      await registerHandler(new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password123', terms_agreed: true }),
      }));

      const loginReq: Request = new Request('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password123' }),
      });
      const loginRes: Response = await loginHandler(loginReq);
      expect(loginRes.status).toBe(200);
      const loginData: { user: User } = (await loginRes.json()) as { user: User };
      expect(loginData.user.username).toBe('timon');

      const badReq: Request = new Request('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'wrongpassword' }),
      });
      const badRes: Response = await loginHandler(badReq);
      expect(badRes.status).toBe(401);
    });

    it('rotates client auth key and verifies old key is invalidated', async (): Promise<void> => {
      const regRes: Response = await registerHandler(new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password123', terms_agreed: true }),
      }));
      const { user, token }: { user: User; token: string } = (await regRes.json()) as { user: User; token: string };
      const oldKey: string = user.client_auth_key;

      const vOldReq: Request = new Request('http://localhost:4000/api/auth/verify-key', {
        method: 'POST',
        headers: { Authorization: `Bearer ${oldKey}` },
      });
      const vOldRes: Response = await verifyKeyHandler(vOldReq);
      expect(vOldRes.status).toBe(200);
      const vOldData: VerifyKeyResponseDto = (await vOldRes.json()) as VerifyKeyResponseDto;
      expect(vOldData.valid).toBe(true);

      const rotateReq: Request = new Request('http://localhost:4000/api/auth/client-key', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const rotateRes: Response = await rotateClientKeyHandler(rotateReq);
      expect(rotateRes.status).toBe(200);
      const { client_auth_key: newKey }: { client_auth_key: string } =
        (await rotateRes.json()) as { client_auth_key: string };
      expect(newKey).not.toBe(oldKey);

      const vOldAgainReq: Request = new Request('http://localhost:4000/api/auth/verify-key', {
        method: 'POST',
        headers: { Authorization: `Bearer ${oldKey}` },
      });
      const vOldAgainRes: Response = await verifyKeyHandler(vOldAgainReq);
      expect(vOldAgainRes.status).toBe(401);
      const vOldAgainData: VerifyKeyResponseDto = (await vOldAgainRes.json()) as VerifyKeyResponseDto;
      expect(vOldAgainData.valid).toBe(false);

      const vNewReq: Request = new Request('http://localhost:4000/api/auth/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_auth_key: newKey }),
      });
      const vNewRes: Response = await verifyKeyHandler(vNewReq);
      expect(vNewRes.status).toBe(200);
      const vNewData: VerifyKeyResponseDto = (await vNewRes.json()) as VerifyKeyResponseDto;
      expect(vNewData.valid).toBe(true);
      expect(vNewData.user?.username).toBe('timon');
    });

    it('rejects verification when key is missing or wrong', async (): Promise<void> => {
      const emptyReq: Request = new Request('http://localhost:4000/api/auth/verify-key', {
        method: 'POST',
      });
      const emptyRes: Response = await verifyKeyHandler(emptyReq);
      expect(emptyRes.status).toBe(401);
      const emptyData: VerifyKeyResponseDto = (await emptyRes.json()) as VerifyKeyResponseDto;
      expect(emptyData.valid).toBe(false);

      const wrongReq: Request = new Request('http://localhost:4000/api/auth/verify-key', {
        method: 'POST',
        headers: { Authorization: 'Bearer gta_live_fake_key_1234567890' },
      });
      const wrongRes: Response = await verifyKeyHandler(wrongReq);
      expect(wrongRes.status).toBe(401);
      const wrongData: VerifyKeyResponseDto = (await wrongRes.json()) as VerifyKeyResponseDto;
      expect(wrongData.valid).toBe(false);
    });
  });
});
