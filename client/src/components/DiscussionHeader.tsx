'use client';

import React from 'react';
import { TrendingRepository } from '../lib/types';
import { DiscussionDigestBox } from './DiscussionDigestBox';

interface DiscussionHeaderProps {
  repo: TrendingRepository;
  allRepos: TrendingRepository[];
  onSelectRepo: (repo: TrendingRepository) => void;
  onOpenReadme: (repo: TrendingRepository) => void;
  onOpenArchiveModal?: () => void;
  messagesCount?: number;
}

function RepoSelector({
  repo,
  allRepos,
  onSelectRepo,
}: {
  repo: TrendingRepository;
  allRepos: TrendingRepository[];
  onSelectRepo: (repo: TrendingRepository) => void;
}): React.JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const found: TrendingRepository | undefined = allRepos.find(
      (r: TrendingRepository): boolean => r.full_name === e.target.value
    );
    if (found) {
      onSelectRepo(found);
    }
  };

  return (
    <select
      value={repo.full_name}
      onChange={handleChange}
      style={{ padding: '6px 10px', fontSize: '14px', fontWeight: 600, borderRadius: '6px', border: '1px solid #d0d7de', backgroundColor: '#ffffff', color: '#1f2328', cursor: 'pointer' }}
    >
      {allRepos.map((r: TrendingRepository): React.JSX.Element => (
        <option key={r.full_name} value={r.full_name}>#{r.rank} {r.full_name}</option>
      ))}
    </select>
  );
}

function RepoMetaBadges({ repo }: { repo: TrendingRepository }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: '#656d76', marginTop: '6px' }}>
      {repo.language && <span>🔹 {repo.language}</span>}
      <span>★ {repo.total_stars.toLocaleString()}</span>
      <span style={{ color: '#1a7f37', fontWeight: 600 }}>▲ +{repo.daily_stars.toLocaleString()} today</span>
      <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0969da', textDecoration: 'none', fontWeight: 500 }}>
        GitHub ↗
      </a>
    </div>
  );
}

function ActionButtons({
  onOpenReadme,
  onOpenArchiveModal,
  messagesCount,
}: {
  onOpenReadme: () => void;
  onOpenArchiveModal?: () => void;
  messagesCount: number;
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={onOpenReadme}
        style={{
          padding: '6px 12px',
          fontSize: '13px',
          borderRadius: '6px',
          border: '1px solid #d0d7de',
          backgroundColor: '#f6f8fa',
          color: '#1f2328',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        📖 README
      </button>
      {onOpenArchiveModal && (
        <button
          onClick={onOpenArchiveModal}
          disabled={messagesCount === 0}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1px solid rgba(27,31,36,0.15)',
            backgroundColor: messagesCount === 0 ? '#f6f8fa' : '#0969da',
            color: messagesCount === 0 ? '#8c959f' : '#ffffff',
            cursor: messagesCount === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          📦 토론 종료 및 보관
        </button>
      )}
    </div>
  );
}

export function DiscussionHeader({
  repo,
  allRepos,
  onSelectRepo,
  onOpenReadme,
  onOpenArchiveModal,
  messagesCount = 0,
}: DiscussionHeaderProps): React.JSX.Element {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <RepoSelector repo={repo} allRepos={allRepos} onSelectRepo={onSelectRepo} />
          <RepoMetaBadges repo={repo} />
        </div>
        <ActionButtons
          onOpenReadme={(): void => onOpenReadme(repo)}
          onOpenArchiveModal={onOpenArchiveModal}
          messagesCount={messagesCount}
        />
      </div>
      <DiscussionDigestBox digest={repo.digest} />
    </div>
  );
}
