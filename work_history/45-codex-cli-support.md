# Work History: #45 fix: 로컬 OpenAI CLI 연동을 위한 Codex CLI(codex exec) 감지 및 실행기 지원

## 1. 개요
- **이슈**: [#45](https://github.com/timonPark/github-trend-agent/issues/45)
- **작업 내용**:
  1. 로컬 환경에 설치된 ChatGPT 데스크톱 공식 CLI인 `codex`(`/Applications/ChatGPT.app/.../bin/codex`)를 주 탐색 대상으로 지정
  2. `OpenaiCliAdapter`에서 `codex` 감지 시 `codex exec --skip-git-repo-check --ephemeral` 인자를 빌드하여 비대화형 헤드리스 실행 지원
  3. UI 설정 탭의 드롭다운 명칭을 `OpenAI / Codex CLI (Headless Local)`로 갱신
  4. 테스트 코드의 명칭 assertion 동기화

## 2. 변경된 파일 목록
- `client/src/lib/ai/detector.ts`: `codex`를 주 명령어로 지정 및 fallback `openai` 유지
- `client/src/lib/ai/adapters/openai-cli.ts`: `codex` 우선 탐색 및 `codex exec` 인자 빌드
- `client/src/components/SettingsTab.tsx`: 드롭다운 옵션 레이블 업데이트
- `client/test/ai-runner.test.ts`: 단위 테스트 assertion 업데이트

## 3. 검증 결과
- **로컬 CLI 실행 검증**: `codex exec --skip-git-repo-check --ephemeral "say hello in one word"` 실제 호출 성공 (OpenAI Codex v0.167.0-alpha.3.2)
- **단위 테스트**: 104개 전체 통과 (`npm run test`)
- **프로덕션 빌드**: Client 및 Server Next.js 빌드 성공 (`npm run build`)
- **코드 품질**: 모든 함수 20줄 이내 및 100% 명시적 타이핑 준수
