import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'GitHub Trend Agent - Central Server',
  description: 'Central Remote Storage and Auth Server for GitHub Trend Agent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="ko">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
