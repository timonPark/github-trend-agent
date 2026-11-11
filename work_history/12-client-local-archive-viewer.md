# Issue #12: 클라이언트 내 토론 아카이브 보관함(LocalArchiveViewer) 및 공개 토글 화면 구현

- **이슈 링크**: https://github.com/timonPark/github-trend-agent/issues/12
- **에픽**: [Epic 4] 웹 실시간 AI 토론(Discussion Session) 및 계정별 보관함(Discussion Archive) (#15)
- **브랜치**: `12-client-local-archive-viewer`
- **상태**: 진행 중
- **시작 일시**: 2026-11-11 11:12 (KST)

---

## 1. 작업 개요 및 요구사항
클라이언트 로컬 워크스페이스(`client/`, `:3000`)의 '토론 아카이브' 탭에서 사용자가 로컬 SQLite에 저장한
토론 아카이브 목록을 조회·검색·필터링하고, 대상 저장소 정보와 초기 `Repository Digest`, AI 토론 핵심 결론 요약 및 대화 전문 로그를 열람하며,
`공개/비공개(is_public)` 상태를 원클릭으로 토글하여 로컬 DB 및 중앙 서버에 실시간 동기화하는 **`LocalArchiveViewer` 웹 화면 및 서브 컴포넌트**를 구현합니다.

### 세부 구현 범위
1. **아카이브 목록 및 필터링 (`LocalArchiveViewer.tsx`, `LocalArchiveFilterBar.tsx`)**:
   - 로컬 SQLite(`GET /api/archives`) 목록 로드
   - 저장소명/키워드 실시간 검색 필터링
   - 전체 / 공개만(`Public`) / 비공개만(`Private`) 상태별 필터 칩
   - 중앙 서버 동기화 여부(`synced_with_server`) 및 공개 상태(`is_public`) 배지 표시
2. **개별 아카이브 카드 (`LocalArchiveCard.tsx`)**:
   - 저장소명, 랭크/스타수, 보관일자(`created_at`), AI 3줄 요약(`discussion_summary`) 미리보기
   - 공개/비공개 토글 스위치 버튼 (클릭 시 `PATCH /api/archives` 호출하여 로컬 및 중앙 서버 동시 갱신)
   - `[상세 대화 열람]` 클릭 시 모달 열기
3. **아카이브 상세 대화 뷰어 모달 (`ArchiveDetailModal.tsx`)**:
   - 저장소 기본 정보 및 GitHub 링크
   - 초기 `Repository Digest` (3줄 요약)
   - AI 토론 핵심 요약문 전문
   - 전체 대화 전문 타임라인 (사용자/AI 말풍선)
4. **메인 화면 연계 (`client/src/app/page.tsx`)**:
   - '토론 아카이브' 탭에 `LocalArchiveViewer` 렌더링 연결
   - 아카이브 보관 완료 시 바로 아카이브 탭으로 전환하여 열람 가능하도록 상호작용 완성
5. **엔지니어링 헌법 준수**:
   - **모든 함수 20줄 이내** 엄격 분해
   - 컴포넌트 150줄 이내 (SRP)
   - 100% 명시적 변수/함수 반환 타이핑 (`any` 전면 배제)

---

## 2. TDD 4단계 계획
- **Step 1 (Seam / Types)**: 필터링 및 뷰어 관련 Props 인터페이스 정의
- **Step 2 (Red)**: 아카이브 필터링 로직, 목록 렌더링 및 공개 토글 액션 단위/통합 테스트 작성 (`client/test/archive-viewer.test.ts`)
- **Step 3 (Green)**: 서브 컴포넌트 구현 및 `page.tsx` 연동, 테스트 통과 확인
- **Step 4 (Refactor)**: 20줄 이내 함수 전수 검증, 전체 테스트 및 빌드 검증 후 PR 생성 (Epic 4 100% 완료)


---

## 3. 진행 경과 및 구현 결과
- **Step 1 (Seam / Types)**: `ArchiveVisibilityFilter`, `LocalArchiveFilterBarProps`, `LocalArchiveCardProps`, `ArchiveDetailModalProps` 정의 완료.
- **Step 2 (Red)**: `client/test/archive-viewer.test.ts`에 검색어 매칭, 요약문 키워드 매칭, 공개/비공개 상태 필터링 및 복합 필터링 등 6개 단위 테스트 작성 완료.
- **Step 3 (Green)**:
  - `client/src/lib/archive-filter.ts`: 대소문자 무시 레포명/요약/Digest 검색 및 공개 상태 필터링 모듈 구현 완료 (32줄).
  - `client/src/components/LocalArchiveFilterBar.tsx`: 공개/비공개 탭 필터 및 실시간 키워드 검색 바 구현 (94줄).
  - `client/src/components/LocalArchiveCard.tsx`: 아카이브 상태 배지, AI 3줄 요약 미리보기, 실시간 공개/비공개 토글 액션 버튼 및 상세 모달 열기 구현 (142줄).
  - `client/src/components/ArchiveDetailModal.tsx`: 저장소 메타정보, Digest 요약, AI 결론 요약 전문 및 전체 대화 타임라인 말풍선 모달 뷰어 구현 (94줄).
  - `client/src/components/LocalArchiveViewer.tsx`: 로컬 SQLite 목록 로드, 실시간 필터링, 토글 API(`PATCH /api/archives`) 동기화 처리 조율 컴포넌트 구현 (126줄).
  - `client/src/app/page.tsx`: '토론 아카이브' 탭에 `LocalArchiveViewer` 연동 완료.
- **Step 4 (Refactor & Verification)**:
  - 컴포넌트 150줄 이내 (SRP) 및 모든 함수 20줄 이내 전수 검증 통과.
  - Vitest 테스트 91개 (서버 18개, 클라이언트 73개) 100% 통과 확인.
  - Next.js 서버 및 클라이언트 프로덕션 빌드 통과 확인.
  - **Epic 4 모든 하위 이슈(#10, #11, #12) 구현 100% 완료**.
