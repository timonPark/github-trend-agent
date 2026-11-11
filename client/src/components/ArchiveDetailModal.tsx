'use client';

import React from 'react';
import { LocalArchive, ChatMessage } from '../lib/types';

interface ArchiveDetailModalProps {
  archive: LocalArchive | null;
  onClose: () => void;
}

function DetailTimeline({ messages }: { messages: ChatMessage[] }): React.JSX.Element {
  if (messages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: '#656d76', fontSize: '13px' }}>
        대화 메시지 로그가 없습니다.
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px', border: '1px solid #d0d7de' }}>
      {messages.map((m: ChatMessage): React.JSX.Element => {
        const isUser: boolean = m.role === 'user';
        return (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#656d76', marginBottom: '2px' }}>
              {isUser ? '👤 You' : '🤖 Local AI Agent'} • {new Date(m.timestamp).toLocaleTimeString()}
            </div>
            <div
              style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
                backgroundColor: isUser ? '#ddf4ff' : '#ffffff',
                color: isUser ? '#0969da' : '#1f2328',
                border: isUser ? '1px solid #54aeff' : '1px solid #d0d7de',
              }}
            >
              {m.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ArchiveDetailModal({
  archive,
  onClose,
}: ArchiveDetailModalProps): React.JSX.Element | null {
  if (!archive) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(31, 35, 40, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '640px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', border: '1px solid #d0d7de', boxShadow: '0 8px 24px rgba(140, 149, 159, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1f2328' }}>{archive.repo_full_name}</h3>
            <div style={{ fontSize: '12px', color: '#656d76', marginTop: '4px' }}>
              스냅샷: {archive.snapshot_date} • 보관일: {new Date(archive.created_at).toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#656d76' }}>✕</button>
        </div>

        {archive.repo_digest && (
          <div style={{ marginBottom: '14px', padding: '10px 12px', backgroundColor: '#f6f8fa', borderRadius: '6px', border: '1px solid #e1e4e8', fontSize: '13px', color: '#1f2328', whiteSpace: 'pre-line' }}>
            <span style={{ fontWeight: 600, color: '#0969da', display: 'block', marginBottom: '2px' }}>📋 Repository Digest (3줄 요약)</span>
            {archive.repo_digest}
          </div>
        )}

        <div style={{ marginBottom: '16px', padding: '10px 12px', backgroundColor: '#dafbe1', borderRadius: '6px', border: '1px solid #4ac26b', fontSize: '13px', color: '#1a7f37', whiteSpace: 'pre-line' }}>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '2px' }}>💡 AI 토론 핵심 결론 요약</span>
          {archive.discussion_summary}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1f2328', marginBottom: '6px' }}>전체 대화 로그 ({archive.messages.length}개):</div>
          <DetailTimeline messages={archive.messages} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d0d7de', backgroundColor: '#f6f8fa', cursor: 'pointer' }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
