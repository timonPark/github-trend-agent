import { describe, it, expect, beforeEach } from 'vitest';
import { resetServerDbForTest, getServerDb } from '../src/lib/db';
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
  createSessionToken,
  verifyPassword,
} from '../src/lib/auth';
import { POST as registerHandler } from '../src/app/api/auth/register/route';
import { POST as loginHandler } from '../src/app/api/auth/login/route';
import { POST as forgotPasswordHandler } from '../src/app/api/auth/forgot-password/route';
import { POST as resetPasswordHandler } from '../src/app/api/auth/reset-password/route';
import {
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  LoginResponseDto,
} from '../src/lib/types/api';
import { User } from '../src/lib/types';

describe('Password Reset Feature', (): void => {
  beforeEach((): void => {
    resetServerDbForTest();
  });

  describe('Password Reset Token Signature', (): void => {
    it('creates and verifies a valid password reset token', (): void => {
      const token: string = createPasswordResetToken('user-123', 'test@example.com');
      const payload: { userId: string; email: string } | null = verifyPasswordResetToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe('user-123');
      expect(payload?.email).toBe('test@example.com');
    });

    it('rejects tampered or mismatched tokens', (): void => {
      const token: string = createPasswordResetToken('user-123', 'test@example.com');
      const tampered: string = token.slice(0, -4) + 'abcd';
      expect(verifyPasswordResetToken(tampered)).toBeNull();

      const sessionToken: string = createSessionToken('user-123', 'testuser');
      expect(verifyPasswordResetToken(sessionToken)).toBeNull();
      expect(verifyPasswordResetToken('not-even-a-token')).toBeNull();
    });
  });

  describe('Forgot Password API (POST /api/auth/forgot-password)', (): void => {
    it('returns error when email format is invalid', async (): Promise<void> => {
      const req: Request = new Request('http://localhost:4000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email' }),
      });
      const res: Response = await forgotPasswordHandler(req);
      expect(res.status).toBe(400);
      const data: { error: string } = (await res.json()) as { error: string };
      expect(data.error).toContain('유효한 이메일');
    });

    it('returns safe message even if email is not found in database', async (): Promise<void> => {
      const req: Request = new Request('http://localhost:4000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      });
      const res: Response = await forgotPasswordHandler(req);
      expect(res.status).toBe(200);
      const data: ForgotPasswordResponseDto = (await res.json()) as ForgotPasswordResponseDto;
      expect(data.message).toContain('등록된 이메일');
      expect(data.reset_token).toBeUndefined();
    });

    it('issues reset token when email belongs to an existing user', async (): Promise<void> => {
      await registerHandler(
        new Request('http://localhost:4000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'alice',
            email: 'alice@example.com',
            password: 'initialPassword123',
            terms_agreed: true,
          }),
        })
      );

      const req: Request = new Request('http://localhost:4000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alice@example.com' }),
      });
      const res: Response = await forgotPasswordHandler(req);
      expect(res.status).toBe(200);
      const data: ForgotPasswordResponseDto = (await res.json()) as ForgotPasswordResponseDto;
      expect(data.reset_token).toBeDefined();
      expect(data.reset_url).toContain('/forgot-password?token=');
    });
  });

  describe('Reset Password API (POST /api/auth/reset-password)', (): void => {
    it('fails when token is invalid or password is too short', async (): Promise<void> => {
      const badTokenReq: Request = new Request('http://localhost:4000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'bad-token', new_password: 'newValidPassword123' }),
      });
      const badTokenRes: Response = await resetPasswordHandler(badTokenReq);
      expect(badTokenRes.status).toBe(400);

      const validToken: string = createPasswordResetToken('user-1', 'alice@example.com');
      const shortPassReq: Request = new Request('http://localhost:4000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: validToken, new_password: '123' }),
      });
      const shortPassRes: Response = await resetPasswordHandler(shortPassReq);
      expect(shortPassRes.status).toBe(400);
    });

    it('successfully resets password and allows login with new password', async (): Promise<void> => {
      await registerHandler(
        new Request('http://localhost:4000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'bob',
            email: 'bob@example.com',
            password: 'oldPassword123',
            terms_agreed: true,
          }),
        })
      );

      const forgotRes: Response = await forgotPasswordHandler(
        new Request('http://localhost:4000/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'bob@example.com' }),
        })
      );
      const forgotData: ForgotPasswordResponseDto = (await forgotRes.json()) as ForgotPasswordResponseDto;
      const resetToken: string = forgotData.reset_token as string;
      expect(resetToken).toBeDefined();

      const resetRes: Response = await resetPasswordHandler(
        new Request('http://localhost:4000/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, new_password: 'newSecretPassword456' }),
        })
      );
      expect(resetRes.status).toBe(200);
      const resetData: ResetPasswordResponseDto = (await resetRes.json()) as ResetPasswordResponseDto;
      expect(resetData.message).toContain('성공적');

      const oldLoginRes: Response = await loginHandler(
        new Request('http://localhost:4000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'bob', password: 'oldPassword123' }),
        })
      );
      expect(oldLoginRes.status).toBe(401);

      const newLoginRes: Response = await loginHandler(
        new Request('http://localhost:4000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'bob', password: 'newSecretPassword456' }),
        })
      );
      expect(newLoginRes.status).toBe(200);
      const loginData: LoginResponseDto = (await newLoginRes.json()) as LoginResponseDto;
      expect(loginData.user.username).toBe('bob');
    });
  });
});
