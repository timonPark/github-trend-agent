# Work History: #6 daily-snapshot-3tier-caching

## 기본 정보
- **이슈 번호**: [#6](https://github.com/timonPark/github-trend-agent/issues/6)
- **상위 에픽**: [#13 [Epic 2] 0시 기준 GitHub Star TOP 10 수집 및 Dual-DB 3단계 공유 캐싱](https://github.com/timonPark/github-trend-agent/issues/13)
- **작업 브랜치**: `6-daily-snapshot-3tier-caching`
- **담당자**: `timonPark`
- **시작 일시**: 2026-11-10 14:07 KST
- **최종 완료일시**: 2026-11-10 14:14 KST
- **상태**: PR #22 머지 및 완료 (Closed)

---

## 작업 목표
1. **중앙 서버 (`server/`) 일일 스냅샷 API (`/api/snapshots`) 구현**:
   - `GET /api/snapshots?date=YYYY-MM-DD`: 클라이언트 인증 키 검증 후 중앙 DB에 저장된 당일 스냅샷 반환
   - `POST /api/snapshots`: 클라이언트가 수집한 TOP 10 스냅샷을 중앙 DB에 저장(공유 활성화)
2. **클라이언트 (`client/`) 3단계 캐싱 엔진 구현**:
   - **Tier 1 (로컬 캐시)**: 클라이언트 로컬 SQLite `local_snapshots` 확인 -> 존재 시 즉시 반환 (`source: local-cache`)
   - **Tier 2 (중앙 서버)**: 로컬 부재 시 중앙 서버 `/api/snapshots` 조회 -> 존재 시 로컬 캐싱 후 반환 (`source: remote-server`)
   - **Tier 3 (최초 수집 & 동기화)**: 로컬/서버 둘 다 부재 시 헤드리스 수집기 가동 -> 로컬 SQLite 및 중앙 서버 양쪽에 동시 저장 (`source: fresh-scraped`)
3. **클라이언트 간 공유 검증**:
   - 클라이언트 A가 최초 수집/서버 동기화 후, 클라이언트 B가 동일 날짜 조회 시 크롤링 없이 중앙 서버에서 즉시 스냅샷을 받아 로컬에 캐싱하는 멀티 클라이언트 공유 시나리오 검증.
4. **테스트 및 UI 소스 뱃지(로컬 캐시/서버 동기화/최초 수집) 연동**.

---

## 진행 내역 (Progress Log)
1. **[2026-11-10 14:07 KST]** 브랜치 `6-daily-snapshot-3tier-caching` 생성 및 체크아웃, Project #13 상태 `In Progress`로 갱신.
2. **[2026-11-10 14:07 KST]** `work_history/6-daily-snapshot-3tier-caching.md` 초기화.
3. **[2026-11-10 14:08 KST]** 중앙 서버 일일 스냅샷 API 구현 ([`server/src/app/api/snapshots/route.ts`](file:///Users/2309-n0018/Project/github-trend-agent/server/src/app/api/snapshots/route.ts)):
   - `GET /api/snapshots?date=YYYY-MM-DD`: 인증 검증 및 당일 스냅샷 반환 (200 / 404 / 401)
   - `POST /api/snapshots`: 인증 검증, 스냅샷 저장 및 생성자(`created_by`) 메타데이터 등록 (201)
   - 서버 단위 테스트 작성 ([`server/test/snapshots.test.ts`](file:///Users/2309-n0018/Project/github-trend-agent/server/test/snapshots.test.ts)) 4/4 통과.
4. **[2026-11-10 14:09 KST]** 클라이언트 3단계 캐싱 엔진 구현 ([`client/src/lib/snapshot-service.ts`](file:///Users/2309-n0018/Project/github-trend-agent/client/src/lib/snapshot-service.ts)):
   - `getOrFetchDailySnapshot`: Tier 1 (로컬 SQLite 캐시) -> Tier 2 (중앙 서버 조회 및 로컬 캐싱) -> Tier 3 (최초 수집 및 중앙 서버 동기화) 순차 실행.
   - `client/src/app/api/trending/route.ts`: 캐시 상태(`source`), 동기화 플래그(`syncedWithServer`) 반환 엔드포인트 구현.
5. **[2026-11-10 14:10 KST]** 멀티 클라이언트 공유 및 3단계 캐싱 통합 테스트 작성 ([`client/test/three-tier-caching.test.ts`](file:///Users/2309-n0018/Project/github-trend-agent/client/test/three-tier-caching.test.ts)):
   - Tier 1 로컬 캐시 즉시 반환 검증
   - Tier 2 중앙 서버 스냅샷 조회 및 로컬 SQLite 저장 검증
   - Tier 3 신규 수집 및 서버 POST 동기화 검증
   - **핵심 시나리오 검증: 클라이언트 A가 최초 수집하여 서버로 전송한 후, 클라이언트 B는 크롤링 없이 중앙 서버 스냅샷을 받아 로컬에 캐싱하는 멀티 클라이언트 공유 시나리오 100% 통과!**
6. **[2026-11-10 14:11 KST]** 클라이언트 웹 UI 연동 ([`client/src/app/page.tsx`](file:///Users/2309-n0018/Project/github-trend-agent/client/src/app/page.tsx)):
   - 캐시 소스 상태 뱃지 (🟢 로컬 캐시 Tier 1 / 🌐 중앙 서버 공유 Tier 2 / ⚡ 신규 수집 Tier 3) 실시간 표시
   - [🔄 캐시 조회] 및 [⚡ 강제 재수집 (Force)] 버튼 제공.
7. **[2026-11-10 14:13 KST]** 전체 42개 테스트 100% 통과 (server 14개, client 28개) 및 Next.js 양측 프로덕션 빌드 성공 확인.
8. **[2026-11-10 14:14 KST]** PR [#22](https://github.com/timonPark/github-trend-agent/pull/22) 생성 및 사용자 승인 후 메인 브랜치 머지 완료. 브랜치 `6-daily-snapshot-3tier-caching` 삭제 및 이슈 #6 자동 Close 확인.
