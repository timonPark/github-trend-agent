import type { Metadata } from 'next';
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'GitHub Trend Agent - Server Portal & Key Center',
  description: 'Central Remote Storage, Public Discussion Portal and Client Key Center',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="ko" data-color-mode="light" data-light-theme="light">
      <body>{children}</body>
    </html>
  );
}
