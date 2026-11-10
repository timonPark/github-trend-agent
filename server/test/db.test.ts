import { describe, it, expect, beforeEach } from 'vitest';
import { getServerDb, resetServerDbForTest } from '../src/lib/db';

describe('Central Server Database Layer', () => {
  let db: ReturnType<typeof getServerDb>;

  beforeEach(() => {
    db = resetServerDbForTest();
  });

  it('creates user with client_auth_key and allows rotation', async () => {
    const user = await db.createUser('timonPark', 'hash123');

    expect(user.username).toBe('timonPark');
    expect(user.client_auth_key).toMatch(/^gta_live_/);

    const found = await db.findUserByClientAuthKey(user.client_auth_key);
    expect(found?.id).toBe(user.id);

    const oldKey = user.client_auth_key;
    const newKey = await db.rotateClientAuthKey(user.id);
    expect(newKey).not.toBe(oldKey);

    const oldLookup = await db.findUserByClientAuthKey(oldKey);
    expect(oldLookup).toBeNull();

    const newLookup = await db.findUserByClientAuthKey(newKey);
    expect(newLookup?.id).toBe(user.id);
  });

  it('saves and retrieves daily snapshots by date key', async () => {
    const repos = [
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

    const saved = await db.saveDailySnapshot('2026-11-10', repos, 'client-node-1');
    expect(saved.snapshot_date).toBe('2026-11-10');
    expect(saved.repositories).toHaveLength(1);

    const retrieved = await db.getDailySnapshot('2026-11-10');
    expect(retrieved?.repositories[0].name).toBe('sample-repo');
  });

  it('manages discussion archives and public/private visibility', async () => {
    const user1 = await db.createUser('user1', 'pw1');
    const user2 = await db.createUser('user2', 'pw2');

    // Archive 1: Private (Default)
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

    // Archive 2: Public
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

    // User 1 sees their private archive
    const user1Archives = await db.listDiscussionArchivesByUser(user1.id);
    expect(user1Archives).toHaveLength(1);
    expect(user1Archives[0].id).toBe('arch-1');
    expect(user1Archives[0].messages).toHaveLength(2);

    // Public feed contains only public archive
    const publicArchives = await db.listPublicDiscussionArchives();
    expect(publicArchives).toHaveLength(1);
    expect(publicArchives[0].id).toBe('arch-2');

    // Toggle arch-1 to public
    const updated = await db.updateArchiveVisibility('arch-1', user1.id, true);
    expect(updated?.is_public).toBe(true);

    const publicAfterToggle = await db.listPublicDiscussionArchives();
    expect(publicAfterToggle).toHaveLength(2);
  });
});
