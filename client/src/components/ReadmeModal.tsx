'use client';

import { TrendingRepository } from '../lib/types';

interface ReadmeModalProps {
  repo: TrendingRepository | null;
  loading: boolean;
  content: string;
  onClose: () => void;
}

export function ReadmeModal({ repo, loading, content, onClose }: ReadmeModalProps) {
  if (!repo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 24px rgba(140, 149, 159, 0.3)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #d0d7de',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f6f8fa',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{repo.full_name} README</h3>
            <span style={{ fontSize: '12px', color: '#656d76' }}>정제된 마크다운 텍스트 뷰어</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#656d76',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#656d76' }}>
              README 내용을 정제하여 불러오는 중...
            </div>
          ) : (
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '13px',
                lineHeight: 1.6,
                backgroundColor: '#f6f8fa',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #d0d7de',
              }}
            >
              {content || '등록된 README 내용이 없습니다.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
