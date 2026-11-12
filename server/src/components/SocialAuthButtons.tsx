'use client';

import React from 'react';
import { OAuthProvider } from '../lib/oauth';

interface SocialAuthButtonsProps {
  onLogin: (provider: OAuthProvider) => void;
  dividerText?: string;
}

function GitHubButton({ onClick }: { onClick: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '9px', fontSize: '13px', fontWeight: 600, backgroundColor: '#24292f', color: '#ffffff', border: '1px solid #24292f', borderRadius: '6px', cursor: 'pointer' }}
    >
      <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
      </svg>
      GitHub로 계속하기
    </button>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
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
  );
}

function KakaoButton({ onClick }: { onClick: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '9px', fontSize: '13px', fontWeight: 600, backgroundColor: '#FEE500', color: '#191919', border: '1px solid #FEE500', borderRadius: '6px', cursor: 'pointer' }}
    >
      <svg height="16" width="16" viewBox="0 0 24 24" fill="#191919">
        <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.82 1.84 5.31 4.65 6.74-.2.74-.74 2.69-.85 3.11-.14.52.19.51.4.37.17-.11 2.66-1.8 3.73-2.53.67.09 1.36.14 2.07.14 5.52 0 10-3.58 10-8s-4.48-8-10-8Z" />
      </svg>
      카카오로 계속하기
    </button>
  );
}

function NaverButton({ onClick }: { onClick: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '9px', fontSize: '13px', fontWeight: 600, backgroundColor: '#03C75A', color: '#ffffff', border: '1px solid #03C75A', borderRadius: '6px', cursor: 'pointer' }}
    >
      <svg height="14" width="14" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M16.273 12.845 7.37 0H0v24h7.727V11.155L16.63 24H24V0h-7.727v12.845Z" />
      </svg>
      네이버로 계속하기
    </button>
  );
}

function Divider({ text }: { text: string }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
      <div style={{ flex: 1, height: '1px', backgroundColor: '#d0d7de' }} />
      <span style={{ padding: '0 8px', fontSize: '11px', color: '#656d76' }}>{text}</span>
      <div style={{ flex: 1, height: '1px', backgroundColor: '#d0d7de' }} />
    </div>
  );
}

export function openSocialLoginPopup(provider: OAuthProvider): void {
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

export function SocialAuthButtons({
  onLogin,
  dividerText = '또는 아이디로 계속하기',
}: SocialAuthButtonsProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
      <GitHubButton onClick={(): void => onLogin('github')} />
      <GoogleButton onClick={(): void => onLogin('google')} />
      <KakaoButton onClick={(): void => onLogin('kakao')} />
      <NaverButton onClick={(): void => onLogin('naver')} />
      {dividerText && <Divider text={dividerText} />}
    </div>
  );
}
