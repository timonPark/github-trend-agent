import { NextResponse } from 'next/server';
import { getServerDb, ServerDbAdapter } from '@/lib/db';
import { authenticateClientKey } from '@/lib/auth';
import { toErrorMessage } from '@/lib/types/error';
import { User, DailySnapshot } from '@/lib/types';
import { SaveSnapshotRequestDto } from '@/lib/types/api';

interface SnapshotGetResponse {
  snapshot?: DailySnapshot | null;
  message?: string;
  error?: string;
}

interface SnapshotPostResponse {
  success?: boolean;
  snapshot?: DailySnapshot;
  error?: string;
}

export async function GET(request: Request): Promise<NextResponse<SnapshotGetResponse>> {
  try {
    const authHeader: string | null = request.headers.get('authorization');
    const user: User | null = await authenticateClientKey(authHeader);
    if (!user) {
      return NextResponse.json<SnapshotGetResponse>(
        { error: 'Unauthorized: Invalid or missing client auth key' },
        { status: 401 }
      );
    }

    const url: URL = new URL(request.url);
    const dateParam: string | null = url.searchParams.get('date');
    const targetDate: string = dateParam || new Date().toISOString().split('T')[0];

    const db: ServerDbAdapter = getServerDb();
    const snapshot: DailySnapshot | null = await db.getDailySnapshot(targetDate);

    if (!snapshot) {
      return NextResponse.json<SnapshotGetResponse>(
        { snapshot: null, message: `No snapshot found for ${targetDate}` },
        { status: 404 }
      );
    }

    return NextResponse.json<SnapshotGetResponse>({ snapshot }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json<SnapshotGetResponse>(
      { error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<SnapshotPostResponse>> {
  try {
    const authHeader: string | null = request.headers.get('authorization');
    const user: User | null = await authenticateClientKey(authHeader);
    if (!user) {
      return NextResponse.json<SnapshotPostResponse>(
        { error: 'Unauthorized: Invalid or missing client auth key' },
        { status: 401 }
      );
    }

    const body: SaveSnapshotRequestDto = (await request.json()) as SaveSnapshotRequestDto;
    const { snapshot_date, repositories } = body;

    if (!snapshot_date || !Array.isArray(repositories) || repositories.length === 0) {
      return NextResponse.json<SnapshotPostResponse>(
        { error: 'Invalid payload: snapshot_date and non-empty repositories array are required' },
        { status: 400 }
      );
    }

    const db: ServerDbAdapter = getServerDb();
    const saved: DailySnapshot = await db.saveDailySnapshot(snapshot_date, repositories, user.username);

    return NextResponse.json<SnapshotPostResponse>(
      {
        success: true,
        snapshot: saved,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json<SnapshotPostResponse>(
      { error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
