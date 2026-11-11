import { ChatMessage, TrendingRepository } from '../types';
import { AiAgentConfig, AiExecutionResult } from './types';
import { executeAiRequest } from './runner';
import { checkAiCapability } from './digest';

function formatRepoContext(repo: Partial<TrendingRepository>): string[] {
  return [
    `당신은 오픈소스 소프트웨어 기술 분석 및 아키텍처 토론 전문 AI 파트너입니다.`,
    `사용자와 함께 선택한 오픈소스 프로젝트에 대해 깊이 있는 기술적 질의응답과 토론을 진행합니다.`,
    ``,
    `[대상 저장소]`,
    `- 저장소명: ${repo.full_name || '알 수 없음'}`,
    `- 설명: ${repo.description || '없음'}`,
    `- 언어: ${repo.language || '지정되지 않음'}`,
    `- 스타 수: ${repo.total_stars ? repo.total_stars.toLocaleString() : 'N/A'}`,
  ];
}

function formatDigestContext(digest?: string): string[] {
  if (!digest || digest.trim().length === 0) return [];
  return [``, `[Repository Digest (AI 3줄 핵심 요약)]`, digest];
}

function formatReadmeContext(readme?: string): string[] {
  if (!readme || readme.trim().length === 0) return [];
  const snippet: string = readme.length > 2500 ? readme.slice(0, 2500) + '\n...(생략)' : readme;
  return [``, `[README 핵심 발췌]`, snippet];
}

export function buildDiscussionSystemPrompt(repo: Partial<TrendingRepository>): string {
  const meta: string[] = formatRepoContext(repo);
  const digest: string[] = formatDigestContext(repo.digest);
  const readme: string[] = formatReadmeContext(repo.readme);
  return [...meta, ...digest, ...readme].join('\n');
}

export function formatConversationHistory(messages: ChatMessage[]): string {
  if (messages.length === 0) return '없음';
  return messages
    .slice(-6)
    .map((m: ChatMessage): string => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');
}

function buildFullPrompt(system: string, history: string, current: string): string {
  return [
    system,
    ``,
    `[이전 대화 맥락]`,
    history,
    ``,
    `[사용자 최신 질문/의견]`,
    current,
    ``,
    `친절하고 전문적이며 핵심을 짚는 기술 답변을 한국어로 제공하십시오.`,
  ].join('\n');
}

export async function executeDiscussionChat(
  config: AiAgentConfig,
  systemPrompt: string,
  historyMessages: ChatMessage[],
  userMessage: string
): Promise<string> {
  const capability = checkAiCapability(config);
  if (!capability.enabled) {
    throw new Error(capability.reason || 'AI capability is disabled');
  }

  const historyText: string = formatConversationHistory(historyMessages);
  const prompt: string = buildFullPrompt(systemPrompt, historyText, userMessage);
  const result: AiExecutionResult = await executeAiRequest(config, prompt);

  if (!result.success) {
    throw new Error(result.error || 'Failed to generate discussion response');
  }
  return result.response.trim();
}
