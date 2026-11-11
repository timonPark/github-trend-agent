'use client';

import React, { useState } from 'react';
import { toErrorMessage } from '../lib/types/error';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: { id: string; username: string; client_auth_key: string }, token: string) => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps): React.JSX.Element {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const endpoint: string = tab === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const res: Response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data: { user?: { id: string; username: string; client_auth_key: string }; token?: string; error?: string } =
        (await res.json()) as { user?: { id: string; username: string; client_auth_key: string }; token?: string; error?: string };
      if (!res.ok || !data.user || !data.token) {
        throw new Error(data.error || '인증에 실패했습니다.');
      }
      localStorage.setItem('gta_server_user', JSON.stringify(data.user));
      localStorage.setItem('gta_server_token', data.token);
      onSuccess(data.user, data.token);
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(31, 35, 40, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '380px', maxWidth: '90%', padding: '24px', border: '1px solid #d0d7de', boxShadow: '0 8px 24px rgba(140, 149, 159, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={(): void => setTab('login')} style={{ fontSize: '15px', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: tab === 'login' ? '#0969da' : '#656d76', borderBottom: tab === 'login' ? '2px solid #0969da' : 'none', paddingBottom: '4px' }}>로그인</button>
            <button type="button" onClick={(): void => setTab('register')} style={{ fontSize: '15px', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: tab === 'register' ? '#0969da' : '#656d76', borderBottom: tab === 'register' ? '2px solid #0969da' : 'none', paddingBottom: '4px' }}>회원가입</button>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#656d76' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>아이디 (Username)</label>
            <input type="text" required value={username} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setUsername(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>비밀번호</label>
            <input type="password" required value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setPassword(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }} />
          </div>
          {error && <div style={{ padding: '8px 10px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '8px', fontSize: '13px', fontWeight: 600, backgroundColor: '#1f883d', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '처리 중...' : tab === 'register' ? '가입하고 키 발급받기' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
