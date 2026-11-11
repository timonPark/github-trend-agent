# Issue #11: 토론 종료 시 핵심 내용 요약 정리, 공개 상태(is_public) 및 로컬·중앙 서버 영구 보관 구현

- **이슈 링크**: https://github.com/timonPark/github-trend-agent/issues/11
- **에픽**: [Epic 4] 웹 실시간 AI 토론(Discussion Session) 및 계정별 보관함(Discussion Archive) (#15)
- **브랜치**: `11-discussion-archive-summarize-and-sync`
- **상태**: 진행 중
- **시작 일시**: 2026-11-11 10:10 (KST)

---

## 1. 작업 개요 및 요구사항
실시간 토론(`Discussion Session`) 종료 시, `Local AI Agent`가 전체 대화 타임라인을 분석하여 3~5줄 분량의 핵심 결론 요약(`discussion_summary`)을 생성하고,
초기 `Repository Digest`, 대화 전문(`messages`), 사용자가 지정한 공개 상태(`is_public`)와 함께 클라이언트 로컬 SQLite DB(`local_archives`)와 중앙 서버(`server/`)의 `discussion_archives` 테이블에 동기화·영구 보관하는 기능 및 API를 구현합니다.

### 세부 구현 범위
1. **토론 핵심 결론 AI 요약 생성 (`client/src/lib/ai/discussion.ts`)**:
   - `generateDiscussionSummary(config, repo, messages)` 구현
   - 대화 내역 전체를 토대로 기술적 장단점, 핵심 결론, 실행 권고사항을 3~5줄로 도출하는 프롬프트 구성
2. **클라이언트 및 중앙 서버 DTO 정의 (`types/api.ts`)**:
   - `CreateArchiveRequestDto`, `CreateArchiveResponseDto`
   - `UpdateArchiveVisibilityRequestDto`, `UpdateArchiveVisibilityResponseDto`
   - `GetArchivesResponseDto`
3. **중앙 서버 아카이브 API 엔드포인트 (`server/src/app/api/archives/route.ts`)**:
   - `x-client-auth-key` 헤더를 통한 사용자 계정 인증 (`findUserByClientKey`)
   - `POST /api/archives`: 아카이브 레코드 저장/업서트 (사용자 `user_id` 자동 바인딩)
   - `GET /api/archives`: 사용자의 아카이브 목록 조회
   - `PATCH /api/archives`: 아카이브 공개 여부(`is_public`) 토글 갱신
4. **클라이언트 아카이브 API 엔드포인트 (`client/src/app/api/archives/route.ts`)**:
   - `POST /api/archives`: 로컬 SQLite DB(`saveLocalArchive`) 저장 및 중앙 서버 원격 동기화
   - `GET /api/archives`: 로컬 아카이브 목록 조회
   - `PATCH /api/archives`: 로컬 아카이브 `is_public` 토글 및 중앙 서버 원격 동기화
5. **웹 화면 UI 연동 (`DiscussionWorkspace.tsx` / `DiscussionArchiveModal.tsx`)**:
   - `[토론 종료 및 보관]` 버튼 클릭 시 공개 여부(공개/비공개) 선택 및 확인 모달 팝업
   - 완료 후 성공 토스트/알림 및 아카이브 저장 상태 피드백
6. **엔지니어링 헌법 준수**:
   - **모든 함수 20줄 이내** 엄격 분해
   - 컴포넌트 150줄 이내 (SRP)
   - 100% 명시적 변수/함수 반환 타이핑 (`any` 전면 배제)

---

## 2. TDD 4단계 계획
- **Step 1 (Seam / Types)**: 공통 및 클라이언트/서버 DTO 인터페이스 선언
- **Step 2 (Red)**: 서버 및 클라이언트 아카이브 API & 요약 생성 단위/통합 테스트 작성 (`server/test/archives.test.ts`, `client/test/archives.test.ts`)
- **Step 3 (Green)**: AI 요약 함수, 서버 및 클라이언트 API 라우트, UI 연동 구현 및 테스트 통과
- **Step 4 (Refactor)**: 20줄 이내 함수 전수 검증, 빌드 및 전체 테스트 검증 후 PR 생성


---

## 3. 진행 경과 및 구현 결과
- **Step 1 (DTO 정의)**:
  - `server/src/lib/types/api.ts`: `CreateArchiveRequestDto`, `CreateArchiveResponseDto`, `UpdateArchiveVisibilityRequestDto`, `UpdateArchiveVisibilityResponseDto`, `GetArchivesResponseDto` 선언 완료.
  - `client/src/lib/types/api.ts`: `CreateLocalArchiveRequestDto`, `CreateLocalArchiveResponseDto`, `UpdateArchiveVisibilityRequestDto`, `UpdateArchiveVisibilityResponseDto`, `GetLocalArchivesResponseDto` 선언 완료.
- **Step 2 (Red)**:
  - `server/test/archives.test.ts`: 4개 테스트 케이스 작성 완료.
  - `client/test/archives.test.ts`: 4개 테스트 케이스 작성 완료.
- **Step 3 (Green)**:
  - `server/src/app/api/archives/route.ts`: 중앙 서버 인증(`x-client-auth-key`), 사용자별 아카이브 생성/조회(`POST`/`GET`), 공개 아카이브 필터링(`GET ?public=true`), 공개 상태 토글(`PATCH`) API 구현 완료 (모든 함수 19줄 이내).
  - `client/src/lib/ai/discussion.ts`: `generateDiscussionSummary` AI 결론 요약 생성 모듈 구현 완료.
  - `client/src/app/api/archives/route.ts`: 로컬 SQLite 저장, AI 요약 자동 생성, 중앙 서버 동기화(`syncArchiveToServer`, `syncPatchToServer`) 및 공개 상태 토글 API 구현 완료 (모든 함수 19줄 이내).
  - `client/src/components/DiscussionArchiveModal.tsx`: 공개/비공개 토글 라디오, AI 요약 저장 확인 모달 컴포넌트 구현 (132줄).
  - `client/src/components/DiscussionDigestBox.tsx`: 3줄 요약 컴포넌트 독립 분리 (23줄).
  - `client/src/components/DiscussionHeader.tsx`: `[토론 종료 및 보관]` 버튼 연동 및 140줄 이내 리팩토링 완료.
  - `client/src/components/DiscussionWorkspace.tsx`: 모달 및 저장 성공 배너, 보관함 이동 연동 완료 (138줄).
  - `client/src/app/page.tsx`: 토론 세션 워크스페이스에 `snapshotDate` 및 `onGoToArchives` 전달 연결 완료.
- **Step 4 (Refactor & Verification)**:
  - 컴포넌트 150줄 이내 및 모든 함수 20줄 이내 전수 준수 확인 완료.
  - 전체 Vitest 테스트 85개 (서버 18개, 클라이언트 67개) 100% 통과 확인.
  - Next.js 서버 및 클라이언트 프로덕션 빌드 통과 확인.
