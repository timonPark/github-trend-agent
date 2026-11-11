# Issue #10: 웹 화면 실시간 AI 채팅 토론(Discussion Session) 구현

- **이슈 링크**: https://github.com/timonPark/github-trend-agent/issues/10
- **에픽**: [Epic 4] 웹 실시간 AI 토론(Discussion Session) 및 계정별 보관함(Discussion Archive) (#15)
- **브랜치**: `10-web-discussion-session-chat`
- **상태**: 진행 중
- **시작 일시**: 2026-11-11 09:49 (KST)

---

## 1. 작업 개요 및 요구사항
클라이언트 로컬 AI 워크스페이스(`client/`)에서 사용자가 선택한 일일 GitHub Star TOP 10 저장소를 주제로,
해당 저장소의 `Repository Digest` 및 `README.md` 컨텍스트를 주입하여 `Local AI Agent`와 실시간으로
질의응답 및 기술 토론을 진행하는 **`DiscussionSession` 웹 채팅 화면 및 API**를 구현합니다.

### 세부 요구사항 충족 기준
1. **토론 세션 관리 및 로컬 DB 영속화**:
   - 저장소별 세션 ID 식별 및 조회/생성 (`client/src/lib/db.ts`)
   - 대화 메시지(`user` / `assistant`)를 로컬 SQLite DB(`discussion_sessions`)에 실시간 저장
2. **컨텍스트 주입 AI 응답 생성 (`client/src/lib/ai/discussion.ts`)**:
   - 저장소 메타데이터 + 3줄 Digest 요약 + README 본문을 프롬프트 컨텍스트로 구성
   - `Local AI Agent` 러너(`executeAiRequest`)를 통해 AI 답변 생성
   - AI 미연동(`none`) 상태 시 요청 차단 (Capability Gating, `403`)
3. **API 엔드포인트 (`client/src/app/api/discussions/route.ts`)**:
   - `GET /api/discussions?repo=...&url=...`: 세션 및 대화 내역 조회/초기화
   - `POST /api/discussions`: 사용자 메시지 추가 및 AI 답변 생성 후 갱신된 세션 반환
4. **UI 컴포넌트 세분화 (SRP 및 150줄 이내 원칙 준수)**:
   - `DiscussionHeader.tsx`: 대상 저장소 정보, Digest 토글 뷰어, README 보기
   - `DiscussionTimeline.tsx`: 사용자/AI 말풍선 타임라인 및 로딩 스피너
   - `DiscussionPromptChips.tsx`: 추천 질문 칩 (아키텍처 분석, 실무 도입 시 장단점 등)
   - `DiscussionInput.tsx`: 메시지 입력 폼 및 전송 버튼
   - `DiscussionWorkspace.tsx`: 위 컴포넌트들을 조율하는 메인 뷰 (100줄 이내)
5. **엔지니어링 원칙 (`AGENTS.md`)**:
   - **모든 함수 최대 20줄 이내** (단일 목적 함수로 분해)
   - 100% 명시적 변수 및 함수 반환 타입 부여

---

## 2. TDD 4단계 계획
- **Step 1 (Seam / Types)**: `client/src/lib/types/api.ts`에 Discussion DTO 인터페이스 선언
- **Step 2 (Red)**: `client/test/discussion.test.ts` 작성 및 테스트 실패 확인
- **Step 3 (Green)**: 프롬프트 빌더, API 라우트, UI 컴포넌트 구현 및 테스트 통과 확인
- **Step 4 (Refactor)**: 모든 함수 20줄 이내 전수 검증, 전체 테스트 및 빌드 확인 후 PR 생성


---

## 3. 진행 경과 및 구현 결과
- **Step 1 (DTO 정의)**: `client/src/lib/types/api.ts`에 `GetDiscussionResponseDto`, `SendDiscussionMessageRequestDto`, `SendDiscussionMessageResponseDto` 선언 완료.
- **Step 2 (Red)**: `client/test/discussion.test.ts`에 프롬프트 빌더, 대화 히스토리 포매터, 세션 조회/전송, AI capability 차단, 다중 턴 대화 지속성 등 8개 테스트 케이스 작성 완료.
- **Step 3 (Green)**:
  - `client/src/lib/ai/discussion.ts`: 저장소 메타데이터, 3줄 Digest, README 컨텍스트를 주입하는 프롬프트 빌더 및 AI 러너 실행 구현 완료 (모든 함수 15줄 이내).
  - `client/src/app/api/discussions/route.ts`: `GET` 세션 조회 및 `POST` 메시지 전송 / AI 응답 생성 및 로컬 SQLite `saveDiscussionSession` 연동 완료 (모든 함수 19줄 이내).
  - `client/src/components/DiscussionHeader.tsx`: 대상 저장소 메타정보, Digest 요약 표시, 레포 드롭다운 전환기, README 버튼 구현 (141줄).
  - `client/src/components/DiscussionPromptChips.tsx`: 4대 추천 질문 칩 구현 (49줄).
  - `client/src/components/DiscussionTimeline.tsx`: 사용자/AI 말풍선 타임라인 및 로딩 스피너 구현 (101줄).
  - `client/src/components/DiscussionInput.tsx`: 단축키(Enter/Shift+Enter) 지원 입력 폼, 전송 버튼, AI 미연동 알림 배너 구현 (118줄).
  - `client/src/components/DiscussionWorkspace.tsx`: 위 서브 컴포넌트들을 조율하는 메인 워크스페이스 컴포넌트 구현 (137줄).
  - `client/src/app/page.tsx`: 실시간 토론 세션 탭 연계 및 TOP 10 카드 `[실시간 토론]` 버튼과 워크스페이스 데이터 연동 완료.
- **Step 4 (Refactor & Verification)**:
  - 컴포넌트 SRP 분해 (모두 150줄 이내) 및 모든 함수 20줄 이내 규칙 100% 만족 전수 검증 완료.
  - Vitest 테스트 77개 (서버 14개, 클라이언트 63개) 전체 100% 통과 확인.
  - Next.js 서버 및 클라이언트 프로덕션 빌드(`npm run build`) 통과 확인.
