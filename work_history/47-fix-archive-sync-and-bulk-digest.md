# Work History: #47 fix: 아카이브 중앙 동기화 누락 수정, 과거 날짜 크롤링 차단 및 TOP 10 일괄 AI 요약 기능 추가

## 1. 개요
- **이슈**: [#47](https://github.com/timonPark/github-trend-agent/issues/47)
- **작업 내용**:
  1. 클라이언트 토론 아카이브 생성/공개 전환 시 중앙 서버(`http://localhost:4000/api/archives`) 동기화 키 조회 결함을 수정 (`getSetting('client_auth_key')` ➔ `getServerAuthKey(db)`)
  2. 과거 날짜(`targetDate < today`) 조회 시 데이터가 없어도 실시간 크롤링(Tier 3: `scrapeGitHubTrending`)이 실행되지 않도록 차단 가드 추가
  3. Daily GitHub Star TOP 10 대시보드에 한 번에 10개 레포지토리의 요약을 생성하는 '전체 일괄 AI 요약 생성' 버튼 및 진행률 표시 추가
  4. 테스트 데이터 초기화: 클라이언트 SQLite DB 및 중앙 서버 로컬 DB의 스냅샷/아카이브/세션 데이터 클리어 (유저 인증 정보는 보존)

## 2. 변경된 파일 목록
- `client/src/app/api/archives/route.ts`: 중앙 서버 동기화 함수에서 `getServerAuthKey(db)` 사용
- `client/src/lib/snapshot-service.ts`: 과거 날짜 실시간 크롤링 방지 가드 추가
- `client/src/components/TrendingDashboard.tsx`: '전체 일괄 AI 요약 생성' 툴바 버튼 및 props 추가
- `client/src/app/page.tsx`: 일괄 요약 실행 함수(`handleGenerateAllDigests`) 및 실시간 진행률 상태 추가
- `client/test/three-tier-caching.test.ts`: 과거 날짜 크롤링 차단 검증 테스트 추가 및 오늘 날짜 기준 동기화
- `client/test/archives.test.ts`: 아카이브 저장 시 중앙 서버 인증 헤더 전송 검증 테스트 추가
- `server/local-server-db.json`: 테스트 스냅샷/아카이브 데이터 초기화

## 3. 검증 결과
- **단위 테스트**: 106개 전체 통과 (`npm run test`)
- **프로덕션 빌드**: Client 및 Server Next.js 프로덕션 빌드 성공 (`npm run build`)
- **코드 품질**: 모든 함수 20줄 이내 및 100% 명시적 타이핑 준수
