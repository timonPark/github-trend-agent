'use client';

import React, { useState } from 'react';
import { TrendingRepository, ChatMessage } from '../lib/types';
import { ApiResponse, CreateLocalArchiveResponseDto } from '../lib/types/api';
import { toErrorMessage } from '../lib/types/error';

interface DiscussionArchiveModalProps {
  repo: TrendingRepository;
  messages: ChatMessage[];
  snapshotDate: string;
  onClose: () => void;
  onArchived: (archiveId: string) => void;
}

export function DiscussionArchiveModal({
  repo,
  messages,
  snapshotDate,
  onClose,
  onArchived,
}: DiscussionArchiveModalProps): React.JSX.Element {
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveArchive = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      const res: Response = await fetch('/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot_date: snapshotDate,
          repo_full_name: repo.full_name,
          repo_url: repo.url,
          repo_digest: repo.digest,
          messages,
          is_public: isPublic,
        }),
      });
      const data: ApiResponse<CreateLocalArchiveResponseDto> =
        (await res.json()) as ApiResponse<CreateLocalArchiveResponseDto>;
      if (!data.success || !data.data) {
        throw new Error(data.error || '아카이브 저장에 실패했습니다.');
      }
      onArchived(data.data.archive.id);
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(31, 35, 40, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          width: '460px',
          maxWidth: '90%',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(140, 149, 159, 0.2)',
          border: '1px solid #d0d7de',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#1f2328' }}>
          📦 토론 종료 및 아카이브 저장
        </h3>
        <p style={{ fontSize: '13px', color: '#656d76', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          현재까지 나눈 <strong>{messages.length}개</strong>의 대화를 바탕으로 로컬 AI가 핵심 인사이트 및 결론 요약을
          자동 생성하고, 계정별 아카이브로 안전하게 보관합니다.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1f2328', marginBottom: '8px' }}>공개 설정:</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px', cursor: 'pointer' }}>
            <input type="radio" name="visibility" checked={isPublic} onChange={(): void => setIsPublic(true)} disabled={saving} />
            <span>🌐 공개 아카이브 (중앙 서버 커뮤니티 피드 공유)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="radio" name="visibility" checked={!isPublic} onChange={(): void => setIsPublic(false)} disabled={saving} />
            <span>🔒 비공개 아카이브 (나만 보기)</span>
          </label>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #d0d7de',
              backgroundColor: '#f6f8fa',
              color: '#1f2328',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            취소
          </button>
          <button
            type="button"
            disabled={saving || messages.length === 0}
            onClick={handleSaveArchive}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid rgba(27,31,36,0.15)',
              backgroundColor: saving ? '#8c959f' : '#1f883d',
              color: '#ffffff',
              cursor: saving || messages.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'AI 요약 및 보관 중...' : '요약 생성 및 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
