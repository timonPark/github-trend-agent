'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ForgotPasswordView } from '@/components/ForgotPasswordView';

export default function ForgotPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleBackToLogin = (): void => {
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '420px', maxWidth: '100%', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #d0d7de', padding: '24px', boxShadow: '0 8px 24px rgba(140, 149, 159, 0.15)' }}>
        <div style={{ marginBottom: '16px' }}>
          <Link href="/" style={{ color: '#0969da', fontSize: '12px', textDecoration: 'none' }}>
            ← 메인 포털로 돌아가기
          </Link>
        </div>
        {successMsg && (
          <div style={{ padding: '8px 10px', backgroundColor: '#dafbe1', color: '#1a7f37', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
            {successMsg}
          </div>
        )}
        <ForgotPasswordView onBackToLogin={handleBackToLogin} onSuccessNotification={setSuccessMsg} />
      </div>
    </div>
  );
}
