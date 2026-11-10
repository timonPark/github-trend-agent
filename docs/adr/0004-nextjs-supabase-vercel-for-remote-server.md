# Next.js, Supabase, and Vercel for Remote Server

중앙 서버(`server/`)는 별도의 무거운 백엔드 인프라를 운영하는 대신 Next.js, Supabase(PostgreSQL 및 Auth), Vercel 배포 조합을 채택합니다. 중앙 서버의 역할이 계정별 인증과 일일 스냅샷 및 토론 아카이브 데이터의 저장·조회로 명확히 한정되어 있으므로, 서버리스 환경과 BaaS를 활용해 최소한의 운영 비용과 높은 생산성으로 가볍게 구성하기 위함입니다.
