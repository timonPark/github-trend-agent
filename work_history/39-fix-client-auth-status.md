# Issue #39: fix: 클라이언트 인증 상태 응답 규격(valid/authenticated) 불일치 수정

## 1. 개요
- **이슈 번호**: #39
- **브랜치**: `39-fix-client-auth-status`
- **목표**: 클라이언트 화면(`client/src/app/page.tsx`)과 인증 상태 API(`client/src/app/api/auth/status/route.ts`) 간의 필드명 불일치(`valid` vs `authenticated`)를 해결하여, 키 인증 완료 후 `AuthGate`가 정상 해제되고 대시보드가 렌더링되도록 수정.

## 2. 작업 내용
1. **TDD 테스트 작성 (Red -> Green)**:
   - `client/test/auth-integration.test.ts`에 `returns valid: true and configured: true matching UI AuthGate expectations (#39)` 테스트 케이스 추가.
   - Red 상태(AssertionError: expected undefined to be true) 확인 후 구현.
2. **API 응답 규격 보강 (Green)**:
   - `client/src/app/api/auth/status/route.ts`의 `AuthStatusPayload` 인터페이스 및 핸들러에 `valid`, `configured`, `authenticated` 필드 완전 일치 적용.
   - 모든 함수 20줄 이내 및 100% 명시적 타이핑 준수.
3. **프론트엔드 방어 코드 적용**:
   - `client/src/app/page.tsx`에서 `authStatus.valid || authStatus.authenticated` 양방향 체크 적용.
4. **품질 검증**:
   - 101개 전체 단위 테스트 100% 통과 (`npm run test`)
   - Server & Client 프로덕션 빌드 100% 성공 (`npm run build`)
