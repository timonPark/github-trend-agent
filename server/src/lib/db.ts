import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, DailySnapshot, DiscussionArchive, TrendingRepository, ChatMessage } from './types';
import crypto from 'crypto';

export interface ServerDatabase {
  createUser(username: string, password_hash: string, client_auth_key?: string): Promise<User>;
  findUserById(id: string): Promise<User | null>;
  findUserByUsername(username: string): Promise<User | null>;
  findUserByClientAuthKey(client_auth_key: string): Promise<User | null>;
  rotateClientAuthKey(user_id: string): Promise<string>;
  getDailySnapshot(snapshot_date: string): Promise<DailySnapshot | null>;
  saveDailySnapshot(snapshot_date: string, repositories: TrendingRepository[], created_by?: string): Promise<DailySnapshot>;
  createDiscussionArchive(archive: Omit<DiscussionArchive, 'created_at'>): Promise<DiscussionArchive>;
  getDiscussionArchiveById(id: string): Promise<DiscussionArchive | null>;
  listDiscussionArchivesByUser(user_id: string): Promise<DiscussionArchive[]>;
  listPublicDiscussionArchives(): Promise<DiscussionArchive[]>;
  updateArchiveVisibility(id: string, user_id: string, is_public: boolean): Promise<DiscussionArchive | null>;
}

export type ServerDbAdapter = ServerDatabase;

// In-Memory fallback implementation for tests and local standalone runs
class MemoryServerDatabase implements ServerDatabase {
  private users: Map<string, User> = new Map();
  private snapshots: Map<string, DailySnapshot> = new Map();
  private archives: Map<string, DiscussionArchive> = new Map();

  async createUser(username: string, password_hash: string, client_auth_key?: string): Promise<User> {
    const existing = await this.findUserByUsername(username);
    if (existing) {
      throw new Error(`Username ${username} already exists`);
    }

    const user: User = {
      id: crypto.randomUUID(),
      username,
      password_hash,
      client_auth_key: client_auth_key || `gta_live_${crypto.randomBytes(24).toString('hex')}`,
      created_at: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return null;
  }

  async findUserByClientAuthKey(client_auth_key: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.client_auth_key === client_auth_key) return user;
    }
    return null;
  }

  async rotateClientAuthKey(user_id: string): Promise<string> {
    const user = this.users.get(user_id);
    if (!user) throw new Error('User not found');
    const newKey = `gta_live_${crypto.randomBytes(24).toString('hex')}`;
    user.client_auth_key = newKey;
    return newKey;
  }

  async getDailySnapshot(snapshot_date: string): Promise<DailySnapshot | null> {
    return this.snapshots.get(snapshot_date) || null;
  }

  async saveDailySnapshot(snapshot_date: string, repositories: TrendingRepository[], created_by?: string): Promise<DailySnapshot> {
    const snapshot: DailySnapshot = {
      snapshot_date,
      repositories,
      created_by,
      updated_at: new Date().toISOString(),
    };
    this.snapshots.set(snapshot_date, snapshot);
    return snapshot;
  }

  async createDiscussionArchive(data: Omit<DiscussionArchive, 'created_at'>): Promise<DiscussionArchive> {
    const archive: DiscussionArchive = {
      ...data,
      created_at: new Date().toISOString(),
    };
    this.archives.set(archive.id, archive);
    return archive;
  }

  async getDiscussionArchiveById(id: string): Promise<DiscussionArchive | null> {
    return this.archives.get(id) || null;
  }

  async listDiscussionArchivesByUser(user_id: string): Promise<DiscussionArchive[]> {
    const results: DiscussionArchive[] = [];
    for (const item of this.archives.values()) {
      if (item.user_id === user_id) {
        results.push(item);
      }
    }
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async listPublicDiscussionArchives(): Promise<DiscussionArchive[]> {
    const results: DiscussionArchive[] = [];
    for (const item of this.archives.values()) {
      if (item.is_public) {
        results.push(item);
      }
    }
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async updateArchiveVisibility(id: string, user_id: string, is_public: boolean): Promise<DiscussionArchive | null> {
    const item = this.archives.get(id);
    if (!item || item.user_id !== user_id) {
      return null;
    }
    item.is_public = is_public;
    return item;
  }
}

// Supabase Implementation
class SupabaseServerDatabase implements ServerDatabase {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async createUser(username: string, password_hash: string, client_auth_key?: string): Promise<User> {
    const key = client_auth_key || `gta_live_${crypto.randomBytes(24).toString('hex')}`;
    const { data, error } = await this.client
      .from('users')
      .insert({ username, password_hash, client_auth_key: key })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as User;
  }

  async findUserById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select()
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as User | null;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select()
      .eq('username', username)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as User | null;
  }

  async findUserByClientAuthKey(client_auth_key: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select()
      .eq('client_auth_key', client_auth_key)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as User | null;
  }

  async rotateClientAuthKey(user_id: string): Promise<string> {
    const newKey = `gta_live_${crypto.randomBytes(24).toString('hex')}`;
    const { error } = await this.client
      .from('users')
      .update({ client_auth_key: newKey })
      .eq('id', user_id);
    if (error) throw new Error(error.message);
    return newKey;
  }

  async getDailySnapshot(snapshot_date: string): Promise<DailySnapshot | null> {
    const { data, error } = await this.client
      .from('daily_snapshots')
      .select()
      .eq('snapshot_date', snapshot_date)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as DailySnapshot | null;
  }

  async saveDailySnapshot(snapshot_date: string, repositories: TrendingRepository[], created_by?: string): Promise<DailySnapshot> {
    const payload = {
      snapshot_date,
      repositories,
      created_by,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await this.client
      .from('daily_snapshots')
      .upsert(payload, { onConflict: 'snapshot_date' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as DailySnapshot;
  }

  async createDiscussionArchive(archive: Omit<DiscussionArchive, 'created_at'>): Promise<DiscussionArchive> {
    const payload = {
      ...archive,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await this.client
      .from('discussion_archives')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as DiscussionArchive;
  }

  async getDiscussionArchiveById(id: string): Promise<DiscussionArchive | null> {
    const { data, error } = await this.client
      .from('discussion_archives')
      .select()
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as DiscussionArchive | null;
  }

  async listDiscussionArchivesByUser(user_id: string): Promise<DiscussionArchive[]> {
    const { data, error } = await this.client
      .from('discussion_archives')
      .select()
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as DiscussionArchive[];
  }

  async listPublicDiscussionArchives(): Promise<DiscussionArchive[]> {
    const { data, error } = await this.client
      .from('discussion_archives')
      .select()
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as DiscussionArchive[];
  }

  async updateArchiveVisibility(id: string, user_id: string, is_public: boolean): Promise<DiscussionArchive | null> {
    const { data, error } = await this.client
      .from('discussion_archives')
      .update({ is_public })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as DiscussionArchive | null;
  }
}

// Global DB Singleton
let dbInstance: ServerDatabase | null = null;

export function getServerDb(): ServerDatabase {
  if (dbInstance) return dbInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    dbInstance = new SupabaseServerDatabase(url, key);
  } else {
    dbInstance = new MemoryServerDatabase();
  }
  return dbInstance;
}

export function resetServerDbForTest(): ServerDatabase {
  dbInstance = new MemoryServerDatabase();
  return dbInstance;
}
