export interface TermsSection {
  title: string;
  content: string;
}

export interface TermsDocument {
  title: string;
  version: string;
  effectiveDate: string;
  sections: TermsSection[];
}

export const TERMS_OF_SERVICE: TermsDocument = {
  title: 'GitHub Trend Agent 서비스 이용약관',
  version: '1.0.0',
  effectiveDate: '2026-11-11',
  sections: [
    {
      title: '제1조 (목적)',
      content:
        '본 약관은 GitHub Trend Agent(이하 "서비스")가 제공하는 일일 GitHub 트렌딩 저장소 조회, AI 토론, 인사이트 아카이브 및 공개 공유 서비스의 이용 조건과 절차, 권리와 의무를 규정함을 목적으로 합니다.',
    },
    {
      title: '제2조 (회원가입 및 계정 관리)',
      content:
        '1. 이용자는 본 약관 및 개인정보 처리방침에 동의한 후 회원가입을 신청합니다.\n2. 회원은 본인의 아이디 및 발급된 Client Auth Key를 안전하게 관리할 책임이 있으며, 이를 제3자에게 양도 또는 대여할 수 없습니다.\n3. 소셜 연동을 통해 가입한 경우 소셜 플랫폼 계정의 보안 책임은 이용자에게 있습니다.',
    },
    {
      title: '제3조 (로컬 AI 에이전트 연동 및 책임)',
      content:
        '1. 서비스는 사용자의 로컬 워크스페이스 환경에서 구동되는 로컬 AI CLI 또는 개인 API 연동을 지원합니다.\n2. AI 모델 연동 및 추론 과정에서 발생하는 모든 비용 및 결과물의 무결성에 대한 책임은 이용자 본인에게 있습니다.',
    },
    {
      title: '제4조 (공개 AI 토론 아카이브 운영)',
      content:
        '1. 회원이 생성한 토론 아카이브를 "공개(Public)"로 설정하는 경우, 해당 인사이트는 모든 사용자에게 피드로 공개 노출됩니다.\n2. 불법, 비방, 개인정보 침해 또는 타인의 지식재산권을 침해하는 내용을 공개 피드에 게시해서는 안 되며, 위반 시 관리자에 의해 비공개 전환 또는 계정 제재가 이루어질 수 있습니다.',
    },
    {
      title: '제5조 (서비스의 변경 및 중단)',
      content:
        '서비스는 무료 또는 오픈소스로 제공되는 범위 내에서 사전 고지 후 시스템 점검 또는 기능 개선을 위해 일시적으로 서비스의 일부 또는 전부를 변경·중단할 수 있습니다.',
    },
  ],
};

export const PRIVACY_POLICY: TermsDocument = {
  title: 'GitHub Trend Agent 개인정보 처리방침',
  version: '1.0.0',
  effectiveDate: '2026-11-11',
  sections: [
    {
      title: '1. 수집하는 개인정보 항목',
      content:
        '1. 일반 가입: 아이디(Username), 비밀번호 해시, 이메일(선택/필수), 이용약관 동의 일시\n2. 소셜 가입: 소셜 제공자(GitHub, Google, Kakao, Naver) 고유 식별자, 이메일, 닉네임, 이용약관 동의 일시\n3. 서비스 이용 과정에서 자동 생성되는 정보: Client Auth Key, 공개 토론 아카이브 생성 내역',
    },
    {
      title: '2. 개인정보의 수집 및 이용 목적',
      content:
        '1. 회원 식별 및 인증, Client Auth Key 발급 및 클라이언트 동기화 검증\n2. 비밀번호 분실 시 재설정 안내 및 주요 공지사항 전달\n3. 부정 이용 방지 및 계정 보안 유지',
    },
    {
      title: '3. 개인정보의 보유 및 이용 기간',
      content:
        '회원의 개인정보는 회원 탈퇴 시까지 안전하게 보관되며, 탈퇴 요청 시 관련 법령에 따른 의무 보관 사유가 없는 한 지체 없이 영구 파기됩니다.',
    },
    {
      title: '4. 개인정보의 안전성 확보 조치',
      content:
        '비밀번호는 단방향 암호화(bcrypt/scrypt)되어 저장되며, 클라이언트 인증키는 안전한 난수 기반 토큰으로 암호화되어 관리됩니다.',
    },
    {
      title: '5. 이용자의 권리와 행사 방법',
      content:
        '이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보 수집 및 이용에 대한 동의를 철회할 수 있습니다.',
    },
  ],
};

export function getTermsOfServiceContent(): TermsDocument {
  return TERMS_OF_SERVICE;
}

export function getPrivacyPolicyContent(): TermsDocument {
  return PRIVACY_POLICY;
}
