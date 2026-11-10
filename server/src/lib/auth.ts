import crypto from 'crypto';
import { getServerDb, ServerDbAdapter } from './db';
import { User } from './types';

export function hashPassword(password: string): string {
  const salt: string = crypto.randomBytes(16).toString('hex');
  const hash: string = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const parts: string[] = combinedHash.split(':');
    const salt: string = parts[0];
    const originalHash: string = parts[1];
    if (!salt || !originalHash) {
      return false;
    }
    const computedHash: string = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

const SESSION_SECRET: string = process.env.SESSION_SECRET || 'gta-session-secret-key-development-32chars';

export function createSessionToken(userId: string, username: string): string {
  const payload: string = JSON.stringify({
    userId,
    username,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
  const b64Payload: string = Buffer.from(payload).toString('base64url');
  const signature: string = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
  return `${b64Payload}.${signature}`;
}

export function verifySessionToken(token: string): { userId: string; username: string } | null {
  try {
    const parts: string[] = token.split('.');
    const b64Payload: string = parts[0];
    const signature: string = parts[1];
    if (!b64Payload || !signature) {
      return null;
    }
    const expectedSig: string = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
    if (signature !== expectedSig) {
      return null;
    }

    const payload: { userId: string; username: string; exp?: number } = JSON.parse(
      Buffer.from(b64Payload, 'base64url').toString('utf-8')
    ) as { userId: string; username: string; exp?: number };
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

export async function authenticateClientKey(authHeaderOrKey?: string | null): Promise<User | null> {
  if (!authHeaderOrKey) {
    return null;
  }
  const key: string = authHeaderOrKey.startsWith('Bearer ')
    ? authHeaderOrKey.slice(7).trim()
    : authHeaderOrKey.trim();

  if (!key) {
    return null;
  }
  const db: ServerDbAdapter = getServerDb();
  return db.findUserByClientAuthKey(key);
}
