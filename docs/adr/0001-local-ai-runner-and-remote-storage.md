# Local AI Runner and Remote Storage & Web Portal Split

AI 추론, 헤드리스 스크래핑 및 에이전트 실시간 토론 워크로드를 사용자의 로컬 클라이언트 워크스페이스(`client/`)에서 실행하고, 중앙 서버(`server/`)는 계정별 데이터 동기화·영속화 API와 누구나 수집된 스냅샷(`Snapshot Explorer`) 및 공개 토론 인사이트(`Public Discussion Feed`)를 열람할 수 있는 공개 웹 포털 UI를 담당하도록 분리합니다. 사용자 각자의 구독 AI 모델(또는 개인 API 키)을 로컬에서 실행하여 중앙 서버의 LLM 비용 부담과 헤드리스 브라우저 리소스 부하를 원천 차단하면서도, 중앙 웹 포털을 통해 일일 트렌딩 지식과 AI 토론 아카이브를 언제 어디서나 탐색·공유할 수 있도록 하기 위함입니다.
