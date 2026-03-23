# chrys-tools

> Claude Code를 팀 개발 도구로 확장하는 Skills CLI

`npx chrys-tools install` 한 번으로 설치하면 **어느 프로젝트에서 Claude Code를 열어도**
Jira 이슈 분석·수정, 서버 배포, README 자동 생성, 발표용 HTML 생성 기능을 바로 사용할 수 있습니다.

**[🌐 라이브 데모 보기](https://chry8822.github.io/chrys-tools/)** (생성된 소개 HTML)

---

## 제공 기능

| 기능 | 사용 예시 | 설명 |
|------|-----------|------|
| **Jira 이슈 분석 & 수정** | `"ABEH-1234 수정해줘"` | 티켓 조회 → 코드 탐색 → 수정 → 테스트 |
| **QA / CI 서버 배포** | `"qa 배포해줘"` | SSH 접속 → git pull → 빌드 |
| **README 자동 생성** | `"README 만들어줘"` | 프로젝트 분석 → README.md 생성 |
| **발표용 HTML 생성** | `"발표 자료 만들어줘"` | 프로젝트 분석 → presentation.html 생성 |

---

## 설치

```bash
npx chrys-tools install
```

설치 중 필요한 정보를 입력하면 나머지는 자동으로 처리됩니다.

```
◆  설치할 기능을 선택하세요
│  ◉ README 자동 생성
│  ◉ Jira 이슈 분석
│  ◉ 서버 배포 (QA/CI)
│  ◉ 발표용 HTML 생성

# Jira 이슈 분석 설정
◆  Jira Base URL     https://your-company.atlassian.net
◆  Atlassian 이메일  you@company.com
◆  Jira API Token    Atlassian 계정 → 보안 → API 토큰
◆  Project Key       PROJ

# 서버 배포 설정
◆  QA 호스트   192.168.1.100
◆  QA 사용자   ubuntu
◆  QA 비밀번호 ********
◆  QA 경로     /var/www/my-app

◆  CI 호스트   192.168.1.101
◆  CI 사용자   ubuntu
◆  CI 경로     /var/www/my-app
```

설치 후 `~/.claude/`에 아래 파일들이 자동으로 구성됩니다:

```
~/.claude/
  CLAUDE.md                              ← skill 참조 등록
  settings.json                          ← MCP 서버 + 실행 권한 자동 등록
  config.json                            ← Jira / 서버 연결 정보
  skills/
    issue-analyzer/SKILL.md
    server-deploy/SKILL.md
    readme-generator/SKILL.md
    present-generator/SKILL.md
```

---

## 기능 상세

---

### 1. Jira 이슈 분석 & 수정

Jira 티켓 번호를 말하면 티켓 내용을 분석하고, 코드를 찾아 수정하고, 테스트까지 실행합니다.

#### 사용 예시

```
"ABEH-1234 분석해줘"
"ABEH-1234 수정하고 테스트해줘"
"이 이슈 어디서 난 거야"
"버그 픽스해줘"
```

#### 동작 흐름

```
1단계  티켓 조회 + 링크 수집
       ├─ Jira 티켓 내용, 에러 메시지, 언급된 파일/API 추출
       └─ 본문·댓글의 링크 전부 열어서 확인
          (Confluence 문서, deprecated API 스펙, 마이그레이션 가이드 등)

2단계  복잡도 판단
       ├─ 에러 메시지·파일명·수정 방향이 명확 → Fast Lane (자동 처리)
       └─ 정보 부족 → Collaborative Lane (사용자와 협업)
```

**Fast Lane — 이슈 위치가 명확한 경우**

```
F-1  병렬 탐색 (3개 동시)
     ├─ 에러/API 기반 코드 검색
     ├─ Git 히스토리 탐색
     └─ 연관 파일 의존성 추적

F-2  수정 계획 제시 → 사용자 승인 [Y/N/E]

F-3  스타일 분석 — 인접 파일에서 네이밍·패턴·에러 처리 방식 파악

F-4  두 에이전트 토론
     ├─ 구현 에이전트: 수정안 제안
     ├─ 리뷰 에이전트: 정확성·사이드 이펙트·스타일·엣지 케이스 검토
     └─ 최대 2라운드 → 합의된 최종안 적용

F-5  수정 리뷰 보고서
     ├─ 수정된 파일 위치
     ├─ Before / After 코드 비교
     └─ 수정 이유 + 리뷰 에이전트 검토 결과

F-6  테스트 전략 수립
     ├─ 자동 테스트 가능 → 관련 테스트 파일 실행
     ├─ 자동 테스트 불가 → npm run build + 수동 체크리스트
     └─ 혼합 → 자동 + 수동 병행
```

**Collaborative Lane — 이슈 위치가 불명확한 경우**

```
C-1  1차 탐색 후 예/아니오 질문 1~3개 제시
C-2  사용자 힌트 반영 → 재탐색 → 위치 확정 → Fast Lane F-2로 합류
     (최대 3라운드, 이후에도 못 찾으면 직접 파일·함수 안내 요청)
```

#### 수정 완료 후 커밋 & 푸시

사용자가 커밋을 요청하면 아래 형식으로 자동 작성합니다:

```
[ABEH-1234] - 거래정보 화면에서 API 응답 파싱 오류 수정

- api.ts: getUserTradeInfo 응답 필드명 수정 (tradeName → tradeTitle)
- TradeInfo.tsx: undefined 접근 방지를 위한 optional chaining 추가
```

커밋 완료 후 푸시 여부를 확인하고, 승인하면 `git push`까지 자동 실행합니다.

---

### 2. QA / CI 서버 배포

Claude Code에서 자연어로 요청하면 SSH로 서버에 접속해 배포까지 완료합니다.
PuTTY/KiTTY를 사용하는 Windows 환경에서 `plink`를 자동으로 사용합니다.

#### 사용 예시

```
"qa 배포해줘"
"ci 빌드해줘"
"qa에 올려줘"
"배포해줘"          ← 서버 목록 보여주고 선택
```

#### 동작 흐름

```
1단계  프로젝트 + 브랜치 입력

       프로젝트: care
       브랜치:   dealHistory
       → 최종 경로: /app/front/care

       한 번에 말해도 됩니다:
       "ci care 프로젝트 dealHistory 브랜치 배포해줘"

2단계  SSH 연결 → fetch + pull 후 최신 커밋 확인
       (ping은 서버 방화벽에서 막히는 경우가 많아 생략, SSH 직접 시도)

       ## 최신 커밋 내역 (QA / care / branch: dealHistory)

       b14bec65 chore: .gitignore에 cursor IDE 관련 항목 추가
       7f4bc3a0 fix: [ABEH-3013] 거래정보 간병/동행 기간 불일치 수정
       444e5003 fix: [ABEH-2956] 공고 등록 증명서 제출처 삭제버튼 수정

       이 커밋으로 배포하시겠습니까?  [Y] 배포  [N] 취소

3단계  git status 점검

       clean               → 바로 빌드 진행
       uncommitted 변경사항  → 선택지 제공
                              [1] stash 후 배포
                              [2] 강제 pull
                              [3] 배포 취소
       merge conflict       → 직접 해결 방법 안내 후 중단

4단계  빌드 실행
       nodeVersion 설정 시 nvm으로 버전 자동 지정 후 빌드

       source ~/.nvm/nvm.sh && nvm use 14 && npm run build

5단계  결과 출력

       ✅ 배포 완료
       서버: QA / 프로젝트: care / branch: dealHistory / commit: b14bec65

       ❌ 빌드 실패 시 에러 로그 분석 + 상세 분석 or 취소 선택
```

#### 인증 방식

| 서버 | 인증 | 사용 도구 | 사전 조건 |
|------|------|-----------|-----------|
| QA | 비밀번호 | `plink -batch -pw` | PuTTY 또는 KiTTY 설치 |
| CI | SSH 키 (.ppk) | `plink -batch -i <keyPath>` | PuTTY 또는 KiTTY 설치 |

> KiTTY / PuTTY를 이미 사용 중이라면 `plink`가 함께 설치돼 있으므로 추가 설정 없이 동작합니다.

#### config 구조

```json
"server-deploy": {
  "servers": {
    "qa": {
      "host": "서버IP",
      "user": "사용자명",
      "password": "비밀번호",
      "basePath": "/app/front"
    },
    "ci": {
      "host": "서버IP",
      "user": "ubuntu",
      "sshKeyPath": "C:\\경로\\CIKEY.ppk",
      "basePath": "/app/front",
      "nodeVersion": "14"
    }
  }
}
```

- `basePath` + 배포 시 입력한 프로젝트명 = 최종 경로
- `nodeVersion` 있으면 nvm으로 자동 전환 후 빌드
- `sshKeyPath` 있으면 plink `-i` 옵션으로 키 인증

#### 설정 변경

```bash
npx chrys-tools config deploy
```

---

### 3. README 자동 생성

현재 프로젝트 코드를 분석해서 README.md를 자동으로 작성합니다.

#### 사용 예시

```
"README 만들어줘"
"리드미 작성해줘"
"프로젝트 문서 만들어줘"
```

#### 동작 흐름

```
1단계  구성 방식 선택
       [1] 기본 양식 (일반적인 README 구성)
       [2] 커스텀 구성 (원하는 섹션 직접 선택)

2단계  섹션 선택 (커스텀 선택 시)
       프로젝트 개요 / 스크린샷 / 주요 기능 / 기술 스택 /
       시작하기 / 환경변수 / 폴더 구조 / API 문서 /
       개발 가이드 / 배포 방법 / 기여 방법 / 라이선스

3단계  병렬 분석 (3개 동시)
       ├─ 폴더 구조 분석
       ├─ package.json · 기술 스택 파악
       └─ 코드 패턴 분석

4단계  README.md 생성 → 프로젝트 루트에 저장
```

---

### 4. 발표용 HTML 생성

현재 프로젝트를 분석해 세련된 다크 터미널 테마의 발표/소개용 HTML 페이지를 자동으로 생성합니다.

#### 사용 예시

```
"발표 자료 만들어줘"
"프로젝트 소개 HTML 만들어줘"
"소개 페이지 만들어줘"
"프레젠테이션 만들어줘"
```

#### 동작 흐름

```
1단계  병렬 분석 (3개 동시)
       ├─ 프로젝트 구조 · package.json · 버전 파악
       ├─ 기술 스택 (dependencies 분석)
       └─ README · 코드에서 목적 · 기능 추출

2단계  누락 정보 확인 (한 번에 모아서 질문)

3단계  presentation.html 생성 → 프로젝트 루트에 저장
```

#### 생성되는 HTML 구성

- **Hero** — 프로젝트명 · 슬로건 · 설치 명령어
- **Why** — 문제 제기 · before/after 카드
- **Features** — 기능 카드 + 터미널 예시 블록
- **How it works** — 단계별 파이프라인 플로우
- **Tech Stack** — 기술 스택 뱃지
- **시작하기** — 설치 방법

#### 인터랙션

- 스크롤 progress bar · 우측 nav dots
- Hero 타이핑 애니메이션 · 마우스 parallax
- 터미널 블록 타이핑 시퀀스 (화면 진입 시 자동 실행)
- Feature 카드 3D tilt · stagger reveal

#### 기존 파일 처리

`presentation.html`이 이미 있으면 선택합니다:

```
[1] 덮어쓰기
[2] 새 파일로 저장  (presentation-2.html)
[3] 취소
```

---

## 토큰 & 속도 최적화

반복 작업과 추론 작업을 다른 모델로 분리해 비용과 속도를 최적화합니다.

| 작업 | 모델 |
|------|------|
| Jira 조회, 코드 검색, Git 탐색, 테스트 실행, HTML 생성 | Haiku (저렴·빠름) |
| 복잡도 판단, 수정 계획, 코드 수정, 리뷰 | Sonnet (품질) |

**병렬 실행:** 탐색 단계에서 서브에이전트 3개를 동시에 실행합니다.

**컨텍스트 최소화:** 서브에이전트는 요약본만 반환합니다. raw JSON이나 파일 전체를 메인 컨텍스트에 올리지 않습니다.

---

## 설치 시 자동 처리 항목

### Atlassian MCP 자동 등록

별도 claude.ai Atlassian 연동 없이 Jira를 바로 조회할 수 있습니다.

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "mcp-atlassian-jira": {
      "command": "npx",
      "args": ["-y", "@aashari/mcp-server-atlassian-jira"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-company",
        "ATLASSIAN_USER_EMAIL": "you@company.com",
        "ATLASSIAN_API_TOKEN": "your-token"
      }
    }
  }
}
```

### 실행 권한 자동 등록

매번 "허용하시겠습니까?" 없이 바로 실행됩니다.

```json
// ~/.claude/settings.json
{
  "permissions": {
    "allow": [
      "Edit(*)", "Write(*)", "Read(*)",
      "Bash(git log*)", "Bash(git commit*)", "Bash(git push*)",
      "Bash(npm test*)", "Bash(npm run build*)",
      "Bash(ssh*)", "Bash(plink*)", "Bash(sshpass*)"
    ]
  }
}
```

---

## 기타 커맨드

```bash
# 기능 단독 추가
npx chrys-tools add jira
npx chrys-tools add deploy
npx chrys-tools add readme
npx chrys-tools add present

# 설정 변경
npx chrys-tools config jira      # Jira URL / API Token / Project Key 변경
npx chrys-tools config deploy    # QA/CI 서버 호스트 / 경로 / 비밀번호 변경

# 설치된 목록 확인
npx chrys-tools list
```

---

## 동작 원리

Claude Code는 시작 시 `~/.claude/CLAUDE.md`와 `~/.claude/skills/`를 자동으로 읽습니다.
이 패키지는 해당 경로에 SKILL.md를 설치하고 `CLAUDE.md`에 참조를 등록합니다.
프로젝트 레포에 아무것도 추가하지 않아도 어느 프로젝트에서나 동작합니다.

```
npx chrys-tools install
        ↓
~/.claude/CLAUDE.md          @skill 참조 등록
~/.claude/settings.json      MCP 서버 + 권한 자동 구성
~/.claude/config.json        Jira · 서버 연결 정보
~/.claude/skills/            각 skill의 SKILL.md
```

---

## 라이선스

MIT
