'use client';

import { useState } from 'react';
import { toErrorMessage } from '../lib/types/error';

interface AuthGateProps {
  onAuthenticated: () => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [gateKey, setGateKey] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateSubmitting, setGateSubmitting] = useState(false);

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateKey.trim()) {
      setGateError('Client Auth Key를 입력해주세요.');
      return;
    }
    setGateSubmitting(true);
    setGateError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server_auth_key: gateKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '인증 키 등록에 실패했습니다.');
      }
      onAuthenticated();
    } catch (err: unknown) {
      setGateError(toErrorMessage(err));
    } finally {
      setGateSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '60px auto',
        padding: '32px',
        backgroundColor: '#ffffff',
        border: '1px solid #d0d7de',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(140, 149, 159, 0.15)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2328', margin: '0 0 8px 0' }}>
          GitHub Trend Agent
        </h2>
        <p style={{ fontSize: '14px', color: '#656d76', margin: 0, lineHeight: 1.5 }}>
          이 클라이언트 앱을 사용하려면 중앙 서버에서 발급받은{' '}
          <strong>Client Auth Key</strong>가 필요합니다.
        </p>
      </div>

      {gateError && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#ffebe9',
            border: '1px solid #ff8182',
            borderRadius: '6px',
            color: '#cf222e',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          {gateError}
        </div>
      )}

      <form onSubmit={handleGateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            htmlFor="gateKey"
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1f2328', marginBottom: '6px' }}
          >
            Client Auth Key
          </label>
          <input
            id="gateKey"
            type="text"
            value={gateKey}
            onChange={(e) => setGateKey(e.target.value)}
            placeholder="ak_..."
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              fontFamily: 'ui-monospace, monospace',
              border: '1px solid #d0d7de',
              borderRadius: '6px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={gateSubmitting}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: '#1f883d',
            border: '1px solid rgba(31, 35, 40, 0.15)',
            borderRadius: '6px',
            cursor: gateSubmitting ? 'not-allowed' : 'pointer',
            opacity: gateSubmitting ? 0.7 : 1,
          }}
        >
          {gateSubmitting ? '인증 확인 중...' : '인증 및 시작하기'}
        </button>
      </form>
    </div>
  );
}
