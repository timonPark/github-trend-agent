# Issue tracker: GitHub

이 레포의 이슈와 명세는 GitHub 이슈(`timonPark/github-trend-agent`)로 관리합니다. 모든 작업에 `gh` CLI를 사용하며, 항상 활성 계정이 `timonPark`인지 확인하세요(`gh auth status` / `gh auth switch -u timonPark`).

## 컨벤션

- **이슈 생성**: `gh issue create --title "..." --body "..."`. 여러 줄 본문은 heredoc을 사용하세요.
- **이슈 읽기**: `gh issue view <number> --json number,title,body,labels,comments`.
- **이슈 목록**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`.
- **이슈를 부모의 서브 이슈로 만들기**: `gh issue create --parent <parent> ...`, 또는 자식 본문 상단에 `Part of #<parent>`를 두세요.
- **이슈에 댓글**: `gh issue comment <number> --body "..."`
- **레이블 적용 / 제거**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **닫기**: `gh issue close <number> --comment "..."`

## 분류 서피스로서의 풀 리퀘스트

**요청 서피스로서의 PR: 아니요.**

## 스킬이 "이슈 트래커에 게시"라고 할 때

GitHub 이슈를 만드세요.

## 스킬이 "관련 티켓을 가져오기"라고 할 때

위의 **이슈 읽기**처럼 읽으세요.
