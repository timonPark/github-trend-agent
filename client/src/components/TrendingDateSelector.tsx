'use client';

import React from 'react';
import { getAdjacentDate, isTodayDate, formatDateDisplay, getTodayString } from '../lib/date-utils';

export interface TrendingDateSelectorProps {
  selectedDate: string;
  loading: boolean;
  onDateChange: (date: string) => void;
}

export function TrendingDateSelector({
  selectedDate,
  loading,
  onDateChange,
}: TrendingDateSelectorProps): React.JSX.Element {
  const isToday: boolean = isTodayDate(selectedDate);
  const btnStyle = {
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: '#f6f8fa',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    cursor: loading ? 'not-allowed' : 'pointer',
    color: '#1f2328',
  };

  const handlePrev = (): void => onDateChange(getAdjacentDate(selectedDate, -1));
  const handleNext = (): void => onDateChange(getAdjacentDate(selectedDate, 1));
  const handleToday = (): void => onDateChange(getTodayString());

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button onClick={handlePrev} disabled={loading} style={btnStyle} title="이전 날짜 조회">
        ◀
      </button>

      <input
        type="date"
        value={selectedDate}
        max={getTodayString()}
        disabled={loading}
        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
          if (e.target.value) onDateChange(e.target.value);
        }}
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          borderRadius: '6px',
          border: '1px solid #d0d7de',
          backgroundColor: '#ffffff',
          color: '#1f2328',
        }}
      />

      <button onClick={handleNext} disabled={loading || isToday} style={{ ...btnStyle, cursor: isToday ? 'not-allowed' : 'pointer' }} title="다음 날짜 조회">
        ▶
      </button>

      {!isToday && (
        <button onClick={handleToday} disabled={loading} style={{ ...btnStyle, color: '#0969da', fontWeight: 600 }}>
          오늘로 복귀
        </button>
      )}

      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2328', marginLeft: '4px' }}>
        ({formatDateDisplay(selectedDate)})
      </span>
    </div>
  );
}
