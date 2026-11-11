# Issue #28: server-snapshot-explorer-ui: 중앙 서버 일일 TOP 10 스냅샷 보관소(Snapshot Explorer) 웹 화면 구현

## 1. 개요
- **이슈 번호**: #28
- **WBS**: 5.2
- **브랜치**: `28-server-snapshot-explorer-ui`
- **담당 컴포넌트**: `server/src/app/api/snapshots/public/route.ts`, `server/src/components/ServerDateSelector.tsx`, `server/src/components/ServerRepoCard.tsx`, `server/src/components/ServerReadmeModal.tsx`, `server/src/components/SnapshotExplorer.tsx`, `server/src/app/page.tsx`

## 2. 작업 내용
1. **DTO 정의**:
   - `server/src/lib/types/api.ts`에 `PublicSnapshotResponseDto` 인터페이스 추가 (`snapshot`, `available_dates`).
2. **TDD 테스트 작성 (Red)**:
   - `server/test/public-snapshots.test.ts`에 비로그인 공개 조회 및 날짜별 조회, 비존재 날짜 조회 테스트 케이스 3개 작성.
3. **공개 스냅샷 API 구현 (Green)**:
   - `server/src/app/api/snapshots/public/route.ts` 구현.
   - 단일 목적 함수 분해(`parseRequestedDate`, `extractAvailableDates`, `resolveTargetSnapshot`, `GET`)로 모든 함수 20줄 이내 준수.
4. **UI 컴포넌트 구현**:
   - `ServerDateSelector.tsx` (84줄): 날짜 직접 입력 및 보관 날짜 빠른 칩 선택기.
   - `ServerRepoCard.tsx` (106줄): 1~10위 카드, 순위 배지, 언어, 스타수, 급상승치, AI 3줄 요약(Digest), README 보기 버튼.
   - `ServerReadmeModal.tsx` (136줄): README 원문 모달 뷰어 (Esc/오버레이 클릭 닫기, 마크다운/텍스트 프리뷰, GitHub 바로가기 링크).
   - `SnapshotExplorer.tsx` (122줄): 메인 뷰 컴포넌트. 날짜별 스냅샷 fetch, 요약 메타 배너, 리스트 및 모달 통합 조율.
5. **글로벌 포털 연동**:
   - `server/src/app/page.tsx`에 `activeTab === 'snapshots'`일 때 `<SnapshotExplorer />` 렌더링 연동.
6. **검증**:
   - 전체 테스트 95개(19개 스위트) 100% 통과.
   - Server & Client 프로덕션 빌드 검증 진행.
