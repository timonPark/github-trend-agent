import { describe, it, expect, beforeEach } from 'vitest';
import { resetServerDbForTest } from '../src/lib/db';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, authenticateClientKey } from '../src/lib/auth';
import { POST as registerHandler } from '../src/app/api/auth/register/route';
import { POST as loginHandler } from '../src/app/api/auth/login/route';
import { GET as getClientKeyHandler, POST as rotateClientKeyHandler } from '../src/app/api/auth/client-key/route';
import { POST as verifyKeyHandler } from '../src/app/api/auth/verify-key/route';

describe('Server Auth & Key Verification', () => {
  beforeEach(() => {
    resetServerDbForTest();
  });

  describe('Password Hashing & Session Token', () => {
    it('correctly hashes and verifies passwords', () => {
      const password = 'mySecretPassword123!';
      const hash = hashPassword(password);
      expect(hash).toContain(':');
      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword('wrongPassword', hash)).toBe(false);
    });

    it('creates and verifies session tokens', () => {
      const token = createSessionToken('user-1', 'octocat');
      const verified = verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe('user-1');
      expect(verified?.username).toBe('octocat');

      expect(verifySessionToken('invalid.token.here')).toBeNull();
    });
  });

  describe('Auth API Routes', () => {
    it('registers a new user and generates a client_auth_key', async () => {
      const req = new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password123' }),
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user.username).toBe('timon');
      expect(data.user.client_auth_key).toMatch(/^gta_live_/);
      expect(data.token).toBeDefined();

      // Duplicate registration should fail
      const dupReq = new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password456' }),
      });
      const dupRes = await registerHandler(dupReq);
      expect(dupRes.status).toBe(409);
    });

    it('logs in an existing user and fails on bad credentials', async () => {
      // Register first
      await registerHandler(new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password123' }),
      }));

      // Login success
      const loginReq = new Request('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password123' }),
      });
      const loginRes = await loginHandler(loginReq);
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.user.username).toBe('timon');

      // Bad password
      const badReq = new Request('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'wrongpassword' }),
      });
      const badRes = await loginHandler(badReq);
      expect(badRes.status).toBe(401);
    });

    it('rotates client auth key and verifies old key is invalidated', async () => {
      const regRes = await registerHandler(new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'timon', password: 'password123' }),
      }));
      const { user, token } = await regRes.json();
      const oldKey = user.client_auth_key;

      // Verify old key works initially
      const vOldReq = new Request('http://localhost:4000/api/auth/verify-key', {
        method: 'POST',
        headers: { Authorization: `Bearer ${oldKey}` },
      });
      const vOldRes = await verifyKeyHandler(vOldReq);
      expect(vOldRes.status).toBe(200);
      expect((await vOldRes.json()).valid).toBe(true);

      // Rotate key
      const rotateReq = new Request('http://localhost:4000/api/auth/client-key', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const rotateRes = await rotateClientKeyHandler(rotateReq);
      expect(rotateRes.status).toBe(200);
      const { client_auth_key: newKey } = await rotateRes.json();
      expect(newKey).not.toBe(oldKey);

      // Now old key must fail with 401
      const vOldAgainReq = new Request('http://localhost:4000/api/auth/verify-key', {
        method: 'POST',
        headers: { Authorization: `Bearer ${oldKey}` },
      });
      const vOldAgainRes = await verifyKeyHandler(vOldAgainReq);
      expect(vOldAgainRes.status).toBe(401);
      expect((await vOldAgainRes.json()).valid).toBe(false);

      // New key must succeed with 200
      const vNewReq = new Request('http://localhost:4000/api/auth/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_auth_key: newKey }),
      });
      const vNewRes = await verifyKeyHandler(vNewReq);
      expect(vNewRes.status).toBe(200);
      const vNewData = await vNewRes.json();
      expect(vNewData.valid).toBe(true);
      expect(vNewData.user.username).toBe('timon');
    });

    it('rejects verification when key is missing or wrong', async () => {
      // Empty header & body
      const emptyReq = new Request('http://localhost:4000/api/auth/verify-key', {
        method: 'POST',
      });
      const emptyRes = await verifyKeyHandler(emptyReq);
      expect(emptyRes.status).toBe(401);
      expect((await emptyRes.json()).valid).toBe(false);

      // Wrong key
      const wrongReq = new Request('http://localhost:4000/api/auth/verify-key', {
        method: 'POST',
        headers: { Authorization: 'Bearer gta_live_fake_key_1234567890' },
      });
      const wrongRes = await verifyKeyHandler(wrongReq);
      expect(wrongRes.status).toBe(401);
      expect((await wrongRes.json()).valid).toBe(false);
    });
  });
});
