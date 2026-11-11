'use client';

import React from 'react';

export type ServerTabType = 'dashboard' | 'snapshots' | 'feed' | 'key-center';

interface ServerHeaderProps {
  activeTab: ServerTabType;
  currentUser: { id: string; username: string } | null;
  onSelectTab: (tab: ServerTabType) => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

const NAV_TABS: { key: ServerTabType; label: string }[] = [
  { key: 'dashboard', label: '📊 Dashboard' },
  { key: 'snapshots', label: '📅 Snapshot Explorer' },
  { key: 'feed', label: '💬 Public Discussions' },
  { key: 'key-center', label: '🔑 Key Center' },
];

function UserAuthSection({
  currentUser,
  onOpenAuthModal,
  onLogout,
}: {
  currentUser: { id: string; username: string } | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}): React.JSX.Element {
  if (currentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '13px', color: '#1f2328', fontWeight: 600 }}>
          👤 {currentUser.username}
        </span>
        <button
          type="button"
          onClick={onLogout}
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            border: '1px solid #d0d7de',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            color: '#cf222e',
            cursor: 'pointer',
          }}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenAuthModal}
      style={{
        padding: '6px 14px',
        fontSize: '13px',
        fontWeight: 600,
        borderRadius: '6px',
        border: '1px solid rgba(27,31,36,0.15)',
        backgroundColor: '#1f883d',
        color: '#ffffff',
        cursor: 'pointer',
      }}
    >
      로그인 / 회원가입
    </button>
  );
}

export function ServerHeader({
  activeTab,
  currentUser,
  onSelectTab,
  onOpenAuthModal,
  onLogout,
}: ServerHeaderProps): React.JSX.Element {
  return (
    <header style={{ backgroundColor: '#24292f', color: '#ffffff', borderBottom: '1px solid #d0d7de' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={(): void => onSelectTab('dashboard')}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>GitHub Trend Agent</span>
            <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#388bfd', borderRadius: '10px', color: '#ffffff', fontWeight: 600 }}>Central Portal</span>
          </div>
        </div>
        <UserAuthSection currentUser={currentUser} onOpenAuthModal={onOpenAuthModal} onLogout={onLogout} />
      </div>
      <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #d0d7de', borderBottom: '1px solid #d0d7de' }}>
        <nav style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px', display: 'flex', gap: '4px' }}>
          {NAV_TABS.map((t): React.JSX.Element => {
            const isActive: boolean = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={(): void => onSelectTab(t.key)}
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: isActive ? '#1f2328' : '#656d76',
                  borderBottom: isActive ? '2px solid #fd8c73' : '2px solid transparent',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
