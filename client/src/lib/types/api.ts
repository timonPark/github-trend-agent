import { LocalSnapshot, TrendingRepository, DiscussionSession, ChatMessage, LocalArchive } from '../types';
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
 * Discussion Session DTOs
 */
export interface GetDiscussionResponseDto {
  session: DiscussionSession;
  isGated: boolean;
}

export interface SendDiscussionMessageRequestDto {
  repo_full_name: string;
  repo_url: string;
  message: string;
  digest?: string;
  readme?: string;
}

export interface SendDiscussionMessageResponseDto {
  session: DiscussionSession;
  latest_message: ChatMessage;
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

/**
 * Archive DTOs
 */
export interface CreateLocalArchiveRequestDto {
  id?: string;
  snapshot_date: string;
  repo_full_name: string;
  repo_url: string;
  repo_digest?: string;
  discussion_summary?: string;
  messages: ChatMessage[];
  is_public: boolean;
}

export interface CreateLocalArchiveResponseDto {
  archive: LocalArchive;
  synced_with_server: boolean;
}

export interface UpdateArchiveVisibilityRequestDto {
  id: string;
  is_public: boolean;
}

export interface UpdateArchiveVisibilityResponseDto {
  archive: LocalArchive;
  synced_with_server: boolean;
}

export interface GetLocalArchivesResponseDto {
  archives: LocalArchive[];
}

