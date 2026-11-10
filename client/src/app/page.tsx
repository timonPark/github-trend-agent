export default function ClientHomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* Navigation Subhead */}
      <div className="mb-6 border-b border-[var(--borderColor-default)] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--fgColor-default)]">
              Today&apos;s GitHub Star TOP 10
            </h2>
            <p className="text-sm text-[var(--fgColor-muted)]">
              매일 0시(00:00) 기준 GitHub 일간 스타 급상승 상위 10개 오픈소스 저장소
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="primer-badge primer-badge-green">
              Design System: @primer/primitives
            </span>
            <span className="primer-badge primer-badge-gray">
              Snapshot Date: 2026-11-10
            </span>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mt-4 flex gap-4 text-sm font-medium">
          <button className="border-b-2 border-[var(--fgColor-accent)] pb-2 text-[var(--fgColor-default)]">
            🌟 Daily TOP 10
          </button>
          <button className="pb-2 text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]">
            💬 Discussion Session
          </button>
          <button className="pb-2 text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]">
            📚 My Archives
          </button>
          <button className="pb-2 text-[var(--fgColor-muted)] hover:text-[var(--fgColor-default)]">
            ⚙️ Settings
          </button>
        </nav>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="primer-card">
          <h3 className="text-sm font-semibold text-[var(--fgColor-muted)]">Local Client Server</h3>
          <p className="mt-2 text-2xl font-bold text-[var(--fgColor-default)]">Active</p>
          <p className="mt-1 text-xs text-[var(--fgColor-muted)]">Next.js App Router (Port 3000)</p>
        </div>

        <div className="primer-card">
          <h3 className="text-sm font-semibold text-[var(--fgColor-muted)]">Local Database</h3>
          <p className="mt-2 text-2xl font-bold text-[var(--fgColor-default)]">SQLite</p>
          <p className="mt-1 text-xs text-[var(--fgColor-muted)]">better-sqlite3 Cache Ready</p>
        </div>

        <div className="primer-card">
          <h3 className="text-sm font-semibold text-[var(--fgColor-muted)]">Central Server Sync</h3>
          <p className="mt-2 text-2xl font-bold text-[var(--fgColor-accent)]">Next.js + Supabase</p>
          <p className="mt-1 text-xs text-[var(--fgColor-muted)]">Server API Endpoint Ready</p>
        </div>
      </div>

      {/* Workspace Scaffolding Status Banner */}
      <div className="primer-card bg-[var(--bgColor-muted)]">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-base font-semibold text-[var(--fgColor-default)]">
              Workspace & Primer Design System Scaffolding Complete
            </h4>
            <p className="mt-1 text-sm text-[var(--fgColor-muted)]">
              `server/`(Next.js + Supabase) 및 `client/`(Next.js + `@primer/primitives`) 기본 구성이 완료되었습니다.
              다음 이슈(#3 Dual-DB 스키마)에서 SQLite 테이블 및 Supabase 스키마 계층을 구축합니다.
            </p>
          </div>
          <button className="primer-btn primer-btn-primary">
            Quick Start
          </button>
        </div>
      </div>
    </main>
  );
}
