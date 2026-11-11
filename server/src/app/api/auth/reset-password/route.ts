import { NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { verifyPasswordResetToken, hashPassword } from '@/lib/auth';
import { toErrorMessage } from '@/lib/types/error';
import { User } from '@/lib/types';
import { ResetPasswordRequestDto, ResetPasswordResponseDto } from '@/lib/types/api';

function validateResetInput(token?: string, newPassword?: string): string | null {
  if (!token || typeof token !== 'string') return '재설정 토큰이 필요합니다.';
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }
  return null;
}

export async function POST(request: Request): Promise<NextResponse<ResetPasswordResponseDto | { error: string }>> {
  try {
    const body: ResetPasswordRequestDto = (await request.json()) as ResetPasswordRequestDto;
    const inputError: string | null = validateResetInput(body.token, body.new_password);
    if (inputError) return NextResponse.json({ error: inputError }, { status: 400 });

    const payload: { userId: string; email: string } | null = verifyPasswordResetToken(body.token);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않거나 만료된 재설정 토큰입니다.' }, { status: 400 });
    }

    const db: ServerDbAdapter = getServerDb();
    const user: User | null = await db.findUserById(payload.userId);
    if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

    const newHash: string = hashPassword(body.new_password);
    await db.updateUserPassword(user.id, newHash);
    return NextResponse.json({ message: '비밀번호가 성공적으로 변경되었습니다.' }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: toErrorMessage(err) }, { status: 500 });
  }
}
