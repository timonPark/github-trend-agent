# Work History: #3 setup-dual-db-schema

## 기본 정보
- **이슈 번호**: [#3](https://github.com/timonPark/github-trend-agent/issues/3)
- **상위 에픽**: [#1 [Epic 1] 기반 워크스페이스, Dual-DB 및 User 계정 인증 구축](https://github.com/timonPark/github-trend-agent/issues/1)
- **작업 브랜치**: `3-setup-dual-db-schema`
- **담당자**: `timonPark`
- **시작 일시**: 2026-11-10 13:27 KST
- **최종 완료일시**: 2026-11-10 13:36 KST
- **상태**: PR #19 머지 및 완료 (Closed)

---

## 작업 목표
- ADR-0002(Dual Database Architecture)에 따라 중앙 서버(`server/`)의 Supabase PostgreSQL 스키마 및 데이터 계층을 구현한다:
  - `users`: `client_auth_key` 필드 포함
  - `daily_snapshots`: 0시 기준 당일 TOP 10 스냅샷 공유 저장
  - `discussion_archives`: `messages`(대화 전문) 및 `is_public`(공개/비공개) 필드 포함
- 클라이언트(`client/`)의 `better-sqlite3` 기반 로컬 SQLite 데이터베이스 초기화 및 CRUD 헬퍼 계층을 구현한다:
  - `local_snapshots`, `user_settings`, `discussion_sessions`, `local_archives` (`is_public` 포함)
  - **인증 키(`server_auth_key`)가 변경되더라도 로컬 SQLite DB의 기존 데이터가 삭제되지 않고 온전히 보존됨을 검증한다.**
- 서버 및 클라이언트 DB 계층의 단위/통합 테스트를 작성하고 검증한다.

---

## 진행 내역 (Progress Log)
1. **[2026-11-10 13:27 KST]** `3-setup-dual-db-schema` 브랜치 생성 및 체크아웃 완료, Project #13 상태 `In Progress`로 갱신.
2. **[2026-11-10 13:27 KST]** `work_history/3-setup-dual-db-schema.md` 초기화.
3. **[2026-11-10 13:28 KST]** 서버 Supabase DDL 작성 ([`server/supabase/schema.sql`](file:///Users/2309-n0018/Project/github-trend-agent/server/supabase/schema.sql)):
   - `users` (id, email, password_hash, client_auth_key, created_at, updated_at)
   - `daily_snapshots` (id, snapshot_date, repositories, summary, source_run_id, created_at)
   - `discussion_archives` (id, user_id, snapshot_date, repo_full_name, repo_summary, messages, summary, is_public, created_at, updated_at)
4. **[2026-11-10 13:29 KST]** 서버 데이터베이스 인터페이스 및 어댑터 작성:
   - [`server/src/lib/types.ts`](file:///Users/2309-n0018/Project/github-trend-agent/server/src/lib/types.ts)
   - [`server/src/lib/db.ts`](file:///Users/2309-n0018/Project/github-trend-agent/server/src/lib/db.ts) (Supabase 클라이언트 + 테스트/로컬용 인메모리 어댑터)
   - [`server/test/db.test.ts`](file:///Users/2309-n0018/Project/github-trend-agent/server/test/db.test.ts) 작성 및 테스트 4/4 통과.
5. **[2026-11-10 13:30 KST]** 클라이언트 로컬 SQLite 데이터 계층 작성:
   - [`client/src/lib/types.ts`](file:///Users/2309-n0018/Project/github-trend-agent/client/src/lib/types.ts)
   - [`client/src/lib/db.ts`](file:///Users/2309-n0018/Project/github-trend-agent/client/src/lib/db.ts) (`better-sqlite3`, WAL 모드 활성화, 스키마 마이그레이션 및 헬퍼)
   - [`client/test/db.test.ts`](file:///Users/2309-n0018/Project/github-trend-agent/client/test/db.test.ts) 작성:
     - 스냅샷 저장 및 조회 검증
     - 토론 세션 생성 및 메시지 추가 검증
     - 토론 아카이브 저장 및 공개/비공개(`is_public`) 플래그 토글 검증
     - **사용자 핵심 요구사항 검증: `server_auth_key` 인증키를 새 키로 변경하더라도 로컬 스냅샷, 토론 세션, 아카이브 데이터가 100% 온전히 유지됨을 단언문(assert)으로 엄격 검증 완료**
6. **[2026-11-10 13:33 KST]** 전체 테스트 (`npm run test`) 및 Next.js 빌드 (`npm run build`) 100% 통과 확인 (11/11 tests pass).
7. **[2026-11-10 13:36 KST]** PR [#19](https://github.com/timonPark/github-trend-agent/pull/19) 생성 및 사용자 승인 후 메인 브랜치 머지 완료. 브랜치 `3-setup-dual-db-schema` 삭제 및 이슈 #3 자동 Close 확인.
