'use client';

import React, { useState, useEffect } from 'react';
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

function SocialAuthButtons({ onLogin }: { onLogin: (provider: 'github' | 'google') => void }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
      <button
        type="button"
        onClick={(): void => onLogin('github')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '9px', fontSize: '13px', fontWeight: 600, backgroundColor: '#24292f', color: '#ffffff', border: '1px solid #24292f', borderRadius: '6px', cursor: 'pointer' }}
      >
        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
        </svg>
        GitHub로 계속하기
      </button>
      <button
        type="button"
        onClick={(): void => onLogin('google')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '9px', fontSize: '13px', fontWeight: 600, backgroundColor: '#ffffff', color: '#1f2328', border: '1px solid #d0d7de', borderRadius: '6px', cursor: 'pointer' }}
      >
        <svg height="16" width="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
          <path fill="#FBBC05" d="M5.28 14.27a7.18 7.18 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15Z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
        </svg>
        Google로 계속하기
      </button>
      <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#d0d7de' }} />
        <span style={{ padding: '0 8px', fontSize: '11px', color: '#656d76' }}>또는 아이디로 계속하기</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#d0d7de' }} />
      </div>
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

function openOAuthPopup(provider: 'github' | 'google'): void {
  const width: number = 520;
  const height: number = 650;
  const left: number = window.screenX + (window.outerWidth - width) / 2;
  const top: number = window.screenY + (window.outerHeight - height) / 2;
  window.open(
    `/api/auth/oauth/${provider}`,
    `oauth_${provider}`,
    `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
  );
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

  useEffect((): (() => void) => {
    const handleMessage = (event: MessageEvent): void => {
      if (event.data?.type === 'GTA_OAUTH_SUCCESS') {
        const { user, token } = event.data;
        localStorage.setItem('gta_server_user', JSON.stringify(user));
        localStorage.setItem('gta_server_token', token);
        onSuccess(user, token);
      } else if (event.data?.type === 'GTA_OAUTH_ERROR') {
        setError(event.data.error || '소셜 인증에 실패했습니다.');
      }
    };
    window.addEventListener('message', handleMessage);
    return (): void => window.removeEventListener('message', handleMessage);
  }, [onSuccess]);

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
          <>
            <SocialAuthButtons onLogin={openOAuthPopup} />
            <form onSubmit={handleSubmit}>
              <UsernameAndEmailFields tab={tab} username={username} email={email} setUsername={setUsername} setEmail={setEmail} />
              <PasswordField tab={tab} password={password} setPassword={setPassword} onForgotClick={(): void => setTab('forgot')} />
              {tab === 'register' && (
                <TermsAgreementGroup agreedTerms={agreedTerms} agreedPrivacy={agreedPrivacy} onChangeTerms={setAgreedTerms} onChangePrivacy={setAgreedPrivacy} onOpenTermsModal={setModalType} />
              )}
              {error && <div style={{ padding: '8px 10px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}
              <button type="submit" disabled={isSubmitDisabled} style={{ width: '100%', padding: '8px', fontSize: '13px', fontWeight: 600, backgroundColor: isSubmitDisabled ? '#8c959f' : '#1f883d', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: isSubmitDisabled ? 'not-allowed' : 'pointer' }}>
                {loading ? '처리 중...' : tab === 'register' ? '약관 동의하고 가입하기' : '로그인'}
              </button>
            </form>
          </>
        )}
      </div>
      <TermsModal isOpen={modalType !== null} type={modalType || 'terms'} onClose={(): void => setModalType(null)} />
    </div>
  );
}
