'use client';

import React from 'react';

interface ServerDateSelectorProps {
  selectedDate: string;
  availableDates: string[];
  onSelectDate: (date: string) => void;
}

function resolveDateButtonStyle(isSelected: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: isSelected ? 600 : 500,
    borderRadius: '12px',
    border: isSelected ? '1px solid #0969da' : '1px solid #d0d7de',
    backgroundColor: isSelected ? '#0969da' : '#ffffff',
    color: isSelected ? '#ffffff' : '#1f2328',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  };
}

export function ServerDateSelector({
  selectedDate,
  availableDates,
  onSelectDate,
}: ServerDateSelectorProps): React.JSX.Element {
  const visibleDates: string[] = availableDates.slice(0, 6);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.value) {
      onSelectDate(e.target.value);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: '#f6f8fa',
        borderRadius: '6px',
        border: '1px solid #d0d7de',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2328' }}>
          📅 날짜 선택
        </span>
        <input
          type="date"
          value={selectedDate}
          onChange={handleInputChange}
          style={{
            padding: '4px 8px',
            fontSize: '13px',
            borderRadius: '4px',
            border: '1px solid #d0d7de',
            backgroundColor: '#ffffff',
            color: '#1f2328',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#656d76', marginRight: '4px' }}>
          보관된 날짜:
        </span>
        {visibleDates.length === 0 && (
          <span style={{ fontSize: '12px', color: '#656d76' }}>수집된 스냅샷 없음</span>
        )}
        {visibleDates.map((date: string): React.JSX.Element => (
          <button
            key={date}
            type="button"
            onClick={(): void => onSelectDate(date)}
            style={resolveDateButtonStyle(date === selectedDate)}
          >
            {date}
          </button>
        ))}
      </div>
    </div>
  );
}
