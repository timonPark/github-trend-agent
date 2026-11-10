import crypto from 'crypto';
import { getServerDb } from './db';
import { User } from './types';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, originalHash] = combinedHash.split(':');
    if (!salt || !originalHash) return false;
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

// Simple signed session token (HMAC-SHA256)
const SESSION_SECRET = process.env.SESSION_SECRET || 'gta-session-secret-key-development-32chars';

export function createSessionToken(userId: string, username: string): string {
  const payload = JSON.stringify({
    userId,
    username,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  const b64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
  return `${b64Payload}.${signature}`;
}

export function verifySessionToken(token: string): { userId: string; username: string } | null {
  try {
    const [b64Payload, signature] = token.split('.');
    if (!b64Payload || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

export async function authenticateClientKey(authHeaderOrKey?: string | null): Promise<User | null> {
  if (!authHeaderOrKey) return null;
  const key = authHeaderOrKey.startsWith('Bearer ')
    ? authHeaderOrKey.slice(7).trim()
    : authHeaderOrKey.trim();

  if (!key) return null;
  const db = getServerDb();
  return db.findUserByClientAuthKey(key);
}
