'use client';

import React from 'react';
import { TrendingRepository } from '../lib/types';

export interface TrendingRepoCardProps {
  repo: TrendingRepository;
  aiGated: boolean;
  generatingDigest: boolean;
  onOpenReadme: (repo: TrendingRepository) => void;
  onGenerateDigest: (repo: TrendingRepository) => void;
  onStartDiscussion: (repo: TrendingRepository) => void;
}

function RepoHeader({ repo }: { repo: TrendingRepository }): React.JSX.Element {
  return (
    <div style={{ flex: 1, paddingRight: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            backgroundColor: repo.rank <= 3 ? '#0969da' : '#eaeef2',
            color: repo.rank <= 3 ? '#ffffff' : '#656d76',
            borderRadius: '50%',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {repo.rank}
        </span>
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '16px', fontWeight: 600, color: '#0969da', textDecoration: 'none' }}
        >
          {repo.full_name}
        </a>
      </div>
      <p style={{ fontSize: '13px', color: '#656d76', margin: '0 0 8px 0', lineHeight: 1.4 }}>
        {repo.description || '설명이 등록되어 있지 않습니다.'}
      </p>
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#656d76' }}>
        {repo.language && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0969da' }} />
            {repo.language}
          </span>
        )}
        <span>★ {repo.total_stars.toLocaleString()} stars</span>
        <span style={{ color: '#1a7f37', fontWeight: 600 }}>▲ +{repo.daily_stars.toLocaleString()} today</span>
      </div>
    </div>
  );
}

interface ActionButtonsProps {
  repo: TrendingRepository;
  aiGated: boolean;
  generatingDigest: boolean;
  onOpenReadme: (repo: TrendingRepository) => void;
  onGenerateDigest: (repo: TrendingRepository) => void;
  onStartDiscussion: (repo: TrendingRepository) => void;
}

function ActionButtons({
  repo,
  aiGated,
  generatingDigest,
  onOpenReadme,
  onGenerateDigest,
  onStartDiscussion,
}: ActionButtonsProps): React.JSX.Element {
  const btnBase = { padding: '6px 10px', fontSize: '12px', borderRadius: '6px' };
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <button
        onClick={(): void => onOpenReadme(repo)}
        style={{ ...btnBase, fontWeight: 500, color: '#1f2328', backgroundColor: '#f6f8fa', border: '1px solid #d0d7de', cursor: 'pointer' }}
      >
        README
      </button>
      <button
        onClick={(): void => onGenerateDigest(repo)}
        disabled={aiGated || generatingDigest}
        title={aiGated ? '설정 탭에서 Local AI Agent를 연동해주세요' : undefined}
        style={{
          ...btnBase,
          fontWeight: 500,
          color: aiGated ? '#8c959f' : repo.digest ? '#0969da' : '#1f2328',
          backgroundColor: aiGated ? '#f6f8fa' : repo.digest ? '#ddf4ff' : '#f6f8fa',
          border: `1px solid ${aiGated ? '#d0d7de' : repo.digest ? '#54aeff' : '#d0d7de'}`,
          cursor: aiGated || generatingDigest ? 'not-allowed' : 'pointer',
        }}
      >
        {generatingDigest ? '요약 생성 중...' : repo.digest ? 'AI 요약 재성성' : 'AI 요약 생성'}
      </button>
      <button
        onClick={(): void => onStartDiscussion(repo)}
        disabled={aiGated}
        title={aiGated ? '설정 탭에서 Local AI Agent를 연동해주세요' : undefined}
        style={{
          ...btnBase,
          fontWeight: 600,
          color: aiGated ? '#8c959f' : '#ffffff',
          backgroundColor: aiGated ? '#eaeef2' : '#1f883d',
          border: `1px solid ${aiGated ? '#d0d7de' : '#1a7f37'}`,
          cursor: aiGated ? 'not-allowed' : 'pointer',
        }}
      >
        실시간 토론
      </button>
    </div>
  );
}

function DigestBox({ digest }: { digest: string }): React.JSX.Element {
  return (
    <div
      style={{
        padding: '10px 14px',
        backgroundColor: '#f6f8fa',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        fontSize: '12px',
        lineHeight: 1.6,
        color: '#1f2328',
        whiteSpace: 'pre-line',
      }}
    >
      <div style={{ fontWeight: 600, color: '#0969da', marginBottom: '4px' }}>⚡ Repository Digest (AI 핵심 요약)</div>
      {digest}
    </div>
  );
}

export function TrendingRepoCard({
  repo,
  aiGated,
  generatingDigest,
  onOpenReadme,
  onGenerateDigest,
  onStartDiscussion,
}: TrendingRepoCardProps): React.JSX.Element {
  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <RepoHeader repo={repo} />
        <ActionButtons
          repo={repo}
          aiGated={aiGated}
          generatingDigest={generatingDigest}
          onOpenReadme={onOpenReadme}
          onGenerateDigest={onGenerateDigest}
          onStartDiscussion={onStartDiscussion}
        />
      </div>
      {repo.digest && <DigestBox digest={repo.digest} />}
    </div>
  );
}
