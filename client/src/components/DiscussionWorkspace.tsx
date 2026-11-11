'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingRepository, DiscussionSession } from '../lib/types';
import { ApiResponse, GetDiscussionResponseDto, SendDiscussionMessageResponseDto } from '../lib/types/api';
import { toErrorMessage } from '../lib/types/error';
import { DiscussionHeader } from './DiscussionHeader';
import { DiscussionTimeline } from './DiscussionTimeline';
import { DiscussionPromptChips } from './DiscussionPromptChips';
import { DiscussionInput } from './DiscussionInput';
import { DiscussionArchiveModal } from './DiscussionArchiveModal';

interface DiscussionWorkspaceProps {
  initialRepo: TrendingRepository | null;
  allRepos: TrendingRepository[];
  aiGated: boolean;
  snapshotDate?: string;
  onOpenReadme: (repo: TrendingRepository) => void;
  onGoToSettings: () => void;
  onGoToArchives?: () => void;
}

async function requestGetSession(repo: TrendingRepository): Promise<DiscussionSession> {
  const query: string = `repo=${encodeURIComponent(repo.full_name)}&url=${encodeURIComponent(repo.url)}`;
  const res: Response = await fetch(`/api/discussions?${query}`);
  const data: ApiResponse<GetDiscussionResponseDto> = (await res.json()) as ApiResponse<GetDiscussionResponseDto>;
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch discussion session');
  return data.data.session;
}

async function requestPostMessage(repo: TrendingRepository, message: string): Promise<SendDiscussionMessageResponseDto> {
  const res: Response = await fetch('/api/discussions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo_full_name: repo.full_name,
      repo_url: repo.url,
      message,
      digest: repo.digest,
      readme: repo.readme,
    }),
  });
  const data: ApiResponse<SendDiscussionMessageResponseDto> =
    (await res.json()) as ApiResponse<SendDiscussionMessageResponseDto>;
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to send message');
  return data.data;
}

export function DiscussionWorkspace({
  initialRepo,
  allRepos,
  aiGated,
  snapshotDate = new Date().toISOString().split('T')[0],
  onOpenReadme,
  onGoToSettings,
  onGoToArchives,
}: DiscussionWorkspaceProps): React.JSX.Element {
  const [selectedRepo, setSelectedRepo] = useState<TrendingRepository | null>(initialRepo || allRepos[0] || null);
  const [session, setSession] = useState<DiscussionSession | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(false);
  const [loadingReply, setLoadingReply] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);
  const [archiveSuccessBanner, setArchiveSuccessBanner] = useState<string | null>(null);

  const loadSession = useCallback(async (repo: TrendingRepository): Promise<void> => {
    setLoadingSession(true);
    try {
      const s: DiscussionSession = await requestGetSession(repo);
      setSession(s);
    } catch (err: unknown) {
      console.error(toErrorMessage(err));
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect((): void => {
    if (selectedRepo) loadSession(selectedRepo);
  }, [selectedRepo, loadSession]);

  const handleSendMessage = async (textToSend?: string): Promise<void> => {
    const text: string = (textToSend || inputMessage).trim();
    if (!selectedRepo || text.length === 0 || loadingReply) return;
    setInputMessage('');
    setLoadingReply(true);
    try {
      const result: SendDiscussionMessageResponseDto = await requestPostMessage(selectedRepo, text);
      setSession(result.session);
    } catch (err: unknown) {
      alert(`메시지 전송 실패: ${toErrorMessage(err)}`);
    } finally {
      setLoadingReply(false);
    }
  };

  const handleArchiveComplete = (archiveId: string): void => {
    setShowArchiveModal(false);
    setArchiveSuccessBanner(`토론이 요약되어 아카이브(${archiveId})로 안전하게 보관되었습니다!`);
  };

  if (!selectedRepo) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #d0d7de', color: '#656d76' }}>
        토론할 저장소가 선택되지 않았습니다.
      </div>
    );
  }

  return (
    <div>
      {archiveSuccessBanner && (
        <div style={{ padding: '10px 14px', backgroundColor: '#dafbe1', border: '1px solid #4ac26b', color: '#1a7f37', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{archiveSuccessBanner}</span>
          {onGoToArchives && (
            <button onClick={onGoToArchives} style={{ background: 'none', border: 'none', color: '#0969da', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
              보관함에서 확인 ➔
            </button>
          )}
        </div>
      )}
      <DiscussionHeader
        repo={selectedRepo}
        allRepos={allRepos}
        onSelectRepo={(r: TrendingRepository): void => setSelectedRepo(r)}
        onOpenReadme={onOpenReadme}
        onOpenArchiveModal={(): void => setShowArchiveModal(true)}
        messagesCount={session?.messages.length || 0}
      />
      <DiscussionPromptChips disabled={aiGated || loadingReply} onSelectPrompt={(prompt: string): Promise<void> => handleSendMessage(prompt)} />
      <DiscussionTimeline messages={session?.messages || []} loadingReply={loadingReply || loadingSession} repoFullName={selectedRepo.full_name} />
      <DiscussionInput inputMessage={inputMessage} loadingReply={loadingReply} aiGated={aiGated} onChangeInput={(val: string): void => setInputMessage(val)} onSubmit={(): Promise<void> => handleSendMessage()} onGoToSettings={onGoToSettings} />
      {showArchiveModal && (
        <DiscussionArchiveModal repo={selectedRepo} messages={session?.messages || []} snapshotDate={snapshotDate} onClose={(): void => setShowArchiveModal(false)} onArchived={handleArchiveComplete} />
      )}
    </div>
  );
}
