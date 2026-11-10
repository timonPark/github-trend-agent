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

export interface LocalSnapshot {
  snapshot_date: string; // YYYY-MM-DD
  repositories: TrendingRepository[];
  source: 'local-scraper' | 'remote-server';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface DiscussionSession {
  id: string;
  repo_full_name: string;
  repo_url: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface LocalArchive {
  id: string;
  user_id: string;
  snapshot_date: string;
  repo_full_name: string;
  repo_url: string;
  repo_digest: string;
  discussion_summary: string;
  messages: ChatMessage[];
  is_public: boolean;
  synced_with_server: boolean;
  created_at: string;
}
