'use client';

import React, { useState } from 'react';
import { toErrorMessage } from '../lib/types/error';
import { TermsModal } from './TermsModal';
import { TermsAgreementGroup } from './TermsAgreementGroup';
import { ForgotPasswordView } from './ForgotPasswordView';

export type AuthTab = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: { id: string; username: string; client_auth_key: string }, token: string) => void;
}

interface ExecuteAuthParams {
  tab: 'login' | 'register';
  username: string;
  email: string;
  password: string;
  agreedTerms: boolean;
  agreedPrivacy: boolean;
  onSuccess: (user: { id: string; username: string; client_auth_key: string }, token: string) => void;
  onError: (msg: string) => void;
  onFinally: () => void;
}

function AuthModalTabs({
  tab,
  setTab,
  onClose,
}: {
  tab: AuthTab;
  setTab: (t: AuthTab) => void;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" onClick={(): void => setTab('login')} style={{ fontSize: '15px', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: tab === 'login' ? '#0969da' : '#656d76', borderBottom: tab === 'login' ? '2px solid #0969da' : 'none', paddingBottom: '4px' }}>로그인</button>
        <button type="button" onClick={(): void => setTab('register')} style={{ fontSize: '15px', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: tab === 'register' ? '#0969da' : '#656d76', borderBottom: tab === 'register' ? '2px solid #0969da' : 'none', paddingBottom: '4px' }}>회원가입</button>
      </div>
      <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#656d76' }}>✕</button>
    </div>
  );
}

function UsernameAndEmailFields({
  tab,
  username,
  email,
  setUsername,
  setEmail,
}: {
  tab: AuthTab;
  username: string;
  email: string;
  setUsername: (val: string) => void;
  setEmail: (val: string) => void;
}): React.JSX.Element {
  return (
    <>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>아이디 (Username)</label>
        <input type="text" required value={username} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setUsername(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }} />
      </div>
      {tab === 'register' && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>이메일 (Email)</label>
          <input type="email" required placeholder="user@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setEmail(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }} />
        </div>
      )}
    </>
  );
}

function PasswordField({
  tab,
  password,
  setPassword,
  onForgotClick,
}: {
  tab: AuthTab;
  password: string;
  setPassword: (val: string) => void;
  onForgotClick: () => void;
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600 }}>비밀번호</label>
        {tab === 'login' && (
          <button type="button" onClick={onForgotClick} style={{ background: 'none', border: 'none', color: '#0969da', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
            비밀번호를 잊으셨나요?
          </button>
        )}
      </div>
      <input type="password" required value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setPassword(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }} />
    </div>
  );
}

async function executeAuthSubmit(p: ExecuteAuthParams): Promise<void> {
  const endpoint: string = p.tab === 'register' ? '/api/auth/register' : '/api/auth/login';
  const bodyPayload: Record<string, unknown> = {
    username: p.username,
    password: p.password,
    ...(p.tab === 'register' ? { email: p.email, terms_agreed: p.agreedTerms && p.agreedPrivacy } : {}),
  };
  try {
    const res: Response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
    });
    const data: { user?: { id: string; username: string; client_auth_key: string }; token?: string; error?: string } =
      (await res.json()) as { user?: { id: string; username: string; client_auth_key: string }; token?: string; error?: string };
    if (!res.ok || !data.user || !data.token) {
      throw new Error(data.error || '인증에 실패했습니다.');
    }
    localStorage.setItem('gta_server_user', JSON.stringify(data.user));
    localStorage.setItem('gta_server_token', data.token);
    p.onSuccess(data.user, data.token);
  } catch (err: unknown) {
    p.onError(toErrorMessage(err));
  } finally {
    p.onFinally();
  }
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps): React.JSX.Element {
  const [tab, setTab] = useState<AuthTab>('login');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    await executeAuthSubmit({ tab: tab as 'login' | 'register', username, email, password, agreedTerms, agreedPrivacy, onSuccess, onError: setError, onFinally: (): void => setLoading(false) });
  };

  const isSubmitDisabled: boolean = loading || (tab === 'register' && (!agreedTerms || !agreedPrivacy));

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(31, 35, 40, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '420px', maxWidth: '92%', padding: '24px', border: '1px solid #d0d7de', boxSizing: 'border-box', boxShadow: '0 8px 24px rgba(140, 149, 159, 0.2)' }}>
        <AuthModalTabs tab={tab} setTab={setTab} onClose={onClose} />
        {infoMessage && <div style={{ padding: '8px 10px', backgroundColor: '#dafbe1', color: '#1a7f37', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>{infoMessage}</div>}
        {tab === 'forgot' ? (
          <ForgotPasswordView onBackToLogin={(): void => setTab('login')} onSuccessNotification={(msg: string): void => { setInfoMessage(msg); setTab('login'); }} />
        ) : (
          <form onSubmit={handleSubmit}>
            <UsernameAndEmailFields tab={tab} username={username} email={email} setUsername={setUsername} setEmail={setEmail} />
            <PasswordField tab={tab} password={password} setPassword={setPassword} onForgotClick={(): void => setTab('forgot')} />
            {tab === 'register' && (
              <TermsAgreementGroup agreedTerms={agreedTerms} agreedPrivacy={agreedPrivacy} onChangeTerms={setAgreedTerms} onChangePrivacy={setAgreedPrivacy} onOpenTermsModal={setModalType} />
            )}
            {error && <div style={{ padding: '8px 10px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}
            <button type="submit" disabled={isSubmitDisabled} style={{ width: '100%', padding: '8px', fontSize: '13px', fontWeight: 600, backgroundColor: isSubmitDisabled ? '#8c959f' : '#1f883d', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: isSubmitDisabled ? 'not-allowed' : 'pointer' }}>
              {loading ? '처리 중...' : tab === 'register' ? '약관 동의하고 키 발급받기' : '로그인'}
            </button>
          </form>
        )}
      </div>
      <TermsModal isOpen={modalType !== null} type={modalType || 'terms'} onClose={(): void => setModalType(null)} />
    </div>
  );
}
