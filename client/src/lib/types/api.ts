import { LocalSnapshot, TrendingRepository } from '../types';
import { AiAgentConfig, AiExecutionResult, DetectedCli } from '../ai/types';

/**
 * Standard Envelope for API Responses
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Auth & Client Key Verification DTOs
 */
export interface VerifyKeyRequestDto {
  client_auth_key: string;
}

export interface VerifyKeyResponseDto {
  valid: boolean;
  user_id?: string;
  email?: string;
  error?: string;
}

export interface AuthStatusResponseDto {
  configured: boolean;
  valid: boolean;
  user_id?: string;
  email?: string;
  error?: string;
}

/**
 * AI Settings & Status DTOs
 */
export interface AiStatusResponseDto {
  config: AiAgentConfig;
  detectedClis: DetectedCli[];
}

export interface AiTestRequestDto {
  provider?: AiAgentConfig['provider'];
  model?: string;
  apiKey?: string;
  cliPath?: string;
  prompt?: string;
}

export type AiTestResponseDto = AiExecutionResult;

export interface CapabilityGateStatusDto {
  enabled: boolean;
  provider: AiAgentConfig['provider'];
  reason?: string;
}

export interface GenerateDigestRequestDto {
  snapshot_date: string;
  repo_full_name: string;
}

export interface GenerateDigestResponseDto {
  snapshot_date: string;
  repo_full_name: string;
  digest: string;
  provider: AiAgentConfig['provider'];
  model: string;
  synced_with_server: boolean;
}

/**
 * Trending & Snapshot DTOs
 */
export interface TrendingResponseDto {
  snapshot_date: string;
  source: 'local-scraper' | 'remote-server';
  count: number;
  repositories: TrendingRepository[];
  cached?: boolean;
}

export interface ScrapeTrendingResponseDto {
  snapshot_date: string;
  count: number;
  repositories: TrendingRepository[];
  source: 'local-scraper';
}

/**
 * Client Local Settings DTO
 */
export interface ClientSettingsDto {
  client_auth_key: string;
  server_url: string;
  ai_provider: AiAgentConfig['provider'];
  ai_model: string;
  ai_api_key?: string;
  ai_cli_path?: string;
}
