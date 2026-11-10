'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import { AuthGate } from '../components/AuthGate';
import { TrendingDashboard } from '../components/TrendingDashboard';
import { SettingsTab } from '../components/SettingsTab';
import { ReadmeModal } from '../components/ReadmeModal';
import { TrendingRepository } from '../lib/types';
import { AiAgentConfig, DetectedCli } from '../lib/ai/types';
import { toErrorMessage } from '../lib/types/error';

interface AuthStatus {
  authenticated: boolean;
  server_url?: string;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
  statusCode?: number;
}

interface LocalStats {
  snapshotCount: number;
  sessionCount: number;
  archiveCount: number;
}

export default function ClientHomePage() {
  const [activeTab, setActiveTab] = useState<'top10' | 'discussion' | 'archives' | 'settings'>('top10');
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings & Local Stats
  const [serverUrl, setServerUrl] = useState('http://localhost:4000');
  const [serverAuthKey, setServerAuthKey] = useState('');
  const [stats, setStats] = useState<LocalStats>({ snapshotCount: 0, sessionCount: 0, archiveCount: 0 });
  const [authExpiredAlert, setAuthExpiredAlert] = useState<string | null>(null);

  // AI Agent Settings
  const [aiConfig, setAiConfig] = useState<AiAgentConfig>({ provider: 'none', model: 'default' });
  const [detectedClis, setDetectedClis] = useState<DetectedCli[]>([]);

  // Trending & Readme State
  const [trendingRepos, setTrendingRepos] = useState<TrendingRepository[]>([]);
  const [trendingSource, setTrendingSource] = useState<'local-cache' | 'remote-server' | 'fresh-scraped' | null>(null);
  const [syncedWithServer, setSyncedWithServer] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [selectedReadmeRepo, setSelectedReadmeRepo] = useState<TrendingRepository | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string>('');

  const loadTrendingData = useCallback(async () => {
    try {
      const res = await fetch('/api/trending');
      const data = await res.json();
      if (data.repositories) {
        setTrendingRepos(data.repositories);
        setTrendingSource(data.cached ? 'local-cache' : data.source === 'remote-server' ? 'remote-server' : 'fresh-scraped');
        setSyncedWithServer(data.syncedWithServer || data.source === 'remote-server');
      }
    } catch {
      // Offline fallback
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/status');
      const authData: AuthStatus = await authRes.json();
      setAuthStatus(authData);

      if (authData.statusCode === 401) {
        setAuthExpiredAlert('중앙 서버 통신 중 401 Unauthorized 에러가 감지되었습니다. 새 인증 키를 등록해주세요.');
        setActiveTab('settings');
      }

      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();
      if (setData.settings) {
        setServerUrl(setData.settings.server_url || 'http://localhost:4000');
        setServerAuthKey(setData.settings.server_auth_key || '');
      }
      if (setData.stats) {
        setStats(setData.stats);
      }

      await loadTrendingData();

      try {
        const aiRes = await fetch('/api/ai/status');
        const aiData = await aiRes.json();
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
      setAuthStatus({ authenticated: false, error: toErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [loadTrendingData]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleManualScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch('/api/trending/scrape', { method: 'POST' });
      const data = await res.json();
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

  const handleOpenReadme = async (repo: TrendingRepository) => {
    setSelectedReadmeRepo(repo);
    setReadmeLoading(true);
    setReadmeContent('');

    try {
      const res = await fetch(`/api/trending?repo=${encodeURIComponent(repo.full_name)}`);
      const data = await res.json();
      setReadmeContent(data.readme || repo.readme || 'README를 가져올 수 없습니다.');
    } catch (err: unknown) {
      setReadmeContent(`README 로드 실패: ${toErrorMessage(err)}`);
    } finally {
      setReadmeLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#656d76' }}>
        클라이언트 데이터베이스 로딩 중...
      </div>
    );
  }

  if (!authStatus?.authenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f6f8fa', padding: '40px 20px' }}>
        <AuthGate onAuthenticated={loadInitialData} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f8fa' }}>
      <Header
        username={authStatus.user?.username || 'Client User'}
        onOpenSettings={() => setActiveTab('settings')}
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
            onClick={() => setActiveTab('top10')}
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
            onClick={() => setActiveTab('discussion')}
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
            onClick={() => setActiveTab('archives')}
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
            onClick={() => setActiveTab('settings')}
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
            source={trendingSource}
            syncedWithServer={syncedWithServer}
            scraping={scraping}
            onRefresh={handleManualScrape}
            onOpenReadme={handleOpenReadme}
          />
        )}

        {activeTab === 'discussion' && (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de', color: '#656d76' }}>
            실시간 AI 토론 세션 기능은 곧 제공될 예정입니다. (Epic 4 #10)
          </div>
        )}

        {activeTab === 'archives' && (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de', color: '#656d76' }}>
            토론 아카이브 뷰어는 곧 제공될 예정입니다. (Epic 4 #12)
          </div>
        )}

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
        onClose={() => setSelectedReadmeRepo(null)}
      />
    </div>
  );
}
