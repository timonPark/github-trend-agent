'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import { AuthGate } from '../components/AuthGate';
import { TrendingDashboard } from '../components/TrendingDashboard';
import { DiscussionWorkspace } from '../components/DiscussionWorkspace';
import { LocalArchiveViewer } from '../components/LocalArchiveViewer';
import { SettingsTab } from '../components/SettingsTab';
import { ReadmeModal } from '../components/ReadmeModal';
import { TrendingRepository } from '../lib/types';
import { getTodayString } from '../lib/date-utils';
import { AiAgentConfig, DetectedCli } from '../lib/ai/types';
import { toErrorMessage } from '../lib/types/error';
import {
  AuthStatusResponseDto,
  ClientSettingsDto,
  TrendingResponseDto,
  ScrapeTrendingResponseDto,
  AiStatusResponseDto,
  GenerateDigestResponseDto,
  ApiResponse,
} from '../lib/types/api';

interface LocalStats {
  snapshotCount: number;
  sessionCount: number;
  archiveCount: number;
}

export default function ClientHomePage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'top10' | 'discussion' | 'archives' | 'settings'>('top10');
  const [authStatus, setAuthStatus] = useState<AuthStatusResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Settings & Local Stats
  const [serverUrl, setServerUrl] = useState<string>('http://localhost:4000');
  const [serverAuthKey, setServerAuthKey] = useState<string>('');
  const [stats, setStats] = useState<LocalStats>({ snapshotCount: 0, sessionCount: 0, archiveCount: 0 });
  const [authExpiredAlert, setAuthExpiredAlert] = useState<string | null>(null);

  // AI Agent Settings
  const [aiConfig, setAiConfig] = useState<AiAgentConfig>({ provider: 'none', model: 'default' });
  const [detectedClis, setDetectedClis] = useState<DetectedCli[]>([]);

  // Trending & Readme State
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [loadingDate, setLoadingDate] = useState<boolean>(false);
  const [trendingRepos, setTrendingRepos] = useState<TrendingRepository[]>([]);
  const [trendingSource, setTrendingSource] = useState<'local-cache' | 'remote-server' | 'fresh-scraped' | null>(null);
  const [syncedWithServer, setSyncedWithServer] = useState<boolean>(false);
  const [scraping, setScraping] = useState<boolean>(false);
  const [selectedReadmeRepo, setSelectedReadmeRepo] = useState<TrendingRepository | null>(null);
  const [readmeLoading, setReadmeLoading] = useState<boolean>(false);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [generatingDigestRepo, setGeneratingDigestRepo] = useState<string | null>(null);
  const [selectedDiscussionRepo, setSelectedDiscussionRepo] = useState<TrendingRepository | null>(null);

  const loadTrendingData = useCallback(async (targetDate?: string): Promise<void> => {
    try {
      const dateQuery: string = targetDate ? `?date=${targetDate}` : '';
      const res: Response = await fetch(`/api/trending${dateQuery}`);
      const data: TrendingResponseDto & { syncedWithServer?: boolean } =
        (await res.json()) as TrendingResponseDto & { syncedWithServer?: boolean };
      if (data.repositories) {
        setTrendingRepos(data.repositories);
        setTrendingSource(data.cached ? 'local-cache' : data.source === 'remote-server' ? 'remote-server' : 'fresh-scraped');
        setSyncedWithServer(data.syncedWithServer || data.source === 'remote-server');
      } else {
        setTrendingRepos([]);
        setTrendingSource(null);
        setSyncedWithServer(false);
      }
    } catch {
      setTrendingRepos([]);
    }
  }, []);

  const handleDateChange = async (newDate: string): Promise<void> => {
    setSelectedDate(newDate);
    setLoadingDate(true);
    try {
      await loadTrendingData(newDate);
    } finally {
      setLoadingDate(false);
    }
  };

  const loadInitialData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const authRes: Response = await fetch('/api/auth/status');
      const authData: AuthStatusResponseDto & { statusCode?: number } =
        (await authRes.json()) as AuthStatusResponseDto & { statusCode?: number };
      setAuthStatus(authData);

      if (authData.statusCode === 401) {
        setAuthExpiredAlert('중앙 서버 통신 중 401 Unauthorized 에러가 감지되었습니다. 새 인증 키를 등록해주세요.');
        setActiveTab('settings');
      }

      const setRes: Response = await fetch('/api/settings');
      const setData: { settings?: ClientSettingsDto; stats?: LocalStats } =
        (await setRes.json()) as { settings?: ClientSettingsDto; stats?: LocalStats };
      if (setData.settings) {
        setServerUrl(setData.settings.server_url || 'http://localhost:4000');
        setServerAuthKey(setData.settings.client_auth_key || '');
      }
      if (setData.stats) {
        setStats(setData.stats);
      }

      await loadTrendingData();

      try {
        const aiRes: Response = await fetch('/api/ai/status');
        const aiData: AiStatusResponseDto = (await aiRes.json()) as AiStatusResponseDto;
        if (aiData.config) {
          setAiConfig(aiData.config);
        }
        if (aiData.detectedClis) {
          setDetectedClis(aiData.detectedClis);
        }
      } catch {
        // AI status check ignore
      }
    } catch (err: unknown) {
      setAuthStatus({ configured: false, valid: false, error: toErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [loadTrendingData]);

  useEffect((): void => {
    loadInitialData();
  }, [loadInitialData]);

  const handleManualScrape = async (): Promise<void> => {
    setScraping(true);
    try {
      const res: Response = await fetch('/api/trending/scrape', { method: 'POST' });
      const data: ScrapeTrendingResponseDto & { syncedWithServer?: boolean } =
        (await res.json()) as ScrapeTrendingResponseDto & { syncedWithServer?: boolean };
      if (data.repositories) {
        setTrendingRepos(data.repositories);
        setTrendingSource('fresh-scraped');
        setSyncedWithServer(data.syncedWithServer || false);
      }
    } catch (err: unknown) {
      alert(`크롤링 실패: ${toErrorMessage(err)}`);
    } finally {
      setScraping(false);
    }
  };

  const handleOpenReadme = async (repo: TrendingRepository): Promise<void> => {
    setSelectedReadmeRepo(repo);
    setReadmeLoading(true);
    setReadmeContent('');

    try {
      const res: Response = await fetch(`/api/trending?repo=${encodeURIComponent(repo.full_name)}`);
      const data: { readme?: string } = (await res.json()) as { readme?: string };
      setReadmeContent(data.readme || repo.readme || 'README를 가져올 수 없습니다.');
    } catch (err: unknown) {
      setReadmeContent(`README 로드 실패: ${toErrorMessage(err)}`);
    } finally {
      setReadmeLoading(false);
    }
  };

  const requestDigestApi = async (repoFullName: string): Promise<string> => {
    const res: Response = await fetch('/api/digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot_date: selectedDate, repo_full_name: repoFullName }),
    });
    const data: ApiResponse<GenerateDigestResponseDto> =
      (await res.json()) as ApiResponse<GenerateDigestResponseDto>;
    if (!res.ok || !data.success || !data.data) {
      throw new Error(data.error || '요약 생성 실패');
    }
    return data.data.digest;
  };

  const applyDigestUpdate = (repoFullName: string, digest: string): void => {
    setTrendingRepos((prev: TrendingRepository[]): TrendingRepository[] =>
      prev.map((r: TrendingRepository): TrendingRepository =>
        r.full_name === repoFullName ? { ...r, digest } : r
      )
    );
  };

  const handleGenerateDigest = async (repo: TrendingRepository): Promise<void> => {
    if (aiConfig.provider === 'none') {
      alert('AI 에이전트가 연동되지 않았습니다. 설정 탭에서 모델 또는 API Key를 설정해주세요.');
      setActiveTab('settings');
      return;
    }

    setGeneratingDigestRepo(repo.full_name);
    try {
      const digest: string = await requestDigestApi(repo.full_name);
      applyDigestUpdate(repo.full_name, digest);
    } catch (err: unknown) {
      alert(`요약 생성 실패: ${toErrorMessage(err)}`);
    } finally {
      setGeneratingDigestRepo(null);
    }
  };

  const handleStartDiscussion = (repo: TrendingRepository): void => {
    setSelectedDiscussionRepo(repo);
    setActiveTab('discussion');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#656d76' }}>
        클라이언트 데이터베이스 로딩 중...
      </div>
    );
  }

  const isAuth: boolean = Boolean(
    authStatus && (authStatus.valid || (authStatus as { authenticated?: boolean }).authenticated)
  );

  if (!isAuth) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f6f8fa', padding: '40px 20px' }}>
        <AuthGate onAuthenticated={loadInitialData} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f8fa' }}>
      <Header
        username={authStatus?.email || 'Client User'}
        onOpenSettings={(): void => setActiveTab('settings')}
      />

      <main style={{ maxWidth: '1012px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Navigation Tabs */}
        <nav
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid #d0d7de',
            marginBottom: '24px',
          }}
        >
          <button
            onClick={(): void => setActiveTab('top10')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'top10' ? '#1f2328' : '#656d76',
              borderBottom: activeTab === 'top10' ? '2px solid #fd8c73' : '2px solid transparent',
            }}
          >
            Daily TOP 10
          </button>
          <button
            onClick={(): void => setActiveTab('discussion')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'discussion' ? '#1f2328' : '#656d76',
              borderBottom: activeTab === 'discussion' ? '2px solid #fd8c73' : '2px solid transparent',
            }}
          >
            실시간 토론 세션
          </button>
          <button
            onClick={(): void => setActiveTab('archives')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'archives' ? '#1f2328' : '#656d76',
              borderBottom: activeTab === 'archives' ? '2px solid #fd8c73' : '2px solid transparent',
            }}
          >
            토론 아카이브
          </button>
          <button
            onClick={(): void => setActiveTab('settings')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'settings' ? '#1f2328' : '#656d76',
              borderBottom: activeTab === 'settings' ? '2px solid #fd8c73' : '2px solid transparent',
            }}
          >
            설정 & AI Agent
          </button>
        </nav>

        {activeTab === 'top10' && (
          <TrendingDashboard
            repos={trendingRepos}
            selectedDate={selectedDate}
            source={trendingSource}
            syncedWithServer={syncedWithServer}
            scraping={scraping}
            loadingDate={loadingDate}
            aiGated={aiConfig.provider === 'none'}
            generatingDigestRepo={generatingDigestRepo}
            onRefresh={handleManualScrape}
            onDateChange={handleDateChange}
            onOpenReadme={handleOpenReadme}
            onGenerateDigest={handleGenerateDigest}
            onStartDiscussion={handleStartDiscussion}
          />
        )}

        {activeTab === 'discussion' && (
          <DiscussionWorkspace
            initialRepo={selectedDiscussionRepo}
            allRepos={trendingRepos}
            aiGated={aiConfig.provider === 'none'}
            snapshotDate={selectedDate}
            onOpenReadme={handleOpenReadme}
            onGoToSettings={(): void => setActiveTab('settings')}
            onGoToArchives={(): void => setActiveTab('archives')}
          />
        )}

        {activeTab === 'archives' && <LocalArchiveViewer />}

        {activeTab === 'settings' && (
          <SettingsTab
            serverUrl={serverUrl}
            serverAuthKey={serverAuthKey}
            stats={stats}
            authExpiredAlert={authExpiredAlert}
            aiConfig={aiConfig}
            detectedClis={detectedClis}
            onSettingsSaved={loadInitialData}
          />
        )}
      </main>

      <ReadmeModal
        repo={selectedReadmeRepo}
        loading={readmeLoading}
        content={readmeContent}
        onClose={(): void => setSelectedReadmeRepo(null)}
      />
    </div>
  );
}
