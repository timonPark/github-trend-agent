'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TermsAgreementGroup } from '@/components/TermsAgreementGroup';
import { TermsModal } from '@/components/TermsModal';
import { toErrorMessage } from '@/lib/types/error';
import { CheckUsernameResponseDto, OAuthOnboardingResponseDto } from '@/lib/types/api';

interface ParsedTokenPayload {
  provider?: string;
  suggested_username?: string;
  email?: string | null;
}

function parseTokenPayload(token: string): ParsedTokenPayload | null {
  try {
    const b64: string = token.split('.')[0];
    if (!b64) return null;
    const binaryStr: string = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(binaryStr) as ParsedTokenPayload;
  } catch {
    return null;
  }
}

function UsernameInput({
  username,
  status,
  onChange,
  onCheck,
}: {
  username: string;
  status: { available: boolean | null; message: string | null };
  onChange: (val: string) => void;
  onCheck: () => void;
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
        닉네임 (Username) <span style={{ color: '#cf222e' }}>*</span>
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          required
          value={username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => onChange(e.target.value)}
          placeholder="3~30자의 영문, 숫자, _, -"
          style={{ flex: 1, padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }}
        />
        <button
          type="button"
          onClick={onCheck}
          style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, backgroundColor: '#f6f8fa', color: '#24292f', border: '1px solid #d0d7de', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          중복 확인
        </button>
      </div>
      {status.message && (
        <div style={{ marginTop: '4px', fontSize: '11px', color: status.available ? '#1a7f37' : '#cf222e' }}>
          {status.available ? '✓ ' : '✕ '} {status.message}
        </div>
      )}
    </div>
  );
}

function OnboardingForm(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token: string = searchParams.get('token') || '';

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [provider, setProvider] = useState<string>('소셜');
  const [checkStatus, setCheckStatus] = useState<{ available: boolean | null; message: string | null }>({ available: null, message: null });
  const [agreedTerms, setAgreedTerms] = useState<boolean>(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    if (!token) return;
    const parsed: ParsedTokenPayload | null = parseTokenPayload(token);
    if (parsed) {
      if (parsed.suggested_username) setUsername(parsed.suggested_username);
      if (parsed.email) setEmail(parsed.email);
      if (parsed.provider) setProvider(parsed.provider.toUpperCase());
    }
  }, [token]);

  const handleCheckUsername = async (): Promise<void> => {
    if (!username.trim()) {
      setCheckStatus({ available: false, message: '닉네임을 입력해 주세요.' });
      return;
    }
    try {
      const res: Response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username.trim())}`);
      const data: CheckUsernameResponseDto = (await res.json()) as CheckUsernameResponseDto;
      setCheckStatus({ available: data.available, message: data.message || (data.available ? '사용 가능한 닉네임입니다.' : '사용 불가') });
    } catch {
      setCheckStatus({ available: false, message: '중복 검사에 실패했습니다.' });
    }
  };

  const handleFinish = (user: unknown, authToken: string): void => {
    localStorage.setItem('gta_server_user', JSON.stringify(user));
    localStorage.setItem('gta_server_token', authToken);
    if (window.opener) {
      window.opener.postMessage({ type: 'GTA_OAUTH_SUCCESS', user, token: authToken }, '*');
      window.close();
    } else {
      router.push('/keys');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (checkStatus.available === false) return setError('이미 사용 중인 닉네임입니다.');
    setLoading(true);
    setError(null);
    try {
      const res: Response = await fetch('/api/auth/oauth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_token: token, username: username.trim(), email: email.trim() || undefined, terms_agreed: agreedTerms && agreedPrivacy }),
      });
      const data: OAuthOnboardingResponseDto & { error?: string } = (await res.json()) as OAuthOnboardingResponseDto & { error?: string };
      if (!res.ok) throw new Error(data.error || '온보딩 처리에 실패했습니다.');
      handleFinish(data.user, data.token);
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled: boolean = loading || !agreedTerms || !agreedPrivacy || !username.trim();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '440px', maxWidth: '100%', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #d0d7de', padding: '24px', boxShadow: '0 8px 24px rgba(140, 149, 159, 0.15)' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0' }}>🎉 {provider} 가입 완료 단계</h1>
          <p style={{ fontSize: '12px', color: '#656d76', margin: 0, lineHeight: 1.5 }}>
            환영합니다! 서비스에서 사용할 닉네임과 이메일을 확인하고 약관에 동의해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <UsernameInput username={username} status={checkStatus} onChange={(v: string): void => { setUsername(v); setCheckStatus({ available: null, message: null }); }} onCheck={handleCheckUsername} />
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>이메일 (Email)</label>
            <input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setEmail(e.target.value)} placeholder="user@example.com" style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', boxSizing: 'border-box' }} />
          </div>
          <TermsAgreementGroup agreedTerms={agreedTerms} agreedPrivacy={agreedPrivacy} onChangeTerms={setAgreedTerms} onChangePrivacy={setAgreedPrivacy} onOpenTermsModal={setModalType} />
          {error && <div style={{ padding: '8px 10px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}
          <button type="submit" disabled={isSubmitDisabled} style={{ width: '100%', padding: '9px', fontSize: '13px', fontWeight: 600, backgroundColor: isSubmitDisabled ? '#8c959f' : '#1f883d', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: isSubmitDisabled ? 'not-allowed' : 'pointer' }}>
            {loading ? '계정 생성 중...' : '온보딩 완료하고 시작하기'}
          </button>
        </form>
      </div>
      <TermsModal isOpen={modalType !== null} type={modalType || 'terms'} onClose={(): void => setModalType(null)} />
    </div>
  );
}

export default function OAuthOnboardingPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>온보딩 페이지 불러오는 중...</div>}>
      <OnboardingForm />
    </Suspense>
  );
}
