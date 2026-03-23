---
name: server-deploy
description: |
  SSH로 원격 서버(QA/CI)에 배포하는 skill입니다.
  다음 상황에서 이 skill을 자동으로 실행하세요:
  - 사용자가 "qa 배포해줘", "qa build", "qa에 올려줘" 라고 말할 때
  - 사용자가 "ci 배포해줘", "ci build", "ci에 올려줘" 라고 말할 때
  - 사용자가 "배포해줘", "서버에 올려줘" 라고 말할 때 (서버 목록 확인 후 선택)
  - 사용자가 "qa 배포 상태 확인해줘", "ci 서버 확인해줘" 라고 말할 때
---

# Server Deploy Skill

SSH로 원격 서버에 접속해 git pull + 빌드까지 자동으로 수행합니다.

---

## 사전 조건 확인

`~/.claude/config.json`의 `skills.server-deploy.servers`에 서버 설정이 없으면:
```
서버 배포 설정이 없습니다.
npx chrys-tools add deploy 를 실행하여 설정하세요.
```

---

## 실행 순서

### 1단계: 설정 읽기

`~/.claude/config.json`에서 배포 대상 서버 정보를 읽습니다:

```json
{
  "skills": {
    "server-deploy": {
      "servers": {
        "qa": {
          "host": "192.168.1.100",
          "user": "ubuntu",
          "password": "****",
          "projectPath": "/var/www/my-app",
          "branch": "develop"
        },
        "ci": {
          "host": "192.168.1.101",
          "user": "ubuntu",
          "projectPath": "/var/www/my-app",
          "branch": "main"
        }
      }
    }
  }
}
```

### 2단계: 배포 확인

배포 전 아래 내용을 사용자에게 보여주고 확인을 받습니다:

```
## 배포 확인

서버:  QA (192.168.1.100)
경로:  /var/www/my-app
브랜치: develop
작업:  git fetch → git pull → npm run build

진행할까요? [Y] 배포  [N] 취소
```

### 3단계: SSH 배포 실행

**인증 방식에 따라 명령어를 다르게 실행합니다:**

#### password가 있는 서버 (QA):

plink 사용 (PuTTY/KiTTY 설치 시 자동 사용 가능):
```bash
plink -batch -pw "<password>" <user>@<host> "cd <projectPath> && git fetch origin && git pull origin <branch> && npm run build 2>&1"
```

plink가 없으면 sshpass 시도:
```bash
sshpass -p "<password>" ssh -o StrictHostKeyChecking=no <user>@<host> "cd <projectPath> && git fetch origin && git pull origin <branch> && npm run build 2>&1"
```

둘 다 없으면:
```
plink 또는 sshpass가 필요합니다.
PuTTY(https://www.putty.org)를 설치하면 plink를 사용할 수 있습니다.
```

#### password가 없는 서버 (CI):

```bash
ssh -o StrictHostKeyChecking=no <user>@<host> "cd <projectPath> && git fetch origin && git pull origin <branch> && npm run build 2>&1"
```

### 4단계: 결과 출력

```
## 배포 결과

서버: QA (192.168.1.100)
상태: ✅ 성공 / ❌ 실패

--- 빌드 출력 (마지막 20줄) ---
[빌드 로그 요약]
-------------------------------

[성공 시] QA 서버 배포가 완료되었습니다.
[실패 시] 오류 내용: [에러 메시지]
         해결 방법: [원인에 따른 안내]
```

---

## 여러 서버가 설정된 경우

"배포해줘"처럼 서버 명시 없이 요청하면 선택지를 보여줍니다:

```
배포할 서버를 선택해주세요:
1. QA  (192.168.1.100) — branch: develop
2. CI  (192.168.1.101) — branch: main
```
