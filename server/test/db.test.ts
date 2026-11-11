import { describe, it, expect, beforeEach } from 'vitest';
import { getServerDb, resetServerDbForTest, ServerDatabase } from '../src/lib/db';
import { User, TrendingRepository, DailySnapshot, DiscussionArchive } from '../src/lib/types';

describe('Central Server Database Layer', (): void => {
  let db: ServerDatabase;

  beforeEach((): void => {
    db = resetServerDbForTest();
  });

  it('creates user with client_auth_key and allows rotation', async (): Promise<void> => {
    const user: User = await db.createUser('timonPark', 'hash123');

    expect(user.username).toBe('timonPark');
    expect(user.client_auth_key).toMatch(/^gta_live_/);

    const found: User | null = await db.findUserByClientAuthKey(user.client_auth_key);
    expect(found?.id).toBe(user.id);

    const oldKey: string = user.client_auth_key;
    const newKey: string = await db.rotateClientAuthKey(user.id);
    expect(newKey).not.toBe(oldKey);

    const oldLookup: User | null = await db.findUserByClientAuthKey(oldKey);
    expect(oldLookup).toBeNull();

    const newLookup: User | null = await db.findUserByClientAuthKey(newKey);
    expect(newLookup?.id).toBe(user.id);
  });

  it('saves and retrieves daily snapshots by date key', async (): Promise<void> => {
    const repos: TrendingRepository[] = [
      {
        rank: 1,
        name: 'sample-repo',
        full_name: 'test/sample-repo',
        url: 'https://github.com/test/sample-repo',
        description: 'Sample description',
        language: 'TypeScript',
        total_stars: 12000,
        daily_stars: 450,
        digest: 'AI Digest summary',
      },
    ];

    const saved: DailySnapshot = await db.saveDailySnapshot('2026-11-10', repos, 'client-node-1');
    expect(saved.snapshot_date).toBe('2026-11-10');
    expect(saved.repositories).toHaveLength(1);

    const retrieved: DailySnapshot | null = await db.getDailySnapshot('2026-11-10');
    expect(retrieved?.repositories[0].name).toBe('sample-repo');
  });

  it('manages discussion archives and public/private visibility', async (): Promise<void> => {
    const user1: User = await db.createUser('user1', 'pw1');
    const user2: User = await db.createUser('user2', 'pw2');

    await db.createDiscussionArchive({
      id: 'arch-1',
      user_id: user1.id,
      username: user1.username,
      snapshot_date: '2026-11-10',
      repo_full_name: 'facebook/react',
      repo_url: 'https://github.com/facebook/react',
      repo_digest: 'React library digest',
      discussion_summary: 'Discussion about React 19',
      messages: [
        { id: 'm1', role: 'user', content: 'What is new in React 19?', timestamp: '2026-11-10T12:00:00Z' },
        { id: 'm2', role: 'assistant', content: 'Actions, use() hook, etc.', timestamp: '2026-11-10T12:00:05Z' },
      ],
      is_public: false,
    });

    await db.createDiscussionArchive({
      id: 'arch-2',
      user_id: user2.id,
      username: user2.username,
      snapshot_date: '2026-11-10',
      repo_full_name: 'vercel/next.js',
      repo_url: 'https://github.com/vercel/next.js',
      repo_digest: 'Next.js digest',
      discussion_summary: 'Discussion about App Router',
      messages: [
        { id: 'm3', role: 'user', content: 'Tell me about RSC', timestamp: '2026-11-10T12:10:00Z' },
      ],
      is_public: true,
    });

    const user1Archives: DiscussionArchive[] = await db.listDiscussionArchivesByUser(user1.id);
    expect(user1Archives).toHaveLength(1);
    expect(user1Archives[0].id).toBe('arch-1');
    expect(user1Archives[0].messages).toHaveLength(2);

    const publicArchives: DiscussionArchive[] = await db.listPublicDiscussionArchives();
    expect(publicArchives).toHaveLength(1);
    expect(publicArchives[0].id).toBe('arch-2');

    const updated: DiscussionArchive | null = await db.updateArchiveVisibility('arch-1', user1.id, true);
    expect(updated?.is_public).toBe(true);

    const publicAfterToggle: DiscussionArchive[] = await db.listPublicDiscussionArchives();
    expect(publicAfterToggle).toHaveLength(2);
  });

  it('persists OAuth users with null password_hash and generated client_auth_key', async (): Promise<void> => {
    const oauthUser: User = await db.createOAuthUser({
      username: 'gh_developer',
      oauth_provider: 'github',
      oauth_id: 'gh-998877',
      email: 'dev@github.com',
      terms_agreed_at: '2026-11-11T12:00:00Z',
    });

    expect(oauthUser.id).toBeDefined();
    expect(oauthUser.username).toBe('gh_developer');
    expect(oauthUser.password_hash).toBeNull();
    expect(oauthUser.client_auth_key).toMatch(/^gta_live_/);
    expect(oauthUser.oauth_provider).toBe('github');
    expect(oauthUser.oauth_id).toBe('gh-998877');
    expect(oauthUser.email).toBe('dev@github.com');
    expect(oauthUser.terms_agreed_at).toBe('2026-11-11T12:00:00Z');

    const foundByOAuth: User | null = await db.findUserByOAuth('github', 'gh-998877');
    expect(foundByOAuth?.id).toBe(oauthUser.id);

    const notFound: User | null = await db.findUserByOAuth('github', 'nonexistent');
    expect(notFound).toBeNull();
  });

  it('prevents duplicate oauth identities and duplicate usernames', async (): Promise<void> => {
    await db.createOAuthUser({
      username: 'google_user',
      oauth_provider: 'google',
      oauth_id: 'g-112233',
    });

    await expect(
      db.createOAuthUser({
        username: 'google_user_diff',
        oauth_provider: 'google',
        oauth_id: 'g-112233',
      })
    ).rejects.toThrow(/already registered/);

    await expect(
      db.createOAuthUser({
        username: 'google_user',
        oauth_provider: 'kakao',
        oauth_id: 'k-445566',
      })
    ).rejects.toThrow(/already exists/);
  });

  it('finds users by email case-insensitively for both regular and oauth users', async (): Promise<void> => {
    const regUser: User = await db.createUser('regular_user', 'hashed_pass', undefined, 'User@Example.com');
    expect(regUser.email).toBe('User@Example.com');
    expect(regUser.oauth_provider).toBe('local');

    const oauthUser: User = await db.createOAuthUser({
      username: 'kakao_user',
      oauth_provider: 'kakao',
      oauth_id: 'k-9900',
      email: 'Kakao.User@Kakao.com',
    });

    const foundReg: User | null = await db.findUserByEmail('user@example.com');
    expect(foundReg?.id).toBe(regUser.id);

    const foundOAuth: User | null = await db.findUserByEmail('KAKAO.USER@KAKAO.COM');
    expect(foundOAuth?.id).toBe(oauthUser.id);
  });

  it('counts both regular users and oauth users in single users table', async (): Promise<void> => {
    expect(await db.countUsers()).toBe(0);

    await db.createUser('standard_user', 'pw123');
    await db.createOAuthUser({
      username: 'naver_user',
      oauth_provider: 'naver',
      oauth_id: 'naver-101',
    });
    await db.createOAuthUser({
      username: 'github_user',
      oauth_provider: 'github',
      oauth_id: 'gh-202',
    });

    const totalCount: number = await db.countUsers();
    expect(totalCount).toBe(3);
  });
});
