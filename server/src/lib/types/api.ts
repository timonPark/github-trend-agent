import { DailySnapshot, TrendingRepository } from '../types';

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
