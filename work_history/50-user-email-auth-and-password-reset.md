# Work History: #50 일반 회원가입 이메일 필수화 및 이메일 기반 비밀번호 재설정 구현

## 작업 개요
- **Issue**: #50 (부모 Epic: #49 사용자 계정 인증 고도화)
- **목표**:
  1. 일반 회원가입(`POST /api/auth/register`) 시 `email` 필수 입력, 정규식 포맷 검증 및 중복 가입 방지 (400 / 409).
  2. 비밀번호 재설정 토큰 발급 API(`POST /api/auth/forgot-password`) 및 검증·변경 API(`POST /api/auth/reset-password`) 구현.
  3. `AuthModal`에 이메일 입력 필드 및 "비밀번호 찾기" 링크/뷰 연동.
  4. 독립된 웹 비밀번호 재설정 페이지(`/forgot-password`) 제공.
  5. 단위 테스트 작성 및 전 수트 검증 (총 121개 테스트 통과).

---

## 주요 구현 내용

### 1. 비밀번호 재설정 서명 토큰 및 암호화 유틸리티 (`server/src/lib/auth.ts`)
- `createPasswordResetToken(userId: string, email: string): string`
  - 서버 시크릿(`SESSION_SECRET`) 기반 HMAC-SHA256 서명 토큰 발급.
  - 1시간 유효 만료 시간(`exp`) 및 고유 `type: 'password_reset'` 클레임 부여로 일반 세션 토큰과의 오용 방지.
- `verifyPasswordResetToken(token: string): { userId: string; email: string } | null`
  - 토큰 변조, 만료, 서명 불일치 엄격 검증.

### 2. DB 어댑터 비밀번호 갱신 메서드 확장 (`server/src/lib/db.ts`)
- `updateUserPassword(userId: string, passwordHash: string): Promise<User>`
  - `ServerDatabase` 인터페이스 명세화.
  - `MemoryServerDatabase`: 인메모리 유저 레코드 패스워드 해시 갱신.
  - `SupabaseServerDatabase`: PostgreSQL `users` 테이블 `update` 쿼리 실행.

### 3. 인증 DTO 확장 (`server/src/lib/types/api.ts`)
- `RegisterRequestDto`: `email?: string` 추가.
- `ForgotPasswordRequestDto`, `ForgotPasswordResponseDto`: 비밀번호 찾기 요청/응답 DTO 신설 (`reset_url` 포함).
- `ResetPasswordRequestDto`, `ResetPasswordResponseDto`: 비밀번호 재설정 요청/응답 DTO 신설.

### 4. API 엔드포인트 구현 및 확장
- `server/src/app/api/auth/register/route.ts`:
  - `EMAIL_REGEX`(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) 포맷 검증.
  - `findUserByEmail`을 통한 중복 이메일 체크 (409 에러 반환).
- `server/src/app/api/auth/forgot-password/route.ts`:
  - 이메일 기반 사용자 조회 및 서명 토큰(`reset_token`) 및 재설정 URL(`reset_url`) 생성.
  - 존재하지 않는 이메일이라도 이메일 열거 공격(Email Enumeration) 방지를 위해 통일된 보안 안내 메시지 반환.
- `server/src/app/api/auth/reset-password/route.ts`:
  - 서명 토큰 검증 후 6자리 이상 신규 비밀번호 해싱 및 `db.updateUserPassword` 영속화.

### 5. UI 화면 및 컴포넌트 연동
- `server/src/components/ForgotPasswordView.tsx`:
  - 1단계: 가입 이메일 입력 및 재설정 링크/토큰 발급.
  - 2단계: 토큰 입력 및 새 비밀번호 입력 완료 뷰.
- `server/src/app/forgot-password/page.tsx`:
  - 쿼리 파라미터(`?token=...`) 자동 바인딩을 지원하는 독립된 반응형 비밀번호 재설정 웹 페이지.
- `server/src/components/AuthModal.tsx`:
  - 회원가입 탭에 이메일 필드 추가.
  - 로그인 탭에 "비밀번호를 잊으셨나요?" 링크 추가 및 탭 전환 연동.

---

## 테스트 및 검증 결과
- **단위 테스트 (`server/test/password-reset.test.ts`)**:
  - 비밀번호 재설정 토큰 서명 및 변조 차단 검증.
  - 이메일 미등록/등록별 `forgot-password` 응답 검증.
  - 유효한 토큰을 통한 비밀번호 변경 및 이전 비밀번호 로그인 실패(401), 새 비밀번호 로그인 성공(200) 검증.
- **기존 테스트 보강 (`server/test/auth.test.ts`, `server/test/terms.test.ts`)**:
  - 이메일 필드 및 중복 이메일 가입 차단 테스트 케이스 보강.
- **전체 단위 테스트**:
  - Client: 12개 파일, 79개 테스트 통과.
  - Server: 10개 파일, 42개 테스트 통과.
  - **총 121개 테스트 통과 (100% Pass)**.
- **프로덕션 빌드 (`npm run build`)**:
  - Client / Server 모두 Next.js 15.5.29 최적화 빌드 및 정적/동적 라우트 검증 통과.
