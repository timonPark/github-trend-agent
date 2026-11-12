'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SocialAuthButtons, openSocialLoginPopup } from '@/components/SocialAuthButtons';
import { toErrorMessage } from '@/lib/types/error';

interface LoginPayload {
  username: string;
  password: string;
}

async function requestLogin(payload: LoginPayload): Promise<{ id: string; username: string; client_auth_key: string }> {
  const res: Response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data: { user?: { id: string; username: string; client_auth_key: string }; token?: string; error?: string } =
    (await res.json()) as { user?: { id: string; username: string; client_auth_key: string }; token?: string; error?: string };
  if (!res.ok || !data.user || !data.token) {
    throw new Error(data.error || '로그인에 실패했습니다.');
  }
  localStorage.setItem('gta_server_user', JSON.stringify(data.user));
  localStorage.setItem('gta_server_token', data.token);
  return data.user;
}

function LoginFormFields({
  username,
  password,
  setUsername,
  setPassword,
}: {
  username: string;
  password: string;
  setUsername: (v: string) => void;
  setPassword: (v: string) => void;
}): React.JSX.Element {
  return (
    <>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>아이디 (Username)</label>
        <input
          type="text"
          required
          value={username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setUsername(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600 }}>비밀번호</label>
          <Link href="/forgot-password" style={{ color: '#0969da', fontSize: '11px', textDecoration: 'none' }}>
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }}
        />
      </div>
    </>
  );
}

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect((): (() => void) => {
    const handleMessage = (event: MessageEvent): void => {
      if (event.data?.type === 'GTA_OAUTH_SUCCESS') {
        const { user, token } = event.data;
        localStorage.setItem('gta_server_user', JSON.stringify(user));
        localStorage.setItem('gta_server_token', token);
        router.push('/');
      } else if (event.data?.type === 'GTA_OAUTH_ERROR') {
        setError(event.data.error || '소셜 인증에 실패했습니다.');
      }
    };
    window.addEventListener('message', handleMessage);
    return (): void => window.removeEventListener('message', handleMessage);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestLogin({ username, password });
      router.push('/');
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '420px', maxWidth: '100%', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #d0d7de', padding: '24px', boxShadow: '0 8px 24px rgba(140, 149, 159, 0.15)' }}>
        <div style={{ marginBottom: '16px' }}>
          <Link href="/" style={{ color: '#0969da', fontSize: '12px', textDecoration: 'none' }}>
            ← 메인 포털로 돌아가기
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: 600, marginTop: '8px', marginBottom: '4px' }}>로그인</h1>
          <p style={{ fontSize: '12px', color: '#656d76', margin: 0 }}>4대 소셜 계정 또는 아이디로 로그인하세요.</p>
        </div>

        <SocialAuthButtons onLogin={openSocialLoginPopup} />

        <form onSubmit={handleSubmit}>
          <LoginFormFields username={username} password={password} setUsername={setUsername} setPassword={setPassword} />
          {error && <div style={{ padding: '8px 10px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '9px', fontSize: '13px', fontWeight: 600, backgroundColor: loading ? '#8c959f' : '#1f883d', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#656d76' }}>
          계정이 없으신가요? <Link href="/register" style={{ color: '#0969da', textDecoration: 'none', fontWeight: 600 }}>회원가입</Link>
        </div>
      </div>
    </div>
  );
}
