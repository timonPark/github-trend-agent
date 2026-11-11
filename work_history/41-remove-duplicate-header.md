# Issue #41: fix: 클라이언트 RootLayout 내 중복 Header 렌더링 제거

## 1. 개요
- **이슈 번호**: #41
- **브랜치**: `41-remove-duplicate-header`
- **목표**: `client/src/app/layout.tsx`에 중복 선언된 `<Header />` 컴포넌트를 제거하여 클라이언트 화면에 단 하나의 헤더만 노출되도록 정리.

## 2. 작업 내용
1. `client/src/app/layout.tsx`:
   - 불필요한 `<Header />` 렌더링 및 `import Header` 제거.
   - 단일 페이지(`page.tsx`)의 상태 연동 헤더만 단독으로 렌더링되도록 보장.
2. `client/src/app/page.tsx`:
   - `authStatus?.email` optional chaining 적용으로 타입 안정성 확보.
3. 검증:
   - 101개 전체 단위 테스트 통과 (`npm run test`)
   - Server & Client 프로덕션 빌드 성공 (`npm run build`)
