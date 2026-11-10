import './globals.css';
import Header from '../components/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GitHub Trend Agent (Client)',
  description: 'Local AI Runner for GitHub Star Trending TOP 10 and Discussion Archives',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="ko" data-color-mode="light" data-light-theme="light" data-dark-theme="dark">
      <body className="min-h-screen bg-[var(--bgColor-default)] text-[var(--fgColor-default)] flex flex-col">
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-[var(--borderColor-default)] py-4 text-center text-xs text-[var(--fgColor-muted)]">
          <p>© 2026 GitHub Trend Agent. Built with Next.js, SQLite, and Primer Primitives.</p>
        </footer>
      </body>
    </html>
  );
}
