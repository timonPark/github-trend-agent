'use client';

import React, { useState } from 'react';
import { toErrorMessage } from '../lib/types/error';

interface ForgotPasswordViewProps {
  onBackToLogin: () => void;
  onSuccessNotification: (msg: string) => void;
}

function RequestResetSection({
  email,
  setEmail,
  onSubmit,
  loading,
  onBack,
}: {
  email: string;
  setEmail: (val: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  onBack: () => void;
}): React.JSX.Element {
  return (
    <form onSubmit={onSubmit}>
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>가입 시 등록한 이메일</label>
        <input type="email" required value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setEmail(e.target.value)} placeholder="developer@example.com" style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }} />
      </div>
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '8px', fontSize: '13px', fontWeight: 600, backgroundColor: '#0969da', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '8px' }}>
        {loading ? '링크 생성 중...' : '비밀번호 재설정 링크 요청'}
      </button>
      <button type="button" onClick={onBack} style={{ width: '100%', padding: '6px', fontSize: '12px', background: 'none', border: 'none', color: '#656d76', cursor: 'pointer' }}>
        ← 로그인으로 돌아가기
      </button>
    </form>
  );
}

function ExecuteResetSection({
  token,
  setToken,
  newPassword,
  setNewPassword,
  onSubmit,
  loading,
  onBack,
}: {
  token: string;
  setToken: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  onBack: () => void;
}): React.JSX.Element {
  return (
    <form onSubmit={onSubmit}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>재설정 토큰</label>
        <input type="text" required value={token} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setToken(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>새 비밀번호 (6자 이상)</label>
        <input type="password" required value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setNewPassword(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }} />
      </div>
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '8px', fontSize: '13px', fontWeight: 600, backgroundColor: '#1f883d', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '8px' }}>
        {loading ? '변경 중...' : '새 비밀번호 저장'}
      </button>
      <button type="button" onClick={onBack} style={{ width: '100%', padding: '6px', fontSize: '12px', background: 'none', border: 'none', color: '#656d76', cursor: 'pointer' }}>
        ← 처음으로
      </button>
    </form>
  );
}

export function ForgotPasswordView({ onBackToLogin, onSuccessNotification }: ForgotPasswordViewProps): React.JSX.Element {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res: Response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data: { message?: string; reset_token?: string; error?: string } = (await res.json()) as { message?: string; reset_token?: string; error?: string };
      if (!res.ok) throw new Error(data.error || '요청 실패');
      setMsg(data.message || '재설정 토큰이 생성되었습니다.');
      if (data.reset_token) setToken(data.reset_token);
      setStep('reset');
    } catch (e: unknown) {
      setErr(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res: Response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data: { message?: string; error?: string } = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || '재설정 실패');
      onSuccessNotification(data.message || '비밀번호가 성공적으로 변경되었습니다.');
      onBackToLogin();
    } catch (e: unknown) {
      setErr(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '14px', borderBottom: '1px solid #d0d7de', paddingBottom: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#1f2328' }}>비밀번호 찾기 / 재설정</h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#656d76' }}>가입하신 이메일로 비밀번호를 재설정합니다.</p>
      </div>
      {msg && <div style={{ padding: '8px 10px', backgroundColor: '#ddf4ff', color: '#0969da', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>{msg}</div>}
      {err && <div style={{ padding: '8px 10px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>{err}</div>}
      {step === 'request' ? (
        <RequestResetSection email={email} setEmail={setEmail} onSubmit={handleRequestSubmit} loading={loading} onBack={onBackToLogin} />
      ) : (
        <ExecuteResetSection token={token} setToken={setToken} newPassword={newPassword} setNewPassword={setNewPassword} onSubmit={handleResetSubmit} loading={loading} onBack={(): void => setStep('request')} />
      )}
    </div>
  );
}
