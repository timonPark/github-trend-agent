import { NextRequest, NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { CheckUsernameResponseDto } from '@/lib/types/api';

const USERNAME_REGEX: RegExp = /^[a-zA-Z0-9_-]{3,30}$/;

function validateUsernameFormat(username: string | null): string | null {
  if (!username) return '닉네임을 입력해 주세요.';
  const trimmed: string = username.trim();
  if (!USERNAME_REGEX.test(trimmed)) {
    return '아이디는 3~30자의 영문, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있습니다.';
  }
  return null;
}

export async function GET(req: NextRequest): Promise<NextResponse<CheckUsernameResponseDto>> {
  const usernameParam: string | null = req.nextUrl.searchParams.get('username');
  const formatError: string | null = validateUsernameFormat(usernameParam);
  if (formatError) {
    return NextResponse.json({ available: false, message: formatError }, { status: 400 });
  }

  const cleanUsername: string = usernameParam!.trim();
  const db: ServerDbAdapter = getServerDb();
  const existing = await db.findUserByUsername(cleanUsername);
  if (existing) {
    return NextResponse.json({ available: false, message: '이미 사용 중인 닉네임입니다.' }, { status: 200 });
  }

  return NextResponse.json({ available: true, message: '사용 가능한 닉네임입니다.' }, { status: 200 });
}
