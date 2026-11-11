'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DailySnapshot, TrendingRepository } from '../lib/types';
import { ApiResponse, PublicSnapshotResponseDto } from '../lib/types/api';
import { toErrorMessage } from '../lib/types/error';
import { ServerDateSelector } from './ServerDateSelector';
import { ServerRepoCard } from './ServerRepoCard';
import { ServerReadmeModal } from './ServerReadmeModal';

function calculateTotalStars(repos: TrendingRepository[]): number {
  return repos.reduce((sum: number, r: TrendingRepository): number => sum + (r.daily_stars || 0), 0);
}

export function SnapshotExplorer(): React.JSX.Element {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalRepo, setModalRepo] = useState<TrendingRepository | null>(null);

  const fetchSnapshot = useCallback(async (targetDate?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const url: string = targetDate
        ? `/api/snapshots/public?date=${encodeURIComponent(targetDate)}`
        : '/api/snapshots/public';
      const res: Response = await fetch(url);
      const json: ApiResponse<PublicSnapshotResponseDto> =
        (await res.json()) as ApiResponse<PublicSnapshotResponseDto>;
      if (!json.success || !json.data) throw new Error(json.error || '스냅샷 로드 실패');
      setSnapshot(json.data.snapshot);
      setAvailableDates(json.data.available_dates);
      if (json.data.snapshot?.snapshot_date) setSelectedDate(json.data.snapshot.snapshot_date);
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect((): void => {
    void fetchSnapshot();
  }, [fetchSnapshot]);

  const handleSelectDate = (date: string): void => {
    setSelectedDate(date);
    void fetchSnapshot(date);
  };

  const repos: TrendingRepository[] = snapshot?.repositories || [];
  const totalDailyStars: number = calculateTotalStars(repos);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2328', margin: '0 0 6px 0' }}>
          📦 일일 TOP 10 스냅샷 보관소
        </h2>
        <p style={{ fontSize: '13px', color: '#656d76', margin: 0 }}>
          매일 0시 중앙 서버에 보관되는 GitHub 인기 저장소와 AI 3줄 요약(Digest) 및 README를 탐색합니다.
        </p>
      </div>

      <ServerDateSelector
        selectedDate={selectedDate}
        availableDates={availableDates}
        onSelectDate={handleSelectDate}
      />

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#656d76' }}>
          스냅샷 데이터를 불러오는 중입니다...
        </div>
      )}

      {error && !isLoading && (
        <div style={{ padding: '16px', backgroundColor: '#ffebe9', border: '1px solid #ff8182', borderRadius: '6px', color: '#cf222e', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {!isLoading && !error && !snapshot && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#656d76', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de' }}>
          선택한 날짜({selectedDate})의 수집된 스냅샷이 존재하지 않습니다.
        </div>
      )}

      {!isLoading && !error && snapshot && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f6f8fa', borderRadius: '6px', border: '1px solid #d0d7de', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2328' }}>
              📌 {snapshot.snapshot_date} 스냅샷 (저장소 {repos.length}개)
            </span>
            <span style={{ fontSize: '12px', color: '#1a7f37', fontWeight: 600 }}>
              당일 TOP 10 총 획득: ▲ +{totalDailyStars.toLocaleString()} stars
            </span>
          </div>

          <div>
            {repos.map((repo: TrendingRepository): React.JSX.Element => (
              <ServerRepoCard
                key={repo.full_name}
                repo={repo}
                onViewReadme={(r: TrendingRepository): void => setModalRepo(r)}
              />
            ))}
          </div>
        </>
      )}

      <ServerReadmeModal repo={modalRepo} onClose={(): void => setModalRepo(null)} />
    </div>
  );
}
