'use client';

import React from 'react';
import { DiscussionArchive } from '../lib/types';

interface UserArchiveRowProps {
  archive: DiscussionArchive;
  onToggle: (a: DiscussionArchive) => Promise<void>;
}

export function UserArchiveRow({ archive, onToggle }: UserArchiveRowProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #d0d7de' }}>
      <div>
        <a href={archive.repo_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: '#0969da', textDecoration: 'none' }}>
          {archive.repo_full_name}
        </a>
        <div style={{ fontSize: '12px', color: '#656d76', marginTop: '2px' }}>
          {archive.snapshot_date} • {archive.discussion_summary}
        </div>
      </div>
      <button
        onClick={(): Promise<void> => onToggle(archive)}
        style={{
          padding: '4px 10px',
          fontSize: '12px',
          borderRadius: '6px',
          border: '1px solid #d0d7de',
          backgroundColor: archive.is_public ? '#dafbe1' : '#f6f8fa',
          color: archive.is_public ? '#1a7f37' : '#656d76',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {archive.is_public ? '🌐 Public' : '🔒 Private'}
      </button>
    </div>
  );
}
