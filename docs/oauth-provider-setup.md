# 소셜 로그인(OAuth) 제공자 설정 및 배포 가이드

Epic #49 (소셜 로그인 4종) 구현에 필요한 외부 콘솔 설정과, **배포 시 바꿔야 하는 값**을 정리한 운영 문서입니다.
Client ID/Secret 같은 **실제 키 값은 이 문서에 적지 않습니다.** 키는 `server/.env.local`(로컬) 또는 배포 환경의 환경변수에만 둡니다.

---

## 1. 한눈에 보기

| 제공자 | 콘솔 | 등록한 앱 | 현재 상태 |
|---|---|---|---|
| GitHub | https://github.com/settings/developers | OAuth App `gh-trend-agent (local dev)` | 로컬 전용 |
| Google | https://console.cloud.google.com/auth/clients | 프로젝트 `gh-trend-agent`, 웹 클라이언트 `gh-trend-agent (local dev)` | 외부(External) / **테스트 중** |
| Kakao | https://developers.kakao.com/console/app/1646191 | 앱 `gh-trend-agent` (ID 1646191) | **개인 개발자 비즈 앱** |
| Naver | https://developers.naver.com/apps/#/list | 앱 `gh-trend-agent` | **개발 중** (검수 전) |

> GitHub 앱 이름은 `github`로 시작할 수 없어서 `gh-`로 시작합니다.

---

## 2. Callback(Redirect) URL 규칙

경로 규칙: `{서버 주소}/api/auth/oauth/{provider}/callback`

| 환경 | 서버 주소 | 예시 (GitHub) |
|---|---|---|
| 로컬 개발 | `http://localhost:4000` | `http://localhost:4000/api/auth/oauth/github/callback` |
| 배포 | `https://<배포 도메인>` | `https://<배포 도메인>/api/auth/oauth/github/callback` |

- `provider`는 `github` / `google` / `kakao` / `naver` 중 하나입니다.
- 서버 포트 4000은 `server/package.json`의 `next dev -p 4000`에서 옵니다.
- 이 경로 규칙은 아직 코드에 구현되어 있지 않습니다. #51, #52 구현 시 이 경로에 맞추고, 경로를 바꾸면 **4개 콘솔 모두** 같이 고쳐야 합니다.
- 배포 환경에서는 반드시 `https://`를 사용합니다. Google은 localhost 외 `http://` Redirect URI를 허용하지 않습니다.
- 값은 **글자 하나까지 정확히** 일치해야 합니다 (끝의 `/`, 대소문자, 포트 포함). 불일치하면 제공자가 `redirect_uri_mismatch` 계열 오류를 냅니다.

---

## 3. 환경변수

`server/.env.local`(로컬) 또는 배포 환경변수에 아래 8개를 설정합니다.

```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=        # Kakao의 'REST API 키'
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

- `server/.env.local`은 `.gitignore`의 `.env.*` 규칙으로 커밋되지 않습니다.
- 배포 환경(ADR 0004 기준 Vercel)에는 같은 이름으로 환경변수를 등록합니다. 로컬 파일은 배포에 올라가지 않습니다.
- Secret이 채팅, 이슈, PR, 로그에 노출되면 즉시 재발급(Rotate)하고 환경변수를 교체합니다.

---

## 4. 제공자별 설정 상세

### 4.1 GitHub

- 경로: Settings > Developer settings > OAuth Apps
- 등록된 값: Homepage `http://localhost:4000`, Callback `http://localhost:4000/api/auth/oauth/github/callback`, Device Flow 끔
- **Callback URL을 1개만 등록할 수 있습니다.** 로컬과 배포를 한 앱에 같이 둘 수 없으므로, 배포용 OAuth App을 **별도로 만들고** 배포 환경에는 그 앱의 키를 넣습니다.
- 이메일: 콘솔에서 설정하는 항목이 없습니다. 코드에서 `scope=user:email`을 요청하고, 로그인 후 `GET https://api.github.com/user/emails`에서 `primary: true` 이고 `verified: true`인 항목을 사용합니다. 사용자가 이메일을 비공개로 해두면 `/user` 응답의 `email`은 `null`입니다.

### 4.2 Google

- 경로: Google Cloud Console > Google Auth Platform (프로젝트 `gh-trend-agent`)
- 등록된 값: 승인된 JavaScript 원본 `http://localhost:4000`, 승인된 리디렉션 URI `http://localhost:4000/api/auth/oauth/google/callback`
- 동의 화면: 대상 **외부**, 게시 상태 **테스트 중**, 테스트 사용자 1명(개발자 본인 Gmail)
- 범위(scope): `openid`, `userinfo.email`, `userinfo.profile`
- 배포 시:
  - **같은 클라이언트에 URI를 추가**할 수 있습니다. JavaScript 원본에 `https://<배포 도메인>`, 리디렉션 URI에 `https://<배포 도메인>/api/auth/oauth/google/callback`을 추가합니다.
  - **게시 상태가 "테스트 중"이면 등록된 테스트 사용자만 로그인할 수 있습니다.** 일반 사용자에게 열려면 동의 화면에서 "프로덕션으로 게시"해야 합니다. 이 프로젝트의 scope 3개는 민감하지 않은 범위라 일반적으로 별도 검증 없이 게시할 수 있습니다.
  - 테스트 중 상태에서는 refresh token이 7일 후 만료됩니다.
- 설정 변경이 실제로 반영되기까지 5분에서 몇 시간이 걸릴 수 있습니다.
- 현재 프로젝트는 개인 Gmail 소유이고 조직이 없습니다. 팀 운영으로 바꾸려면 소유자를 추가하거나 조직 프로젝트로 옮기는 것을 검토합니다.

### 4.3 Kakao

- 경로: Kakao Developers > 내 애플리케이션 > `gh-trend-agent`
- **Redirect URI는 "앱 > 플랫폼 키 > REST API 키 수정" 화면**에 있습니다. (이전 콘솔의 "카카오 로그인" 메뉴가 아닙니다.)
- 등록된 값: Redirect URI `http://localhost:4000/api/auth/oauth/kakao/callback`
- 카카오 로그인: 활성화 ON, OpenID Connect OFF
- 동의항목: 닉네임(`profile_nickname`) 필수, 카카오계정 이메일(`account_email`) 필수
- Client Secret: REST API 키 생성 시 자동 발급되어 활성화 상태입니다. 토큰 요청에 `client_secret`을 함께 보냅니다.
- 이메일은 **개인 개발자 비즈 앱**으로 전환해야 받을 수 있어서 전환해 두었습니다. 전환을 위해 임시 앱 아이콘(128px)을 올려 두었으니 필요하면 앱 기본 정보에서 교체합니다.
- 배포 시:
  - 같은 앱의 Redirect URI에 `https://<배포 도메인>/api/auth/oauth/kakao/callback`을 **추가 등록**합니다. 여러 개 등록할 수 있습니다.
  - 일반 사용자에게 서비스하려면 앱 설정(플랫폼, 동의항목 목적 등)이 서비스 실제 내용과 맞는지 점검합니다.

### 4.4 Naver

- 경로: NAVER Developers > Application > 내 애플리케이션 > `gh-trend-agent` > API 설정
- 등록된 값: 사용 API 네이버 로그인, 제공 정보 이메일(필수) / 회원이름(선택), 환경 PC 웹, 서비스 URL `http://localhost:4000`, Callback `http://localhost:4000/api/auth/oauth/naver/callback`
- **앱 상태가 "개발 중"이면 앱 관리자(최대 3명)와 테스터 ID(최대 20명)만 로그인할 수 있습니다.** 일반 사용자에게 열려면 **"네이버 로그인 검수요청"을 통과**해야 합니다.
- 배포 시:
  - API 설정에서 서비스 URL을 `https://<배포 도메인>`으로, Callback URL에 `https://<배포 도메인>/api/auth/oauth/naver/callback`을 추가합니다.
  - 검수 요청 전에 배포 도메인으로 실제 로그인이 되는지 먼저 확인합니다.
- **Naver의 이메일은 계정 이메일이 아니라 사용자가 등록한 연락처 이메일**이라 계정별 고유값이 아닙니다.

---

## 5. 구현 시 지켜야 할 설계 원칙

1. **계정 식별은 제공자별 고유 ID로 합니다** (`provider` + `provider_user_id`). 이메일로 소셜 계정을 같은 사용자라고 자동 병합하지 않습니다. 특히 Naver 이메일은 고유값이 아닙니다.
2. **이메일은 연락과 비밀번호 재설정용입니다.** `User.email` 중복 방지(#50)와 충돌하는 경우(이미 같은 이메일의 일반 계정이 있을 때) 처리 정책을 #50, #51, #52에서 명시적으로 정합니다.
3. **`state` 파라미터를 반드시 사용합니다.** 요청마다 난수를 만들어 저장하고 콜백에서 검증해 CSRF를 막습니다.
4. **Client Secret은 서버에서만 사용합니다.** 클라이언트 번들이나 응답에 포함하지 않습니다.
5. **로컬 Dev 시뮬레이터**는 키가 없는 환경에서만 노출하고, 프로덕션 빌드에서는 비활성화합니다.

---

## 6. 배포 체크리스트

- [ ] 배포 도메인(`https://...`) 확정
- [ ] 배포 환경변수 8개 등록 (4.1의 GitHub는 **배포용 앱을 새로 만든 키**)
- [ ] GitHub: 배포용 OAuth App 생성, Callback `https://<배포 도메인>/api/auth/oauth/github/callback`
- [ ] Google: JavaScript 원본과 리디렉션 URI에 배포 도메인 추가, 동의 화면 "프로덕션으로 게시"
- [ ] Kakao: Redirect URI에 배포 도메인 추가
- [ ] Naver: 서비스 URL, Callback URL을 배포 도메인으로 변경 또는 추가, 로그인 확인 후 검수 요청
- [ ] 4개 제공자 모두 배포 도메인에서 로그인과 신규 가입이 되는지 확인
- [ ] Dev 시뮬레이터가 배포 환경에서 비활성화되어 있는지 확인

## 7. 문제 해결

| 증상 | 확인할 것 |
|---|---|
| `redirect_uri_mismatch` / `invalid_request` | 콘솔에 등록한 Callback과 코드가 보내는 값이 글자 단위로 같은지, http/https, 끝의 `/`, 포트 |
| Google에서 "접근 차단됨 / 승인되지 않은 앱" | 게시 상태가 테스트 중인데 테스트 사용자에 없는 계정으로 로그인 중인지 |
| Google 설정을 바꿨는데 계속 오류 | 반영까지 5분에서 몇 시간 걸릴 수 있음 |
| Kakao에서 이메일이 오지 않음 | 비즈 앱 전환 여부, `account_email` 동의항목 상태, 사용자가 동의 화면에서 이메일 제공을 거부했는지 |
| Naver 로그인이 일부 계정에서만 됨 | 앱이 "개발 중"이면 관리자/테스터 ID만 가능. 멤버관리에 계정 추가 또는 검수 요청 |
| GitHub에서 `email`이 `null` | `user:email` scope를 요청하고 `/user/emails`를 조회하는지 |
| 로컬에서만 되고 배포에서 안 됨 | 배포 환경변수 누락, 배포용 Callback 미등록 |
