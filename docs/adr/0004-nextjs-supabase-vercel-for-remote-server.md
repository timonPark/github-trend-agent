# Next.js, @primer/primitives, Supabase, and Vercel for Remote Server

중앙 서버(`server/`)는 별도의 무거운 백엔드 인프라를 운영하는 대신 Next.js(App Router), `@primer/primitives` 디자인 시스템, Supabase(PostgreSQL 및 Auth), Vercel 배포 조합을 채택합니다. 중앙 서버는 로컬 클라이언트와의 데이터 동기화 API(인증 키 검증, 2차 일일 스냅샷 공유, 토론 아카이브 저장)뿐만 아니라, 일반 웹 방문자와 개발자가 접속하여 플랫폼 대시보드(`Dashboard`), 날짜별 일일 스냅샷 보관소(`SnapshotExplorer`), 공개 AI 토론 피드(`PublicDiscussionFeed`), 계정 및 클라이언트 연동 키 센터(`Auth & KeyCenter`)를 이용할 수 있는 공개 웹 포털 화면을 함께 제공합니다.
