# Work History: #5 github-trending-headless-scraper

## 기본 정보
- **이슈 번호**: [#5](https://github.com/timonPark/github-trend-agent/issues/5)
- **상위 에픽**: [#13 [Epic 2] 0시 기준 GitHub Star TOP 10 수집 및 Dual-DB 3단계 공유 캐싱](https://github.com/timonPark/github-trend-agent/issues/13)
- **작업 브랜치**: `5-github-trending-headless-scraper`
- **담당자**: `timonPark`
- **시작 일시**: 2026-11-10 14:01 KST
- **최종 완료일시**: 2026-11-10 14:05 KST
- **상태**: PR 생성 대기 및 검증 완료

---

## 작업 목표
1. **클라이언트 로컬 GitHub Daily Star TOP 10 헤드리스 수집기 구현**:
   - GitHub Daily Trending 페이지(`https://github.com/trending?since=daily`) 및 정규화 파서 작성
   - 일일 급상승 상위 10개 레포지토리 정보 추출:
     - `rank` (1 ~ 10)
     - `name` (레포지토리 이름)
     - `full_name` (`owner/name`)
     - `url` (`https://github.com/owner/name`)
     - `description` (저장소 소개)
     - `language` (주 사용 언어)
     - `total_stars` (누적 스타 수)
     - `daily_stars` (당일 획득 스타 수)
2. **저장소 `README.md` 원문 수집 및 텍스트 정제기 구현**:
   - 레포지토리의 기본 브랜치(`HEAD`, `main`, `master`) raw README 수집
   - AI 토론 및 요약 컨텍스트에 적합하도록 마크다운 텍스트 정제(배지/HTML 노이즈 제거, 토큰/길이 최적화)
3. **네트워크 단절 및 구조 변경 대응을 위한 안전한 폴백 메커니즘**:
   - Rate limit이나 접속 실패 시 대체 샘플/시드 데이터 파싱 지원
4. **수집기 단위/통합 테스트 작성 및 검증**.

---

## 진행 내역 (Progress Log)
1. **[2026-11-10 14:01 KST]** 브랜치 `5-github-trending-headless-scraper` 생성 및 체크아웃, Project #13 상태 `In Progress`로 갱신.
2. **[2026-11-10 14:01 KST]** `work_history/5-github-trending-headless-scraper.md` 초기화.
3. **[2026-11-10 14:02 KST]** `TrendingRepository` 인터페이스에 `readme?: string` 필드 추가 (`client/src/lib/types.ts`, `server/src/lib/types.ts`).
4. **[2026-11-10 14:02 KST]** 클라이언트 헤드리스 수집기 및 README 정제기 구현 ([`client/src/lib/scraper.ts`](file:///Users/2309-n0018/Project/github-trend-agent/client/src/lib/scraper.ts)):
   - `parseTrendingHtml`: GitHub Trending HTML로부터 순위 1~10, 저장소명, 풀네임, URL, 설명, 언어, 총 스타, 오늘 증가 스타 정밀 파싱
   - `cleanMarkdownReadme`: AI 컨텍스트용 마크다운 정제 (배지 링크, HTML 태그, 주석 제거 및 길이 최적화)
   - `fetchRepositoryReadme`: HEAD/main/master 브랜치 순차 raw README 수집
   - `scrapeGitHubTrending`: 일일 트렌딩 페이지 HTTP 수집 및 네트워크 단절 시 시드 샘플 fallback 지원
5. **[2026-11-10 14:03 KST]** 클라이언트 수집 라우트 및 UI 연동:
   - `client/src/app/api/trending/scrape/route.ts`: 온디맨드 수집 및 로컬 SQLite `local_snapshots` 자동 저장 라우트 구현
   - `client/src/app/page.tsx`: TOP 10 실시간 렌더링 카드, [🔄 지금 수집 실행] 버튼, [📖 README] 모달 뷰어 연동
6. **[2026-11-10 14:03 KST]** 수집기 단위/통합 테스트 작성 ([`client/test/scraper.test.ts`](file:///Users/2309-n0018/Project/github-trend-agent/client/test/scraper.test.ts)):
   - HTML 파싱 정확도, max 제한, 빈 HTML 예외 처리, README 정제, fetchFallback 검증 10/10 통과.
7. **[2026-11-10 14:04 KST]** 전체 34개 테스트 100% 통과 (server 10개, client 24개) 및 양측 Next.js 프로덕션 빌드 성공 확인.
