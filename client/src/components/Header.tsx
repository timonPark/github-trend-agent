'use client';

import React, { useState, useEffect } from 'react';

interface HeaderProps {
  username?: string;
  onOpenSettings?: () => void;
}

export default function Header({ username, onOpenSettings }: HeaderProps = {}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('color-mode') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-color-mode', saved);
      document.documentElement.setAttribute('data-light-theme', saved === 'dark' ? 'dark' : 'light');
      document.documentElement.setAttribute('data-dark-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('color-mode', next);
    document.documentElement.setAttribute('data-color-mode', next);
    document.documentElement.setAttribute('data-light-theme', next === 'dark' ? 'dark' : 'light');
  };

  return (
    <header className="border-b border-[var(--borderColor-default)] bg-[var(--bgColor-default)] px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <svg
            height="24"
            aria-hidden="true"
            viewBox="0 0 16 16"
            version="1.1"
            width="24"
            className="fill-[var(--fgColor-default)]"
          >
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
          </svg>
          <div>
            <h1 className="text-base font-semibold leading-none text-[var(--fgColor-default)]">
              GitHub Trend Agent
            </h1>
            <span className="text-xs text-[var(--fgColor-muted)]">
              Local AI Runner & Repository Curator
            </span>
          </div>
          <span className="primer-badge primer-badge-blue ml-2">v0.1.0</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {username && (
            <span className="text-xs font-semibold text-[var(--fgColor-default)]">
              👤 {username}
            </span>
          )}
          <div className="flex items-center gap-2 text-xs text-[var(--fgColor-muted)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--fgColor-success)]"></span>
            <span>Local DB Ready</span>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="primer-btn"
              title="설정"
              aria-label="Settings"
            >
              ⚙️
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="primer-btn"
            title="Toggle Light / Dark mode"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>
    </header>
  );
}
