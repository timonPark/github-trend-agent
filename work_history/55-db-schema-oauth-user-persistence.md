# Work History: #55 db-schema-oauth-user-persistence: 서버 DB users 계정 테이블 스키마 확장(email, oauth_provider, oauth_id) 및 소셜 계정 영속화 구현

## 1. 개요
- **이슈**: [#55](https://github.com/timonPark/github-trend-agent/issues/55) (Part of [#49](https://github.com/timonPark/github-trend-agent/issues/49))
- **작업 목적**:
  - 일반 회원가입 사용자뿐만 아니라 4대 소셜 로그인(GitHub, Google, Kakao, Naver)으로 가입한 사용자도 중앙 서버 DB의 동일한 `users` 단일 계정 테이블에 정상 영속화되도록 DB 스키마 및 데이터베이스 어댑터(`ServerDatabase`)를 확장합니다.
  - 소셜 제공자 고유 식별자(`oauth_provider`, `oauth_id`), 이메일(`email`), 약관 동의 일시(`terms_agreed_at`) 컬럼을 추가하고, 소셜 계정 조회(`findUserByOAuth`), 이메일 조회(`findUserByEmail`), 소셜 계정 생성(`createOAuthUser`) 메서드를 구현합니다.

## 2. 작업 상세 내용
1. **타입 정의 확장 (`server/src/lib/types.ts`)**:
   - `OAuthProvider` 유니온 타입 신설 (`'github' | 'google' | 'kakao' | 'naver' | 'local'`)
   - `User` 인터페이스 확장: `password_hash`를 nullable(`string | null | undefined`)로 변경하고, `email`, `oauth_provider`, `oauth_id`, `terms_agreed_at` 필드 추가
   - `CreateOAuthUserParams` 인터페이스 신설
2. **데이터베이스 어댑터 구현 (`server/src/lib/db.ts`)**:
   - `ServerDatabase` 인터페이스에 `createOAuthUser`, `findUserByOAuth`, `findUserByEmail` 메서드 추가 및 `createUser`에 선택적 `email`, `terms_agreed_at` 지원
   - `MemoryServerDatabase`:
     - `createOAuthUser`: 사용자명 중복 방지, `(oauth_provider, oauth_id)` 중복 방지, `client_auth_key` 자동 발급, 메모리 맵 및 `local-server-db.json` 동기화
     - `findUserByOAuth`: 공급자 및 소셜 ID 기반 계정 검색
     - `findUserByEmail`: 대소문자 무관(case-insensitive) 이메일 검색
   - `SupabaseServerDatabase`:
     - Supabase PostgreSQL `users` 테이블 대상 insert/select 쿼리 구현
   - 모든 함수 20줄 이내(Extract Function) 및 100% 명시적 타이핑 준수
3. **Supabase PostgreSQL 스키마 최신화 (`server/supabase/schema.sql`)**:
   - `users` 테이블에 `password_hash` nullable 처리, `email text`, `oauth_provider text`, `oauth_id text`, `terms_agreed_at timestamptz` 컬럼 추가
   - `uq_users_oauth` 복합 고유 제약(`unique (oauth_provider, oauth_id)`) 및 `idx_users_email`, `idx_users_oauth` 인덱스 생성
4. **기존 API 방어 보강 (`server/src/app/api/auth/login/route.ts`)**:
   - 비밀번호 없는 소셜 사용자의 일반 로그인 시도 시 안전하게 401 처리하는 가드 추가
5. **README.md 문서 최신화**:
   - 4.1 중앙 서버 ERD 및 테이블 명세표에 새로 추가된 컬럼 및 고유 제약 반영

## 3. 검증 결과
- **단위 테스트**: 110개 테스트 전체 통과 (`npm run test`)
  - `persists OAuth users with null password_hash and generated client_auth_key` 통과
  - `prevents duplicate oauth identities and duplicate usernames` 통과
  - `finds users by email case-insensitively for both regular and oauth users` 통과
  - `counts both regular users and oauth users in single users table` 통과
- **프로덕션 빌드**: Client 및 Server Next.js 프로덕션 빌드 성공 (`npm run build`)

## 4. 완료 상태
- **Pull Request**: [#60](https://github.com/timonPark/github-trend-agent/pull/60) (스쿼시 머지 완료)
- **작업 브랜치**: `55-db-schema-oauth-user-persistence` (삭제 완료)
- **이슈 상태**: [#55](https://github.com/timonPark/github-trend-agent/issues/55) Closed
- **완료 일시**: 2026-11-11 16:51 (KST)
