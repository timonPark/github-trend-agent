'use client';

import React from 'react';
import { TrendingRepository } from '../lib/types';

interface ServerRepoCardProps {
  repo: TrendingRepository;
  onViewReadme: (repo: TrendingRepository) => void;
}

function resolveRankBadgeStyle(rank: number): React.CSSProperties {
  const isTop3: boolean = rank <= 3;
  const bgColor: string = rank === 1 ? '#d4a72c' : rank === 2 ? '#6e7781' : rank === 3 ? '#b06f23' : '#afb8c1';
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: bgColor,
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: isTop3 ? 700 : 600,
    flexShrink: 0,
  };
}

export function ServerRepoCard({ repo, onViewReadme }: ServerRepoCardProps): React.JSX.Element {
  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #d0d7de',
        marginBottom: '14px',
        boxShadow: '0 1px 3px rgba(31,35,40,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={resolveRankBadgeStyle(repo.rank)}>#{repo.rank}</span>
          <div>
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '16px', fontWeight: 600, color: '#0969da', textDecoration: 'none' }}
            >
              {repo.full_name}
            </a>
            <span style={{ fontSize: '12px', color: '#656d76', marginLeft: '10px' }}>
              {repo.language || 'Unknown Language'}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a7f37' }}>
            ▲ +{repo.daily_stars.toLocaleString()} stars today
          </div>
          <div style={{ fontSize: '12px', color: '#656d76' }}>
            ★ {repo.total_stars.toLocaleString()}
          </div>
        </div>
      </div>

      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#1f2328', lineHeight: 1.5 }}>
        {repo.description || '저장소 설명이 없습니다.'}
      </p>

      {repo.digest && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#f6f8fa',
            borderRadius: '6px',
            border: '1px solid #eaeef2',
            marginBottom: '12px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#656d76', marginBottom: '4px' }}>
            🤖 AI 3줄 요약 (Digest)
          </div>
          <div style={{ fontSize: '12px', color: '#1f2328', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {repo.digest}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          type="button"
          onClick={(): void => onViewReadme(repo)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '4px',
            border: '1px solid #d0d7de',
            backgroundColor: '#f6f8fa',
            color: '#1f2328',
            cursor: 'pointer',
          }}
        >
          📄 README.md 보기
        </button>
      </div>
    </div>
  );
}
