# AGENTS.md

Behavioral guidelines and workflow rules for `github-trend-agent`.

---

## Part 1. Behavioral Guidelines (Karpathy Principles)

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**
- When editing existing code, match existing style and avoid modifying adjacent unrelated code, comments, or formatting.
- Remove imports/variables/functions that YOUR changes made unused.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**
- Transform tasks into verifiable goals:
  ```
  1. [Step] → verify: [check]
  2. [Step] → verify: [check]
  ```

---

## Part 2. Issue-Driven Workflow & Work History Rules

이 프로젝트의 모든 개발 작업은 반드시 다음 5단계 절차를 준수하여 진행합니다. (GitHub 계정은 개인 계정인 `timonPark`을 사용합니다.)

1. **GitHub 이슈 기반 작업**:
   - 모든 작업은 GitHub 저장소(`timonPark/github-trend-agent`)에 등록된 이슈를 기반으로 시작합니다.
2. **작업 브랜치 생성**:
   - 이슈 작업을 시작할 때 반드시 `{이슈번호}-{이슈내용}` 형식(예: `1-setup-monorepo-structure`)으로 브랜치를 생성하여 진행합니다.
3. **`work_history/` 실시간 기록 및 상태 관리**:
   - `work_history/` 폴더 안에 해당 작업의 마크다운 파일(예: `work_history/{이슈번호}-{이슈내용}.md`)을 생성합니다.
   - 작업을 진행할 때마다 진행 내역과 변경 사항을 실시간으로 업데이트합니다.
   - 작업이 완료되면 문서 내 **최종 완료일시**를 기록하고 **상태를 `완료`로 변경**합니다.
4. **PR 생성 및 사용자 승인 게이트**:
   - 작업이 완료되면 `commit → push → PR 생성`까지 진행합니다.
   - **PR 머지는 반드시 사용자의 명시적인 승인을 받은 후에만 수행합니다.** (임의 자동 머지 금지)
5. **머지 후 최종 정리 (Post-Merge Cleanup)**:
   - 사용자의 승인을 받아 PR이 머지되면:
     1) 해당 GitHub 이슈를 정리(Close)합니다.
     2) 작업에 사용한 브랜치(로컬 및 원격)를 삭제합니다.
     3) 최종적으로 `work_history/` 안의 마크다운 문서까지 작성 완료 상태를 확정 반영합니다.

---

## Part 3. Skill-Driven Engineering (`/Users/2309-n0018/study/mattpocock-skills`)

작업의 성격에 따라 `/Users/2309-n0018/study/mattpocock-skills` (및 전역 설치된 `~/.claude/skills/`)의 스킬 가이드를 참고하여 진행합니다:

- **새 애플리케이션 / 신규 기능 추가**: `/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement` (`tdd` 적용)
- **버그 수정**: `diagnosing-bugs` (재현 → 가설 → 수정 게이트) → `tdd` (회귀 테스트 고정) → `code-review` → `pr`
- **리팩토링 / 아키텍처 개선**: `/improve-codebase-architecture` → `grilling` → `codebase-design` → `tdd`
- **코드 리뷰 및 PR 생성**: `/code-review` (Standards 축 + Spec 축 병렬 검증) → `pr`
- **조사 / 프로토타입 / 세션 회고**: `research`, `prototype`, `/retro`
- 흐름 선택 상세 문서: [`/Users/2309-n0018/study/mattpocock-skills/README.md`](file:///Users/2309-n0018/study/mattpocock-skills/README.md) 및 [`skill-chain-flows.md`](file:///Users/2309-n0018/study/mattpocock-skills/skill-chain-flows.md)

## Agent skills

### Issue tracker

이슈는 이 레포의 GitHub Issues(`timonPark/github-trend-agent`)에서 추적됩니다. `docs/agents/issue-tracker.md` 참조.

### Domain docs

단일 컨텍스트(루트 `GLOSSARY.md` + `docs/adr/`). `docs/agents/domain.md` 참조.
