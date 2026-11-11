'use client';

import React from 'react';

interface DiscussionInputProps {
  inputMessage: string;
  loadingReply: boolean;
  aiGated: boolean;
  onChangeInput: (val: string) => void;
  onSubmit: () => void;
  onGoToSettings: () => void;
}

function GatedAlertBanner({ onGoToSettings }: { onGoToSettings: () => void }): React.JSX.Element {
  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: '#fff8c5',
        border: '1px solid #d4a72c',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#734f00',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}
    >
      <span>⚠️ 로컬 AI 에이전트가 설정되지 않아 실시간 토론 질의를 진행할 수 없습니다.</span>
      <button
        onClick={onGoToSettings}
        style={{
          padding: '4px 10px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: '#0969da',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        설정 탭으로 이동
      </button>
    </div>
  );
}

export function DiscussionInput({
  inputMessage,
  loadingReply,
  aiGated,
  onChangeInput,
  onSubmit,
  onGoToSettings,
}: DiscussionInputProps): React.JSX.Element {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loadingReply && !aiGated && inputMessage.trim().length > 0) {
        onSubmit();
      }
    }
  };

  const isSubmitDisabled: boolean = aiGated || loadingReply || inputMessage.trim().length === 0;

  return (
    <div style={{ marginTop: '12px' }}>
      {aiGated && <GatedAlertBanner onGoToSettings={onGoToSettings} />}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          rows={3}
          value={inputMessage}
          disabled={aiGated || loadingReply}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => onChangeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            aiGated
              ? 'AI 에이전트를 먼저 연동해주세요.'
              : '저장소에 대해 궁금한 점을 입력하세요 (Enter: 전송, Shift+Enter: 줄바꿈)'
          }
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: '14px',
            borderRadius: '6px',
            border: '1px solid #d0d7de',
            resize: 'none',
            backgroundColor: aiGated ? '#f6f8fa' : '#ffffff',
            color: '#1f2328',
            outline: 'none',
          }}
        />
        <button
          type="button"
          disabled={isSubmitDisabled}
          onClick={onSubmit}
          style={{
            height: '42px',
            padding: '0 18px',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1px solid rgba(27,31,36,0.15)',
            backgroundColor: isSubmitDisabled ? '#8c959f' : '#1f883d',
            color: '#ffffff',
            cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loadingReply ? '답변 생성 중...' : '전송 ↵'}
        </button>
      </div>
    </div>
  );
}
