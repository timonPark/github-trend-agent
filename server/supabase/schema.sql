-- Supabase PostgreSQL Schema for GitHub Trend Agent Central Server

-- 1. Users Table (Account & Client Auth Key Management)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text,                  -- Optional for OAuth users
  client_auth_key text unique not null, -- Key used by client to authenticate with central server
  email text,
  oauth_provider text,                 -- 'github' | 'google' | 'kakao' | 'naver' | 'local'
  oauth_id text,
  terms_agreed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint uq_users_oauth unique (oauth_provider, oauth_id)
);

create index if not exists idx_users_client_auth_key on public.users(client_auth_key);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_oauth on public.users(oauth_provider, oauth_id);

-- 2. Daily Trending Snapshots Table (Shared across all clients per date)
create table if not exists public.daily_snapshots (
  snapshot_date text primary key,      -- Format: YYYY-MM-DD (00:00 midnight base)
  repositories jsonb not null,         -- Array of Top 10 Trending Repository + Repository Digest
  created_by text,
  updated_at timestamptz not null default now()
);

-- 3. Discussion Archives Table (Discussion Summary + Digest + Transcript + Public/Private)
create table if not exists public.discussion_archives (
  id text primary key,
  user_id text not null,
  username text not null,
  snapshot_date text not null,
  repo_full_name text not null,
  repo_url text not null,
  repo_digest text not null,
  discussion_summary text not null,
  messages jsonb not null,             -- Array of chat messages [{role, content, timestamp}]
  is_public boolean not null default false, -- Public/Private toggle
  created_at timestamptz not null default now()
);

create index if not exists idx_discussion_archives_user_id on public.discussion_archives(user_id);
create index if not exists idx_discussion_archives_is_public on public.discussion_archives(is_public);
create index if not exists idx_discussion_archives_repo_name on public.discussion_archives(repo_full_name);
