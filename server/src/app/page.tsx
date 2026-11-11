'use client';

import React, { useState, useEffect } from 'react';
import { ServerHeader, ServerTabType } from '../components/ServerHeader';
import { DashboardView } from '../components/DashboardView';
import { KeyCenterView } from '../components/KeyCenterView';
import { SnapshotExplorer } from '../components/SnapshotExplorer';
import { PublicDiscussionFeed } from '../components/PublicDiscussionFeed';
import { AuthModal } from '../components/AuthModal';

interface AuthUser {
  id: string;
  username: string;
  client_auth_key: string;
}

export default function ServerPortalPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ServerTabType>('dashboard');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect((): void => {
    const savedUser: string | null = localStorage.getItem('gta_server_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser) as AuthUser);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleLogout = (): void => {
    localStorage.removeItem('gta_server_user');
    localStorage.removeItem('gta_server_token');
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user: AuthUser): void => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleUpdateKey = (newKey: string): void => {
    if (!currentUser) return;
    const updated: AuthUser = { ...currentUser, client_auth_key: newKey };
    setCurrentUser(updated);
    localStorage.setItem('gta_server_user', JSON.stringify(updated));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f8fa' }}>
      <ServerHeader
        activeTab={activeTab}
        currentUser={currentUser}
        onSelectTab={(tab: ServerTabType): void => setActiveTab(tab)}
        onOpenAuthModal={(): void => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
        {activeTab === 'dashboard' && (
          <DashboardView
            onGoToKeyCenter={(): void => setActiveTab('key-center')}
            onGoToSnapshots={(): void => setActiveTab('snapshots')}
            onGoToDiscussions={(): void => setActiveTab('feed')}
          />
        )}

        {activeTab === 'snapshots' && <SnapshotExplorer />}

        {activeTab === 'feed' && <PublicDiscussionFeed />}

        {activeTab === 'key-center' && (
          <KeyCenterView
            currentUser={currentUser}
            onOpenAuthModal={(): void => setShowAuthModal(true)}
            onUpdateUserKey={handleUpdateKey}
          />
        )}
      </main>

      {showAuthModal && (
        <AuthModal
          onClose={(): void => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
