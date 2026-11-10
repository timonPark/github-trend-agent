'use client';

import { useState, useEffect } from 'react';

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

interface TrendingRepoItem {
  rank: number;
  name: string;
  full_name: string;
  url: string;
  description: string;
  language: string;
  total_stars: number;
  daily_stars: number;
  readme?: string;
}

export default function ClientHomePage() {
  const [activeTab, setActiveTab] = useState<'top10' | 'discussion' | 'archives' | 'settings'>('top10');
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Gate Form State
  const [gateKey, setGateKey] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateSubmitting, setGateSubmitting] = useState(false);

  // Settings State
  const [serverUrl, setServerUrl] = useState('http://localhost:4000');
  const [serverAuthKey, setServerAuthKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [stats, setStats] = useState<LocalStats>({ snapshotCount: 0, sessionCount: 0, archiveCount: 0 });

  // 401 Alert State
  const [authExpiredAlert, setAuthExpiredAlert] = useState<string | null>(null);

  // Trending Scraper State
  const [trendingRepos, setTrendingRepos] = useState<TrendingRepoItem[]>([]);
  const [trendingSource, setTrendingSource] = useState<'local-cache' | 'remote-server' | 'fresh-scraped' | null>(null);
  const [syncedWithServer, setSyncedWithServer] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [selectedReadmeRepo, setSelectedReadmeRepo] = useState<TrendingRepoItem | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string>('');

  // Load auth status and settings
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Auth Status
      const authRes = await fetch('/api/auth/status');
      const authData: AuthStatus = await authRes.json();
      setAuthStatus(authData);

      if (authData.statusCode === 401) {
        setAuthExpiredAlert('중앙 서버 통신 중 401 Unauthorized 에러가 감지되었습니다. 새 인증 키를 등록해주세요.');
        setActiveTab('settings');
      }

      // 2. Fetch Settings & Stats
      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();
      if (setData.settings) {
        setServerUrl(setData.settings.server_url || 'http://localhost:4000');
        setServerAuthKey(setData.settings.server_auth_key || '');
        setGateKey(setData.settings.server_auth_key || '');
      }
      if (setData.stats) {
        setStats(setData.stats);
      }

      // 3. Fetch Initial Trending Snapshots
      loadTrendingData();
    } catch (err: any) {
      setAuthStatus({ authenticated: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingData = async (forceRefresh = false) => {
    try {
      setScraping(true);
      const res = await fetch(`/api/trending${forceRefresh ? '?force=true' : ''}`);
      const data = await res.json();

      if (res.status === 401) {
        setAuthExpiredAlert('중앙 서버 통신 중 401 Unauthorized 에러가 감지되었습니다. 설정 화면에서 인증 키를 확인해주세요.');
        setActiveTab('settings');
        return;
      }

      if (data.snapshot?.repositories) {
        setTrendingRepos(data.snapshot.repositories);
        setTrendingSource(data.source);
        setSyncedWithServer(!!data.syncedWithServer);
      }
      // Refresh stats
      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();
      if (setData.stats) setStats(setData.stats);
    } catch {}
    finally {
      setScraping(false);
    }
  };

  const handleOpenReadme = async (repo: TrendingRepoItem) => {
    setSelectedReadmeRepo(repo);
    setReadmeLoading(true);
    setReadmeContent('');

    try {
      // Try to fetch raw readme directly
      const rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/HEAD/README.md`;
      const res = await fetch(rawUrl);
      if (res.ok) {
        const text = await res.text();
        setReadmeContent(text.slice(0, 5000));
      } else {
        setReadmeContent('README를 가져올 수 없습니다.');
      }
    } catch {
      setReadmeContent('README를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setReadmeLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Submit Key from Auth Gate
  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateKey.trim()) {
      setGateError('인증 키를 입력해주세요.');
      return;
    }

    setGateError(null);
    setGateSubmitting(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_url: serverUrl,
          server_auth_key: gateKey.trim(),
          verify: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '인증 키 검증에 실패했습니다.');
      }

      setGateError(null);
      await loadInitialData();
      setActiveTab('top10');
    } catch (err: any) {
      setGateError(err.message);
    } finally {
      setGateSubmitting(false);
    }
  };

  // Save Settings from Settings Tab
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);
    setSavingSettings(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_url: serverUrl,
          server_auth_key: serverAuthKey.trim(),
          verify: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '설정 저장에 실패했습니다.');
      }

      setSettingsSuccess('✅ 중앙 서버 인증이 확인되었으며 설정이 저장되었습니다. 로컬 데이터는 모두 안전하게 보존됩니다.');
      setAuthExpiredAlert(null);
      await loadInitialData();
    } catch (err: any) {
      setSettingsError(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* 401 Expiration Alert Banner */}
      {authExpiredAlert && (
        <div className="mb-6 rounded-md border border-[var(--borderColor-danger-muted)] bg-[var(--bgColor-danger-muted)] p-4 text-sm text-[var(--fgColor-danger)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">⚠️ 인증 키 만료 / 무효:</span>
            <span>{authExpiredAlert}</span>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="primer-btn primer-btn-danger text-xs"
          >
            설정 화면에서 키 갱신
          </button>
        </div>
      )}

      {/* Subhead Header */}
      <div className="mb-6 border-b border-[var(--borderColor-default)] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--fgColor-default)]">
              GitHub Trend Agent Client
            </h2>
            <p className="text-sm text-[var(--fgColor-muted)]">
              로컬 AI 러너 및 일일 GitHub Star TOP 10 심층 분석 & 토론 클라이언트
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="primer-badge primer-badge-green">
              Design System: @primer/primitives
            </span>
            {authStatus?.authenticated ? (
              <span className="primer-badge primer-badge-green">
                🟢 서버 인증됨 ({authStatus.user?.username})
              </span>
            ) : (
              <span className="primer-badge primer-badge-red">
                🔴 서버 인증 필요
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <nav className="mt-4 flex gap-4 text-sm font-medium">
          <button
            onClick={() => setActiveTab('top10')}
            className={`pb-2 ${
              activeTab === 'top10'
                ? 'border-b-2 border-[var(--fgColor-accent)] font-semibold text-[var(--fgColor-default)]'
                : 'text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]'
            }`}
          >
            🌟 Daily TOP 10
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`pb-2 ${
              activeTab === 'discussion'
                ? 'border-b-2 border-[var(--fgColor-accent)] font-semibold text-[var(--fgColor-default)]'
                : 'text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]'
            }`}
          >
            💬 Discussion Session
          </button>
          <button
            onClick={() => setActiveTab('archives')}
            className={`pb-2 ${
              activeTab === 'archives'
                ? 'border-b-2 border-[var(--fgColor-accent)] font-semibold text-[var(--fgColor-default)]'
                : 'text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]'
            }`}
          >
            📚 My Archives
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 ${
              activeTab === 'settings'
                ? 'border-b-2 border-[var(--fgColor-accent)] font-semibold text-[var(--fgColor-default)]'
                : 'text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]'
            }`}
          >
            ⚙️ Settings
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--fgColor-muted)]">
          클라이언트 데이터 및 서버 인증 상태를 확인하고 있습니다...
        </div>
      ) : !authStatus?.authenticated && activeTab !== 'settings' ? (
        /* Server Auth Gate (Must verify key before using other features) */
        <div className="mx-auto max-w-xl py-8">
          <div className="primer-card border-2 border-[var(--borderColor-accent-emphasis)] shadow-md">
            <div className="mb-4 text-center">
              <span className="text-4xl">🔐</span>
              <h3 className="mt-2 text-xl font-bold text-[var(--fgColor-default)]">
                중앙 서버 계정 인증 필요
              </h3>
              <p className="mt-1 text-sm text-[var(--fgColor-muted)]">
                클라이언트를 사용하려면 먼저 중앙 서버에 회원가입 후 발급받은 인증 키를 등록해야 합니다.
              </p>
            </div>

            <div className="mb-6 rounded-md bg-[var(--bgColor-muted)] p-3 text-xs text-[var(--fgColor-muted)] leading-relaxed">
              <p className="font-semibold text-[var(--fgColor-default)]">💡 인증 키 발급 안내:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>
                  중앙 서버 웹 페이지(
                  <a
                    href={serverUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--fgColor-accent)] underline font-medium"
                  >
                    {serverUrl}
                  </a>
                  )에 접속합니다.
                </li>
                <li>회원가입 후 로그인하여 [클라이언트 연동 인증 키]를 복사합니다.</li>
                <li>아래 입력란에 키를 붙여넣고 [인증 및 시작하기] 버튼을 누릅니다.</li>
              </ol>
            </div>

            {gateError && (
              <div className="mb-4 rounded-md border border-[var(--borderColor-danger-muted)] bg-[var(--bgColor-danger-muted)] p-3 text-xs text-[var(--fgColor-danger)]">
                {gateError}
              </div>
            )}

            <form onSubmit={handleGateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--fgColor-default)] mb-1">
                  클라이언트 연동 인증 키 (Client Auth Key)
                </label>
                <input
                  type="text"
                  required
                  value={gateKey}
                  onChange={(e) => setGateKey(e.target.value)}
                  placeholder="예: gta_live_a1b2c3d4..."
                  className="w-full rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] px-3 py-2 text-sm font-mono text-[var(--fgColor-default)] focus:outline-none focus:ring-2 focus:ring-[var(--fgColor-accent)]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={gateSubmitting}
                  className="primer-btn primer-btn-primary w-full py-2 text-sm justify-center"
                >
                  {gateSubmitting ? '서버 인증 확인 중...' : '인증 및 시작하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : activeTab === 'settings' ? (
        /* Settings Tab */
        <div className="space-y-6">
          <div className="primer-card">
            <h3 className="text-base font-bold text-[var(--fgColor-default)] mb-2">
              ⚙️ 중앙 서버 연동 설정 (Central Server Connection)
            </h3>
            <p className="text-xs text-[var(--fgColor-muted)] mb-4">
              중앙 서버의 주소 및 회원가입 시 발급받은 클라이언트 인증 키를 관리합니다.
            </p>

            {settingsSuccess && (
              <div className="mb-4 rounded-md border border-[var(--borderColor-success-muted)] bg-[var(--bgColor-success-muted)] p-3 text-xs text-[var(--fgColor-success)]">
                {settingsSuccess}
              </div>
            )}

            {settingsError && (
              <div className="mb-4 rounded-md border border-[var(--borderColor-danger-muted)] bg-[var(--bgColor-danger-muted)] p-3 text-xs text-[var(--fgColor-danger)]">
                {settingsError}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--fgColor-default)] mb-1">
                  중앙 서버 주소 (Server URL)
                </label>
                <input
                  type="url"
                  required
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] px-3 py-2 text-sm text-[var(--fgColor-default)]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-[var(--fgColor-default)]">
                    클라이언트 인증 키 (Client Auth Key)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-xs text-[var(--fgColor-accent)] hover:underline"
                  >
                    {showKey ? '키 숨기기' : '키 표시'}
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  required
                  value={serverAuthKey}
                  onChange={(e) => setServerAuthKey(e.target.value)}
                  placeholder="gta_live_..."
                  className="w-full rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] px-3 py-2 text-sm font-mono text-[var(--fgColor-default)]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="primer-btn primer-btn-primary"
                >
                  {savingSettings ? '검증 및 저장 중...' : '인증 검증 및 저장'}
                </button>
              </div>
            </form>
          </div>

          {/* Local Data Preservation Guarantee Banner */}
          <div className="primer-card border border-[var(--borderColor-accent-emphasis)] bg-[var(--bgColor-accent-muted)]">
            <h4 className="text-sm font-bold text-[var(--fgColor-accent)] mb-2 flex items-center gap-2">
              <span>🛡️</span>
              <span>로컬 데이터 영구 보존 보장 (Local Data Retention Invariant)</span>
            </h4>
            <p className="text-xs text-[var(--fgColor-default)] leading-relaxed mb-4">
              중앙 서버 연동 키를 변경하거나 계정을 재인증하더라도, 클라이언트의 로컬 SQLite 데이터베이스(
              <code>client/.data/gta_local.sqlite</code>)에 저장된 일일 스냅샷, 실시간 토론 세션 및 아카이브 데이터는
              <strong> 절대 삭제되거나 초기화되지 않고 안전하게 유지됩니다.</strong>
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] p-3 text-center">
                <p className="text-xs text-[var(--fgColor-muted)]">보관된 로컬 스냅샷</p>
                <p className="text-lg font-bold text-[var(--fgColor-default)] mt-1">
                  {stats.snapshotCount}개
                </p>
              </div>
              <div className="rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] p-3 text-center">
                <p className="text-xs text-[var(--fgColor-muted)]">저장된 토론 세션</p>
                <p className="text-lg font-bold text-[var(--fgColor-default)] mt-1">
                  {stats.sessionCount}개
                </p>
              </div>
              <div className="rounded-md border border-[var(--borderColor-default)] bg-[var(--bgColor-default)] p-3 text-center">
                <p className="text-xs text-[var(--fgColor-muted)]">내 토론 아카이브</p>
                <p className="text-lg font-bold text-[var(--fgColor-default)] mt-1">
                  {stats.archiveCount}개
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Main Tabs (top10, discussion, archives) */
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="primer-card">
              <h3 className="text-sm font-semibold text-[var(--fgColor-muted)]">Local Client Server</h3>
              <p className="mt-2 text-2xl font-bold text-[var(--fgColor-default)]">Active</p>
              <p className="mt-1 text-xs text-[var(--fgColor-muted)]">Port 3000 (SQLite Ready)</p>
            </div>

            <div className="primer-card">
              <h3 className="text-sm font-semibold text-[var(--fgColor-muted)]">Central Server Sync</h3>
              <p className="mt-2 text-2xl font-bold text-[var(--fgColor-success)]">Connected</p>
              <p className="mt-1 text-xs text-[var(--fgColor-muted)]">
                User: {authStatus?.user?.username} ({serverUrl})
              </p>
            </div>

            <div className="primer-card">
              <h3 className="text-sm font-semibold text-[var(--fgColor-muted)]">Local Data Retention</h3>
              <p className="mt-2 text-2xl font-bold text-[var(--fgColor-accent)]">Guaranteed</p>
              <p className="mt-1 text-xs text-[var(--fgColor-muted)]">Key changes keep all data intact</p>
            </div>
          </div>

          {activeTab === 'top10' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--fgColor-default)]">
                      🌟 일일 GitHub Star 급상승 TOP 10
                    </h3>
                    {trendingSource === 'local-cache' && (
                      <span className="primer-badge primer-badge-green text-xs">
                        🟢 로컬 SQLite 캐시 (Tier 1)
                      </span>
                    )}
                    {trendingSource === 'remote-server' && (
                      <span className="primer-badge primer-badge-green text-xs">
                        🌐 중앙 서버 공유 캐시 (Tier 2)
                      </span>
                    )}
                    {trendingSource === 'fresh-scraped' && (
                      <span className="primer-badge primer-badge-yellow text-xs">
                        ⚡ 신규 실시간 수집 (Tier 3)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--fgColor-muted)]">
                    매일 0시 기준 Dual-DB 3단계 캐싱으로 중복 크롤링 없이 클라이언트 간 공유됩니다.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadTrendingData(false)}
                    disabled={scraping}
                    className="primer-btn text-xs"
                  >
                    {scraping ? '조회 중...' : '🔄 캐시 조회'}
                  </button>
                  <button
                    onClick={() => loadTrendingData(true)}
                    disabled={scraping}
                    className="primer-btn primer-btn-primary text-xs"
                  >
                    {scraping ? '수집 실행 중...' : '⚡ 강제 재수집 (Force)'}
                  </button>
                </div>
              </div>

              {trendingRepos.length === 0 ? (
                <div className="primer-card text-center py-8 text-xs text-[var(--fgColor-muted)]">
                  아직 수집된 스냅샷이 없습니다. [지금 수집 실행] 버튼을 눌러보세요.
                </div>
              ) : (
                <div className="grid gap-3">
                  {trendingRepos.map((repo) => (
                    <div
                      key={repo.full_name}
                      className="primer-card flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-[var(--borderColor-accent-emphasis)] transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bgColor-muted)] font-mono text-xs font-bold text-[var(--fgColor-default)]">
                          {repo.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-sm text-[var(--fgColor-accent)] hover:underline truncate"
                            >
                              {repo.full_name}
                            </a>
                            <span className="primer-badge primer-badge-gray text-[10px]">
                              {repo.language}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--fgColor-muted)] line-clamp-2">
                            {repo.description || '설명이 없습니다.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 text-xs text-[var(--fgColor-muted)]">
                        <div className="text-right">
                          <p className="font-semibold text-[var(--fgColor-default)]">
                            ★ {repo.total_stars.toLocaleString()}
                          </p>
                          <p className="text-[var(--fgColor-success)] font-medium">
                            +{repo.daily_stars.toLocaleString()} today
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenReadme(repo)}
                          className="primer-btn text-xs py-1 px-2"
                        >
                          📖 README
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="primer-card">
              <h3 className="text-base font-bold text-[var(--fgColor-default)] mb-2">
                💬 Real-time AI Discussion Session
              </h3>
              <p className="text-xs text-[var(--fgColor-muted)]">
                로컬 AI 에이전트와의 실시간 토론 기능은 M3/M4 마일스톤에서 활성화됩니다.
              </p>
            </div>
          )}

          {activeTab === 'archives' && (
            <div className="primer-card">
              <h3 className="text-base font-bold text-[var(--fgColor-default)] mb-2">
                📚 My Discussion Archives (Local & Server)
              </h3>
              <p className="text-xs text-[var(--fgColor-muted)]">
                토론 아카이브 열람 및 공개/비공개 전환 기능은 M4 마일스톤(#12)에서 구현됩니다.
              </p>
            </div>
          )}

          {/* README Modal */}
          {selectedReadmeRepo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="primer-card max-h-[80vh] w-full max-w-3xl overflow-hidden flex flex-col bg-[var(--bgColor-default)] shadow-2xl">
                <div className="flex justify-between items-center border-b border-[var(--borderColor-default)] pb-3 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--fgColor-default)]">
                      📖 {selectedReadmeRepo.full_name} README.md
                    </h3>
                    <a
                      href={selectedReadmeRepo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--fgColor-accent)] hover:underline"
                    >
                      {selectedReadmeRepo.url}
                    </a>
                  </div>
                  <button
                    onClick={() => setSelectedReadmeRepo(null)}
                    className="primer-btn text-xs"
                  >
                    닫기 ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 bg-[var(--bgColor-muted)] rounded font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {readmeLoading ? (
                    <div className="text-center py-8 text-[var(--fgColor-muted)]">
                      README 원문을 불러오고 있습니다...
                    </div>
                  ) : (
                    readmeContent
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
