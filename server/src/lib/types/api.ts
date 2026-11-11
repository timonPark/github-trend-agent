import { DailySnapshot, TrendingRepository, DiscussionArchive, ChatMessage } from '../types';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RegisterRequestDto {
  username: string;
  password?: string;
}

export interface RegisterResponseDto {
  user_id: string;
  username: string;
  client_auth_key: string;
}

export interface LoginRequestDto {
  username: string;
  password?: string;
}

export interface LoginResponseDto {
  user_id: string;
  username: string;
  client_auth_key: string;
}

export interface VerifyKeyRequestDto {
  client_auth_key: string;
}

export interface VerifyKeyResponseDto {
  valid: boolean;
  user?: {
    id: string;
    username: string;
  };
  user_id?: string;
  username?: string;
  error?: string;
}

export interface GetSnapshotResponseDto {
  snapshot_date: string;
  repositories: TrendingRepository[];
  created_by?: string;
  updated_at: string;
}

export interface SaveSnapshotRequestDto {
  snapshot_date: string;
  repositories: TrendingRepository[];
}

export interface CreateArchiveRequestDto {
  id?: string;
  snapshot_date: string;
  repo_full_name: string;
  repo_url: string;
  repo_digest?: string;
  discussion_summary: string;
  messages: ChatMessage[];
  is_public: boolean;
}

export interface CreateArchiveResponseDto {
  archive: DiscussionArchive;
}

export interface UpdateArchiveVisibilityRequestDto {
  id: string;
  is_public: boolean;
}

export interface UpdateArchiveVisibilityResponseDto {
  archive: DiscussionArchive;
}

export interface GetArchivesResponseDto {
  archives: DiscussionArchive[];
}

export interface PlatformStatsResponseDto {
  snapshot_count: number;
  public_archive_count: number;
  total_user_count: number;
  today_top3: TrendingRepository[];
  recent_public_discussions: DiscussionArchive[];
}


