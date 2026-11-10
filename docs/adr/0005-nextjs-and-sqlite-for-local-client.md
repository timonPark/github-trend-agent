# Next.js and SQLite for Local Client Server

사용자의 로컬 환경에서 구동되는 클라이언트(`client/`)는 Next.js(웹 화면 UI 및 로컬 백엔드 API Route 통합)와 파일 기반 경량 DB인 SQLite(`better-sqlite3`)를 채택합니다. 별도의 프론트엔드·백엔드 프로세스를 분리해 띄우는 번거로움 없이 단일 프로세스로 로컬 웹 화면과 Node.js 기반 헤드리스 수집·AI CLI 서브프로세스 실행을 모두 처리하고, 중앙 서버(`server/`)와 Next.js 프레임워크를 통일하기 위함입니다.
