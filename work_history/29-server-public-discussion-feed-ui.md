# Issue #29: server-public-discussion-feed-ui: 중앙 서버 공개 AI 토론 아카이브 피드 웹 화면 구현

## 1. 개요
- **이슈 번호**: #29
- **WBS**: 5.3
- **에픽**: Epic 5 (#30)
- **브랜치**: `29-server-public-discussion-feed-ui`
- **목표**: 중앙 서버 웹 포털(`server/`, `:4000`)에서 공개(`is_public: true`)로 동기화된 Discussion Archive들을 검색·필터링하고, AI 토론 핵심 결론 요약 및 전체 대화 타임라인을 열람할 수 있는 `PublicDiscussionFeed` 화면 구현.

## 2. 작업 상세 내용
1. **필터 유틸리티 구현 및 TDD (Red -> Green)**:
   - `server/src/lib/feed-filter.ts`:
     - `matchArchiveQuery`: 저장소명, 작성자(@username), 요약 결론, Digest 대소문자 무시 검색
     - `matchArchiveDate`: 스냅샷 날짜 일치 필터
     - `filterPublicArchives`: 조건 필터 및 최신순(`created_at` DESC) 정렬
     - 모든 함수 20줄 이내 및 100% 명시적 타이핑 준수
   - `server/test/public-discussion-feed.test.ts`: 단위 테스트 5개 케이스 작성 및 100% 통과
2. **UI 서브 컴포넌트 구현 (각 150줄 이내, 함수 20줄 이내)**:
   - `DiscussionFeedFilterBar.tsx` (87줄): 검색어 인풋, 날짜 선택기, 초기화 버튼 및 건수 표시
   - `DiscussionFeedCard.tsx` (88줄): 대상 저장소명, 작성자 배지(@username), 작성일, AI 토론 핵심 결론 미리보기 카드
   - `DiscussionFeedDetailModal.tsx` (122줄): 저장소 정보, 초기 Repository Digest, AI 핵심 결론, 사용자/AI 말풍선 타임라인 상세 뷰어 모달
   - `PublicDiscussionFeed.tsx` (108줄): 메인 피드 조율 뷰. 데이터 로드(`GET /api/archives?public=true`), 필터 상태, 카드 리스트 및 모달 통합
3. **포털 메인 화면 연동**:
   - `server/src/app/page.tsx`의 `feed` 탭에 `<PublicDiscussionFeed />` 연결 (90줄 유지)
4. **품질 및 검증**:
   - 전체 단위 테스트 100개(20개 스위트) 100% 통과
   - Server & Client 프로덕션 빌드 성공
