# claude-skills

## 주의사항

이 프로젝트는 완전히 새로운 패키지다.
같은 머신의 다른 폴더를 참고하거나 읽지 않는다.
오직 이 CLAUDE.md와 사용자 지시만 따른다.

## 프로젝트 개요

`claude-skills`는 Claude Code용 Skills를 글로벌로 설치해주는 npm CLI 패키지다.
`npx claude-skills install` 한 번으로 `~/.claude/skills/`에 skill 파일들을 설치하고,
이후 어느 프로젝트에서 Claude Code를 켜도 해당 skills가 자동으로 동작한다.

cursor-setup (팀 Cursor 룰 배포 CLI)과 동일한 배포 철학으로 설계한다.
외부 공개 npm 배포 목적이므로 회사 특정 정보는 포함하지 않는다.

---

## 기술 스택

- **언어**: TypeScript
- **런타임**: Node.js
- **CLI 인터랙션**: `@clack/prompts` (깔끔한 UI, inquirer 대신)
- **파일 시스템**: fs/path (Node.js 내장)
- **설정 저장**: `~/.claude/config.json` (API 정보 등)
- **패키지 배포**: npm (npx 실행 가능)
- **빌드**: tsup (TypeScript 번들러)

---

## 핵심 동작 원리

Claude Code는 시작 시 아래 경로를 자동으로 읽는다:

- `~/.claude/CLAUDE.md` — 글로벌 컨텍스트
- `~/.claude/skills/` — 글로벌 skills

이 패키지는 해당 경로에 skill 파일들을 설치해준다.
프로젝트 레포에 종속되지 않고 어디서든 동작한다.

---

## 폴더 구조 (목표)

```
claude-skills/
  src/
    index.ts              ← CLI 진입점 (bin)
    commands/
      install.ts          ← install 커맨드
      add.ts              ← add 커맨드 (기능 단위 추가)
      config.ts           ← config 커맨드 (설정 변경)
      list.ts             ← list 커맨드 (설치된 skill 목록)
    skills/
      readme-generator/
        SKILL.md          ← README 생성 skill 정의
        index.ts          ← 설치 로직
      issue-analyzer/
        SKILL.md          ← Jira 이슈 분석 skill 정의
        index.ts          ← 설치 로직 + Jira 설정 수집
    utils/
      config.ts           ← ~/.claude/config.json 읽기/쓰기
      fs.ts               ← 파일 복사, 경로 처리
      prompt.ts           ← clack/prompts 공통 래퍼
  package.json
  tsconfig.json
  tsup.config.ts
  README.md
```

---

## CLI 커맨드 목록

### `npx claude-skills install`

메인 설치 커맨드. 최초 설치 시 사용.

```
흐름:
1. 설치할 skill 목록 표시 (스페이스로 다중 선택)
2. 선택한 skill별로 필요한 설정 수집
3. ~/.claude/skills/ 에 파일 복사
4. ~/.claude/config.json 에 설정 저장
5. 설치 결과 요약 출력
```

### `npx claude-skills add <skill명>`

특정 skill만 추가 설치.

```
예: npx claude-skills add jira
```

### `npx claude-skills config <skill명>`

설치된 skill의 설정 변경.

```
예: npx claude-skills config jira
→ Jira URL, API Token, Project Key 재입력
```

### `npx claude-skills list`

현재 설치된 skill 목록 출력.

---

## install 플로우 상세

```
$ npx claude-skills install

┌─────────────────────────────────────┐
│  claude-skills installer            │
│  Claude Code용 Skills 설치 도구     │
└─────────────────────────────────────┘

? 설치할 기능을 선택하세요 (스페이스로 선택/해제, 엔터로 확인)
  ◉ README 자동 생성
  ◉ Jira 이슈 분석
  ◯ (추후 추가 예정...)

─── Jira 이슈 분석 설정 ───────────────
  이 기능은 Jira API 연동이 필요합니다.

? Jira Base URL을 입력하세요
  예: https://your-company.atlassian.net
  > _
  (건너뛰기: 엔터)

? Jira API Token을 입력하세요
  Atlassian 계정 → 보안 → API 토큰에서 생성
  > ****
  (건너뛰기: 엔터)

? Jira Project Key를 입력하세요
  예: PROJ, DEV, XBHL
  > _
  (건너뛰기: 엔터)

  ※ 건너뛰면 Jira 이슈 분석 기능은 설치되지 않습니다.
  ※ 나중에 `claude-skills add jira`로 추가할 수 있습니다.

─── 설치 결과 ─────────────────────────
  ✅ README 자동 생성    → ~/.claude/skills/readme-generator/
  ⏭️  Jira 이슈 분석     → 건너뜀 (claude-skills add jira로 추가 가능)

  이제 어느 프로젝트에서든 claude를 켜고 사용하세요.
  예: "이 프로젝트 README 만들어줘"
```

---

## Skills 상세 정의

### 1. README 자동 생성 (`readme-generator`)

**트리거 예시** (SKILL.md description에 포함):

- "README 만들어줘"
- "리드미 작성해줘"
- "README.md 생성해줘"
- "프로젝트 문서 만들어줘"

**동작**:

1. 사용자에게 구성 방식 선택 요청
   - [1] 기본 양식 (일반적인 README 구성)
   - [2] 커스텀 구성 (섹션 직접 선택)
2. 커스텀 선택 시 섹션 목록 표시 (스페이스 다중 선택)
   ```
   [1]  프로젝트 개요 + 배지
   [2]  스크린샷 / 데모 GIF
   [3]  주요 기능
   [4]  기술 스택 표
   [5]  시작하기 (설치 + 실행)
   [6]  환경변수 목록 (.env 항목)
   [7]  프로젝트 폴더 구조
   [8]  API 문서
   [9]  개발 가이드 (브랜치, 커밋, PR)
   [10] 배포 방법
   [11] 기여 방법
   [12] 라이선스
   ```
3. 선택 완료 후 확인 → 수정 가능
4. 선택한 섹션마다 정보 수집 방식 선택
   - 직접 입력
   - 건너뛰기
   - AI 자동 생성 (현재 폴더 코드베이스 분석)
5. Sub-agents 병렬 실행
   - Sub-agent 1: 폴더 구조 분석
   - Sub-agent 2: package.json, 기술스택 파악
   - Sub-agent 3: 기존 코드 패턴 분석
6. 결과 합쳐서 README.md 생성

**출력**: 현재 프로젝트 루트에 `README.md` 생성

---

### 2. Jira 이슈 분석 (`issue-analyzer`)

**트리거 예시**:

- "XBHL-1234 분석해줘"
- "[티켓키]-[번호] 이슈 파악해줘"
- "이 이슈 어디서 난 거야"
- "티켓 분석해줘"

**동작**:

1. 티켓 번호 파싱 (트리거 메시지에서 추출)
2. Sub-agents 병렬 실행
   - Sub-agent 1: Atlassian MCP → 티켓 내용 조회
   - Sub-agent 2: 코드베이스에서 관련 파일 탐색
   - Sub-agent 3: Git 히스토리에서 관련 커밋 탐색
3. 결과 합쳐서 분석 보고서 출력
   ```
   📁 관련 파일 (우선순위 순)
   🔍 코드 흐름 요약
   ⚠️  의심 원인 후보
   🔄 재현 방법 추측
   📝 관련 커밋 히스토리
   ```

**전제 조건**: 설치 시 Jira 설정이 입력되어 있어야 함
**설정 없으면**: "Jira 설정이 없습니다. `claude-skills config jira`로 설정하세요" 안내

---

## 설정 파일 구조

```json
// ~/.claude/config.json
{
  "version": "1.0.0",
  "skills": {
    "issue-analyzer": {
      "jira": {
        "baseUrl": "https://your-company.atlassian.net",
        "apiToken": "encrypted_token_here",
        "projectKey": "XBHL"
      }
    }
  }
}
```

API Token은 저장 시 암호화 처리한다.

---

## 개발 시 주의사항

- 외부 공개 npm 패키지이므로 회사명, 내부 도메인, 특정 프로젝트 키를 하드코딩하지 않는다
- 모든 회사/프로젝트 특정 정보는 설치 시 사용자 입력으로 받는다
- clack/prompts의 cancel 처리를 반드시 구현한다 (Ctrl+C 시 graceful exit)
- ~/.claude/ 디렉토리가 없으면 자동 생성한다
- 기존에 설치된 skill이 있으면 덮어쓸지 확인한다
- TypeScript strict 모드 사용
- 에러 메시지는 한국어/영어 둘 다 고려 (공개 패키지이므로)

---

## 추후 추가 예정 기능 (확장 가능 구조로 설계)

- 코드 리뷰 자동화 skill
- PR 설명 자동 생성 skill
- 커밋 메시지 생성 skill
- 테스트 코드 자동 생성 skill
- Confluence 문서 생성 skill
