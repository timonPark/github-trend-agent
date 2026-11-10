# GitHub Trend Agent

일일 GitHub 트렌딩 저장소를 탐색하고, AI 에이전트와의 토론을 통해 도출된 인사이트를 개인화하여 아카이빙하는 시스템.

## Language

**Daily Trending Snapshot**:
매일 자정(00:00)을 기준으로 당일 최초 조회 시 1회 생성되어 모든 사용자에게 공통 제공되는 상위 10개 Trending Repository 및 Repository Digest 컬렉션.
_Avoid_: Daily List, Top 10 Batch, Crawl Job

**Trending Repository**:
GitHub 일간 트렌딩에서 당일 스타 급상승 상위 10위 내에 선정된 오픈소스 저장소.
_Avoid_: Star Project, Git Ranking, Top Repo

**Repository Digest**:
수집된 저장소의 목적, 주요 기능 및 기술적 가치를 간결하게 분석·정리한 초기 요약본.
_Avoid_: Repo Brief, Overview, Repo Summary

**Discussion Session**:
웹 화면에서 특정 Trending Repository를 주제로 사용자와 Local AI Agent가 실시간으로 대화를 주고받는 채팅 세션.
_Avoid_: Prompt Run, Single Query

**Discussion Archive**:
Discussion Session을 통해 도출된 결론 및 인사이트를 Repository Digest와 결합하여 영구 보존하는 통합 기록물.
_Avoid_: History, Log, Saved Note

**User**:
시스템에 인증하여 자신만의 AI 설정을 관리하고 Discussion Archive를 축적하는 개인 주체.
_Avoid_: Account, Member, Client

**Local AI Agent**:
사용자가 자신의 로컬 클라이언트에 AI 구독(CLI) 또는 API를 연동하여 활성화한 AI 실행 주체로, 연동된 사용자만 AI 에이전트 기능(요약 생성 및 토론)을 사용할 수 있음.
_Avoid_: AI Bot, Remote LLM, Cloud Agent
