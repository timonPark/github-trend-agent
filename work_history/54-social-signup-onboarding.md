# Work History: #54 소셜 최초 가입 시 추가 정보 입력 화면(온보딩) 구현

## 작업 개요
- **Issue**: #54 (부모 Epic: #49 사용자 계정 인증 고도화)
- **목표**:
  1. 소셜 로그인(GitHub, Google, Kakao, Naver) 최초 로그인 시 즉시 계정을 생성하지 않고, 온보딩 서명 토큰 발급 및 온보딩 화면(`/oauth/onboarding`)으로 리다이렉트.
  2. 닉네임 유일성 검증 API(`GET /api/auth/check-username`) 및 프론트 실시간 중복 확인 구현.
  3. 온보딩 완료 API(`POST /api/auth/oauth/onboarding`)를 통해 최종 소셜 유저 영속화 및 `Client Auth Key` 발급.
  4. 온보딩 화면(`/oauth/onboarding`): 제공자 이메일 기본값 표시, 사용자 수정/기재 가능, 닉네임 중복 체크, 약관 동의, 팝업 및 독립 웹 페이지 동시 지원.
  5. 엄격한 TDD(단위 테스트) 및 전체 테스트 스위트, 프로덕션 빌드 성공.
- **상태**: 완료 (Merged into main via PR #65, Epic #49 Completed)
- **작업 시작**: 2026-11-12
- **작업 완료**: 2026-11-12 17:35 KST

---

## 주요 구현 내용

### 1. 온보딩 서명 토큰 유틸리티 (`server/src/lib/auth.ts`)
- `createOAuthOnboardingToken(ticket: OAuthOnboardingTicket): string`:
  - HMAC-SHA256 서명 토큰 발급, `type: 'oauth_onboarding'`, 30분 유효기간.
  - 소셜 제공자(`provider`), 고유 식별자(`oauth_id`), 추천 닉네임(`suggested_username`), 소셜 이메일(`email`)을 서명 보증.
- `verifyOAuthOnboardingToken(token: string): OAuthOnboardingTicket | null`:
  - 서명 일치 여부, 타입 클레임, 만료 시간 엄격 검증. 위변조 토큰 즉시 차단.

### 2. 닉네임 중복 검사 API (`server/src/app/api/auth/check-username/route.ts`)
- `GET /api/auth/check-username?username=...`:
  - 영숫자, 밑줄(_), 하이픈(-), 3~30자 포맷 유효성 검사 (실패 시 400).
  - DB `findUserByUsername` 조회를 통해 실시간 사용 가능 여부 판별 (`available: boolean`).

### 3. 소셜 인증 콜백 분기 (`server/src/app/api/auth/oauth/[provider]/callback/route.ts`)
- 기존 유저: `findUserByOAuth` 결과 존재 시 즉시 세션 쿠키(`gta_session`) 발급 및 로그인 완료(`buildSuccessHtml`).
- 신규 유저: 유저 레코드를 임의 생성하지 않고, 온보딩 서명 토큰을 포함하여 `/oauth/onboarding?token=...` 화면으로 302 리다이렉트.

### 4. 온보딩 완료 API (`server/src/app/api/auth/oauth/onboarding/route.ts`)
- `POST /api/auth/oauth/onboarding`:
  - 온보딩 서명 토큰 검증, 약관 동의 검증, 닉네임 중복 검증.
  - `db.createOAuthUser`를 호출하여 중앙 서버 단일 `users` 테이블에 계정 생성 및 `client_auth_key` 발급.
  - 세션 토큰 발행 및 `gta_session` 쿠키 설정.

### 5. 온보딩 화면 구축 (`server/src/app/oauth/onboarding/page.tsx`)
- 토큰 페이로드 디코딩을 통한 소셜 이메일 및 추천 닉네임 자동 채움.
- 닉네임 중복 확인 인터랙션 및 실시간 성공/에러 상태 피드백 표시.
- 서비스 이용약관 및 개인정보 수집·이용 동의 연동 (`TermsAgreementGroup`, `TermsModal`).
- 팝업 OAuth 창일 경우 `window.opener.postMessage({ type: 'GTA_OAUTH_SUCCESS', user, token })` 전송 후 닫기, 직접 웹 창일 경우 키 센터(`/keys`)로 라우팅.

---

## TDD 사이클 및 검증 결과

1. **Red**:
   - `server/test/oauth-onboarding.test.ts` 작성 후 실행 (라우트 미존재 및 미구현으로 실패 확인).
2. **Green**:
   - 토큰 유틸리티, 닉네임 검사 API, 온보딩 완료 API, 콜백 분기, 온보딩 화면 구현으로 10개 신설 테스트 통과.
3. **Refactor & 호환성 검증**:
   - 기존 소셜 테스트(`oauth-github-google.test.ts`, `oauth-kakao-naver.test.ts`)의 콜백 케이스를 신규/기존 유저 스펙에 맞게 정돈.
   - 전체 테스트 스위트: 총 151개 테스트 (Server 72개 + Client 79개) 100% 통과 (`npm run test`).
   - 프로덕션 빌드: 정적 페이지 생성 및 Next.js 타입체크 100% 성공 (`npm run build`).
