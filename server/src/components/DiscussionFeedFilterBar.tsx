'use client';

import React from 'react';

interface DiscussionFeedFilterBarProps {
  searchQuery: string;
  selectedDate: string;
  totalCount: number;
  filteredCount: number;
  onSearchChange: (query: string) => void;
  onDateChange: (date: string) => void;
  onReset: () => void;
}

export function DiscussionFeedFilterBar({
  searchQuery,
  selectedDate,
  totalCount,
  filteredCount,
  onSearchChange,
  onDateChange,
  onReset,
}: DiscussionFeedFilterBarProps): React.JSX.Element {
  const hasFilter: boolean = Boolean(searchQuery.trim() || selectedDate);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '14px 16px',
        backgroundColor: '#f6f8fa',
        borderRadius: '6px',
        border: '1px solid #d0d7de',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
        <input
          type="text"
          placeholder="🔍 저장소명, 작성자(@username), 결론 키워드 검색..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => onSearchChange(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '13px',
            borderRadius: '6px',
            border: '1px solid #d0d7de',
            backgroundColor: '#ffffff',
            color: '#1f2328',
          }}
        />
        <input
          type="date"
          value={selectedDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => onDateChange(e.target.value)}
          style={{
            padding: '6px 10px',
            fontSize: '13px',
            borderRadius: '6px',
            border: '1px solid #d0d7de',
            backgroundColor: '#ffffff',
            color: '#1f2328',
          }}
        />
        {hasFilter && (
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid #d0d7de',
              backgroundColor: '#ffffff',
              color: '#656d76',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            초기화
          </button>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#656d76', whiteSpace: 'nowrap' }}>
        검색 결과: <strong style={{ color: '#1f2328' }}>{filteredCount}</strong> / 전체 {totalCount}개
      </div>
    </div>
  );
}
