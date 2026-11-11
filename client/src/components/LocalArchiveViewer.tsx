'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LocalArchive } from '../lib/types';
import { ApiResponse, GetLocalArchivesResponseDto, UpdateArchiveVisibilityResponseDto } from '../lib/types/api';
import { filterArchives, ArchiveVisibilityFilter } from '../lib/archive-filter';
import { toErrorMessage } from '../lib/types/error';
import { LocalArchiveFilterBar } from './LocalArchiveFilterBar';
import { LocalArchiveCard } from './LocalArchiveCard';
import { ArchiveDetailModal } from './ArchiveDetailModal';

async function fetchLocalArchives(): Promise<LocalArchive[]> {
  const res: Response = await fetch('/api/archives');
  const data: ApiResponse<GetLocalArchivesResponseDto> =
    (await res.json()) as ApiResponse<GetLocalArchivesResponseDto>;
  if (!data.success || !data.data) {
    throw new Error(data.error || '아카이브 목록을 불러오지 못했습니다.');
  }
  return data.data.archives;
}

async function patchArchiveVisibility(id: string, isPublic: boolean): Promise<LocalArchive> {
  const res: Response = await fetch('/api/archives', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, is_public: isPublic }),
  });
  const data: ApiResponse<UpdateArchiveVisibilityResponseDto> =
    (await res.json()) as ApiResponse<UpdateArchiveVisibilityResponseDto>;
  if (!data.success || !data.data) {
    throw new Error(data.error || '공개 상태 변경에 실패했습니다.');
  }
  return data.data.archive;
}

function EmptyArchivesNotice(): React.JSX.Element {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de', color: '#656d76' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗄️</div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2328', margin: '0 0 6px 0' }}>
        보관된 토론 아카이브가 없습니다
      </h3>
      <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
        Daily TOP 10 탭에서 관심 있는 저장소를 선택하고 실시간 AI 토론을 진행한 후,<br />
        <strong>[토론 종료 및 보관]</strong>을 실행하면 여기에 영구 보관됩니다.
      </p>
    </div>
  );
}

export function LocalArchiveViewer(): React.JSX.Element {
  const [archives, setArchives] = useState<LocalArchive[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibility, setVisibility] = useState<ArchiveVisibilityFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<LocalArchive | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const list: LocalArchive[] = await fetchLocalArchives();
      setArchives(list);
    } catch (err: unknown) {
      console.error(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect((): void => {
    loadData();
  }, [loadData]);

  const handleToggle = async (a: LocalArchive): Promise<void> => {
    setTogglingId(a.id);
    try {
      const updated: LocalArchive = await patchArchiveVisibility(a.id, !a.is_public);
      setArchives((prev: LocalArchive[]): LocalArchive[] =>
        prev.map((item: LocalArchive): LocalArchive => (item.id === a.id ? updated : item))
      );
      if (selectedArchive?.id === a.id) setSelectedArchive(updated);
    } catch (err: unknown) {
      alert(`상태 변경 실패: ${toErrorMessage(err)}`);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredList: LocalArchive[] = filterArchives(archives, searchQuery, visibility);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#656d76' }}>
        토론 아카이브 보관함 불러오는 중...
      </div>
    );
  }

  return (
    <div>
      <LocalArchiveFilterBar
        searchQuery={searchQuery}
        visibility={visibility}
        totalCount={archives.length}
        filteredCount={filteredList.length}
        onSearchChange={(q: string): void => setSearchQuery(q)}
        onVisibilityChange={(v: ArchiveVisibilityFilter): void => setVisibility(v)}
      />
      {filteredList.length === 0 ? (
        <EmptyArchivesNotice />
      ) : (
        filteredList.map((a: LocalArchive): React.JSX.Element => (
          <LocalArchiveCard
            key={a.id}
            archive={a}
            toggling={togglingId === a.id}
            onToggleVisibility={handleToggle}
            onViewDetail={(item: LocalArchive): void => setSelectedArchive(item)}
          />
        ))
      )}
      <ArchiveDetailModal archive={selectedArchive} onClose={(): void => setSelectedArchive(null)} />
    </div>
  );
}
