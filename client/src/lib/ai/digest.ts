import { Database as DatabaseInstance } from 'better-sqlite3';
import { TrendingRepository } from '../types';
import { AiAgentConfig, AiExecutionResult } from './types';
import { CapabilityGateStatusDto } from '../types/api';
import { executeAiRequest } from './runner';
import { getSetting } from '../db';

function isDirectApiProvider(provider: AiAgentConfig['provider']): boolean {
  return provider === 'api-openai' || provider === 'api-anthropic' || provider === 'api-gemini';
}

function hasMissingApiKey(config: AiAgentConfig): boolean {
  return isDirectApiProvider(config.provider) && (!config.apiKey || config.apiKey.trim().length === 0);
}

/**
 * Checks whether the AI agent is configured and capable of running tasks.
 */
export function checkAiCapability(config: AiAgentConfig): CapabilityGateStatusDto {
  if (config.provider === 'none') {
    return {
      enabled: false,
      provider: 'none',
      reason: 'AI 에이전트가 연동되지 않았습니다. 설정 탭에서 로컬 AI 모델 또는 API Key를 설정해주세요.',
    };
  }

  if (hasMissingApiKey(config)) {
    return {
      enabled: false,
      provider: config.provider,
      reason: `${config.provider} 사용을 위한 API Key가 설정되지 않았습니다.`,
    };
  }

  return { enabled: true, provider: config.provider };
}

function formatRepoMetadata(repo: TrendingRepository): string[] {
  return [
    `당신은 오픈소스 소프트웨어 전문 기술 분석가입니다.`,
    `아래 GitHub 저장소의 메타데이터와 README 내용을 바탕으로, 개발자들이 핵심 가치를 즉시 파악할 수 있도록 정확히 3줄로 핵심 요약(Repository Digest)을 한국어로 작성해주세요.`,
    ``,
    `[저장소 정보]`,
    `- 저장소명: ${repo.full_name}`,
    `- 한줄 설명: ${repo.description || '없음'}`,
    `- 주요 프로그래밍 언어: ${repo.language || '지정되지 않음'}`,
    `- 전체 스타 수: ${repo.total_stars.toLocaleString()}`,
    `- 당일 급상승 스타 수: +${repo.daily_stars.toLocaleString()}`,
  ];
}

function formatReadmeSnippet(readme?: string): string[] {
  if (!readme || readme.trim().length === 0) {
    return [];
  }
  const snippet: string = readme.length > 3000 ? readme.slice(0, 3000) + '\n...(이하 생략)' : readme;
  return [``, `[README 본문]`, snippet];
}

function formatPromptRules(): string[] {
  return [
    ``,
    `[작성 규칙]`,
    `1. 반드시 아래 3개 항목에 맞추어 정확히 3줄로 작성하십시오. 불필요한 서론이나 결론 문구는 생략하십시오.`,
    `   - 목적: (이 프로젝트가 해결하고자 하는 핵심 문제 및 존재 목적)`,
    `   - 주요 기능: (가장 핵심적인 기술적 기능 2~3가지)`,
    `   - 기술적 가치: (기존 대안 대비 차별점 또는 개발 생태계에 주는 시사점)`,
  ];
}

/**
 * Builds a prompt for generating a 3-line Repository Digest.
 */
export function buildDigestPrompt(repo: TrendingRepository): string {
  const meta: string[] = formatRepoMetadata(repo);
  const readme: string[] = formatReadmeSnippet(repo.readme);
  const rules: string[] = formatPromptRules();
  return [...meta, ...readme, ...rules].join('\n');
}

/**
 * Executes the AI agent to generate a Repository Digest.
 */
export async function generateRepoDigest(
  config: AiAgentConfig,
  repo: TrendingRepository
): Promise<{ digest: string; provider: AiAgentConfig['provider']; model: string }> {
  const capability: CapabilityGateStatusDto = checkAiCapability(config);
  if (!capability.enabled) {
    throw new Error(capability.reason || 'AI agent capability is disabled');
  }

  const prompt: string = buildDigestPrompt(repo);
  const result: AiExecutionResult = await executeAiRequest(config, prompt, repo.readme);
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate repository digest');
  }

  return {
    digest: result.response.trim(),
    provider: result.providerUsed || config.provider,
    model: config.model,
  };
}

function getServerSyncConfig(db?: DatabaseInstance): { serverUrl: string; serverAuthKey: string | null } {
  const serverUrl: string = getSetting('server_url', db) || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
  const serverAuthKey: string | null = getSetting('server_auth_key', db);
  return { serverUrl, serverAuthKey };
}

async function sendSnapshotToRemote(
  serverUrl: string,
  authKey: string,
  snapshot_date: string,
  repositories: TrendingRepository[]
): Promise<boolean> {
  try {
    const res: Response = await fetch(`${serverUrl}/api/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authKey}` },
      body: JSON.stringify({ snapshot_date, repositories }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Synchronizes updated snapshot repositories with the central server if configured.
 */
export async function syncSnapshotToServer(
  snapshot_date: string,
  repositories: TrendingRepository[],
  db?: DatabaseInstance
): Promise<boolean> {
  const { serverUrl, serverAuthKey } = getServerSyncConfig(db);
  if (!serverAuthKey || serverAuthKey.trim().length === 0) {
    return false;
  }
  return sendSnapshotToRemote(serverUrl, serverAuthKey, snapshot_date, repositories);
}
