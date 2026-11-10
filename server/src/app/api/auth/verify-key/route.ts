import { NextResponse } from 'next/server';
import { authenticateClientKey } from '@/lib/auth';
import { toErrorMessage } from '@/lib/types/error';
import { User } from '@/lib/types';
import { VerifyKeyRequestDto, VerifyKeyResponseDto } from '@/lib/types/api';

export async function POST(request: Request): Promise<NextResponse<VerifyKeyResponseDto>> {
  try {
    let key: string | null = null;

    const authHeader: string | null = request.headers.get('authorization');
    if (authHeader) {
      key = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    }

    if (!key) {
      try {
        const body: VerifyKeyRequestDto = (await request.json()) as VerifyKeyRequestDto;
        if (body && typeof body.client_auth_key === 'string') {
          key = body.client_auth_key.trim();
        }
      } catch {
        // Body might be empty
      }
    }

    if (!key) {
      return NextResponse.json<VerifyKeyResponseDto>(
        { valid: false, error: 'Client authentication key is required' },
        { status: 401 }
      );
    }

    const user: User | null = await authenticateClientKey(key);
    if (!user) {
      return NextResponse.json<VerifyKeyResponseDto>(
        { valid: false, error: 'Invalid or expired client authentication key' },
        { status: 401 }
      );
    }

    return NextResponse.json<VerifyKeyResponseDto>({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
      },
      user_id: user.id,
      username: user.username,
    });
  } catch (err: unknown) {
    return NextResponse.json<VerifyKeyResponseDto>(
      { valid: false, error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
