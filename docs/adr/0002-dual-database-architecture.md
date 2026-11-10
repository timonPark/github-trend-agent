# Dual Database Architecture and Shared Daily Snapshot Caching

중앙 서버의 메인 데이터베이스 외에 클라이언트(로컬 서버)에도 경량 데이터베이스를 둡니다. 당일(00:00 기준) 최초로 조회한 클라이언트가 생성한 `Daily Trending Snapshot`과 `Repository Digest`를 중앙 서버 DB에 저장하여 이후 접속하는 모든 클라이언트가 중복 크롤링·요약 없이 내려받아 자신의 로컬 DB에 캐싱해 사용하도록 하고, 개별 사용자의 `Discussion Session` 진행 상태는 로컬 DB에서 관리한 뒤 최종 정리된 `Discussion Archive`를 계정별로 중앙 서버 DB에 영구 보존하기 위함입니다.
