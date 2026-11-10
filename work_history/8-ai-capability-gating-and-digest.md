# Issue #8: AI 연동 여부에 따른 기능 제한(Gating) 및 Repository Digest 요약 생성 구현

- **이슈 링크**: https://github.com/timonPark/github-trend-agent/issues/8
- **에픽**: [Epic 3] 사용자별 Local AI Agent 연동 및 미연동 기능 제한(Capability Gating) (#14)
- **브랜치**: `8-ai-capability-gating-and-digest`
- **상태**: 완료 (PR 승인 대기)
- **완료 일시**: 2026-11-11 08:07 (KST)

---

## 1. 작업 개요 및 요구사항
사용자의 `Local AI Agent` 연동 여부(`provider !== 'none'`)에 따라 AI 기능을 제어(Capability Gating)하고,
연동된 상태에서 특정 GitHub Star TOP 10 저장소에 대한 `Repository Digest`(AI 3줄 핵심 요약)를 생성하여
클라이언트 로컬 SQLite DB와 중앙 서버 스냅샷에 동기화하는 기능을 구현했습니다.

### 세부 요구사항 충족
1. **AI Capability Gating**:
   - `provider === 'none'`(AI 미연동) 상태일 때:
     - `/api/digest` 등 AI 실행 API 직접 호출 시 `403 Forbidden` (`error: 'AI capability is disabled...'`) 반환
     - `TrendingDashboard`의 `[AI 요약 생성]` 및 `[실시간 토론 시작]` 버튼 비활성화(disabled) 및 연동 유도 툴팁/안내 제공
   - `provider !== 'none'`(AI 연동) 상태일 때:
     - `[AI 요약 생성]` 및 `[실시간 토론 시작]` 버튼 활성화
2. **Repository Digest 생성 및 동기화**:
   - 저장소 메타데이터(이름, 설명, 언어, 스타 수) 및 `README.md` 컨텍스트를 프롬프트로 구성하여 `Local AI Agent` 어댑터 호출
   - 목적, 핵심 기능, 기술적 가치를 3줄 요약한 `Repository Digest` 생성
   - 생성된 Digest를 클라이언트 로컬 SQLite 스냅샷(`local_snapshots`) 내 해당 저장소 레코드에 반영 (`updateLocalRepoDigest`)
   - 중앙 서버가 연동되어 있을 경우(`server_url` 및 `server_auth_key` 유효), 중앙 서버 `POST /api/snapshots`에 동기화 업데이트 수행

---

## 2. TDD 4단계 완료 내역
- **Step 1 (Seam / Types)**:
  - `client/src/lib/types/api.ts`에 `CapabilityGateStatusDto`, `GenerateDigestRequestDto`, `GenerateDigestResponseDto` 정의
  - `client/src/lib/db.ts`에 `updateLocalRepoDigest` 함수 구현
- **Step 2 (Red)**:
  - `client/test/digest.test.ts` 작성 (총 10개 테스트 케이스: Capability Gating, 프롬프트 빌더, DB 갱신, API Route 403/400/404/200 응답)
  - 구현 전 테스트 실행으로 Red 상태 확인
- **Step 3 (Green)**:
  - `client/src/lib/ai/digest.ts` 구현 (`checkAiCapability`, `buildDigestPrompt`, `generateRepoDigest`, `syncSnapshotToServer`)
  - `client/src/app/api/digest/route.ts` 구현
  - `client/src/components/TrendingRepoCard.tsx` 생성 (SRP 및 150줄 이내 컴포넌트 분해)
  - `client/src/components/TrendingDashboard.tsx` 리팩토링 (139줄)
  - `client/src/app/page.tsx`에 `handleGenerateDigest` 및 `aiGated` 연동
  - `client/test/digest.test.ts` 10개 테스트 및 전체 테스트 64개 100% Green 통과
- **Step 4 (Refactor & 100% 명시적 타이핑)**:
  - 전수 타입 및 반환 타입 명시 확인 (`any` 없음)
  - 컴포넌트 150줄 이내(Card: 144줄, Dashboard: 139줄) 분해 유지
  - 프로덕션 빌드 `npm run build` (서버/클라이언트 모두 번들링 성공)

---

## 3. 검증 결과
- 테스트 스위트:
  - 서버: 14개 통과
  - 클라이언트: 50개 통과 (기존 40개 + digest 신규 10개)
  - 총합: 64 passed (100%)
- 프로덕션 빌드:
  - `server`: Next.js 15.5.29 빌드 성공
  - `client`: Next.js 15.5.29 빌드 성공 (Type check / Lint 통과)
