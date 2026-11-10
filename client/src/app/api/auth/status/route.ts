import { NextResponse } from 'next/server';
import { getClientDb, getSetting, getServerAuthKey } from '@/lib/db';
import { verifyServerKey } from '@/lib/server-api';

export async function GET(request: Request) {
  try {
    const db = getClientDb();
    const serverUrl = getSetting('server_url', db) || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    const serverAuthKey = getServerAuthKey(db);

    if (!serverAuthKey) {
      return NextResponse.json({
        authenticated: false,
        server_url: serverUrl,
        error: '인증 키가 등록되지 않았습니다. 중앙 서버에서 발급받은 키를 등록해주세요.',
      });
    }

    // Verify key with central server
    const verification = await verifyServerKey(serverUrl, serverAuthKey);

    if (!verification.valid) {
      return NextResponse.json(
        {
          authenticated: false,
          server_url: serverUrl,
          statusCode: verification.statusCode || 401,
          error: verification.error || '인증 키가 유효하지 않거나 만료되었습니다.',
        },
        { status: 200 } // Return 200 JSON with authenticated: false so client UI can render gate gracefully
      );
    }

    return NextResponse.json({
      authenticated: true,
      server_url: serverUrl,
      user: verification.user,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        authenticated: false,
        error: err.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
