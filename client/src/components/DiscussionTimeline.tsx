'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../lib/types';

interface DiscussionTimelineProps {
  messages: ChatMessage[];
  loadingReply: boolean;
  repoFullName: string;
}

function EmptyTimelineNotice({ repoFullName }: { repoFullName: string }): React.JSX.Element {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#656d76' }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2328', margin: '0 0 6px 0' }}>
        {repoFullName} 기술 토론을 시작해보세요!
      </h3>
      <p style={{ fontSize: '13px', margin: 0 }}>
        저장소의 README와 3줄 요약 맥락이 로컬 AI 에이전트에게 자동 주입되어 있습니다.
      </p>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }): React.JSX.Element {
  const isUser: boolean = msg.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
      }}
    >
      <div style={{ fontSize: '11px', color: '#656d76', marginBottom: '4px' }}>
        {isUser ? '👤 You' : '🤖 Local AI Agent'} • {new Date(msg.timestamp).toLocaleTimeString()}
      </div>
      <div
        style={{
          maxWidth: '85%',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: 1.6,
          whiteSpace: 'pre-line',
          backgroundColor: isUser ? '#ddf4ff' : '#ffffff',
          color: isUser ? '#0969da' : '#1f2328',
          border: isUser ? '1px solid #54aeff' : '1px solid #d0d7de',
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

function LoadingIndicator(): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: '#0969da', fontSize: '13px' }}>
      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
      <span>AI 에이전트가 저장소 컨텍스트를 분석하여 답변을 생성하는 중입니다...</span>
    </div>
  );
}

export function DiscussionTimeline({
  messages,
  loadingReply,
  repoFullName,
}: DiscussionTimelineProps): React.JSX.Element {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect((): void => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingReply]);

  return (
    <div
      style={{
        flex: 1,
        minHeight: '360px',
        maxHeight: '480px',
        overflowY: 'auto',
        backgroundColor: '#f6f8fa',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        padding: '16px',
      }}
    >
      {messages.length === 0 ? (
        <EmptyTimelineNotice repoFullName={repoFullName} />
      ) : (
        messages.map((m: ChatMessage): React.JSX.Element => <MessageBubble key={m.id} msg={m} />)
      )}
      {loadingReply && <LoadingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
