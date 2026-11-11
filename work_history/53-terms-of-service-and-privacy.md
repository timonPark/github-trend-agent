# Work History: #53 terms-of-service-and-privacy: 회원가입 시 서비스 이용약관 및 개인정보 수집·이용 동의 기능 추가

## 1. 개요
- **이슈**: [#53](https://github.com/timonPark/github-trend-agent/issues/53) (Part of [#49](https://github.com/timonPark/github-trend-agent/issues/49))
- **작업 목적**:
  - 일반 회원가입 및 향후 소셜 신규 온보딩 시 사용자가 서비스 이용 규정과 개인정보 수집 내역을 명확히 인지하고 동의할 수 있도록 '서비스 이용약관(Terms of Service)'과 '개인정보 처리방침(Privacy Policy)' 동의 체크박스, 약관 전문 페이지(`/terms`, `/privacy`) 및 팝업 모달을 구축합니다.
  - 필수 약관 미동의 시 가입이 차단되며, 전체 동의 시 유저 DB의 `terms_agreed_at` 컬럼에 동의 일시를 영구 기록합니다.

## 2. 작업 상세 내용
1. **약관 데이터 모듈 신설 (`server/src/lib/terms-content.ts`)**:
   - `TERMS_OF_SERVICE`: 서비스 목적, 계정/키 관리 책임, 로컬 AI 에이전트 연동 책임, 공개 AI 토론 아카이브 운영 정책 등 5개 조항 정의
   - `PRIVACY_POLICY`: 수집 항목, 수집 및 이용 목적, 보유/이용 기간, 안전성 확보 조치 등 5개 조항 정의
   - `getTermsOfServiceContent()`, `getPrivacyPolicyContent()` 헬퍼 함수 제공
2. **약관 전문 독립 페이지 구축**:
   - `server/src/app/terms/page.tsx`: `/terms` 서비스 이용약관 전문 뷰
   - `server/src/app/privacy/page.tsx`: `/privacy` 개인정보 처리방침 전문 뷰
3. **약관 UI 컴포넌트 구현**:
   - `server/src/components/TermsModal.tsx`: 모달 내에서 약관 전문을 바로 확인할 수 있는 팝업 모달
   - `server/src/components/TermsAgreementGroup.tsx`: '전체 동의', '[필수] 이용약관', '[필수] 개인정보' 체크박스 및 전문 보기 버튼을 제공하는 재사용 가능 컴포넌트
4. **회원가입 폼 통합 (`server/src/components/AuthModal.tsx`)**:
   - 회원가입 탭 시 `TermsAgreementGroup` 노출
   - 필수 약관 2개 모두 체크 시에만 가입 버튼 활성화(`isSubmitDisabled` 가드)
   - 약관 보기 클릭 시 `TermsModal` 팝업 연동
5. **백엔드 검증 및 영속화 (`server/src/app/api/auth/register/route.ts`)**:
   - `terms_agreed: true` 미전달 시 400 에러 및 경고 메시지 반환
   - 동의 확인 시 `terms_agreed_at` 타임스탬프를 생성하여 `db.createUser`를 통해 `users` 테이블에 영속화
6. **코드 품질 제약 준수**:
   - 모든 신규 및 수정 함수 20줄 이내(Extract Function) 적용
   - 100% 명시적 타이핑 준수

## 3. 검증 결과
- **단위 테스트**: 114개 테스트 전체 통과 (`npm run test`)
  - `server/test/terms.test.ts`: 약관 컨텐츠 구조, 약관 미동의 시 400 차단, 동의 시 `terms_agreed_at` DB 영속화 검증
  - `server/test/auth.test.ts`: 약관 필수화 반영 및 기존 인증 플로우 검증
- **프로덕션 빌드**: Client 및 Server Next.js 빌드 성공 (`/terms`, `/privacy` 정적 페이지 포함)

## 4. 완료 상태
- **Pull Request**: [#61](https://github.com/timonPark/github-trend-agent/pull/61) (스쿼시 머지 완료)
- **작업 브랜치**: `53-terms-of-service-and-privacy` (삭제 완료)
- **이슈 상태**: [#53](https://github.com/timonPark/github-trend-agent/issues/53) Closed
- **완료 일시**: 2026-11-11 17:03 (KST)
