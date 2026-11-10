'use client';

import React from 'react';
import { TrendingRepository } from '../lib/types';
import { TrendingRepoCard } from './TrendingRepoCard';

interface TrendingDashboardProps {
  repos: TrendingRepository[];
  source: 'local-cache' | 'remote-server' | 'fresh-scraped' | null;
  syncedWithServer: boolean;
  scraping: boolean;
  aiGated: boolean;
  generatingDigestRepo: string | null;
  onRefresh: () => void;
  onOpenReadme: (repo: TrendingRepository) => void;
  onGenerateDigest: (repo: TrendingRepository) => void;
  onStartDiscussion: (repo: TrendingRepository) => void;
}

export function TrendingDashboard({
  repos,
  source,
  syncedWithServer,
  scraping,
  aiGated,
  generatingDigestRepo,
  onRefresh,
  onOpenReadme,
  onGenerateDigest,
  onStartDiscussion,
}: TrendingDashboardProps): React.JSX.Element {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0', color: '#1f2328' }}>
            Daily GitHub Star TOP 10
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#656d76' }}>
            <span>
              데이터 출처:{' '}
              <strong>
                {source === 'local-cache' && '로컬 캐시 (Tier 1 SQLite)'}
                {source === 'remote-server' && '중앙 서버 동기화 (Tier 2 Remote)'}
                {source === 'fresh-scraped' && '신규 크롤링 (Tier 3 Scraped)'}
                {!source && '확인 중...'}
              </strong>
            </span>
            {syncedWithServer && (
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: '#dafbe1',
                  color: '#1a7f37',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                중앙 동기화 완료
              </span>
            )}
            {aiGated && (
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: '#fff8c5',
                  color: '#9a6700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
                title="설정 탭에서 Local AI Agent를 연동해주세요"
              >
                AI 미연동 (요약·토론 제한됨)
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={scraping}
          style={{
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1f2328',
            backgroundColor: '#f6f8fa',
            border: '1px solid #d0d7de',
            borderRadius: '6px',
            cursor: scraping ? 'not-allowed' : 'pointer',
          }}
        >
          {scraping ? '수집 중...' : '새로고침 (Scrape)'}
        </button>
      </div>

      {repos.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f6f8fa',
            border: '1px dashed #d0d7de',
            borderRadius: '6px',
            color: '#656d76',
            fontSize: '14px',
          }}
        >
          수집된 오늘자 트렌딩 저장소가 없습니다. 상단의 새로고침 버튼을 눌러보세요.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {repos.map((repo: TrendingRepository): React.JSX.Element => (
            <TrendingRepoCard
              key={repo.rank}
              repo={repo}
              aiGated={aiGated}
              generatingDigest={generatingDigestRepo === repo.full_name}
              onOpenReadme={onOpenReadme}
              onGenerateDigest={onGenerateDigest}
              onStartDiscussion={onStartDiscussion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
