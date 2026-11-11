import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, DailySnapshot, DiscussionArchive, TrendingRepository, CreateOAuthUserParams } from './types';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function generateClientAuthKey(): string {
  return `gta_live_${crypto.randomBytes(24).toString('hex')}`;
}

interface LocalDbState {
  users: [string, User][];
  snapshots: [string, DailySnapshot][];
  archives: [string, DiscussionArchive][];
}

function resolveLocalDbPath(): string {
  const cwd: string = process.cwd();
  if (fs.existsSync(path.join(cwd, 'server'))) {
    return path.join(cwd, 'server', 'local-server-db.json');
  }
  return path.join(cwd, 'local-server-db.json');
}

function readLocalDbFromFile(): LocalDbState | null {
  if (process.env.NODE_ENV === 'test') return null;
  try {
    const fp: string = resolveLocalDbPath();
    if (fs.existsSync(fp)) {
      const content: string = fs.readFileSync(fp, 'utf-8');
      return JSON.parse(content) as LocalDbState;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeLocalDbToFile(state: LocalDbState): void {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const fp: string = resolveLocalDbPath();
    fs.writeFileSync(fp, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

export interface ServerDatabase {
  createUser(
    username: string,
    password_hash: string,
    client_auth_key?: string,
    email?: string,
    terms_agreed_at?: string
  ): Promise<User>;
  createOAuthUser(params: CreateOAuthUserParams): Promise<User>;
  findUserById(id: string): Promise<User | null>;
  findUserByUsername(username: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByOAuth(oauth_provider: string, oauth_id: string): Promise<User | null>;
  findUserByClientAuthKey(client_auth_key: string): Promise<User | null>;
  rotateClientAuthKey(user_id: string): Promise<string>;
  updateUserPassword(user_id: string, password_hash: string): Promise<User>;
  getDailySnapshot(snapshot_date: string): Promise<DailySnapshot | null>;
  listDailySnapshots(): Promise<DailySnapshot[]>;
  countUsers(): Promise<number>;
  saveDailySnapshot(snapshot_date: string, repositories: TrendingRepository[], created_by?: string): Promise<DailySnapshot>;
  createDiscussionArchive(archive: Omit<DiscussionArchive, 'created_at'>): Promise<DiscussionArchive>;
  getDiscussionArchiveById(id: string): Promise<DiscussionArchive | null>;
  listDiscussionArchivesByUser(user_id: string): Promise<DiscussionArchive[]>;
  listPublicDiscussionArchives(): Promise<DiscussionArchive[]>;
  updateArchiveVisibility(id: string, user_id: string, is_public: boolean): Promise<DiscussionArchive | null>;
}

export type ServerDbAdapter = ServerDatabase;

// In-Memory & Local file fallback implementation for tests and local standalone runs
class MemoryServerDatabase implements ServerDatabase {
  private users: Map<string, User> = new Map<string, User>();
  private snapshots: Map<string, DailySnapshot> = new Map<string, DailySnapshot>();
  private archives: Map<string, DiscussionArchive> = new Map<string, DiscussionArchive>();

  constructor() {
    this.syncFromDisk();
  }

  private syncFromDisk(): void {
    const state: LocalDbState | null = readLocalDbFromFile();
    if (state) {
      this.users = new Map<string, User>(state.users || []);
      this.snapshots = new Map<string, DailySnapshot>(state.snapshots || []);
      this.archives = new Map<string, DiscussionArchive>(state.archives || []);
    }
  }

  private syncToDisk(): void {
    const state: LocalDbState = {
      users: Array.from(this.users.entries()),
      snapshots: Array.from(this.snapshots.entries()),
      archives: Array.from(this.archives.entries()),
    };
    writeLocalDbToFile(state);
  }

  private async validateNewUser(username: string, email?: string): Promise<void> {
    const existing: User | null = await this.findUserByUsername(username);
    if (existing) {
      throw new Error(`Username ${username} already exists`);
    }
    if (email) {
      const existingEmail: User | null = await this.findUserByEmail(email);
      if (existingEmail) {
        throw new Error(`Email ${email} is already registered`);
      }
    }
  }

  async createUser(
    username: string,
    password_hash: string,
    client_auth_key?: string,
    email?: string,
    terms_agreed_at?: string
  ): Promise<User> {
    this.syncFromDisk();
    await this.validateNewUser(username, email);

    const user: User = {
      id: crypto.randomUUID(),
      username,
      password_hash,
      client_auth_key: client_auth_key || generateClientAuthKey(),
      email: email || null,
      oauth_provider: 'local',
      oauth_id: null,
      terms_agreed_at: terms_agreed_at || null,
      created_at: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    this.syncToDisk();
    return user;
  }

  private async validateOAuthUser(params: CreateOAuthUserParams): Promise<void> {
    const existingUsername: User | null = await this.findUserByUsername(params.username);
    if (existingUsername) {
      throw new Error(`Username ${params.username} already exists`);
    }
    const existingOAuth: User | null = await this.findUserByOAuth(params.oauth_provider, params.oauth_id);
    if (existingOAuth) {
      throw new Error(`OAuth account (${params.oauth_provider}:${params.oauth_id}) is already registered`);
    }
  }

  async createOAuthUser(params: CreateOAuthUserParams): Promise<User> {
    this.syncFromDisk();
    await this.validateOAuthUser(params);

    const user: User = {
      id: crypto.randomUUID(),
      username: params.username,
      password_hash: null,
      client_auth_key: params.client_auth_key || generateClientAuthKey(),
      email: params.email || null,
      oauth_provider: params.oauth_provider,
      oauth_id: params.oauth_id,
      terms_agreed_at: params.terms_agreed_at || null,
      created_at: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    this.syncToDisk();
    return user;
  }

  async findUserById(id: string): Promise<User | null> {
    this.syncFromDisk();
    return this.users.get(id) || null;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    this.syncFromDisk();
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    this.syncFromDisk();
    const normalized: string = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email && user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return null;
  }

  async findUserByOAuth(oauth_provider: string, oauth_id: string): Promise<User | null> {
    this.syncFromDisk();
    for (const user of this.users.values()) {
      if (user.oauth_provider === oauth_provider && user.oauth_id === oauth_id) {
        return user;
      }
    }
    return null;
  }

  async findUserByClientAuthKey(client_auth_key: string): Promise<User | null> {
    this.syncFromDisk();
    for (const user of this.users.values()) {
      if (user.client_auth_key === client_auth_key) {
        return user;
      }
    }
    return null;
  }

  async rotateClientAuthKey(user_id: string): Promise<string> {
    this.syncFromDisk();
    const user: User | undefined = this.users.get(user_id);
    if (!user) {
      throw new Error('User not found');
    }
    const newKey: string = `gta_live_${crypto.randomBytes(24).toString('hex')}`;
    user.client_auth_key = newKey;
    this.syncToDisk();
    return newKey;
  }

  async updateUserPassword(user_id: string, password_hash: string): Promise<User> {
    this.syncFromDisk();
    const user: User | undefined = this.users.get(user_id);
    if (!user) {
      throw new Error('User not found');
    }
    user.password_hash = password_hash;
    this.syncToDisk();
    return user;
  }

  async getDailySnapshot(snapshot_date: string): Promise<DailySnapshot | null> {
    this.syncFromDisk();
    return this.snapshots.get(snapshot_date) || null;
  }

  async listDailySnapshots(): Promise<DailySnapshot[]> {
    this.syncFromDisk();
    const list: DailySnapshot[] = Array.from(this.snapshots.values());
    return list.sort((a: DailySnapshot, b: DailySnapshot): number => b.snapshot_date.localeCompare(a.snapshot_date));
  }

  async countUsers(): Promise<number> {
    this.syncFromDisk();
    return this.users.size;
  }

  async saveDailySnapshot(snapshot_date: string, repositories: TrendingRepository[], created_by?: string): Promise<DailySnapshot> {
    this.syncFromDisk();
    const snapshot: DailySnapshot = {
      snapshot_date,
      repositories,
      created_by,
      updated_at: new Date().toISOString(),
    };
    this.snapshots.set(snapshot_date, snapshot);
    this.syncToDisk();
    return snapshot;
  }

  async createDiscussionArchive(data: Omit<DiscussionArchive, 'created_at'>): Promise<DiscussionArchive> {
    this.syncFromDisk();
    const archive: DiscussionArchive = {
      ...data,
      created_at: new Date().toISOString(),
    };
    this.archives.set(archive.id, archive);
    this.syncToDisk();
    return archive;
  }

  async getDiscussionArchiveById(id: string): Promise<DiscussionArchive | null> {
    this.syncFromDisk();
    return this.archives.get(id) || null;
  }

  async listDiscussionArchivesByUser(user_id: string): Promise<DiscussionArchive[]> {
    this.syncFromDisk();
    const results: DiscussionArchive[] = [];
    for (const item of this.archives.values()) {
      if (item.user_id === user_id) {
        results.push(item);
      }
    }
    return results.sort((a: DiscussionArchive, b: DiscussionArchive): number => b.created_at.localeCompare(a.created_at));
  }

  async listPublicDiscussionArchives(): Promise<DiscussionArchive[]> {
    this.syncFromDisk();
    const results: DiscussionArchive[] = [];
    for (const item of this.archives.values()) {
      if (item.is_public) {
        results.push(item);
      }
    }
    return results.sort((a: DiscussionArchive, b: DiscussionArchive): number => b.created_at.localeCompare(a.created_at));
  }

  async updateArchiveVisibility(id: string, user_id: string, is_public: boolean): Promise<DiscussionArchive | null> {
    this.syncFromDisk();
    const item: DiscussionArchive | undefined = this.archives.get(id);
    if (!item || item.user_id !== user_id) {
      return null;
    }
    item.is_public = is_public;
    this.syncToDisk();
    return item;
  }
}

// Supabase Implementation
class SupabaseServerDatabase implements ServerDatabase {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async createUser(
    username: string,
    password_hash: string,
    client_auth_key?: string,
    email?: string,
    terms_agreed_at?: string
  ): Promise<User> {
    const key: string = client_auth_key || generateClientAuthKey();
    const payload: Record<string, unknown> = {
      username,
      password_hash,
      client_auth_key: key,
      email: email || null,
      oauth_provider: 'local',
      terms_agreed_at: terms_agreed_at || null,
    };
    const { data, error } = await this.client.from('users').insert(payload).select().single();
    if (error) {
      throw new Error(error.message);
    }
    return data as User;
  }

  async createOAuthUser(params: CreateOAuthUserParams): Promise<User> {
    const key: string = params.client_auth_key || generateClientAuthKey();
    const payload: Record<string, unknown> = {
      username: params.username,
      password_hash: null,
      client_auth_key: key,
      email: params.email || null,
      oauth_provider: params.oauth_provider,
      oauth_id: params.oauth_id,
      terms_agreed_at: params.terms_agreed_at || null,
    };
    const { data, error } = await this.client.from('users').insert(payload).select().single();
    if (error) {
      throw new Error(error.message);
    }
    return data as User;
  }

  async findUserById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select()
      .eq('id', id)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data as User | null;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select()
      .eq('username', username)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data as User | null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select()
      .ilike('email', email.trim())
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data as User | null;
  }

  async findUserByOAuth(oauth_provider: string, oauth_id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select()
      .eq('oauth_provider', oauth_provider)
      .eq('oauth_id', oauth_id)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data as User | null;
  }

  async findUserByClientAuthKey(client_auth_key: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select()
      .eq('client_auth_key', client_auth_key)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data as User | null;
  }

  async rotateClientAuthKey(user_id: string): Promise<string> {
    const newKey: string = `gta_live_${crypto.randomBytes(24).toString('hex')}`;
    const { error } = await this.client
      .from('users')
      .update({ client_auth_key: newKey })
      .eq('id', user_id);
    if (error) {
      throw new Error(error.message);
    }
    return newKey;
  }

  async updateUserPassword(user_id: string, password_hash: string): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .update({ password_hash })
      .eq('id', user_id)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data as User;
  }

  async getDailySnapshot(snapshot_date: string): Promise<DailySnapshot | null> {
    const { data, error } = await this.client
      .from('daily_snapshots')
      .select()
      .eq('snapshot_date', snapshot_date)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data as DailySnapshot | null;
  }

  async listDailySnapshots(): Promise<DailySnapshot[]> {
    const { data, error } = await this.client
      .from('daily_snapshots')
      .select()
      .order('snapshot_date', { ascending: false });
    if (error || !data) return [];
    return data as DailySnapshot[];
  }

  async countUsers(): Promise<number> {
    const { count, error } = await this.client
      .from('users')
      .select('*', { count: 'exact', head: true });
    return error ? 0 : (count || 0);
  }

  async saveDailySnapshot(snapshot_date: string, repositories: TrendingRepository[], created_by?: string): Promise<DailySnapshot> {
    const payload: {
      snapshot_date: string;
      repositories: TrendingRepository[];
      created_by?: string;
      updated_at: string;
    } = {
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
    if (error) {
      throw new Error(error.message);
    }
    return data as DailySnapshot;
  }

  async createDiscussionArchive(archive: Omit<DiscussionArchive, 'created_at'>): Promise<DiscussionArchive> {
    const payload: Omit<DiscussionArchive, 'created_at'> & { created_at: string } = {
      ...archive,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await this.client
      .from('discussion_archives')
      .insert(payload)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data as DiscussionArchive;
  }

  async getDiscussionArchiveById(id: string): Promise<DiscussionArchive | null> {
    const { data, error } = await this.client
      .from('discussion_archives')
      .select()
      .eq('id', id)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data as DiscussionArchive | null;
  }

  async listDiscussionArchivesByUser(user_id: string): Promise<DiscussionArchive[]> {
    const { data, error } = await this.client
      .from('discussion_archives')
      .select()
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    return (data || []) as DiscussionArchive[];
  }

  async listPublicDiscussionArchives(): Promise<DiscussionArchive[]> {
    const { data, error } = await this.client
      .from('discussion_archives')
      .select()
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
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
    if (error) {
      throw new Error(error.message);
    }
    return data as DiscussionArchive | null;
  }
}

// Global DB Singleton across Next.js route chunks in Node process
const globalForDb = globalThis as unknown as {
  serverDbInstance?: ServerDatabase;
};

export function getServerDb(): ServerDatabase {
  if (globalForDb.serverDbInstance) {
    return globalForDb.serverDbInstance;
  }

  const url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    globalForDb.serverDbInstance = new SupabaseServerDatabase(url, key);
  } else {
    globalForDb.serverDbInstance = new MemoryServerDatabase();
  }
  return globalForDb.serverDbInstance;
}

export function resetServerDbForTest(): ServerDatabase {
  globalForDb.serverDbInstance = new MemoryServerDatabase();
  return globalForDb.serverDbInstance;
}
