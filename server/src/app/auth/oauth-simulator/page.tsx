'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SimulatorForm(): React.JSX.Element {
  const searchParams = useSearchParams();
  const provider: string = searchParams.get('provider') || 'github';
  const state: string = searchParams.get('state') || '';
  const redirectUri: string = searchParams.get('redirect_uri') || '/';

  const defaultUser: string = provider === 'github' ? 'dev-octocat' : 'dev-google-user';
  const [customUsername, setCustomUsername] = useState<string>(defaultUser);

  const handleSimulate = (usernameToUse: string): void => {
    const code: string = `dev-mock-${usernameToUse}`;
    const targetUrl: URL = new URL(redirectUri, window.location.origin);
    targetUrl.searchParams.set('code', code);
    if (state) targetUrl.searchParams.set('state', state);
    window.location.href = targetUrl.toString();
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '24px', border: '1px solid #d0d7de', borderRadius: '8px', backgroundColor: '#ffffff', boxShadow: '0 8px 24px rgba(140, 149, 159, 0.15)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px' }}>🧪</span>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Dev OAuth 시뮬레이터</h2>
      </div>
      <p style={{ fontSize: '13px', color: '#57606a', marginBottom: '16px', lineHeight: 1.5 }}>
        외부 OAuth Client ID/Secret 설정 없이 로컬 개발 및 오프라인 환경에서 <strong>{provider.toUpperCase()}</strong> 소셜 로그인을 즉시 시뮬레이션합니다.
      </p>

      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px', fontSize: '12px' }}>
        <div style={{ marginBottom: '4px' }}><strong>Provider:</strong> {provider}</div>
        <div style={{ wordBreak: 'break-all' }}><strong>Callback:</strong> {redirectUri}</div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>시뮬레이션할 소셜 유저명</label>
        <input
          type="text"
          value={customUsername}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setCustomUsername(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          onClick={(): void => handleSimulate(customUsername)}
          style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: '#1f883d', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          {provider === 'github' ? 'GitHub' : 'Google'} 계정으로 로그인 완료
        </button>
        <button
          type="button"
          onClick={(): void => window.close()}
          style={{ width: '100%', padding: '8px', fontSize: '12px', background: 'none', border: '1px solid #d0d7de', color: '#656d76', borderRadius: '6px', cursor: 'pointer' }}
        >
          시뮬레이션 취소
        </button>
      </div>
    </div>
  );
}

export default function OAuthSimulatorPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>시뮬레이터 로딩 중...</div>}>
      <SimulatorForm />
    </Suspense>
  );
}
