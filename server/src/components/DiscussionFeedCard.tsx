'use client';

import React from 'react';
import { DiscussionArchive } from '../lib/types';

interface DiscussionFeedCardProps {
  archive: DiscussionArchive;
  onSelect: (archive: DiscussionArchive) => void;
}

function formatDate(isoString: string): string {
  try {
    const d: Date = new Date(isoString);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

export function DiscussionFeedCard({ archive, onSelect }: DiscussionFeedCardProps): React.JSX.Element {
  return (
    <div
      onClick={(): void => onSelect(archive)}
      style={{
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #d0d7de',
        marginBottom: '14px',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(31,35,40,0.04)',
        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0969da', backgroundColor: '#ddf4ff', padding: '2px 8px', borderRadius: '12px' }}>
            @{archive.username}
          </span>
          <span style={{ fontSize: '12px', color: '#656d76' }}>
            📅 {archive.snapshot_date}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#8c959f' }}>
          {formatDate(archive.created_at)}
        </span>
      </div>

      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#1f2328' }}>
        {archive.repo_full_name}
      </h3>

      <div
        style={{
          padding: '10px 14px',
          backgroundColor: '#f6f8fa',
          borderRadius: '6px',
          border: '1px solid #eaeef2',
          marginBottom: '12px',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#656d76', marginBottom: '4px' }}>
          🤖 AI 토론 핵심 결론
        </div>
        <div style={{ fontSize: '13px', color: '#1f2328', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {archive.discussion_summary}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#656d76' }}>
          💬 대화 {archive.messages.length}개
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0969da' }}>
          전체 대화 및 Digest 보기 ➔
        </span>
      </div>
    </div>
  );
}
