'use client';

import React from 'react';
import { ArchiveVisibilityFilter } from '../lib/archive-filter';

interface LocalArchiveFilterBarProps {
  searchQuery: string;
  visibility: ArchiveVisibilityFilter;
  totalCount: number;
  filteredCount: number;
  onSearchChange: (q: string) => void;
  onVisibilityChange: (v: ArchiveVisibilityFilter) => void;
}

export function LocalArchiveFilterBar({
  searchQuery,
  visibility,
  totalCount,
  filteredCount,
  onSearchChange,
  onVisibilityChange,
}: LocalArchiveFilterBarProps): React.JSX.Element {
  const tabs: { key: ArchiveVisibilityFilter; label: string }[] = [
    { key: 'all', label: `전체 (${totalCount})` },
    { key: 'public', label: '🌐 공개만' },
    { key: 'private', label: '🔒 비공개만' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
      }}
    >
      <div style={{ display: 'flex', gap: '6px' }}>
        {tabs.map((tab): React.JSX.Element => (
          <button
            key={tab.key}
            type="button"
            onClick={(): void => onVisibilityChange(tab.key)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: visibility === tab.key ? '1px solid #0969da' : '1px solid #d0d7de',
              backgroundColor: visibility === tab.key ? '#ddf4ff' : '#f6f8fa',
              color: visibility === tab.key ? '#0969da' : '#1f2328',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void => onSearchChange(e.target.value)}
          placeholder="저장소명 또는 요약 키워드 검색..."
          style={{
            padding: '6px 10px',
            fontSize: '13px',
            borderRadius: '6px',
            border: '1px solid #d0d7de',
            minWidth: '240px',
            outline: 'none',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={(): void => onSearchChange('')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: 'none',
              background: 'none',
              color: '#656d76',
              cursor: 'pointer',
            }}
          >
            ✕ 지우기
          </button>
        )}
        <span style={{ fontSize: '12px', color: '#656d76' }}>
          {filteredCount}건
        </span>
      </div>
    </div>
  );
}
