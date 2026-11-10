# AGENTS.md

`github-trend-agent` 프로젝트의 엔지니어링 원칙, 행동 가이드라인, 작업 워크플로우 헌법입니다.
모든 에이전트와 기여자는 본 문서에 명시된 원칙을 예외 없이 준수해야 합니다.

---

## Part 1. 핵심 엔지니어링 & 개발 원칙 (Core Principles)

### 1. 선(先) 보고 및 협의 원칙
- **사전 승인 필수**: 임의로 코드를 대량 수정하거나 스킬/외부 도구를 무단 실행하지 않으며, **무엇을 어떤 구조로 작업할지 사용자에게 먼저 설명하고 협의한 후 착수**합니다.
- **불필요한 중단 금지**: 작업 범위와 방향이 합의된 후에는 사소한 질문이나 말대꾸로 진행을 끊지 않고 맡은 목표를 끝까지 완수합니다.
- **투명한 보고**: 문제나 실패가 발생했을 때 핑계를 대지 않고 사실 관계와 해결 대안을 명확히 보고합니다.

### 2. 엄격한 TDD (Test-Driven Development) 준수
- **구현 후 테스트 끼워맞추기(Test-After) 절대 금지**: 코드를 먼저 구현하고 사후에 구색 맞추기식 테스트를 작성하는 안티패턴을 금지합니다.
- **4단계 TDD 사이클 강제**:
  1. **Seam / Type 정의**: 인터페이스, DTO, 함수의 입출력 타입을 먼저 선언
  2. **Red**: 실패하는 단위/통합 테스트를 먼저 작성하고 실행하여 실패(Red)를 확인
  3. **Green**: 테스트를 통과시키는 최소한의 프로덕션 코드 구현
  4. **Refactor**: 테스트 통과 상태를 유지하며 중복 제거, 가독성 향상, 구조 개선
- **단위 테스트 독립성**: 파일/DB/네트워크 등 외부 의존성은 모의(Mock/Stub) 처리하여 빠르고 결정적인(Deterministic) 테스트를 보장합니다.

### 3. 엄격한 TypeScript 타입 시스템
- **`any` 타입 전면 금지**: `any` 키워드 사용을 일절 금지하며, 변수·함수 파라미터·반환값에 명시적 타입을 부여합니다.
- **모든 변수에 명시적 타입 선언 필수**:
  - `const`, `let` 선언 시 타입 추론에 의존하지 않고 명시적 타입 표기 (예: `const count: number = 0;`, `const res: Response = await fetch(...)`).
  - React `useState` 사용 시 제네릭 타입 표기 필수 (예: `useState<boolean>(false)`, `useState<string>('')`).
- **모든 함수에 명시적 반환 타입(Explicit Return Type) 선언 필수**:
  - 컴포넌트: `export default function Component(): React.JSX.Element`
  - 비동기 핸들러: `const handleSubmit = async (e: React.FormEvent): Promise<void> =>`
  - Next.js API Route: `export async function GET(req: Request): Promise<NextResponse<ApiResponse<T>>>`
  - 유틸리티/헬퍼: 일반 함수 및 화살표 함수 모두 반환 타입 누락 금지.
- **API Request/Response DTO 체계화**: 클라이언트-서버 간 주고받는 모든 데이터는 `ApiResponse<T>`, `VerifyKeyRequestDto`, `AiTestResponseDto` 등 명시적인 DTO 인터페이스를 선언하여 타입 검증을 거칩니다.
- **예외 처리 표준**: `catch (err: any)`를 금지하고 `catch (err: unknown)`을 사용하며, 타입 가드(`instanceof Error` 또는 에러 파서 헬퍼 `toErrorMessage`)를 통해 안전하게 메시지를 추출합니다.
- **느슨한 타입 지양**: 단순 `string` 대신 Union Literal(`'claude' | 'gemini' | 'ollama' | 'mock'`) 또는 Enum을 사용하여 유효한 값의 범위를 컴파일 타임에 제한합니다.

### 4. 단일 책임 원칙 (SRP) 및 모듈화 / 아키텍처
- **함수 비대화 금지**: 단일 함수는 50줄 이내로 유지하며 하나의 명확한 책임만 담당합니다.
- **어댑터 & 팩토리 패턴 필수 적용**: 다중 공급자(AI 엔진: Claude CLI, Gemini CLI, Ollama, API 등)를 다룰 때 수백 줄짜리 거대 if-else 분기 함수를 만들지 않고, 공급자별 `Adapter` 모듈과 이를 생성/반환하는 `Factory` 구조로 분리합니다.
- **UI 컴포넌트 세분화**: 화면 전체를 한 파일에 몰아넣는 몬스터 컴포넌트(150줄 초과) 작성을 금지하며, 단일 책임을 갖는 서브 컴포넌트(`AuthGate`, `TrendingDashboard`, `SettingsTab`, `ReadmeModal` 등)로 분해합니다.
- **관심사 분리 (SoC)**: UI 컴포넌트는 상태 렌더링에 집중하고, 비즈니스 로직과 API 호출은 `lib/` 또는 커스텀 훅으로 위임합니다.

---

## Part 2. Git & Issue 워크플로우 규정

이 프로젝트의 모든 작업은 GitHub 이슈(`timonPark/github-trend-agent`)와 연동하여 다음 절차를 엄격히 준수합니다.

1. **GitHub 이슈 기반 착수**:
   - 모든 작업은 승인된 GitHub 이슈를 기반으로 시작합니다.
2. **이슈 브랜치 생성**:
   - `{이슈번호}-{이슈내용}` 형식(예: `7-local-ai-agent-integration`)으로 브랜치를 분기합니다.
3. **`work_history/` 실시간 기록**:
   - `work_history/{이슈번호}-{이슈내용}.md` 문서를 생성하여 작업 내역과 의사결정을 실시간 기록합니다.
   - 작업 완료 시 최종 완료 일시를 기재하고 상태를 `완료`로 변경합니다.
4. **커밋 및 PR 규격**:
   - 모든 커밋 메시지 하단에 공동 작성자 트레일러를 포함합니다:
     ```
     Co-Authored-By: Gemini <176961590+gemini-code-assist[bot]@users.noreply.github.com>
     ```
   - 작업 완료 후 `git push` 및 PR을 생성합니다.
5. **PR 승인 게이트 (임의 머지 절대 금지)**:
   - **PR 생성 후 작업을 즉시 멈추고 사용자에게 PR 링크를 보고합니다.**
   - **사용자의 명시적인 승인 명령("머지해", "확인했으니 진행해" 등)을 받기 전에는 절대로 임의로 머지하지 않습니다.**
6. **머지 후 정리 (Post-Merge)**:
   - 승인 후 머지가 완료되면 이슈 Close, 원격/로컬 브랜치 삭제, 히스토리 최종 상태를 정리합니다.

---

## Part 3. 디자인 시스템 및 환경 가이드

- **디자인 시스템**: GitHub 공식 디자인 시스템 토큰인 **`@primer/primitives`** 패키지를 기반으로 스타일링합니다. (로컬 레퍼런스: `/Users/2309-n0018/Project/primer-primitives`)
- **터미널 실행 규칙**: 불필요한 보안 프롬프트 방지를 위해 복합 쉘 명령어(`&&`, `rm`, `mv` 등) 대신 내장 파일 도구를 우선 사용합니다.
- **Domain Docs**: 프로젝트 도메인 용어는 루트 `GLOSSARY.md` 및 `docs/adr/`를 단일 진실 공급원(SSOT)으로 유지합니다.
