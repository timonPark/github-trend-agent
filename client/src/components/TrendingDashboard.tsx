'use client';

import React from 'react';
import { TrendingRepository } from '../lib/types';
import { TrendingRepoCard } from './TrendingRepoCard';
import { TrendingDateSelector } from './TrendingDateSelector';
import { TrendingCacheBadge } from './TrendingCacheBadge';
import { isTodayDate } from '../lib/date-utils';

interface TrendingDashboardProps {
  repos: TrendingRepository[];
  selectedDate: string;
  source: 'local-cache' | 'remote-server' | 'fresh-scraped' | null;
  syncedWithServer: boolean;
  scraping: boolean;
  loadingDate: boolean;
  aiGated: boolean;
  generatingDigestRepo: string | null;
  bulkGenerating?: boolean;
  bulkProgress?: { current: number; total: number } | null;
  onRefresh: () => void;
  onDateChange: (date: string) => void;
  onOpenReadme: (repo: TrendingRepository) => void;
  onGenerateDigest: (repo: TrendingRepository) => void;
  onGenerateAllDigests?: () => void;
  onStartDiscussion: (repo: TrendingRepository) => void;
}

export function TrendingDashboard({
  repos,
  selectedDate,
  source,
  syncedWithServer,
  scraping,
  loadingDate,
  aiGated,
  generatingDigestRepo,
  bulkGenerating = false,
  bulkProgress = null,
  onRefresh,
  onDateChange,
  onOpenReadme,
  onGenerateDigest,
  onGenerateAllDigests,
  onStartDiscussion,
}: TrendingDashboardProps): React.JSX.Element {
  const isToday: boolean = isTodayDate(selectedDate);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0', color: '#1f2328' }}>
            Daily GitHub Star TOP 10
          </h2>
          <TrendingCacheBadge source={source} syncedWithServer={syncedWithServer} aiGated={aiGated} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <TrendingDateSelector selectedDate={selectedDate} loading={loadingDate || scraping} onDateChange={onDateChange} />
          {!aiGated && repos.length > 0 && onGenerateAllDigests && (
            <button
              onClick={onGenerateAllDigests}
              disabled={bulkGenerating || Boolean(generatingDigestRepo) || scraping || loadingDate}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: bulkGenerating ? '#8c959f' : '#1f883d',
                border: '1px solid rgba(27, 31, 36, 0.15)',
                borderRadius: '6px',
                cursor: bulkGenerating ? 'not-allowed' : 'pointer',
              }}
            >
              {bulkGenerating
                ? `일괄 요약 중 (${bulkProgress ? `${bulkProgress.current}/${bulkProgress.total}` : '진행 중'})...`
                : '✨ 전체 일괄 AI 요약 생성'}
            </button>
          )}
          {isToday && (
            <button
              onClick={onRefresh}
              disabled={scraping || loadingDate || bulkGenerating}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1f2328',
                backgroundColor: '#f6f8fa',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                cursor: scraping || bulkGenerating ? 'not-allowed' : 'pointer',
              }}
            >
              {scraping ? '수집 중...' : '새로고침 (Scrape)'}
            </button>
          )}
        </div>
      </div>

      {loadingDate ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f6f8fa', border: '1px dashed #d0d7de', borderRadius: '6px', color: '#656d76', fontSize: '14px' }}>
          {selectedDate} 스냅샷 데이터를 불러오는 중입니다...
        </div>
      ) : repos.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f6f8fa', border: '1px dashed #d0d7de', borderRadius: '6px', color: '#656d76', fontSize: '14px' }}>
          {selectedDate}에 저장된 트렌딩 스냅샷이 없습니다. {isToday && '새로고침 버튼을 눌러보세요.'}
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
