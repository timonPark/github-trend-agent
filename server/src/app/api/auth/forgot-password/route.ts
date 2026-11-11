import { NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { createPasswordResetToken } from '@/lib/auth';
import { toErrorMessage } from '@/lib/types/error';
import { User } from '@/lib/types';
import { ForgotPasswordRequestDto, ForgotPasswordResponseDto } from '@/lib/types/api';

const EMAIL_REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request): Promise<NextResponse<ForgotPasswordResponseDto | { error: string }>> {
  try {
    const body: ForgotPasswordRequestDto = (await request.json()) as ForgotPasswordRequestDto;
    const email: string = (body.email || '').trim();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: '유효한 이메일 주소를 입력해주세요.' }, { status: 400 });
    }

    const db: ServerDbAdapter = getServerDb();
    const user: User | null = await db.findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ message: '등록된 이메일인 경우 재설정 링크가 발송되었습니다.' }, { status: 200 });
    }

    const resetToken: string = createPasswordResetToken(user.id, user.email || email);
    const resetUrl: string = `/forgot-password?token=${resetToken}`;
    return NextResponse.json(
      { message: '비밀번호 재설정 토큰이 생성되었습니다.', reset_token: resetToken, reset_url: resetUrl },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: toErrorMessage(err) }, { status: 500 });
  }
}
