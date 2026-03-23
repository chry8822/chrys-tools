---
name: server-deploy
description: |
  SSH로 원격 서버(QA/CI)에 배포하는 skill입니다.
  다음 상황에서 이 skill을 자동으로 실행하세요:
  - 사용자가 "qa 배포해줘", "qa build", "qa에 올려줘" 라고 말할 때
  - 사용자가 "ci 배포해줘", "ci build", "ci에 올려줘" 라고 말할 때
  - 사용자가 "배포해줘", "서버에 올려줘" 라고 말할 때 (서버 목록 확인 후 선택)
---

# Server Deploy Skill

SSH로 원격 서버에 접속해 브랜치 확인 → 최신 커밋 검토 → 예외 처리 → 빌드까지 수행합니다.

---

## 사전 조건 확인

`~/.claude/config.json`의 `skills.server-deploy.servers`에 서버 설정이 없으면:
```
서버 배포 설정이 없습니다.
npx chrys-tools add deploy 를 실행하여 설정하세요.
```

---

## 실행 순서

### 1단계: 브랜치 입력

사용자에게 배포할 브랜치를 묻습니다:

```
브랜치:
```

사용자가 브랜치를 입력하면 다음 단계로 진행합니다.

---

### 2단계: fetch + pull + 최신 커밋 확인

**경로 변경이 필요한 경우:**
사용자가 대화 중에 경로를 명시하면 config 경로 대신 해당 경로를 사용합니다.
```
"qa 배포하는데 경로는 /app/frontend야"  → /app/frontend 사용
"이번엔 /app/front-v2로 배포해줘"       → /app/front-v2 사용
```
영구 변경은 `npx chrys-tools config deploy` 로 가능하다고 안내합니다.

SSH로 서버에 접속해 아래 명령어를 순서대로 실행합니다:

```bash
cd <projectPath> && git fetch origin && git checkout <branch> && git pull origin <branch> && git log --oneline -5
```

결과를 아래 형식으로 출력합니다:

```
## 최신 커밋 내역 (QA / branch: develop)

a1b2c3d 로그인 화면 API 연동 수정
e4f5g6h 사용자 목록 페이지네이션 추가
i7j8k9l 거래정보 화면 필드 오타 수정
m0n1o2p 스타일 일부 수정
q3r4s5t 초기 세팅

이 커밋으로 배포하시겠습니까?  [Y] 배포  [N] 취소
```

---

### 3단계: git status 확인

사용자가 Y를 선택하면 먼저 서버 상태를 점검합니다:

```bash
cd <projectPath> && git status
```

#### 상태가 clean한 경우 (`nothing to commit`)
→ 4단계(빌드)로 바로 진행

#### 변경사항 또는 충돌이 있는 경우
아래처럼 상황을 보여주고 사용자에게 선택권을 줍니다:

```
⚠️  서버에 uncommitted 변경사항이 있습니다.

변경된 파일:
- src/app/api/api.ts (modified)
- src/components/Header.tsx (modified)

어떻게 할까요?
[1] 변경사항 stash 후 배포 진행  (git stash → pull → build)
[2] 변경사항 무시하고 강제 pull   (git checkout . → pull → build)
[3] 배포 취소
```

**[1] stash 선택 시:**
```bash
cd <projectPath> && git stash && git pull origin <branch> && git log --oneline -3
```

**[2] 강제 pull 선택 시:**
```bash
cd <projectPath> && git checkout . && git pull origin <branch>
```

**[3] 취소 시:**
배포를 중단하고 사용자에게 서버 상태를 안내합니다.

#### 경로를 찾을 수 없는 경우 (`No such file or directory`)

```
❌ 경로를 찾을 수 없습니다: /app/front

올바른 경로를 알려주시면 바로 진행하겠습니다.
영구 변경은 npx chrys-tools config deploy 로 가능합니다.
```

#### merge conflict가 있는 경우
```
❌ Merge conflict가 감지되었습니다.

충돌 파일:
- src/app/api/api.ts

자동으로 해결할 수 없습니다.
서버에 직접 접속해서 충돌을 해결한 뒤 다시 시도해주세요.

SSH 접속 명령어:
ssh <user>@<host>
cd <projectPath>
```

---

### 4단계: 빌드 실행

```bash
cd <projectPath> && npm run build 2>&1
```

빌드 진행 중임을 안내합니다:
```
빌드 중... (npm run build)
```

---

### 5단계: 결과 출력

#### 성공 시
```
✅ 배포 완료

서버:   QA (192.168.1.100)
브랜치: develop
커밋:   a1b2c3d 로그인 화면 API 연동 수정
```

#### 빌드 실패 시
빌드 에러 로그 마지막 30줄을 출력하고 원인을 분석합니다:

```
❌ 빌드 실패

에러 내용:
[에러 로그 마지막 30줄]

원인 분석: [타입 에러 / 모듈 없음 / 문법 오류 등]

어떻게 할까요?
[1] 에러 내용 상세 분석 요청
[2] 배포 취소
```

---

## SSH 명령어 구성

**password가 있는 서버 (QA) — plink 우선, sshpass 대체:**

plink 사용:
```bash
plink -batch -pw "<password>" <user>@<host> "<commands>"
```

plink 없으면 sshpass:
```bash
sshpass -p "<password>" ssh -o StrictHostKeyChecking=no <user>@<host> "<commands>"
```

**password가 없는 서버 (CI) — SSH 키 인증:**
```bash
ssh -o StrictHostKeyChecking=no <user>@<host> "<commands>"
```

---

## 여러 서버가 설정된 경우

"배포해줘"처럼 서버 명시 없이 요청하면 먼저 서버를 선택합니다:

```
배포할 서버를 선택해주세요:
1. QA  (192.168.1.100)
2. CI  (192.168.1.101)
```

선택 후 브랜치 입력부터 동일하게 진행합니다.
