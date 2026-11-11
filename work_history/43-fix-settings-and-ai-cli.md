# Work History: #43 fix: 클라이언트 설정 화면 키 미표시 수정 및 로컬 AI CLI(Gemini agy / OpenAI 헤드리스) 연동 지원

## 1. 개요
- **이슈**: [#43](https://github.com/timonPark/github-trend-agent/issues/43)
- **작업 내용**:
  1. 설정 탭 내 `server_auth_key` vs `client_auth_key` 필드명 불일치로 인한 Client Auth Key 미표시 버그 수정 및 prop 동기화 `useEffect` 보강
  2. Google Gemini CLI 감지 및 실행기에 로컬 설치된 `agy`(`/opt/homebrew/bin/agy`) 바이너리 자동 탐색 및 fallback 지원
  3. OpenAI 헤드리스 CLI(`cli-openai`) 프로바이더 타입, 어댑터, 팩토리, 설정 드롭다운 옵션 및 감지 지원 추가

## 2. 변경된 파일 목록
- `client/src/lib/ai/types.ts`: `AiProviderType`에 `cli-openai` 추가, `DetectedCli['id']`에 `openai` 추가
- `client/src/lib/ai/detector.ts`: `agy` 대체 명령어 탐색 및 `openai` CLI 감지 지원 (모든 함수 20줄 이내 리팩토링)
- `client/src/lib/ai/adapters/gemini-cli.ts`: `agy` 로컬 바이너리 우선 탐색 및 fallback 추가
- `client/src/lib/ai/adapters/openai-cli.ts`: 신규 OpenAI CLI 헤드리스 어댑터 구현
- `client/src/lib/ai/factory.ts`: `cli-openai` 분기 매핑
- `client/src/app/api/settings/route.ts`: GET/POST의 `client_auth_key` 및 `server_auth_key` 양방향 호환 지원
- `client/src/app/page.tsx`: 설정 API 응답에서 `client_auth_key || server_auth_key` 추출
- `client/src/components/SettingsTab.tsx`: prop 변경 시 `useEffect` 동기화 및 `cli-openai` 드롭다운 옵션 추가
- `client/test/auth-integration.test.ts`: 설정 API 양방향 키 지원 검증 테스트 추가
- `client/test/ai-runner.test.ts`: agy 감지, openai CLI 감지 및 어댑터 생성 단위 테스트 추가

## 3. 검증 결과
- **단위 테스트**: 전체 104개 테스트 100% 통과 (Client 77개, Server 27개)
- **프로덕션 빌드**: `npm run build` 클라이언트 및 서버 모두 성공
- **코드 품질**: 모든 함수 20줄 이내, 100% 명시적 타이핑 준수
