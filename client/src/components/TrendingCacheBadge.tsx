'use client';

import React from 'react';

export interface TrendingCacheBadgeProps {
  source: 'local-cache' | 'remote-server' | 'fresh-scraped' | null;
  syncedWithServer: boolean;
  aiGated: boolean;
}

function getSourceBadgeInfo(source: TrendingCacheBadgeProps['source']): { text: string; bg: string; color: string } {
  if (source === 'local-cache') {
    return { text: 'Tier 1: 로컬 SQLite 캐시', bg: '#ddf4ff', color: '#0969da' };
  }
  if (source === 'remote-server') {
    return { text: 'Tier 2: 중앙 서버 원격 동기화', bg: '#fbefff', color: '#8250df' };
  }
  if (source === 'fresh-scraped') {
    return { text: 'Tier 3: 신규 헤드리스 크롤링', bg: '#fff8c5', color: '#9a6700' };
  }
  return { text: '확인 중...', bg: '#f6f8fa', color: '#656d76' };
}

export function TrendingCacheBadge({
  source,
  syncedWithServer,
  aiGated,
}: TrendingCacheBadgeProps): React.JSX.Element {
  const badgeInfo = getSourceBadgeInfo(source);
  const badgeStyle = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#656d76' }}>
      <span
        style={{ ...badgeStyle, backgroundColor: badgeInfo.bg, color: badgeInfo.color }}
        title="1차 SQLite → 2차 중앙 서버 → 3차 직접 크롤링 3단계 공유 캐싱"
      >
        {badgeInfo.text}
      </span>

      {syncedWithServer && (
        <span
          style={{ ...badgeStyle, backgroundColor: '#dafbe1', color: '#1a7f37' }}
          title="중앙 서버 DB와 동기화가 완료되었습니다"
        >
          중앙 동기화 완료
        </span>
      )}

      {aiGated && (
        <span
          style={{ ...badgeStyle, backgroundColor: '#fff8c5', color: '#9a6700' }}
          title="설정 탭에서 Local AI Agent를 연동하면 요약 및 토론이 활성화됩니다"
        >
          AI 미연동
        </span>
      )}
    </div>
  );
}
