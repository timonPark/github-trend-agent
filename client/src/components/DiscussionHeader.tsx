'use client';

import React from 'react';
import { TrendingRepository } from '../lib/types';

interface DiscussionHeaderProps {
  repo: TrendingRepository;
  allRepos: TrendingRepository[];
  onSelectRepo: (repo: TrendingRepository) => void;
  onOpenReadme: (repo: TrendingRepository) => void;
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
      style={{
        padding: '6px 10px',
        fontSize: '14px',
        fontWeight: 600,
        borderRadius: '6px',
        border: '1px solid #d0d7de',
        backgroundColor: '#ffffff',
        color: '#1f2328',
        cursor: 'pointer',
      }}
    >
      {allRepos.map(
        (r: TrendingRepository): React.JSX.Element => (
          <option key={r.full_name} value={r.full_name}>
            #{r.rank} {r.full_name}
          </option>
        )
      )}
    </select>
  );
}

function RepoMetaBadges({ repo }: { repo: TrendingRepository }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: '#656d76', marginTop: '6px' }}>
      {repo.language && <span>🔹 {repo.language}</span>}
      <span>★ {repo.total_stars.toLocaleString()}</span>
      <span style={{ color: '#1a7f37', fontWeight: 600 }}>▲ +{repo.daily_stars.toLocaleString()} today</span>
      <a
        href={repo.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#0969da', textDecoration: 'none', fontWeight: 500 }}
      >
        GitHub ↗
      </a>
    </div>
  );
}

function DigestBox({ digest }: { digest?: string }): React.JSX.Element | null {
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
      <div style={{ fontWeight: 600, color: '#0969da', marginBottom: '4px' }}>📋 Repository Digest (3줄 요약)</div>
      {digest}
    </div>
  );
}

export function DiscussionHeader({
  repo,
  allRepos,
  onSelectRepo,
  onOpenReadme,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RepoSelector repo={repo} allRepos={allRepos} onSelectRepo={onSelectRepo} />
          </div>
          <RepoMetaBadges repo={repo} />
        </div>
        <button
          onClick={(): void => onOpenReadme(repo)}
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
          📖 README 원문 보기
        </button>
      </div>
      <DigestBox digest={repo.digest} />
    </div>
  );
}
