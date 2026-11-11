export type OAuthProvider = 'github' | 'google' | 'kakao' | 'naver' | 'local';

export interface User {
  id: string;
  username: string;
  password_hash?: string | null;
  client_auth_key: string;
  email?: string | null;
  oauth_provider?: OAuthProvider | null;
  oauth_id?: string | null;
  terms_agreed_at?: string | null;
  created_at: string;
}

export interface CreateOAuthUserParams {
  username: string;
  oauth_provider: OAuthProvider;
  oauth_id: string;
  email?: string | null;
  terms_agreed_at?: string | null;
  client_auth_key?: string;
}

export interface TrendingRepository {
  rank: number;
  name: string;
  full_name: string;
  url: string;
  description: string;
  language: string;
  total_stars: number;
  daily_stars: number;
  digest?: string;
  readme?: string;
}

export interface DailySnapshot {
  snapshot_date: string; // YYYY-MM-DD
  repositories: TrendingRepository[];
  created_by?: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface DiscussionArchive {
  id: string;
  user_id: string;
  username: string;
  snapshot_date: string;
  repo_full_name: string;
  repo_url: string;
  repo_digest: string;
  discussion_summary: string;
  messages: ChatMessage[];
  is_public: boolean;
  created_at: string;
}
