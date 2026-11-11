'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DiscussionArchive } from '../lib/types';
import { ApiResponse, GetArchivesResponseDto, UpdateArchiveVisibilityResponseDto } from '../lib/types/api';
import { toErrorMessage } from '../lib/types/error';
import { UserArchiveRow } from './UserArchiveRow';

interface KeyCenterViewProps {
  currentUser: { id: string; username: string; client_auth_key?: string } | null;
  onOpenAuthModal: () => void;
  onUpdateUserKey: (newKey: string) => void;
}

function KeyDisplayCard({
  authKey,
  onRotateKey,
}: {
  authKey: string;
  onRotateKey: () => Promise<void>;
}): React.JSX.Element {
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [rotating, setRotating] = useState<boolean>(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(authKey);
    setCopied(true);
    setTimeout((): void => setCopied(false), 2000);
  };

  const handleRotate = async (): Promise<void> => {
    if (!confirm('키를 재발급하면 기존 키로 연결된 로컬 클라이언트에서 재등록이 필요합니다. 진행할까요?')) return;
    setRotating(true);
    await onRotateKey();
    setRotating(false);
  };

  const maskedKey: string = showKey ? authKey : `${authKey.slice(0, 9)}••••••••••••••••••••••••`;

  return (
    <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de', marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#1f2328' }}>🔑 내 Client Auth Key</h3>
      <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#656d76' }}>로컬 AI 클라이언트 설정 탭에 아래 키를 입력하여 중앙 서버와 동기화하세요.</p>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <code style={{ flex: 1, padding: '8px 12px', backgroundColor: '#f6f8fa', borderRadius: '6px', border: '1px solid #d0d7de', fontFamily: 'monospace', fontSize: '13px', color: '#1f2328' }}>
          {maskedKey}
        </code>
        <button onClick={(): void => setShowKey(!showKey)} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d0d7de', backgroundColor: '#ffffff', cursor: 'pointer' }}>
          {showKey ? '숨기기' : '보기'}
        </button>
        <button onClick={handleCopy} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', border: '1px solid rgba(27,31,36,0.15)', backgroundColor: copied ? '#dafbe1' : '#0969da', color: copied ? '#1a7f37' : '#ffffff', cursor: 'pointer' }}>
          {copied ? '✓ 복사됨!' : '클립보드 복사'}
        </button>
        <button disabled={rotating} onClick={handleRotate} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d0d7de', backgroundColor: '#ffffff', color: '#cf222e', cursor: rotating ? 'not-allowed' : 'pointer' }}>
          {rotating ? '재발급 중...' : '키 재발급'}
        </button>
      </div>
    </div>
  );
}

export function KeyCenterView({
  currentUser,
  onOpenAuthModal,
  onUpdateUserKey,
}: KeyCenterViewProps): React.JSX.Element {
  const [archives, setArchives] = useState<DiscussionArchive[]>([]);

  const loadArchives = useCallback(async (): Promise<void> => {
    if (!currentUser?.client_auth_key) return;
    try {
      const res: Response = await fetch('/api/archives', { headers: { 'x-client-auth-key': currentUser.client_auth_key } });
      const data: ApiResponse<GetArchivesResponseDto> = (await res.json()) as ApiResponse<GetArchivesResponseDto>;
      if (data.success && data.data) setArchives(data.data.archives);
    } catch (err: unknown) {
      console.error(toErrorMessage(err));
    }
  }, [currentUser]);

  useEffect((): void => {
    loadArchives();
  }, [loadArchives]);

  const handleRotateKey = async (): Promise<void> => {
    try {
      const token: string | null = localStorage.getItem('gta_server_token');
      const res: Response = await fetch('/api/auth/client-key', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data: { client_auth_key?: string } = (await res.json()) as { client_auth_key?: string };
      if (data.client_auth_key) onUpdateUserKey(data.client_auth_key);
    } catch (err: unknown) {
      alert(`키 재발급 실패: ${toErrorMessage(err)}`);
    }
  };

  const handleToggle = async (a: DiscussionArchive): Promise<void> => {
    if (!currentUser?.client_auth_key) return;
    try {
      const res: Response = await fetch('/api/archives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-client-auth-key': currentUser.client_auth_key },
        body: JSON.stringify({ id: a.id, is_public: !a.is_public }),
      });
      const data: ApiResponse<UpdateArchiveVisibilityResponseDto> = (await res.json()) as ApiResponse<UpdateArchiveVisibilityResponseDto>;
      if (data.success && data.data) {
        setArchives((prev: DiscussionArchive[]): DiscussionArchive[] =>
          prev.map((item: DiscussionArchive): DiscussionArchive => item.id === a.id ? data.data!.archive : item)
        );
      }
    } catch (err: unknown) {
      alert(`공개 설정 변경 실패: ${toErrorMessage(err)}`);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de', color: '#656d76' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2328', margin: '0 0 8px 0' }}>키 센터는 로그인이 필요한 서비스입니다</h3>
        <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>로그인하거나 회원가입 후 Client Auth Key를 발급받아 로컬 AI 클라이언트와 연동하세요.</p>
        <button onClick={onOpenAuthModal} style={{ padding: '8px 16px', backgroundColor: '#1f883d', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>로그인 / 회원가입</button>
      </div>
    );
  }

  return (
    <div>
      <KeyDisplayCard authKey={currentUser.client_auth_key || 'gta_live_not_configured'} onRotateKey={handleRotateKey} />
      <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #d0d7de', fontWeight: 600, fontSize: '14px' }}>내 동기화 아카이브 ({archives.length}개)</div>
        {archives.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#656d76', fontSize: '13px' }}>로컬 클라이언트에서 동기화된 토론 아카이브가 없습니다.</div>
        ) : (
          archives.map((a: DiscussionArchive): React.JSX.Element => <UserArchiveRow key={a.id} archive={a} onToggle={handleToggle} />)
        )}
      </div>
    </div>
  );
}
