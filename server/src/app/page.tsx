'use client';

import { useState, useEffect } from 'react';

interface AuthUser {
  id: string;
  username: string;
  client_auth_key: string;
  created_at: string;
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [rotateLoading, setRotateLoading] = useState(false);

  useEffect(() => {
    // Check saved session in localStorage for demo client state
    const savedUser = localStorage.getItem('gta_server_user');
    const savedToken = localStorage.getItem('gta_server_token');
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = tab === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem('gta_server_user', JSON.stringify(data.user));
      localStorage.setItem('gta_server_token', data.token);
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('gta_server_user');
    localStorage.removeItem('gta_server_token');
  };

  const handleCopyKey = () => {
    if (!currentUser?.client_auth_key) return;
    navigator.clipboard.writeText(currentUser.client_auth_key);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleRotateKey = async () => {
    if (!token || !currentUser) return;
    setRotateLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/client-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rotate key');

      const updated = { ...currentUser, client_auth_key: data.client_auth_key };
      setCurrentUser(updated);
      localStorage.setItem('gta_server_user', JSON.stringify(updated));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRotateLoading(false);
    }
  };

  return (
    <main style={{ padding: '2.5rem 1.5rem', maxWidth: '860px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2328' }}>
      <header style={{ borderBottom: '1px solid #d0d7de', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
              🌐 GitHub Trend Agent Central Server
            </h1>
            <p style={{ margin: 0, color: '#656d76', fontSize: '0.95rem' }}>
              원격 중앙 서버 (계정 인증, 일일 TOP 10 스냅샷 보관소 및 토론 아카이브)
            </p>
          </div>
          {currentUser && (
            <button
              onClick={handleLogout}
              style={{
                background: '#f6f8fa',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              로그아웃
            </button>
          )}
        </div>
      </header>

      {error && (
        <div
          style={{
            background: '#ffebe9',
            border: '1px solid #ff8182',
            color: '#cf222e',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {!currentUser ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #d0d7de',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '440px',
            margin: '2rem auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', borderBottom: '1px solid #d0d7de', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: 'transparent',
                fontWeight: tab === 'login' ? 600 : 400,
                color: tab === 'login' ? '#0969da' : '#656d76',
                borderBottom: tab === 'login' ? '2px solid #0969da' : 'none',
                cursor: 'pointer',
              }}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: 'transparent',
                fontWeight: tab === 'register' ? 600 : 400,
                color: tab === 'register' ? '#0969da' : '#656d76',
                borderBottom: tab === 'register' ? '2px solid #0969da' : 'none',
                cursor: 'pointer',
              }}
            >
              회원가입
            </button>
          </div>

          <p style={{ fontSize: '0.875rem', color: '#656d76', marginBottom: '1.25rem' }}>
            {tab === 'register'
              ? '중앙 서버에 계정을 생성하고 클라이언트 전용 인증 키를 발급받으세요.'
              : '중앙 서버 계정으로 로그인하여 발급된 클라이언트 인증 키를 확인하세요.'}
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                아이디 (Username)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="예: octocat"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d0d7de',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                비밀번호
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자리 이상 비밀번호"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d0d7de',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#1f883d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '10px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
              }}
            >
              {loading ? '처리 중...' : tab === 'register' ? '계정 생성 및 키 발급' : '로그인'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Welcome Card */}
          <div
            style={{
              background: '#f6f8fa',
              border: '1px solid #d0d7de',
              borderRadius: '8px',
              padding: '1.25rem 1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>
              환영합니다, <strong>{currentUser.username}</strong> 님! 👋
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#656d76' }}>
              서버 계정 ID: <code>{currentUser.id}</code> | 가입일시:{' '}
              {new Date(currentUser.created_at).toLocaleString('ko-KR')}
            </p>
          </div>

          {/* Client Auth Key Box */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #0969da',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(9, 105, 218, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0969da' }}>
                🔑 내 클라이언트 연동 인증 키 (Client Auth Key)
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    background: '#f6f8fa',
                    border: '1px solid #d0d7de',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {showKey ? '숨기기' : '표시하기'}
                </button>
                <button
                  type="button"
                  onClick={handleRotateKey}
                  disabled={rotateLoading}
                  style={{
                    background: '#fff8c5',
                    border: '1px solid #d4a72c',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    cursor: rotateLoading ? 'not-allowed' : 'pointer',
                    color: '#4d2d00',
                  }}
                >
                  {rotateLoading ? '재발급 중...' : '키 재발급(Rotate)'}
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#656d76', marginBottom: '0.75rem' }}>
              로컬 클라이언트를 실행하고 아래의 인증 키를 클라이언트 화면에 등록하면 중앙 서버와 동기화가 활성화됩니다.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f6f8fa',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #d0d7de',
              }}
            >
              <code style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.95rem', wordBreak: 'break-all' }}>
                {showKey
                  ? currentUser.client_auth_key
                  : currentUser.client_auth_key.slice(0, 12) + '••••••••••••••••••••••••••••••••'}
              </code>
              <button
                type="button"
                onClick={handleCopyKey}
                style={{
                  background: keyCopied ? '#2da44e' : '#ffffff',
                  color: keyCopied ? '#ffffff' : '#1f2328',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {keyCopied ? '✓ 복사됨!' : '키 복사'}
              </button>
            </div>
          </div>

          {/* Client Download & Guide */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #d0d7de',
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem' }}>
              📦 클라이언트 설치 및 연동 안내
            </h3>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.7', fontSize: '0.9rem', color: '#1f2328' }}>
              <li>
                로컬 터미널에서 클라이언트 프로젝트를 실행합니다:
                <pre
                  style={{
                    background: '#f6f8fa',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    margin: '6px 0',
                    fontSize: '0.85rem',
                    overflowX: 'auto',
                  }}
                >
                  npm run dev --workspace=client
                </pre>
              </li>
              <li>
                웹 브라우저로 로컬 클라이언트 접속 (<code>http://localhost:3000</code>).
              </li>
              <li>
                클라이언트 최초 실행 화면에서 위 <strong>인증 키</strong>를 입력하고 [인증 및 시작하기] 버튼을 누르면 연동이 완료됩니다.
              </li>
              <li>
                클라이언트 설정(Settings)에서 언제든 인증 키를 재등록할 수 있으며, <strong>인증 키를 변경하더라도 로컬에 저장된 토론 내역과 스냅샷 데이터는 그대로 유지됩니다.</strong>
              </li>
            </ol>
          </div>
        </div>
      )}
    </main>
  );
}
