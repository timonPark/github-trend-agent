'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DiscussionArchive } from '../lib/types';
import { ApiResponse, GetArchivesResponseDto } from '../lib/types/api';
import { toErrorMessage } from '../lib/types/error';
import { filterPublicArchives } from '../lib/feed-filter';
import { DiscussionFeedFilterBar } from './DiscussionFeedFilterBar';
import { DiscussionFeedCard } from './DiscussionFeedCard';
import { DiscussionFeedDetailModal } from './DiscussionFeedDetailModal';

export function PublicDiscussionFeed(): React.JSX.Element {
  const [archives, setArchives] = useState<DiscussionArchive[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedArchive, setSelectedArchive] = useState<DiscussionArchive | null>(null);

  const fetchFeed = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res: Response = await fetch('/api/archives?public=true');
      const json: ApiResponse<GetArchivesResponseDto> =
        (await res.json()) as ApiResponse<GetArchivesResponseDto>;
      if (!json.success || !json.data) throw new Error(json.error || '피드 로드 실패');
      setArchives(json.data.archives);
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect((): void => {
    void fetchFeed();
  }, [fetchFeed]);

  const handleReset = (): void => {
    setSearchQuery('');
    setSelectedDate('');
  };

  const filteredArchives: DiscussionArchive[] = filterPublicArchives(archives, searchQuery, selectedDate);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2328', margin: '0 0 6px 0' }}>
          💬 공개 AI 토론 아카이브 피드
        </h2>
        <p style={{ fontSize: '13px', color: '#656d76', margin: 0 }}>
          사용자들이 공개로 동기화한 AI 에이전트 토론 기록과 핵심 결론 요약 및 대화 전문을 열람합니다.
        </p>
      </div>

      <DiscussionFeedFilterBar
        searchQuery={searchQuery}
        selectedDate={selectedDate}
        totalCount={archives.length}
        filteredCount={filteredArchives.length}
        onSearchChange={(q: string): void => setSearchQuery(q)}
        onDateChange={(d: string): void => setSelectedDate(d)}
        onReset={handleReset}
      />

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#656d76' }}>
          공개 토론 피드를 불러오는 중입니다...
        </div>
      )}

      {error && !isLoading && (
        <div style={{ padding: '16px', backgroundColor: '#ffebe9', border: '1px solid #ff8182', borderRadius: '6px', color: '#cf222e', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {!isLoading && !error && filteredArchives.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#656d76', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de' }}>
          {archives.length === 0
            ? '아직 공개된 AI 토론 아카이브가 없습니다. 클라이언트에서 토론 후 아카이브를 공개해 보세요!'
            : '검색 조건과 일치하는 공개 토론 아카이브가 없습니다.'}
        </div>
      )}

      {!isLoading && !error && filteredArchives.length > 0 && (
        <div>
          {filteredArchives.map((archive: DiscussionArchive): React.JSX.Element => (
            <DiscussionFeedCard
              key={archive.id}
              archive={archive}
              onSelect={(a: DiscussionArchive): void => setSelectedArchive(a)}
            />
          ))}
        </div>
      )}

      <DiscussionFeedDetailModal
        archive={selectedArchive}
        onClose={(): void => setSelectedArchive(null)}
      />
    </div>
  );
}
