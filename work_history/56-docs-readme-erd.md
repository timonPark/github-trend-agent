# Work History: #56 docs: README.md에 Dual-DB 및 데이터베이스 개체 관계도(ERD) 다이어그램 추가

## 1. 개요
- **이슈**: [#56](https://github.com/timonPark/github-trend-agent/issues/56)
- **작업 목적**:
  - 프로젝트의 Dual-DB(중앙 서버 Supabase PostgreSQL + 클라이언트 로컬 SQLite) 아키텍처 및 각 데이터베이스의 테이블 개체 관계도(ERD), 조인 관계, 필드 상세 명세를 `README.md`에 추가하여 아키텍처 투명성과 개발 이해도를 극대화합니다.
- **작업 내용**:
  1. **중앙 서버 ERD (Supabase PostgreSQL)**:
     - `users`, `daily_snapshots`, `discussion_archives` 테이블 엔터티와 필드 타입, PK/FK/UK 제약 조건 시각화 (`erDiagram`)
     - 테이블 간 1:N 조인 관계 (`users.id` -> `discussion_archives.user_id`, `daily_snapshots.snapshot_date` -> `discussion_archives.snapshot_date`, `users.username` -> `daily_snapshots.created_by`) 명시
     - 컬럼별 상세 테이블 명세표 및 향후 Epic 6(#49) OAuth 확장 예정 필드 안내 노트 추가
  2. **클라이언트 로컬 ERD (SQLite)**:
     - `user_settings`, `local_snapshots`, `discussion_sessions`, `local_archives` 테이블 엔터티 및 필드 타입, PK/FK 시각화 (`erDiagram`)
     - 테이블 간 관계 (`local_snapshots` -> `local_archives`, `discussion_sessions` -> `local_archives`) 및 상세 테이블 명세표 작성
  3. **Dual-DB 동기화 매핑 및 데이터 흐름 다이어그램**:
     - 클라이언트 로컬 SQLite와 중앙 서버 PostgreSQL 간의 3개 동기화 채널(인증 검증, 일일 스냅샷 3단계 캐싱, 아카이브 영속화 및 공개 피드 반영) 시각화 (`flowchart LR`)
     - 동기화 동작 원리 및 비즈니스 규칙 테이블 정리
  4. **운영 문서 링크 추가**:
     - 4대 소셜 로그인 가이드 문서(`docs/oauth-provider-setup.md`) 링크 등록

## 2. 변경된 파일 목록
- `README.md`: `## 4. 데이터베이스 아키텍처 및 ERD (Dual-DB Model)` 섹션 신설 및 목차/참조 링크 업데이트
- `docs/oauth-provider-setup.md`: 소셜 로그인(OAuth) 4대 제공자 설정 가이드 문서 보존
- `work_history/56-docs-readme-erd.md`: 본 작업 내역 문서 신규 작성

## 3. 검증 결과
- **Markdown 문법 및 Mermaid 렌더링 검증**: GitHub Flavored Markdown 규격 및 표준 Mermaid `erDiagram`, `flowchart` 문법 검증 완료
- **기존 테스트 검증**: Client 및 Server 전체 단위 테스트 통과 유지
