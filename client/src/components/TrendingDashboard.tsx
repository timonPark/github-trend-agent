'use client';

import React from 'react';
import { TrendingRepository } from '../lib/types';

interface TrendingDashboardProps {
  repos: TrendingRepository[];
  source: 'local-cache' | 'remote-server' | 'fresh-scraped' | null;
  syncedWithServer: boolean;
  scraping: boolean;
  onRefresh: () => void;
  onOpenReadme: (repo: TrendingRepository) => void;
}

export function TrendingDashboard({
  repos,
  source,
  syncedWithServer,
  scraping,
  onRefresh,
  onOpenReadme,
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
            <div
              key={repo.rank}
              style={{
                padding: '16px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ flex: 1, paddingRight: '20px' }}>
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
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#0969da',
                      textDecoration: 'none',
                    }}
                  >
                    {repo.full_name}
                  </a>
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#656d76',
                    margin: '0 0 10px 0',
                    lineHeight: 1.4,
                  }}
                >
                  {repo.description || '설명이 등록되어 있지 않습니다.'}
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#656d76' }}>
                  {repo.language && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#0969da',
                        }}
                      />
                      {repo.language}
                    </span>
                  )}
                  <span>★ {repo.total_stars.toLocaleString()} stars</span>
                  <span style={{ color: '#1a7f37', fontWeight: 600 }}>
                    ▲ +{repo.daily_stars.toLocaleString()} today
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(): void => onOpenReadme(repo)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#1f2328',
                    backgroundColor: '#f6f8fa',
                    border: '1px solid #d0d7de',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  README
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
