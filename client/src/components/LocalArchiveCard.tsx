'use client';

import React from 'react';
import { LocalArchive } from '../lib/types';

interface LocalArchiveCardProps {
  archive: LocalArchive;
  toggling: boolean;
  onToggleVisibility: (archive: LocalArchive) => void;
  onViewDetail: (archive: LocalArchive) => void;
}

function ArchiveCardBadges({ archive }: { archive: LocalArchive }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <span
        style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: archive.is_public ? '#dafbe1' : '#f6f8fa',
          color: archive.is_public ? '#1a7f37' : '#656d76',
          border: archive.is_public ? '1px solid #4ac26b' : '1px solid #d0d7de',
        }}
      >
        {archive.is_public ? '🌐 Public' : '🔒 Private'}
      </span>
      <span
        style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: archive.synced_with_server ? '#ddf4ff' : '#fff8c5',
          color: archive.synced_with_server ? '#0969da' : '#9a6700',
          border: archive.synced_with_server ? '1px solid #54aeff' : '1px solid #d4a72c',
        }}
      >
        {archive.synced_with_server ? '☁️ 중앙 동기화' : '💾 로컬 전용'}
      </span>
    </div>
  );
}

function ArchiveCardHeader({ archive }: { archive: LocalArchive }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
      <div>
        <a
          href={archive.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '16px', fontWeight: 600, color: '#0969da', textDecoration: 'none' }}
        >
          {archive.repo_full_name}
        </a>
        <div style={{ fontSize: '12px', color: '#656d76', marginTop: '4px' }}>
          스냅샷: {archive.snapshot_date} • 보관일: {new Date(archive.created_at).toLocaleString()} • 대화 {archive.messages.length}개
        </div>
      </div>
      <ArchiveCardBadges archive={archive} />
    </div>
  );
}

function ArchiveCardActions({
  archive,
  toggling,
  onToggleVisibility,
  onViewDetail,
}: {
  archive: LocalArchive;
  toggling: boolean;
  onToggleVisibility: (a: LocalArchive) => void;
  onViewDetail: (a: LocalArchive) => void;
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
      <button
        type="button"
        disabled={toggling}
        onClick={(): void => onToggleVisibility(archive)}
        style={{
          padding: '5px 12px',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: '6px',
          border: '1px solid #d0d7de',
          backgroundColor: '#f6f8fa',
          color: '#1f2328',
          cursor: toggling ? 'not-allowed' : 'pointer',
        }}
      >
        {toggling ? '전환 중...' : archive.is_public ? '🔒 비공개로 전환' : '🌐 공개로 전환'}
      </button>
      <button
        type="button"
        onClick={(): void => onViewDetail(archive)}
        style={{
          padding: '5px 12px',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: '6px',
          border: '1px solid rgba(27,31,36,0.15)',
          backgroundColor: '#0969da',
          color: '#ffffff',
          cursor: 'pointer',
        }}
      >
        💬 상세 대화 열람
      </button>
    </div>
  );
}

export function LocalArchiveCard({
  archive,
  toggling,
  onToggleVisibility,
  onViewDetail,
}: LocalArchiveCardProps): React.JSX.Element {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#ffffff',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        marginBottom: '12px',
      }}
    >
      <ArchiveCardHeader archive={archive} />
      <div
        style={{
          padding: '10px 12px',
          backgroundColor: '#f6f8fa',
          borderRadius: '6px',
          border: '1px solid #e1e4e8',
          fontSize: '13px',
          color: '#1f2328',
          lineHeight: 1.5,
          whiteSpace: 'pre-line',
        }}
      >
        <span style={{ fontWeight: 600, color: '#0969da', display: 'block', marginBottom: '4px' }}>
          💡 AI 토론 핵심 결론 요약:
        </span>
        {archive.discussion_summary}
      </div>
      <ArchiveCardActions
        archive={archive}
        toggling={toggling}
        onToggleVisibility={onToggleVisibility}
        onViewDetail={onViewDetail}
      />
    </div>
  );
}
