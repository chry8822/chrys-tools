# chrys-tools

Claude Code용 Skills를 글로벌로 설치해주는 npm CLI 패키지.

`npx chrys-tools install` 한 번으로 Jira 연동부터 권한 설정, MCP 자동 구성까지 전부 완료되고
이후 **어느 프로젝트에서 Claude Code를 켜도** 바로 사용할 수 있습니다.

---

## 설치

```bash
npx chrys-tools install
```

설치 중 아래 정보를 입력하면 나머지는 자동으로 처리됩니다:

```
◆  설치할 기능을 선택하세요
│  ◉ README 자동 생성
│  ◉ Jira 이슈 분석

◆  Jira Base URL    예: https://your-company.atlassian.net
◆  Atlassian 이메일 예: you@company.com
◆  Jira API Token   Atlassian 계정 → 보안 → API 토큰
◆  Jira Project Key 예: PROJ, DEV
```

---

## 설치 시 자동으로 처리되는 것들

`install` 명령 하나로 아래 세 가지가 한 번에 설정됩니다.

### 1. Atlassian MCP 자동 구성

`~/.claude/settings.json`에 Jira MCP 서버가 자동으로 등록됩니다.
claude.ai에서 별도로 Atlassian을 연동하지 않아도 Jira를 바로 조회할 수 있습니다.

```json
// ~/.claude/settings.json (자동 생성)
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

### 2. 실행 권한 자동 등록

skill 실행 중 필요한 명령들이 Claude Code 권한 목록에 자동 추가됩니다.
매번 "허용하시겠습니까?" 팝업 없이 바로 실행됩니다.

```json
// ~/.claude/settings.json (자동 추가)
{
  "permissions": {
    "allow": [
      "Bash(git log*)",
      "Bash(git blame*)",
      "Bash(git diff*)",
      "Bash(npm test*)",
      "Bash(pytest*)",
      "Bash(go test*)"
    ]
  }
}
```

### 3. Skill 파일 + 설정 저장

```
~/.claude/skills/issue-analyzer/SKILL.md   ← Claude Code가 자동으로 읽는 skill 정의
~/.claude/config.json                       ← Jira 연결 정보 저장
```

---

## 사용 방법

설치 후 프로젝트 디렉토리에서 Claude Code를 열고 자연어로 요청합니다.

```bash
cd ~/projects/my-app
claude
```

```
"PROJ-1234 분석해줘"
"PROJ-1234 수정하고 테스트해줘"
"이 이슈 어디서 난 거야"
"README 만들어줘"
```

---

## Jira 이슈 분석 동작 흐름

티켓 번호를 입력하면 분석부터 코드 수정, 테스트까지 자동으로 진행됩니다.

```
사용자: "PROJ-1234 분석하고 수정해줘"

1단계  티켓 파싱          PROJ-1234 추출
2단계  병렬 분석          ──────────────────────────────────────
                          │ Jira 티켓 조회    │ 코드베이스 탐색  │ Git 히스토리    │
                          │ (Haiku)           │ (Haiku)          │ (Haiku)         │
                          ──────────────────────────────────────
3단계  분석 보고서        Sonnet이 3개 결과 합산 → 보고서 출력
4단계  수정 계획 제시     수정할 파일/라인/이유 제시 → 사용자 승인 요청
5단계  코드 수정          승인 후 Sonnet이 최소 범위만 수정
6단계  테스트 실행        Haiku가 테스트 실행 → 결과 요약 반환
```

### 토큰 및 속도 최적화 설계

단순 반복 작업과 복잡한 추론 작업을 다른 모델로 분리합니다.

| 작업 | 모델 | 비용 |
|------|------|------|
| Jira 조회, 코드 검색, Git 탐색, 테스트 실행 | Haiku | 저렴 |
| 분석 보고서 작성, 수정 계획, 코드 수정 | Sonnet | 품질 |

**병렬 실행:** Jira 조회 / 코드 검색 / Git 탐색 3개를 동시에 실행합니다.
순차 실행 대비 분석 시간이 약 3배 단축됩니다.

**컨텍스트 최소화:** 각 서브에이전트는 요약본만 반환합니다.
raw JSON이나 전체 파일 내용을 메인 컨텍스트에 올리지 않아 불필요한 토큰 소모를 방지합니다.

```
나쁜 예  서브에이전트가 Jira API 전체 응답(수천 토큰)을 그대로 반환
좋은 예  서브에이전트가 핵심 필드만 요약해서 반환 (수십 토큰)
```

---

## 반자동 수정 흐름

코드를 바로 수정하지 않고, 계획을 먼저 보여준 뒤 승인을 받습니다.

```
## 수정 계획

수정할 파일
1. src/services/care.ts (line 42-58)
   - 변경 내용: day_work_info 필드를 거래정보 화면에 표시
   - 이유: 백엔드 API에 필드가 추가됐으나 프론트에서 미사용 중

예상 사이드 이펙트
- 기존 동행 서비스 API 호출부도 공통 API로 변경 필요

실행할 테스트
- npm test

위 수정 계획대로 진행할까요?
[Y] 수정 실행  [N] 취소  [E] 계획 변경
```

승인(`Y`) 후 수정 → 테스트 실행 → 결과 보고까지 자동으로 진행됩니다.
테스트 실패 시 원인을 분석하고 수정 계획부터 다시 시작합니다.

---

## 기타 커맨드

```bash
# 특정 skill만 추가
npx chrys-tools add jira
npx chrys-tools add readme

# Jira 설정 변경
npx chrys-tools config jira

# 설치된 skill 목록 확인
npx chrys-tools list
```

---

## 동작 원리

Claude Code는 시작 시 `~/.claude/skills/` 디렉토리를 자동으로 읽습니다.
이 패키지는 해당 경로에 SKILL.md 파일을 설치합니다.

프로젝트 레포에 아무것도 추가하지 않아도 어느 프로젝트에서나 동작합니다.

```
npx chrys-tools install
        ↓
~/.claude/skills/issue-analyzer/SKILL.md   (어느 프로젝트에서나 자동 로드)
~/.claude/settings.json                    (MCP 서버 + 권한 등록)
~/.claude/config.json                      (Jira 연결 정보)
```

---

## 프로젝트 구조

```
src/
  index.ts
  commands/
    install.ts       대화형 설치 (MCP + 권한 + skill 한 번에)
    add.ts           단일 skill 추가
    config.ts        설정 변경
    list.ts          설치 목록 확인
  skills/
    readme-generator/
      SKILL.md       skill 정의
      index.ts       설치 로직
    issue-analyzer/
      SKILL.md       skill 정의 (모델 라우팅 + 병렬 실행 포함)
      index.ts       설치 로직 + Jira 설정
  utils/
    config.ts        ~/.claude/config.json 읽기/쓰기
    settings.ts      ~/.claude/settings.json MCP + 권한 등록
    fs.ts            파일 복사, 경로 처리
    prompt.ts        @clack/prompts 공통 래퍼
```

---

## 라이선스

MIT
