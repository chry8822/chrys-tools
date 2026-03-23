# chrys-tools

Claude Code용 Skills를 글로벌로 설치해주는 npm CLI 패키지.

`npx chrys-tools install` 한 번으로 Jira 연동부터 MCP 자동 구성, 권한 설정까지 전부 완료되고
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

skill 실행 중 필요한 모든 명령이 Claude Code 권한 목록에 자동 추가됩니다.
파일 수정, 커밋, 푸시 등 매번 "허용하시겠습니까?" 확인 없이 바로 실행됩니다.

```json
// ~/.claude/settings.json (자동 추가)
{
  "permissions": {
    "allow": [
      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "Bash(git log*)",
      "Bash(git diff*)",
      "Bash(git commit*)",
      "Bash(git push*)",
      "Bash(npm test*)",
      "Bash(npm run build*)"
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

### 1단계: 티켓 조회 + 링크 탐색 + 복잡도 판단

티켓 내용뿐 아니라 본문/댓글의 **모든 링크를 열어서** 맥락을 파악합니다.

```
1-A  Jira 티켓 조회         제목, 버그 설명, 에러 메시지, 언급된 파일/API명 추출 (Haiku)
1-B  링크 컨텍스트 수집     Confluence 페이지, 외부 문서 등 티켓 내 링크 전부 확인 (Haiku)
                            → deprecated API, 새 엔드포인트, 마이그레이션 가이드 등 파악
1-C  복잡도 판단            에러 메시지/파일명/수정 방향이 명확하면 Fast Lane
                            정보가 부족하면 Collaborative Lane (Sonnet)
```

---

### Fast Lane — 이슈 위치가 명확한 경우

사용자 개입 없이 자동으로 탐색 → 계획 제시 → 수정 → 테스트까지 진행합니다.

```
F-1  정밀 탐색 (Haiku 3개 병렬)
     ├─ 에러/API 기반 Grep 검색
     ├─ Git 히스토리 탐색
     └─ 연관 파일 의존성 추적

F-2  수정 계획 제시 → 사용자 승인 [Y/N/E]

F-3  스타일 분석
     수정 전 인접 파일에서 프로젝트 코딩 스타일 파악
     (네이밍 규칙, 함수 구조, import 패턴, 에러 처리 방식)

F-4  두 에이전트 토론 후 코드 수정
     ├─ 구현 에이전트: 수정안 제안 + 이유 명시 (Sonnet)
     ├─ 리뷰 에이전트: 정확성 / 사이드 이펙트 / 스타일 / 엣지 케이스 검토 (Sonnet)
     └─ 최대 2라운드 토론 → 합의된 최종안 적용

F-5  수정 리뷰 보고서 출력
     ├─ 수정된 파일 위치
     ├─ Before / After 코드 비교
     ├─ 수정 이유
     └─ 리뷰 에이전트 검토 결과

F-6  테스트 전략 수립 + 실행
     ├─ A. 자동 테스트 가능  → 관련 테스트 파일 실행
     ├─ B. 자동 테스트 불가  → npm run build + 수동 테스트 체크리스트 생성
     └─ C. 혼합             → 자동 + 수동 병행
```

---

### Collaborative Lane — 이슈 위치가 불명확한 경우

사용자의 힌트로 범위를 좁혀가며 함께 문제를 찾습니다.

```
C-1  1차 탐색 + 질문
     키워드로 빠른 탐색 후 예/아니오로 답할 수 있는 질문 1~3개 제시

C-2  힌트 기반 정밀 탐색
     사용자 답변을 반영해 재탐색 → 위치 확신도 높으면 Fast Lane F-2로 합류

     최대 3라운드 반복, 이후에도 못 찾으면 사용자에게 직접 파일/함수 안내 요청
```

---

### 커밋 & 푸시 흐름

수정 완료 후 사용자가 커밋을 요청하면 아래 형식으로 자동 커밋합니다.

```
[PROJ-1234] - 거래정보 화면에서 API 응답 파싱 오류 수정

- api.ts: getUserTradeInfo 응답 필드명 수정 (tradeName → tradeTitle)
- TradeInfo.tsx: undefined 접근 방지를 위한 optional chaining 추가
```

커밋 완료 후 푸시 여부를 확인하고, 승인하면 `git push`까지 자동 실행합니다.

---

## 토큰 및 속도 최적화 설계

단순 반복 작업과 복잡한 추론 작업을 다른 모델로 분리합니다.

| 작업 | 모델 |
|------|------|
| Jira 조회, 코드 검색, Git 탐색, 테스트 실행 | Haiku (저렴) |
| 복잡도 판단, 수정 계획, 코드 수정, 리뷰 | Sonnet (품질) |

**병렬 실행:** 탐색 단계에서 Haiku 서브에이전트 3개를 동시 실행합니다.
순차 실행 대비 탐색 시간이 약 3배 단축됩니다.

**컨텍스트 최소화:** 각 서브에이전트는 요약본만 반환합니다.
raw JSON이나 전체 파일 내용을 메인 컨텍스트에 올리지 않아 불필요한 토큰 소모를 방지합니다.

```
나쁜 예  서브에이전트가 Jira API 전체 응답(수천 토큰)을 그대로 반환
좋은 예  서브에이전트가 핵심 필드만 요약해서 반환 (수십 토큰)
```

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
      SKILL.md       skill 정의 (모델 라우팅 + 병렬 실행 + 두 에이전트 토론 포함)
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
