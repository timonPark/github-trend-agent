import { NextResponse } from 'next/server';
import { getClientDb, getSetting, setSetting, getServerAuthKey, setServerAuthKey } from '@/lib/db';
import { verifyServerKey, VerifyKeyResult } from '@/lib/server-api';

export async function GET() {
  try {
    const db = getClientDb();
    const serverUrl = getSetting('server_url', db) || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    const serverAuthKey = getServerAuthKey(db) || '';

    // Database stats to prove local data retention
    const snapshotCount = (db.prepare('SELECT COUNT(*) as cnt FROM local_snapshots').get() as any)?.cnt || 0;
    const sessionCount = (db.prepare('SELECT COUNT(*) as cnt FROM discussion_sessions').get() as any)?.cnt || 0;
    const archiveCount = (db.prepare('SELECT COUNT(*) as cnt FROM local_archives').get() as any)?.cnt || 0;

    return NextResponse.json({
      settings: {
        server_url: serverUrl,
        server_auth_key: serverAuthKey,
        is_key_set: !!serverAuthKey,
      },
      stats: {
        snapshotCount,
        sessionCount,
        archiveCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { server_url, server_auth_key, verify = true } = body;

    const db = getClientDb();

    if (server_url && typeof server_url === 'string') {
      setSetting('server_url', server_url.trim(), db);
    }

    const targetUrl = server_url ? server_url.trim() : (getSetting('server_url', db) || 'http://localhost:4000');

    if (server_auth_key !== undefined && typeof server_auth_key === 'string') {
      const trimmedKey = server_auth_key.trim();

      // Optional online verification before saving
      let verification: VerifyKeyResult = { valid: true };
      if (verify && trimmedKey.length > 0) {
        verification = await verifyServerKey(targetUrl, trimmedKey);
        if (!verification.valid) {
          return NextResponse.json(
            {
              success: false,
              statusCode: 401,
              error: verification.error || '중앙 서버 인증에 실패했습니다. 키를 다시 확인해주세요.',
            },
            { status: 400 }
          );
        }
      }

      // CRITICAL INVARIANT: Save setting WITHOUT touching any snapshot, discussion, or archive tables
      setServerAuthKey(trimmedKey, db);

      return NextResponse.json({
        success: true,
        message: '설정이 성공적으로 저장되었습니다. 로컬 데이터는 모두 안전하게 유지됩니다.',
        verifiedUser: verification.user,
      });
    }

    return NextResponse.json({ success: true, message: '설정이 저장되었습니다.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
