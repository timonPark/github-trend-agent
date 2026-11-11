'use client';

import React from 'react';

interface DiscussionPromptChipsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled: boolean;
}

const DEFAULT_PROMPTS: string[] = [
  '💡 이 프로젝트의 핵심 아키텍처와 주요 동작 원리를 설명해줘',
  '⚖️ 실무 프로덕션 환경 도입 시 장단점과 주요 고려사항은?',
  '🔍 기존 유사 오픈소스/솔루션 대비 가장 뚜렷한 기술적 차별점은?',
  '🚀 코드베이스를 처음 분석하거나 기여할 때 살펴볼 핵심 디렉터리는?',
];

export function DiscussionPromptChips({
  onSelectPrompt,
  disabled,
}: DiscussionPromptChipsProps): React.JSX.Element {
  return (
    <div style={{ margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '12px', color: '#656d76', fontWeight: 600 }}>💡 추천 질문 (클릭하여 질의 시작):</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {DEFAULT_PROMPTS.map((prompt: string, idx: number): React.JSX.Element => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={(): void => onSelectPrompt(prompt)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: '20px',
              border: '1px solid #d0d7de',
              backgroundColor: disabled ? '#f6f8fa' : '#ffffff',
              color: disabled ? '#8c959f' : '#0969da',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
