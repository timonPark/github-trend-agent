import { describe, it, expect, beforeEach } from 'vitest';
import { resetServerDbForTest, ServerDatabase } from '../src/lib/db';
import {
  GET as getArchivesHandler,
  POST as createArchiveHandler,
  PATCH as updateArchiveHandler,
} from '../src/app/api/archives/route';
import { User, ChatMessage, DiscussionArchive } from '../src/lib/types';
import {
  ApiResponse,
  CreateArchiveRequestDto,
  CreateArchiveResponseDto,
  GetArchivesResponseDto,
  UpdateArchiveVisibilityResponseDto,
} from '../src/lib/types/api';

describe('Server Discussion Archives API (#11)', (): void => {
  let authKeyUser1: string;
  let authKeyUser2: string;
  let user1: User;
  let user2: User;

  const mockMessages: ChatMessage[] = [
    { id: '1', role: 'user', content: '프로젝트 구조가 어때?', timestamp: '2026-11-11T00:00:00Z' },
    { id: '2', role: 'assistant', content: '클린 아키텍처입니다.', timestamp: '2026-11-11T00:00:01Z' },
  ];

  beforeEach(async (): Promise<void> => {
    const db: ServerDatabase = resetServerDbForTest();
    user1 = await db.createUser('alice', 'hash-1', 'gta_live_alice_key');
    user2 = await db.createUser('bob', 'hash-2', 'gta_live_bob_key');
    authKeyUser1 = user1.client_auth_key;
    authKeyUser2 = user2.client_auth_key;
  });

  it('rejects unauthenticated requests with 401', async (): Promise<void> => {
    const req: Request = new Request('http://localhost:4000/api/archives');
    const res: Response = await getArchivesHandler(req);
    expect(res.status).toBe(401);

    const postReq: Request = new Request('http://localhost:4000/api/archives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapshot_date: '2026-11-11',
        repo_full_name: 'test/repo',
        repo_url: 'https://github.com/test/repo',
        discussion_summary: '요약',
        messages: mockMessages,
        is_public: true,
      }),
    });
    const postRes: Response = await createArchiveHandler(postReq);
    expect(postRes.status).toBe(401);
  });

  it('POST /api/archives creates archive linked to authenticated user', async (): Promise<void> => {
    const body: CreateArchiveRequestDto = {
      id: 'archive-1',
      snapshot_date: '2026-11-11',
      repo_full_name: 'facebook/react',
      repo_url: 'https://github.com/facebook/react',
      repo_digest: '1. UI 라이브러리\n2. 컴포넌트 기반\n3. 가상 돔',
      discussion_summary: 'React는 컴포넌트 기반 UI 개발에 최적화된 라이브러리입니다.',
      messages: mockMessages,
      is_public: true,
    };

    const req: Request = new Request('http://localhost:4000/api/archives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-auth-key': authKeyUser1,
      },
      body: JSON.stringify(body),
    });

    const res: Response = await createArchiveHandler(req);
    expect(res.status).toBe(200);

    const json: ApiResponse<CreateArchiveResponseDto> =
      (await res.json()) as ApiResponse<CreateArchiveResponseDto>;
    expect(json.success).toBe(true);
    expect(json.data?.archive.id).toBe('archive-1');
    expect(json.data?.archive.user_id).toBe(user1.id);
    expect(json.data?.archive.username).toBe(user1.username);
    expect(json.data?.archive.is_public).toBe(true);
  });

  it('GET /api/archives returns only user archives by default, and public archives when public=true', async (): Promise<void> => {
    // User1 creates a public archive
    const postReq1: Request = new Request('http://localhost:4000/api/archives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-auth-key': authKeyUser1 },
      body: JSON.stringify({
        id: 'arch-u1-pub',
        snapshot_date: '2026-11-11',
        repo_full_name: 'user1/public-repo',
        repo_url: 'https://github.com/user1/public-repo',
        discussion_summary: '공개 토론 요약',
        messages: mockMessages,
        is_public: true,
      }),
    });
    await createArchiveHandler(postReq1);

    // User2 creates a private archive
    const postReq2: Request = new Request('http://localhost:4000/api/archives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-auth-key': authKeyUser2 },
      body: JSON.stringify({
        id: 'arch-u2-priv',
        snapshot_date: '2026-11-11',
        repo_full_name: 'user2/private-repo',
        repo_url: 'https://github.com/user2/private-repo',
        discussion_summary: '비공개 토론 요약',
        messages: mockMessages,
        is_public: false,
      }),
    });
    await createArchiveHandler(postReq2);

    // User1 queries their own archives
    const reqUser1: Request = new Request('http://localhost:4000/api/archives', {
      headers: { 'x-client-auth-key': authKeyUser1 },
    });
    const resUser1: Response = await getArchivesHandler(reqUser1);
    expect(resUser1.status).toBe(200);
    const jsonUser1: ApiResponse<GetArchivesResponseDto> =
      (await resUser1.json()) as ApiResponse<GetArchivesResponseDto>;
    expect(jsonUser1.data?.archives).toHaveLength(1);
    expect(jsonUser1.data?.archives[0].id).toBe('arch-u1-pub');

    // Anyone can query public archives without auth or with query param public=true
    const publicReq: Request = new Request('http://localhost:4000/api/archives?public=true');
    const publicRes: Response = await getArchivesHandler(publicReq);
    expect(publicRes.status).toBe(200);
    const jsonPub: ApiResponse<GetArchivesResponseDto> =
      (await publicRes.json()) as ApiResponse<GetArchivesResponseDto>;
    expect(jsonPub.data?.archives).toHaveLength(1);
    expect(jsonPub.data?.archives[0].id).toBe('arch-u1-pub');
  });

  it('PATCH /api/archives toggles visibility only for owner', async (): Promise<void> => {
    // User1 creates private archive
    const postReq: Request = new Request('http://localhost:4000/api/archives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-auth-key': authKeyUser1 },
      body: JSON.stringify({
        id: 'toggle-test',
        snapshot_date: '2026-11-11',
        repo_full_name: 'test/toggle-repo',
        repo_url: 'https://github.com/test/toggle-repo',
        discussion_summary: '토글 테스트 요약',
        messages: mockMessages,
        is_public: false,
      }),
    });
    await createArchiveHandler(postReq);

    // User2 attempts to toggle User1's archive -> 404 / 403
    const unauthorizedPatch: Request = new Request('http://localhost:4000/api/archives', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-client-auth-key': authKeyUser2 },
      body: JSON.stringify({ id: 'toggle-test', is_public: true }),
    });
    const unauthRes: Response = await updateArchiveHandler(unauthorizedPatch);
    expect(unauthRes.status).toBe(404);

    // User1 toggles their own archive -> 200
    const authorizedPatch: Request = new Request('http://localhost:4000/api/archives', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-client-auth-key': authKeyUser1 },
      body: JSON.stringify({ id: 'toggle-test', is_public: true }),
    });
    const authRes: Response = await updateArchiveHandler(authorizedPatch);
    expect(authRes.status).toBe(200);
    const jsonPatch: ApiResponse<UpdateArchiveVisibilityResponseDto> =
      (await authRes.json()) as ApiResponse<UpdateArchiveVisibilityResponseDto>;
    expect(jsonPatch.data?.archive.is_public).toBe(true);
  });
});
