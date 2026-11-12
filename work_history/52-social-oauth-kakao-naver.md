# Work History: #52 국내 소셜 로그인(Kakao & Naver OAuth) 연동 및 4대 소셜 통합 로그인 UI 구축

## 작업 개요
- **Issue**: #52 (부모 Epic: #49 사용자 계정 인증 고도화)
- **목표**:
  1. 국내 대표 소셜 서비스인 카카오(Kakao)와 네이버(Naver)의 OAuth 인증 플로우를 중앙 서버에 연동.
  2. 개발 모드 및 오프라인 환경을 위한 Kakao / Naver Dev 시뮬레이터 지원.
  3. 중앙 서버 로그인(`/login`), 회원가입(`/register`), 그리고 `AuthModal`에 GitHub, Google, Kakao, Naver 4대 소셜 로그인 버튼을 포함한 통합 UI 구축.
  4. 엄격한 TDD(단위 테스트) 및 전 수트 통과, 프로덕션 빌드 성공.
- **상태**: 완료 (Merged into main via PR #64)
- **작업 시작**: 2026-11-12
- **작업 완료**: 2026-11-12 17:18 KST

---

## 주요 구현 내용

### 1. OAuth 통합 모듈 확장 (`server/src/lib/oauth.ts`)
- **국내 제공자 지원**: `OAuthProvider`에 대응하여 `isDevOAuthEnabled`에 `kakao`, `naver` 환경 변수(`KAKAO_CLIENT_ID`, `NAVER_CLIENT_ID`) 감지 로직 추가.
- **인가 URL 생성 분리**: 단일 책임 원칙(SRP)과 함수 20줄 제한을 준수하기 위해 `getProductionAuthorizeUrl` 함수를 추출하여 Kakao(`kauth.kakao.com/oauth/authorize`), Naver(`nid.naver.com/oauth2.0/authorize`) 엔드포인트 URL 생성 로직을 체계화.
- **토큰 교환 & 프로필 수신 구현**:
  - `exchangeKakaoToken` & `fetchKakaoProfile`: 카카오 토큰 교환 및 사용자 프로필(`properties.nickname`, `kakao_account.email`) 파싱.
  - `exchangeNaverToken` & `fetchNaverProfile`: 네이버 토큰 교환 및 사용자 프로필(`response.nickname`, `response.email`) 파싱.
- **Dev 모의 프로필 지원**: `dev-mock-*` 코드 수신 시 가상 카카오/네이버 프로필 즉시 생성 및 반환.
- **단일 계정 테이블 영속화 연계**: `getOrCreateOAuthUser`를 통해 기존/신규 유저 자동 식별, 닉네임 중복 해소, `client_auth_key` 자동 발급.

### 2. OAuth API 엔드포인트 확장
- `server/src/app/api/auth/oauth/[provider]/route.ts`:
  - `SUPPORTED_PROVIDERS`에 `'kakao'`, `'naver'` 추가.
  - 유효성 검증, `oauth_state` CSRF 쿠키 설정 및 302 리다이렉트 지원.
- `server/src/app/api/auth/oauth/[provider]/callback/route.ts`:
  - 동일한 다이나믹 콜백 핸들러에서 Kakao, Naver 코드 교환 및 세션 쿠키(`gta_session`), `GTA_OAUTH_SUCCESS` 팝업 메시지 송출.

### 3. Dev OAuth 시뮬레이터 개선 (`server/src/app/auth/oauth-simulator/page.tsx`)
- Kakao(`dev-kakao-user`), Naver(`dev-naver-user`) 전용 기본 닉네임 및 표시명 헬퍼(`getDefaultUsername`, `getProviderDisplayName`) 추출.
- 외부 API 키 없는 로컬/오프라인 환경에서도 원클릭으로 4대 소셜 로그인 즉시 시뮬레이션 지원.

### 4. 4대 소셜 로그인 공통 컴포넌트 신설 (`server/src/components/SocialAuthButtons.tsx`)
- GitHub, Google, Kakao, Naver 4대 소셜 로그인 버튼을 독립된 모듈로 신설하여 중복 제거.
- Primer 디자인 시스템 토큰 및 각 소셜 공식 브랜드 가이드라인 준수:
  - GitHub: `#24292f`, `#ffffff`, Octocat SVG
  - Google: `#ffffff`, `#1f2328`, Google 4색 SVG
  - Kakao: `#FEE500`, `#191919`, Kakao 심볼 SVG
  - Naver: `#03C75A`, `#ffffff`, Naver N 심볼 SVG
- `openSocialLoginPopup(provider)` 헬퍼를 함께 제공하여 팝업 기반 인증 창 중앙 정렬 및 호출 일원화.

### 5. `AuthModal.tsx` 리팩토링
- 인라인으로 작성되어 있던 소셜 버튼 및 팝업 코드를 `SocialAuthButtons` 공통 컴포넌트로 교체하여 파일 크기 200줄 안팎으로 정돈.

### 6. 중앙 서버 전용 웹 페이지 구축
- `server/src/app/login/page.tsx`:
  - 독립된 로그인 페이지 제공. 4대 소셜 원클릭 로그인 + 아이디/비밀번호 폼 + 비밀번호 찾기 링크 연계.
- `server/src/app/register/page.tsx`:
  - 독립된 회원가입 페이지 제공. 4대 소셜 간편 가입 + 이메일/비밀번호 가입 폼 + 약관 동의 체크박스 및 모달 연계.

---

## TDD 사이클 및 검증 결과

1. **Red**:
   - `server/test/oauth-kakao-naver.test.ts` 작성 후 실행.
   - 인가 URL 미지원(`Unsupported OAuth provider: kakao`), 토큰 교환 미지원, API 라우트 400 반환 등 5개 실패 확인.
2. **Green**:
   - `oauth.ts`, 라우트 핸들러, 시뮬레이터, 소셜 버튼 컴포넌트 구현으로 11개 단위 테스트 전체 통과.
3. **Refactor & 전수 점검**:
   - `process.env` 복원 로직 안전화 및 함수 20줄 제한, 타입 명시 확인.
   - 전체 테스트 스위트: 총 141개 테스트 (Server 62개 + Client 79개) 100% 통과.
   - 프로덕션 빌드(`npm run build`): 정적 페이지 사전 렌더링 및 타입체크 100% 성공.
