'use client';

import React, { useEffect } from 'react';
import { TrendingRepository } from '../lib/types';

interface ServerReadmeModalProps {
  repo: TrendingRepository | null;
  onClose: () => void;
}

export function ServerReadmeModal({ repo, onClose }: ServerReadmeModalProps): React.JSX.Element | null {
  useEffect((): (() => void) => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!repo) {
    return null;
  }

  const hasReadme: boolean = Boolean(repo.readme && repo.readme.trim().length > 0);

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
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(140,149,159,0.2)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #d0d7de',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #d0d7de',
            backgroundColor: '#f6f8fa',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#1f2328' }}>
              📄 {repo.full_name} / README.md
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: '#656d76',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          {hasReadme ? (
            <pre
              style={{
                margin: 0,
                fontSize: '12px',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#1f2328',
                lineHeight: 1.6,
              }}
            >
              {repo.readme}
            </pre>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#656d76', fontSize: '13px' }}>
              ℹ️ 보관소에 등록된 README 원문이 없습니다.
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderTop: '1px solid #d0d7de',
            backgroundColor: '#f6f8fa',
          }}
        >
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '13px', color: '#0969da', textDecoration: 'none', fontWeight: 500 }}
          >
            GitHub에서 전체 보기 ↗
          </a>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid #d0d7de',
              backgroundColor: '#ffffff',
              color: '#1f2328',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
