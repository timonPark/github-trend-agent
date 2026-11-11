# Work History: #51 글로벌 소셜 로그인(GitHub & Google OAuth) 연동 및 Dev 시뮬레이터 지원

## 작업 개요
- **Issue**: #51 (부모 Epic: #49 사용자 계정 인증 고도화)
- **목표**:
  1. GitHub OAuth (`/api/auth/oauth/github`, `/callback`) 핸들러 및 인증 플로우 구현.
  2. Google OAuth (`/api/auth/oauth/google`, `/callback`) 핸들러 및 인증 플로우 구현.
  3. 소셜 인증 성공 시 계정 자동 생성(`createOAuthUser`) 및 기존 계정 연동(`findUserByOAuth`), 고유 `client_auth_key` 발급.
  4. 외부 API 키가 없는 로컬 개발/오프라인 환경에서도 원클릭으로 소셜 가입/로그인을 검증할 수 있는 Dev OAuth 시뮬레이터(`/auth/oauth-simulator`) 지원.
  5. `AuthModal`에 GitHub / Google 소셜 로그인 버튼 및 `postMessage` 팝업 수신 연동.
  6. 단위 테스트 작성 및 전 수트 검증 (총 130개 테스트 통과).

---

## 주요 구현 내용

### 1. OAuth 통합 모듈 (`server/src/lib/oauth.ts`)
- `OAuthProvider`: `'github' | 'google' | 'kakao' | 'naver'` (향후 국내 소셜 연동 확장성 확보).
- `isDevOAuthEnabled(provider)`: `GITHUB_CLIENT_ID` / `GOOGLE_CLIENT_ID` 부재 시 또는 개발 모드에서 자동 Mock 모드 전환.
- `getOAuthAuthorizeUrl(provider, state, redirectUri)`:
  - 프로덕션: 공식 인가 엔드포인트 URL 생성 (`scope=read:user,user:email` 또는 `openid profile email`).
  - 개발 환경: `/auth/oauth-simulator` 페이지로 연결.
- `exchangeOAuthCodeForProfile(provider, code, redirectUri)`:
  - 실제 토큰 교환 및 프로필(`id`, `username`, `email`) 획득.
  - `dev-mock-*` 코드 수신 시 가상 프로필 즉시 생성 반환.
- `getOrCreateOAuthUser(db, profile)`:
  - `findUserByOAuth(provider, id)`로 기존 유저 확인.
  - 신규 유저의 경우 `generateUniqueUsername`을 통해 중복 방지(`octocat_1` 등) 후 `createOAuthUser` 영속화.

### 2. OAuth API 엔드포인트
- `server/src/app/api/auth/oauth/[provider]/route.ts`:
  - `provider` 유효성 검증 (`github`, `google`).
  - CSRF 방지용 `state` 생성 및 `oauth_state` 쿠키 설정.
  - 인가 URL로 302 리다이렉트 (절대 URL 변환 처리).
- `server/src/app/api/auth/oauth/[provider]/callback/route.ts`:
  - 인가 코드 수신 ➔ 프로필 획득 ➔ 소셜 계정 생성/로그인 ➔ `createSessionToken` 발급.
  - `gta_session` HttpOnly 쿠키 설정.
  - 팝업 창 연동용 `postMessage({ type: 'GTA_OAUTH_SUCCESS', user, token })` HTML 응답.

### 3. Dev OAuth 시뮬레이터 (`server/src/app/auth/oauth-simulator/page.tsx`)
- Client ID/Secret 없이도 브라우저에서 버튼 클릭으로 원하는 닉네임의 GitHub/Google 소셜 로그인 완주 지원.
- `Suspense` 래핑을 통한 SSR 안전성 및 Next.js 정적 빌드 최적화.

### 4. UI 연동 (`server/src/components/AuthModal.tsx`)
- GitHub 및 Google 브랜드 스타일의 원클릭 소셜 로그인 버튼(`SocialAuthButtons`) 연동.
- `window.open` 팝업 방식으로 OAuth 플로우를 열고 부모 창에서 `message` 이벤트를 수신하여 매끄러운 자동 로그인 및 모달 닫기 지원.

---

## 테스트 및 검증 결과
- **단위 테스트 (`server/test/oauth-github-google.test.ts`)**:
  - Dev OAuth 감지 및 시뮬레이터 URL 생성 테스트.
  - Mock 인가 코드 ➔ 프로필 변환 테스트.
  - 신규 소셜 유저 생성 및 닉네임 충돌 자동 해결(`octocat_1`) 검증.
  - 기존 유저 재로그인 세션 유지 검증.
  - `GET /api/auth/oauth/github` 및 `GET /api/auth/oauth/google` 302 리다이렉트 검증.
  - GitHub/Google 콜백 라우트의 세션 쿠키 발급 및 토큰 유효성 검증.
- **전체 단위 테스트**:
  - Client: 12개 파일, 79개 테스트 통과.
  - Server: 11개 파일, 51개 테스트 통과.
  - **총 130개 테스트 ALL PASS (100%)**.
- **프로덕션 빌드 (`npm run build`)**:
  - Client / Server Next.js 15.5.29 빌드 성공.
