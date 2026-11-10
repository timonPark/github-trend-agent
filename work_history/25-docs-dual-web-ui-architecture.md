# Issue #25: 클라이언트 및 중앙 서버 웹 포털(Dual Web UI) 아키텍처 설계 문서 현행화

- **이슈 링크**: https://github.com/timonPark/github-trend-agent/issues/25
- **브랜치**: `25-docs-dual-web-ui-architecture`
- **상태**: 완료 (PR 승인 대기)
- **완료 일시**: 2026-11-10 16:32 (KST)

---

## 1. 작업 배경 및 목적
- 기존 아키텍처 다이어그램에는 클라이언트(`client/`)에만 웹 화면이 표현되어 있고 중앙 서버(`server/`)는 API 및 DB 스토리지로만 묘사되어 있었음.
- 사용자와의 설계 협의를 통해 **클라이언트 로컬 AI 워크스페이스(`client/`)**와 **중앙 서버 공개 웹 포털(`server/`)** 양쪽 모두 `@primer/primitives` 기반의 웹 UI를 제공하는 **Dual Web UI 아키텍처**로 화면 구성을 확정함.
- 이에 맞춰 아키텍처 문서(`README.md`, `GLOSSARY.md`, `docs/adr/`)와 열려 있는 GitHub 이슈(`#8` ~ `#15`)를 일괄 현행화함.

## 2. 주요 변경 사항
1. **GitHub 등록 이슈 현행화 (`#8`, `#9`, `#10`, `#11`, `#12`, `#13`, `#15`)**:
   - `#9`: 클라이언트 `TrendingDashboard` 고도화 + 중앙 서버 `@primer/primitives` 적용 및 `Dashboard`(플랫폼 통계/하이라이트), `SnapshotExplorer`(날짜별 TOP 10 및 Digest/README 열람) 웹 화면 구현으로 확장
   - `#11`: 토론 종료 아카이브 저장 시 공개 여부(`is_public: boolean`) 필드 및 상태 전환(`PATCH`) 동기화 명시
   - `#12`: 클라이언트 `LocalArchiveViewer`(공개/비공개 즉시 토글 포함) + 중앙 서버 4대 포털 탭(`Dashboard`, `SnapshotExplorer`, `PublicDiscussionFeed`, `Auth & KeyCenter`) 통합 완성으로 구체화
   - `#13`, `#15`: 상위 에픽 설명 및 하위 티켓 범위 동기화
2. **도메인 및 아키텍처 문서 업데이트**:
   - `README.md`: 시스템 아키텍처 Mermaid 다이어그램에 `Server Web Portal UI` 추가, 핵심 기능 5번(Dual Web UI) 신설, 기술 스택 표 업데이트
   - `GLOSSARY.md`: `Snapshot Explorer`, `Public Discussion Feed` 용어 추가 및 `Discussion Archive` 정의 보완
   - `docs/adr/0001-local-ai-runner-and-remote-storage.md` & `docs/adr/0004-nextjs-supabase-vercel-for-remote-server.md`: 중앙 서버의 공개 웹 포털 UI 역할 명시
