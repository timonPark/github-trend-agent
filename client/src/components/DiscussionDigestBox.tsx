'use client';

import React from 'react';

export function DiscussionDigestBox({ digest }: { digest?: string }): React.JSX.Element | null {
  if (!digest) {
    return null;
  }
  return (
    <div
      style={{
        marginTop: '12px',
        padding: '10px 14px',
        backgroundColor: '#f6f8fa',
        borderRadius: '6px',
        border: '1px solid #e1e4e8',
        fontSize: '13px',
        color: '#1f2328',
        lineHeight: 1.5,
        whiteSpace: 'pre-line',
      }}
    >
      <div style={{ fontWeight: 600, color: '#0969da', marginBottom: '4px' }}>
        📋 Repository Digest (3줄 요약)
      </div>
      {digest}
    </div>
  );
}
