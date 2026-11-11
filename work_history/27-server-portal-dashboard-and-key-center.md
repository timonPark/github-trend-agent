# Issue #27: 중앙 서버 @primer/primitives 포털 레이아웃, 메인 대시보드 및 키 센터 웹 화면 구현

- **이슈 링크**: https://github.com/timonPark/github-trend-agent/issues/27
- **에픽**: [Epic 5] 중앙 서버 공개 웹 포털(Server Web Portal) 및 키 센터 UI 구축 (#30)
- **브랜치**: `27-server-portal-dashboard-and-key-center`
- **상태**: 진행 중
- **시작 일시**: 2026-11-11 11:23 (KST)

---

## 1. 작업 개요 및 요구사항
중앙 서버(`server/`, `:4000`)에 `@primer/primitives` 기반 디자인 토큰과 상단 4탭 글로벌 포털 네비게이션
(`Dashboard` | `Snapshot Explorer` | `Public Discussions` | `Key Center`)을 구축하고,
플랫폼 주요 통계 지표와 오늘자 TOP 3 하이라이트를 제공하는 메인 대시보드(`DashboardView`),
그리고 회원가입·로그인 및 `Client Auth Key` 발급·마스킹 열람·원클릭 복사·재발급(`rotate-key`)을 제공하는 **키 센터(`KeyCenterView`) 웹 화면**을 구현합니다.

### 세부 구현 범위
1. **플랫폼 통계 및 하이라이트 API (`GET /api/stats`)**:
   - 총 수집 스냅샷 수 (`snapshot_count`)
   - 공유된 공개 AI 토론 아카이브 수 (`public_archive_count`)
   - 가입 회원 수 (`total_user_count`)
   - 최신 스냅샷 기준 TOP 3 저장소 하이라이트 (`today_top3`)
   - 최신 공개 아카이브 미리보기 (`recent_public_discussions`)
2. **Primer 디자인 가이드 기반 서브 컴포넌트 분해 (SRP 및 150줄 이내 준수)**:
   - `server/src/components/ServerHeader.tsx`: 글로벌 헤더, 4탭 네비게이션, 사용자 로그인/로그아웃 쉘
   - `server/src/components/DashboardView.tsx`: 3대 플랫폼 통계 카드, 오늘자 TOP 3 하이라이트, 로컬 클라이언트 다운로드/연동 안내 배너
   - `server/src/components/KeyCenterView.tsx`: 클라이언트 인증 키 마스킹/보기 토글, 복사, 재발급 모달, 내 아카이브 목록 및 공개/비공개 토글
   - `server/src/components/AuthModal.tsx`: 회원가입 및 로그인 모달 폼
3. **메인 페이지 리팩토링 (`server/src/app/page.tsx`)**:
   - 기존 437줄 모놀리식 코드를 제거하고 컴포넌트 조율 중심의 100줄 이내 컴포넌트로 개편
4. **엔지니어링 헌법 준수**:
   - **모든 함수 최대 20줄 이내** 엄격 분해
   - 컴포넌트 150줄 이내 (SRP)
   - 100% 명시적 변수/함수 반환 타이핑 (`any` 전면 배제)

---

## 2. TDD 4단계 계획
- **Step 1 (Seam / Types)**: `server/src/lib/types/api.ts`에 `PlatformStatsResponseDto` 선언
- **Step 2 (Red)**: `GET /api/stats` 통계 API 단위/통합 테스트 작성 (`server/test/stats.test.ts`)
- **Step 3 (Green)**: `server/src/app/api/stats/route.ts` 구현 및 UI 서브 컴포넌트 분해 구현
- **Step 4 (Refactor)**: 20줄 이내 함수 전수 검증, 빌드 및 전체 테스트 검증 후 PR 생성


---

## 3. 진행 경과 및 구현 결과
- **Step 1 (Seam / Types)**:
  - `server/src/lib/types/api.ts`: `PlatformStatsResponseDto` 선언 완료.
  - `server/src/lib/db.ts`: `listDailySnapshots()`, `countUsers()` 메서드 추가 완료.
- **Step 2 (Red)**:
  - `server/test/stats.test.ts`: 통계 지표(스냅샷 수, 공개 아카이브 수, 회원 수, TOP 3 하이라이트) 검증 테스트 작성 완료.
- **Step 3 (Green)**:
  - `server/src/app/api/stats/route.ts`: 누적 지표 집계 및 TOP 3 하이라이트 반환 API 라우트 구현 완료 (36줄).
  - `server/package.json`: `@primer/primitives` 의존성 추가 완료.
  - `server/src/app/globals.css` 및 `layout.tsx`: Primer CSS 테마 및 컬러 모드 설정 완료.
  - `server/src/components/ServerHeader.tsx`: 포털 로고, 4탭 네비게이션, 로그인/로그아웃 쉘 구현 (122줄).
  - `server/src/components/DashboardView.tsx`: 3대 지표 카드, TOP 3 하이라이트, 로컬 클라이언트 안내 배너 구현 (108줄).
  - `server/src/components/KeyCenterView.tsx`: Client Auth Key 마스킹/보기, 복사, 재발급, 내 아카이브 목록 및 공개/비공개 토글 구현 (139줄).
  - `server/src/components/UserArchiveRow.tsx`: 사용자 아카이브 행 컴포넌트 독립 분리 (34줄).
  - `server/src/components/AuthModal.tsx`: 로그인 / 회원가입 모달 폼 구현 (67줄).
  - `server/src/app/page.tsx`: 모놀리식 437줄을 서브 컴포넌트 조율 중심의 101줄로 전면 개편 완료.
- **Step 4 (Refactor & Verification)**:
  - 모든 컴포넌트 150줄 이내 및 모든 함수 20줄 이내 전수 검증 통과.
  - Vitest 테스트 92개 (서버 19개, 클라이언트 73개) 100% 통과 확인.
  - Next.js 서버 및 클라이언트 프로덕션 빌드 통과 확인.
