'use client';

import React, { useState } from 'react';
import { AiAgentConfig, DetectedCli } from '../lib/ai/types';
import { toErrorMessage } from '../lib/types/error';
import { ApiResponse, ClientSettingsDto, AiTestResponseDto } from '../lib/types/api';

interface LocalStats {
  snapshotCount: number;
  sessionCount: number;
  archiveCount: number;
}

interface SettingsTabProps {
  serverUrl: string;
  serverAuthKey: string;
  stats: LocalStats;
  authExpiredAlert: string | null;
  aiConfig: AiAgentConfig;
  detectedClis: DetectedCli[];
  onSettingsSaved: () => void;
}

export function SettingsTab({
  serverUrl: initialServerUrl,
  serverAuthKey: initialServerAuthKey,
  stats,
  authExpiredAlert,
  aiConfig: initialAiConfig,
  detectedClis,
  onSettingsSaved,
}: SettingsTabProps): React.JSX.Element {
  // Server Settings Form State
  const [serverUrl, setServerUrl] = useState<string>(initialServerUrl);
  const [serverAuthKey, setServerAuthKey] = useState<string>(initialServerAuthKey);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // AI Agent Settings Form State
  const [aiProvider, setAiProvider] = useState<AiAgentConfig['provider']>(initialAiConfig.provider);
  const [aiModel, setAiModel] = useState<string>(initialAiConfig.model || 'default');
  const [aiApiKey, setAiApiKey] = useState<string>(initialAiConfig.apiKey || '');
  const [aiSaving, setAiSaving] = useState<boolean>(false);
  const [aiTesting, setAiTesting] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSaveServerSettings = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    try {
      const res: Response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_url: serverUrl.trim(),
          server_auth_key: serverAuthKey.trim(),
        }),
      });
      const data: ApiResponse<ClientSettingsDto> = (await res.json()) as ApiResponse<ClientSettingsDto>;
      if (!res.ok || !data.success) {
        throw new Error(data.error || '설정 저장에 실패했습니다.');
      }
      setSettingsSuccess('중앙 서버 설정이 성공적으로 저장 및 검증되었습니다.');
      onSettingsSaved();
    } catch (err: unknown) {
      setSettingsError(toErrorMessage(err));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveAiSettings = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setAiSaving(true);
    setAiMessage(null);
    setAiError(null);

    try {
      const res: Response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_provider: aiProvider,
          ai_model: aiModel,
          ai_api_key: aiApiKey.trim(),
        }),
      });
      const data: ApiResponse<ClientSettingsDto> = (await res.json()) as ApiResponse<ClientSettingsDto>;
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI 설정 저장에 실패했습니다.');
      }
      setAiMessage('AI Agent 설정이 저장되었습니다.');
      onSettingsSaved();
    } catch (err: unknown) {
      setAiError(toErrorMessage(err));
    } finally {
      setAiSaving(false);
    }
  };

  const handleTestAi = async (): Promise<void> => {
    setAiTesting(true);
    setAiMessage(null);
    setAiError(null);

    try {
      const res: Response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          model: aiModel,
          apiKey: aiApiKey.trim(),
        }),
      });
      const data: AiTestResponseDto = (await res.json()) as AiTestResponseDto;
      if (!data.success) {
        throw new Error(data.error || 'AI 연결 테스트 실패');
      }
      setAiMessage(`AI 연결 성공! (${data.latencyMs}ms 소요)\n응답 요약: ${data.response.slice(0, 100)}...`);
    } catch (err: unknown) {
      setAiError(toErrorMessage(err));
    } finally {
      setAiTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 401 Alert */}
      {authExpiredAlert && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fff8c5',
            border: '1px solid #d4a72c',
            borderRadius: '6px',
            color: '#7d4e00',
            fontSize: '13px',
          }}
        >
          {authExpiredAlert}
        </div>
      )}

      {/* 1. Server Settings */}
      <div
        style={{
          padding: '24px',
          backgroundColor: '#ffffff',
          border: '1px solid #d0d7de',
          borderRadius: '6px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: '#1f2328' }}>
          중앙 서버 및 인증 설정
        </h3>

        {settingsSuccess && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#dafbe1',
              border: '1px solid #1a7f37',
              borderRadius: '6px',
              color: '#1a7f37',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {settingsSuccess}
          </div>
        )}

        {settingsError && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#ffebe9',
              border: '1px solid #ff8182',
              borderRadius: '6px',
              color: '#cf222e',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {settingsError}
          </div>
        )}

        <form onSubmit={handleSaveServerSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              중앙 서버 URL
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setServerUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Client Auth Key
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={serverAuthKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setServerAuthKey(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontFamily: 'ui-monospace, monospace',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                }}
              />
              <button
                type="button"
                onClick={(): void => setShowKey(!showKey)}
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                  backgroundColor: '#f6f8fa',
                  cursor: 'pointer',
                }}
              >
                {showKey ? '숨김' : '표시'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={savingSettings}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#1f883d',
                border: '1px solid rgba(31,35,40,0.15)',
                borderRadius: '6px',
                cursor: savingSettings ? 'not-allowed' : 'pointer',
              }}
            >
              {savingSettings ? '저장 및 검증 중...' : '서버 설정 저장'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. AI Agent Settings */}
      <div
        style={{
          padding: '24px',
          backgroundColor: '#ffffff',
          border: '1px solid #d0d7de',
          borderRadius: '6px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0', color: '#1f2328' }}>
          Local AI Agent 연동 설정
        </h3>
        <p style={{ fontSize: '13px', color: '#656d76', margin: '0 0 16px 0' }}>
          로컬 CLI(Claude, Gemini, Ollama)를 감지하거나 Direct API Key를 연동하여 AI 요약 및 실시간 토론 기능을 활성화합니다.
        </p>

        {aiMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#dafbe1',
              border: '1px solid #1a7f37',
              borderRadius: '6px',
              color: '#1a7f37',
              fontSize: '13px',
              marginBottom: '16px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {aiMessage}
          </div>
        )}

        {aiError && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#ffebe9',
              border: '1px solid #ff8182',
              borderRadius: '6px',
              color: '#cf222e',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {aiError}
          </div>
        )}

        {/* Detected CLIs */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#656d76', marginBottom: '8px' }}>
            감지된 로컬 AI 도구 상태:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {detectedClis.map((cli: DetectedCli): React.JSX.Element => (
              <span
                key={cli.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backgroundColor: cli.installed ? '#dafbe1' : '#f6f8fa',
                  color: cli.installed ? '#1a7f37' : '#656d76',
                  border: `1px solid ${cli.installed ? '#1a7f37' : '#d0d7de'}`,
                }}
              >
                <span>{cli.installed ? '●' : '○'}</span>
                <strong>{cli.name}</strong>
                <span>{cli.installed ? '(설치됨)' : '(미설치)'}</span>
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveAiSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              AI 제공자 (Provider)
            </label>
            <select
              value={aiProvider}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>): void =>
                setAiProvider(e.target.value as AiAgentConfig['provider'])
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="none">비활성화 (None - Capability Gated)</option>
              <option value="mock">Mock Provider (오프라인 로컬 개발 및 테스트)</option>
              <option value="cli-claude">Claude Code CLI (Headless Local)</option>
              <option value="cli-gemini">Gemini CLI (Google AGY Headless)</option>
              <option value="cli-ollama">Ollama (Local LLM HTTP)</option>
              <option value="api-openai">Direct API: OpenAI (ChatGPT)</option>
              <option value="api-anthropic">Direct API: Anthropic (Claude)</option>
              <option value="api-gemini">Direct API: Google Gemini</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              모델 명칭
            </label>
            <input
              type="text"
              value={aiModel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setAiModel(e.target.value)}
              placeholder="gpt-4o, claude-3-5-sonnet, llama3 등"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {aiProvider.startsWith('api-') && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                API Key
              </label>
              <input
                type="password"
                value={aiApiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setAiApiKey(e.target.value)}
                placeholder="sk-..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontFamily: 'ui-monospace, monospace',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={handleTestAi}
              disabled={aiTesting}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1f2328',
                backgroundColor: '#f6f8fa',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                cursor: aiTesting ? 'not-allowed' : 'pointer',
              }}
            >
              {aiTesting ? '연결 테스트 중...' : '연결 테스트'}
            </button>
            <button
              type="submit"
              disabled={aiSaving}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#1f883d',
                border: '1px solid rgba(31,35,40,0.15)',
                borderRadius: '6px',
                cursor: aiSaving ? 'not-allowed' : 'pointer',
              }}
            >
              {aiSaving ? '저장 중...' : 'AI 설정 저장'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Local SQLite Stats */}
      <div
        style={{
          padding: '24px',
          backgroundColor: '#ffffff',
          border: '1px solid #d0d7de',
          borderRadius: '6px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0', color: '#1f2328' }}>
          로컬 SQLite 보존 현황
        </h3>
        <p style={{ fontSize: '13px', color: '#656d76', margin: '0 0 16px 0' }}>
          인증 키를 교체하더라도 로컬 SQLite 데이터는 영구 보존됩니다.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#f6f8fa', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0969da', display: 'block' }}>
              {stats.snapshotCount}
            </span>
            <span style={{ fontSize: '12px', color: '#656d76' }}>보관된 데일리 스냅샷</span>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#f6f8fa', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0969da', display: 'block' }}>
              {stats.sessionCount}
            </span>
            <span style={{ fontSize: '12px', color: '#656d76' }}>진행된 토론 세션</span>
          </div>
          <div style={{ padding: '16px', backgroundColor: '#f6f8fa', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0969da', display: 'block' }}>
              {stats.archiveCount}
            </span>
            <span style={{ fontSize: '12px', color: '#656d76' }}>영구 아카이브 문서</span>
          </div>
        </div>
      </div>
    </div>
  );
}
