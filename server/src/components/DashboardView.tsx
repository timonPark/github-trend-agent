'use client';

import React, { useState, useEffect } from 'react';
import { PlatformStatsResponseDto, ApiResponse } from '../lib/types/api';
import { TrendingRepository, DiscussionArchive } from '../lib/types';
import { toErrorMessage } from '../lib/types/error';

interface DashboardViewProps {
  onGoToKeyCenter: () => void;
  onGoToSnapshots: () => void;
  onGoToDiscussions: () => void;
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }): React.JSX.Element {
  return (
    <div style={{ flex: 1, minWidth: '220px', padding: '16px 20px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#656d76', fontSize: '13px', marginBottom: '6px' }}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2328' }}>{value.toLocaleString()}</div>
    </div>
  );
}

function Top3Highlights({ repos, onGoToSnapshots }: { repos: TrendingRepository[]; onGoToSnapshots: () => void }): React.JSX.Element {
  return (
    <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2328' }}>🔥 오늘자 GitHub Star TOP 3 하이라이트</h3>
        <button onClick={onGoToSnapshots} style={{ background: 'none', border: 'none', color: '#0969da', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>전체 TOP 10 탐색 ➔</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {repos.map((r: TrendingRepository): React.JSX.Element => (
          <div key={r.full_name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f6f8fa', borderRadius: '6px' }}>
            <div>
              <span style={{ fontWeight: 700, color: '#0969da', marginRight: '8px' }}>#{r.rank}</span>
              <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: '#1f2328', textDecoration: 'none' }}>{r.full_name}</a>
              <span style={{ fontSize: '12px', color: '#656d76', marginLeft: '10px' }}>{r.description || '설명 없음'}</span>
            </div>
            <span style={{ fontSize: '12px', color: '#1a7f37', fontWeight: 600 }}>▲ +{r.daily_stars.toLocaleString()} stars</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientInstallBanner({ onGoToKeyCenter }: { onGoToKeyCenter: () => void }): React.JSX.Element {
  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#ddf4ff', borderRadius: '6px', border: '1px solid #54aeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: '#0969da' }}>💻 로컬 AI 토론 클라이언트를 사용해보세요!</h4>
        <p style={{ margin: 0, fontSize: '12px', color: '#1f2328' }}>포털 가입 후 키 센터에서 인증 키를 발급받아 로컬 클라이언트에 등록하면 실시간 AI 토론 및 로컬 아카이브를 이용할 수 있습니다.</p>
      </div>
      <button onClick={onGoToKeyCenter} style={{ padding: '6px 14px', backgroundColor: '#0969da', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        키 센터 이동 ➔
      </button>
    </div>
  );
}

export function DashboardView({ onGoToKeyCenter, onGoToSnapshots }: DashboardViewProps): React.JSX.Element {
  const [stats, setStats] = useState<PlatformStatsResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect((): void => {
    fetch('/api/stats')
      .then((res: Response): Promise<ApiResponse<PlatformStatsResponseDto>> => res.json())
      .then((data: ApiResponse<PlatformStatsResponseDto>): void => {
        if (data.success && data.data) setStats(data.data);
      })
      .catch((err: unknown): void => console.error(toErrorMessage(err)))
      .finally((): void => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#656d76' }}>포털 데이터 로딩 중...</div>;

  return (
    <div>
      <ClientInstallBanner onGoToKeyCenter={onGoToKeyCenter} />
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <StatCard icon="📅" label="총 수집 일수" value={stats?.snapshot_count || 0} />
        <StatCard icon="💬" label="공유된 AI 토론 아카이브" value={stats?.public_archive_count || 0} />
        <StatCard icon="👥" label="등록된 개발자 수" value={stats?.total_user_count || 0} />
      </div>
      <Top3Highlights repos={stats?.today_top3 || []} onGoToSnapshots={onGoToSnapshots} />
    </div>
  );
}
