# Work History: #4 user-auth-and-client-key-verification

## 기본 정보
- **이슈 번호**: [#4](https://github.com/timonPark/github-trend-agent/issues/4)
- **상위 에픽**: [#1 [Epic 1] 기반 워크스페이스, Dual-DB 및 User 계정 인증 구축](https://github.com/timonPark/github-trend-agent/issues/1)
- **작업 브랜치**: `4-user-auth-and-client-key-verification`
- **담당자**: `timonPark`
- **시작 일시**: 2026-11-10 13:38 KST
- **최종 완료일시**: 2026-11-10 13:57 KST
- **상태**: PR 생성 대기 및 검증 완료

---

## 작업 목표
1. **중앙 서버 (`server/`) 회원가입·로그인 및 클라이언트 인증 키 발급/검증 API 구현**:
   - `/api/auth/register`: 중앙 서버 선(先) 회원가입 (이메일/아이디, 비밀번호)
   - `/api/auth/login`: 로그인 및 세션 확인
   - `/api/auth/client-key`: 클라이언트 인증 키(Token) 발급 및 재발급(Rotate)
   - `/api/auth/verify-key`: 클라이언트 인증 키 유효성 검증 (헤더 Bearer 또는 바디 지원)
   - 중앙 서버 웹 화면(`server/src/app/page.tsx`): 회원가입/로그인 폼, 대시보드에서 클라이언트 다운로드/실행 가이드 및 클라이언트 연동 인증 키 복사/재발급 UI 제공
2. **클라이언트 (`client/`) 최초 실행 시 서버 인증 게이트 구현**:
   - 로컬 SQLite `user_settings`에 `server_auth_key`가 없거나 무효한 경우, 앱 기능 사용 차단 및 "중앙 서버 계정 인증 필요" 게이트 화면 표시
   - 중앙 서버 회원가입/로그인 안내 및 인증 키 입력/검증 폼 제공
3. **클라이언트 설정 화면에서 인증 키 변경 및 로컬 데이터 보존**:
   - 클라이언트 설정(Settings) 화면에서 서버 연동 인증 키 변경 가능
   - **인증 키를 변경하더라도 로컬 SQLite DB의 기존 데이터(스냅샷, 토론 세션, 아카이브)는 일절 삭제하지 않고 100% 보존**
4. **인증 키 무효/만료(401 Unauthorized) 발생 시 설정 화면 자동 유도**:
   - 중앙 서버와 통신 중 401 에러를 받으면 사용자에게 상태 알림 및 설정 화면으로 자동 유도
5. **서버 및 클라이언트 인증 연동/401 에러 핸들링 테스트 검증**.

---

## 진행 내역 (Progress Log)
1. **[2026-11-10 13:38 KST]** 브랜치 `4-user-auth-and-client-key-verification` 생성 및 체크아웃, Project #13 상태 `In Progress`로 갱신.
2. **[2026-11-10 13:38 KST]** `work_history/4-user-auth-and-client-key-verification.md` 초기화.
3. **[2026-11-10 13:39 KST]** 중앙 서버 인증 유틸리티 및 API 라우트 구현:
   - `server/src/lib/auth.ts`: 비밀번호 해싱(`scrypt`), HMAC 세션 토큰 발행/검증, 클라이언트 키 인증 헬퍼
   - `server/src/app/api/auth/register/route.ts`: 회원가입 API (고유 키 `gta_live_...` 자동 발급)
   - `server/src/app/api/auth/login/route.ts`: 로그인 API
   - `server/src/app/api/auth/client-key/route.ts`: 현재 인증 키 조회 및 새 키 재발급(Rotate) API
   - `server/src/app/api/auth/verify-key/route.ts`: 클라이언트 인증 키 검증 엔드포인트 (200 / 401 반환)
4. **[2026-11-10 13:49 KST]** 중앙 서버 웹 화면(`server/src/app/page.tsx`) 구축:
   - 로그인 / 회원가입 전환 폼
   - 로그인 후 대시보드: 환영 메시지, 클라이언트 설치/실행 가이드, 인증 키 표시/숨김/복사 및 [키 재발급(Rotate)] 버튼
5. **[2026-11-10 13:51 KST]** 서버 단위/통합 테스트 작성 (`server/test/auth.test.ts`):
   - 비밀번호 해싱, 세션 토큰, 회원가입, 로그인, 인증 키 회전, 401/200 검증 6/6 통과 (총 10개 테스트 통과).
6. **[2026-11-10 13:52 KST]** 클라이언트 연동 모듈 및 API 구현:
   - `client/src/lib/server-api.ts`: `verifyServerKey`, `fetchWithServerAuth` (401 감지 시 `UnauthorizedError` throw)
   - `client/src/app/api/auth/status/route.ts`: 로컬 인증 상태 및 서버 연결 상태 조회 API
   - `client/src/app/api/settings/route.ts`: 서버 주소 및 인증 키 저장/검증 API (로컬 스냅샷/토론 데이터 불변 보존)
7. **[2026-11-10 13:53 KST]** 클라이언트 웹 화면(`client/src/app/page.tsx`) 구축:
   - 미인증 시 중앙 서버 인증 게이트 화면 표시 (중앙 서버 가이드, 인증키 입력 및 즉시 검증)
   - 401 만료 알림 배너 및 설정 화면 자동 유도
   - Settings 탭: 인증 키 변경 및 로컬 데이터 통계(스냅샷, 토론 세션, 아카이브 수) 실시간 대시보드
8. **[2026-11-10 13:54 KST]** 클라이언트 통합 테스트 작성 (`client/test/auth-integration.test.ts`):
   - 401 감지 테스트 통과
   - **인증 키를 새 키로 변경하더라도 기존 `local_snapshots`, `discussion_sessions`, `local_archives` 데이터가 100% 온전히 유지됨을 단언문(assert)으로 엄격 검증 완료**
9. **[2026-11-10 13:55 KST]** 전체 24개 테스트 100% 통과 (server 10개, client 14개) 및 Next.js 양측 프로덕션 빌드 성공 확인.
