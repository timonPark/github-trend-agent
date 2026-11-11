'use client';

import React, { useEffect } from 'react';
import { DiscussionArchive, ChatMessage } from '../lib/types';

interface DiscussionFeedDetailModalProps {
  archive: DiscussionArchive | null;
  onClose: () => void;
}

function MessageBubble({ msg }: { msg: ChatMessage }): React.JSX.Element {
  const isUser: boolean = msg.role === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
      <span style={{ fontSize: '11px', color: '#656d76', marginBottom: '3px' }}>
        {isUser ? '👤 사용자' : '🤖 Local AI'}
      </span>
      <div
        style={{
          maxWidth: '80%',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          backgroundColor: isUser ? '#0969da' : '#f6f8fa',
          color: isUser ? '#ffffff' : '#1f2328',
          border: isUser ? 'none' : '1px solid #d0d7de',
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function DiscussionFeedDetailModal({ archive, onClose }: DiscussionFeedDetailModalProps): React.JSX.Element | null {
  useEffect((): (() => void) => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!archive) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(31,35,40,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        onClick={(e: React.MouseEvent<HTMLDivElement>): void => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(140,149,159,0.2)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #d0d7de',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #d0d7de', backgroundColor: '#f6f8fa' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1f2328' }}>
              💬 {archive.repo_full_name} 토론 아카이브
            </h3>
            <span style={{ fontSize: '12px', color: '#656d76' }}>
              작성자: @{archive.username} · 스냅샷: {archive.snapshot_date}
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#656d76', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          {archive.repo_digest && (
            <div style={{ padding: '12px 14px', backgroundColor: '#f6f8fa', borderRadius: '6px', border: '1px solid #eaeef2', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#656d76', marginBottom: '4px' }}>📄 초기 저장소 요약 (Repository Digest)</div>
              <div style={{ fontSize: '12px', color: '#1f2328', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{archive.repo_digest}</div>
            </div>
          )}

          <div style={{ padding: '12px 14px', backgroundColor: '#ddf4ff', borderRadius: '6px', border: '1px solid #54aeff', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#0969da', marginBottom: '4px' }}>🤖 AI 토론 핵심 결론 요약</div>
            <div style={{ fontSize: '13px', color: '#1f2328', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{archive.discussion_summary}</div>
          </div>

          <div style={{ borderTop: '1px solid #d0d7de', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#1f2328' }}>💬 전체 대화 타임라인 ({archive.messages.length}개)</h4>
            {archive.messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#656d76', fontSize: '12px', padding: '20px 0' }}>대화 내역이 없습니다.</div>
            ) : (
              archive.messages.map((msg: ChatMessage): React.JSX.Element => <MessageBubble key={msg.id} msg={msg} />)
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid #d0d7de', backgroundColor: '#f6f8fa' }}>
          <button type="button" onClick={onClose} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', border: '1px solid #d0d7de', backgroundColor: '#ffffff', color: '#1f2328', cursor: 'pointer' }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
