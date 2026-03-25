---
name: present-generator
description: |
  현재 프로젝트를 분석해 발표/소개용 HTML 페이지를 생성합니다.
  다음 상황에서 이 skill을 자동으로 실행하세요:
  - 사용자가 "발표 자료 만들어줘", "발표용 HTML 만들어줘" 라고 말할 때
  - 사용자가 "소개 페이지 만들어줘", "프로젝트 소개 HTML 만들어줘" 라고 말할 때
  - 사용자가 "프레젠테이션 만들어줘", "프로젝트 설명 페이지 만들어줘" 라고 말할 때
  - 사용자가 "make a presentation", "create project intro page" 라고 말할 때
---

# Present Generator Skill

현재 프로젝트를 분석해 다크 터미널 테마의 세련된 HTML 발표 페이지를 생성합니다.
출력: 프로젝트 루트의 `presentation.html` (단일 파일, CDN 폰트만 외부 참조)

---

## 모델 라우팅

| 작업 | 모델 |
|------|------|
| 폴더 구조·package.json·기술 스택 분석 | `claude-haiku-4-5-20251001` |
| README·코드에서 목적·기능 추출 | `claude-haiku-4-5-20251001` |
| HTML 생성 | `claude-haiku-4-5-20251001` |

서브에이전트는 **요약된 결과만** 반환합니다. 파일 전체 내용 전달 금지.

---

## 실행 순서

### 1단계: 병렬 분석 (Haiku 서브에이전트 3개 동시)

**서브에이전트 1 — 프로젝트 기본 정보**
- `package.json` → name, **version** (반드시 포함), description, scripts 파악
- 폴더 구조 depth 2 파악
- 반환: `{ name, version, description, mainCommand, folderSummary }`

**서브에이전트 2 — 기술 스택**
- `package.json` dependencies + devDependencies 분석
- 주요 프레임워크/라이브러리/언어 추출 (최대 8개)
- 반환: `{ techStack: [{name, category}] }`

**서브에이전트 3 — 목적 & 기능**
- `README.md` 읽기 (없으면 src/ 주요 파일 2~3개)
- 프로젝트 목적, 배경, 핵심 기능 추출
- 반환: `{ purpose, motivation, features: [{title, desc, cliExample}] }` (기능 최대 4개)

---

### 2단계: 누락 정보 확인

분석 후 아래 항목이 불명확하면 **한 번에** 사용자에게 묻습니다:

```
자동으로 파악하지 못한 정보가 있습니다. 빈칸으로 두면 해당 섹션은 생략됩니다.

프로젝트 한 줄 슬로건:
왜 만들었나요 (배경/해결한 문제):
주요 사용 명령어/URL (예: npx my-tool install):
```

---

### 3단계: HTML 생성

아래 **HTML 생성 가이드**에 따라 `presentation.html`을 생성합니다.

> **중요**: version은 1단계에서 package.json에서 읽은 값을 그대로 사용합니다. 절대 하드코딩하거나 추측하지 않습니다.

---

### 4단계: 품질 다듬기 (자동 실행)

HTML 파일 저장 후 아래 스킬을 **순서대로** 실행해 완성도를 높입니다.
각 스킬은 생성된 파일을 직접 읽고 개선합니다.

| 순서 | 스킬 | 목적 |
|------|------|------|
| 1 | `typeset` | 폰트 계층·크기·행간·자간 정교화 |
| 2 | `arrange` | 레이아웃·스페이싱·비주얼 리듬 정렬 |
| 3 | `animate` | 애니메이션·마이크로인터랙션 강화 |
| 4 | `polish` | 최종 퀄리티 패스 — AI 답지 않은 디테일 완성 |

> 각 스킬 실행 후 파일이 저장되면 다음 스킬로 이어서 실행합니다.

---

## HTML 생성 가이드

### 디자인 토큰

```css
:root {
  --bg: #0d1117;  --bg2: #161b22;  --bg3: #21262d;
  --border: #30363d;
  --green: #00ff88;  --green-dim: #00cc6a;
  --blue: #58a6ff;  --red: #ff6e6e;  --yellow: #ffa657;
  --text: #e6edf3;  --text-dim: #8b949e;
}
```

폰트 (head에 포함):
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Noto+Sans+KR:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```

---

### 전체 CSS (그대로 사용)

```css
* { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { background:var(--bg); color:var(--text); font-family:'Noto Sans KR','Inter',sans-serif; overflow-x:hidden; word-break:keep-all; }

/* SCROLL PROGRESS */
#scroll-progress { position:fixed; top:0; left:0; height:2px; width:0%; background:linear-gradient(90deg,var(--green),var(--blue)); z-index:9999; transition:width .1s linear; }

/* NAV DOTS */
#nav-dots { position:fixed; right:1.5rem; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:.6rem; z-index:100; }
.nav-dot { width:8px; height:8px; border-radius:50%; background:var(--border); border:none; cursor:pointer; transition:all .3s; padding:0; }
.nav-dot.active { background:var(--green); box-shadow:0 0 8px var(--green); transform:scale(1.3); }
.nav-dot:hover { background:var(--text-dim); }

/* HERO */
.hero { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; padding:2rem; overflow:hidden; text-align:center; }
.hero::before { content:''; position:absolute; inset:0; background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,255,136,.1) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(88,166,255,.06) 0%, transparent 50%); pointer-events:none; }
.grid-bg { position:absolute; inset:0; background-image:linear-gradient(rgba(48,54,61,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(48,54,61,.3) 1px,transparent 1px); background-size:40px 40px; mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%); pointer-events:none; will-change:transform; }
.badge { display:inline-flex; align-items:center; gap:.5rem; background:rgba(0,255,136,.08); border:1px solid rgba(0,255,136,.25); border-radius:999px; padding:.45rem 1.2rem; font-size:.88rem; font-weight:500; color:var(--green); margin-bottom:2rem; animation:fadeDown .6s ease both; position:relative; overflow:hidden; }
.badge::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green); animation:pulse 2s ease infinite; flex-shrink:0; }
.badge::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(0,255,136,.15),transparent); transform:translateX(-100%); animation:badgeShimmer 3s ease 1.5s infinite; }
.hero h1 { font-family:'JetBrains Mono',monospace; font-size:clamp(2.2rem,5vw,3.8rem); font-weight:700; line-height:1.15; animation:fadeDown .7s ease .1s both; position:relative; }
.hero h1 .accent { color:var(--green); position:relative; display:inline-block; }
.hero h1 .accent::after { content:''; position:absolute; bottom:-4px; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--green),transparent); transform:scaleX(0); transform-origin:left; animation:underlineIn .8s ease .9s forwards; }
.hero > p { margin-top:1.5rem; font-size:clamp(.95rem,1.8vw,1.1rem); color:var(--text-dim); max-width:560px; line-height:1.9; animation:fadeDown .7s ease .2s both; }
.install-box { margin-top:2.5rem; display:flex; align-items:center; gap:1rem; background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:1rem 1.5rem; font-family:'JetBrains Mono',monospace; font-size:1rem; animation:fadeDown .7s ease .3s both; position:relative; overflow:hidden; transition:border-color .3s,box-shadow .3s; }
.install-box:hover { border-color:rgba(0,255,136,.4); box-shadow:0 0 20px rgba(0,255,136,.08); }
.install-box::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(0,255,136,.04),transparent); animation:shimmer 3s ease infinite; }
.install-box .prompt { color:var(--green); }
.copy-btn { margin-left:auto; background:none; border:1px solid var(--border); border-radius:6px; color:var(--text-dim); padding:.3rem .8rem; font-size:.75rem; cursor:pointer; transition:all .2s; font-family:'Inter',sans-serif; position:relative; z-index:1; }
.copy-btn:hover { border-color:var(--green); color:var(--green); background:rgba(0,255,136,.05); }
.copy-btn.copied { border-color:var(--green); color:var(--green); background:rgba(0,255,136,.1); }
.t-cursor { display:inline-block; width:2px; height:1em; background:var(--green); margin-left:2px; vertical-align:middle; animation:blink .7s step-end infinite; }
.hero-sub { margin-top:1.2rem; display:flex; gap:1.5rem; flex-wrap:wrap; justify-content:center; animation:fadeDown .7s ease .4s both; }
.hero-sub span { font-size:.82rem; color:var(--text-dim); display:flex; align-items:center; gap:.4rem; transition:color .2s; cursor:default; }
.hero-sub span:hover { color:var(--text); }
.scroll-hint { position:absolute; bottom:2rem; display:flex; flex-direction:column; align-items:center; gap:.5rem; color:var(--text-dim); font-size:.75rem; animation:fadeDown 1s ease .9s both; }
.scroll-hint .arrow { width:20px; height:20px; border-right:2px solid var(--border); border-bottom:2px solid var(--border); transform:rotate(45deg); animation:bounce 1.5s ease infinite; }

/* SECTION LABEL — 뱃지 스타일 (배경+테두리, 주석 블록처럼 보이게) */
.section-label { display:inline-block; font-family:'JetBrains Mono',monospace; font-size:.78rem; color:var(--green); background:rgba(0,255,136,.08); border:1px solid rgba(0,255,136,.2); border-radius:4px; padding:.2rem .65rem; margin-bottom:1rem; }

/* SECTIONS */
.section { padding:6rem 2rem; max-width:960px; margin:0 auto; }
.section-alt { background:var(--bg2); border-top:1px solid var(--border); border-bottom:1px solid var(--border); padding:6rem 2rem; }
.section-alt .section-inner { max-width:960px; margin:0 auto; }
.section-header { text-align:center; margin-bottom:3rem; }
.section-title { font-size:clamp(1.55rem,3vw,2.1rem); font-weight:700; line-height:1.3; margin-bottom:1rem; letter-spacing:-.01em; }
.section-desc { color:var(--text-dim); font-size:.97rem; line-height:1.85; max-width:620px; margin:0 auto; }

/* PAIN CARDS */
.pain-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1rem; margin-top:2.5rem; }
.pain-card { background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:1.5rem; transition:border-color .3s,opacity .5s,transform .3s,box-shadow .3s; opacity:0; transform:translateY(24px); }
.pain-card.in { opacity:1; transform:translateY(0); }
.pain-card:hover { border-color:#444c56; transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.3); }
.pain-card .icon { margin-bottom:.85rem; }
.pain-card h3 { font-size:.92rem; font-weight:600; margin-bottom:.6rem; }
.pain-card p { font-size:.86rem; color:var(--text-dim); line-height:1.75; }
.pain-card .strike { text-decoration:line-through; color:var(--red); opacity:.7; }
.pain-card .after { color:var(--green); font-size:.92rem; font-weight:600; margin-top:.85rem; display:flex; align-items:center; gap:.4rem; }
.pain-card .after code { font-family:'JetBrains Mono',monospace; font-size:.83rem; background:rgba(0,255,136,.1); padding:.15em .45em; border-radius:4px; }

/* FEATURE CARDS */
.feature-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1.5rem; }
.feature-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:border-color .3s,box-shadow .3s; opacity:0; transform:translateY(32px); }
.feature-card.in { opacity:1; transform:translateY(0); transition:opacity .5s ease,transform .5s ease,border-color .3s,box-shadow .3s; }
.feature-card:hover { border-color:rgba(0,255,136,.35); box-shadow:0 12px 36px rgba(0,0,0,.4),0 0 0 1px rgba(0,255,136,.1); }
.card-header { padding:1.5rem 1.5rem 1rem; border-bottom:1px solid var(--border); display:flex; align-items:flex-start; gap:1rem; }
.card-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:transform .3s; }
.feature-card:hover .card-icon { transform:scale(1.1) rotate(-3deg); }
.card-icon svg { width:20px; height:20px; stroke-width:1.8; }
.icon-green { background:rgba(0,255,136,.1); border:1px solid rgba(0,255,136,.2); }
.icon-green svg { stroke:#00ff88; }
.icon-blue { background:rgba(88,166,255,.1); border:1px solid rgba(88,166,255,.2); }
.icon-blue svg { stroke:#58a6ff; }
.icon-yellow { background:rgba(255,166,87,.1); border:1px solid rgba(255,166,87,.2); }
.icon-yellow svg { stroke:#ffa657; }
.icon-red { background:rgba(255,110,110,.1); border:1px solid rgba(255,110,110,.2); }
.icon-red svg { stroke:#ff6e6e; }
.icon-purple { background:rgba(188,140,255,.1); border:1px solid rgba(188,140,255,.2); }
.icon-purple svg { stroke:#bc8cff; }
.card-title { font-size:1rem; font-weight:600; margin-bottom:.3rem; }
.card-subtitle { font-size:.8rem; color:var(--text-dim); line-height:1.5; }
.card-body { padding:1.25rem 1.5rem 1.5rem; }

/* TERMINAL */
.terminal { background:var(--bg); border:1px solid var(--border); border-radius:8px; overflow:hidden; font-family:'JetBrains Mono',monospace; font-size:.84rem; transition:border-color .3s; }
.feature-card:hover .terminal { border-color:#444c56; }
.terminal-bar { padding:.5rem .75rem; background:var(--bg3); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:.4rem; }
.dot { width:10px; height:10px; border-radius:50%; }
.dot-red { background:#ff6058; } .dot-yellow { background:#ffbd2e; } .dot-green { background:#28c840; }
.terminal-content { padding:.9rem 1.1rem; line-height:2.1; min-height:5.5rem; }
.t-prompt { color:var(--green); } .t-cmd { color:var(--text); } .t-out { color:var(--text-dim); }
.t-success { color:var(--green); } .t-info { color:var(--blue); } .t-warn { color:var(--yellow); }

/* FLOW STEPS */
.flow-steps { margin-top:1rem; display:flex; flex-direction:column; gap:.5rem; }
.flow-step { display:flex; align-items:flex-start; gap:.75rem; font-size:.85rem; }
.step-num { width:22px; height:22px; border-radius:50%; background:rgba(0,255,136,.1); border:1px solid rgba(0,255,136,.3); display:flex; align-items:center; justify-content:center; font-size:.72rem; color:var(--green); flex-shrink:0; font-family:'JetBrains Mono',monospace; transition:all .3s; }
.flow-step:hover .step-num { background:rgba(0,255,136,.2); box-shadow:0 0 8px rgba(0,255,136,.3); }
.step-text { color:var(--text-dim); line-height:1.65; padding-top:2px; }
.step-text strong { color:var(--text); }

/* PIPELINE */
.pipeline { display:flex; flex-direction:column; gap:0; position:relative; }
.pipeline::before { content:''; position:absolute; left:24px; top:24px; bottom:24px; width:1px; background:linear-gradient(to bottom,var(--green),var(--blue),transparent); }
.pipeline-step { display:flex; gap:1.5rem; padding:1.25rem 0; opacity:0; transform:translateX(-20px); transition:opacity .5s ease,transform .5s ease; }
.pipeline-step.in { opacity:1; transform:translateX(0); }
.pipe-dot { width:48px; height:48px; border-radius:50%; background:var(--bg3); border:2px solid var(--border); display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-size:.82rem; color:var(--green); flex-shrink:0; z-index:1; transition:all .3s; }
.pipeline-step:hover .pipe-dot { border-color:var(--green); box-shadow:0 0 12px rgba(0,255,136,.3); background:rgba(0,255,136,.08); }
.pipe-content h3 { font-size:1rem; font-weight:600; margin-bottom:.3rem; }
.pipe-content p { font-size:.86rem; color:var(--text-dim); line-height:1.7; }
.pipe-code { margin-top:.5rem; font-family:'JetBrains Mono',monospace; font-size:.82rem; color:var(--blue); background:var(--bg); border:1px solid var(--border); border-radius:6px; padding:.4rem .75rem; display:inline-block; transition:all .2s; }
.pipeline-step:hover .pipe-code { border-color:var(--blue); }

/* TECH STACK */
.tech-grid { display:flex; flex-wrap:wrap; gap:.75rem; justify-content:center; margin-top:2rem; }
.tech-badge { background:var(--bg2); border:1px solid var(--border); border-radius:8px; padding:.5rem 1.1rem; font-size:.85rem; color:var(--text-dim); font-family:'JetBrains Mono',monospace; transition:all .25s,opacity .4s,transform .4s; opacity:0; transform:scale(.9); cursor:default; }
.tech-badge.in { opacity:1; transform:scale(1); }
.tech-badge:hover { border-color:var(--green); color:var(--green); background:rgba(0,255,136,.06); transform:scale(1.05); box-shadow:0 0 12px rgba(0,255,136,.15); }

/* INSTALL */
.big-install { margin-top:2rem; background:var(--bg2); border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:border-color .3s,box-shadow .3s; }
.big-install:hover { border-color:rgba(0,255,136,.3); box-shadow:0 0 30px rgba(0,255,136,.07); }
.big-install-code { padding:1.5rem 2rem; font-family:'JetBrains Mono',monospace; font-size:1.05rem; text-align:left; }
.install-steps { margin-top:1.75rem; display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; text-align:left; }
.install-step { padding:1rem; background:var(--bg2); border:1px solid var(--border); border-radius:8px; opacity:0; transform:translateY(16px); transition:all .25s; }
.install-step.in { opacity:1; transform:translateY(0); }
.install-step:hover { border-color:rgba(0,255,136,.3); transform:translateY(-2px); }
.install-step .num { font-family:'JetBrains Mono',monospace; font-size:.78rem; color:var(--green); margin-bottom:.45rem; }
.install-step p { font-size:.84rem; color:var(--text-dim); line-height:1.65; }

/* FOOTER */
footer { border-top:1px solid var(--border); padding:2.5rem 2rem; text-align:center; color:var(--text-dim); font-size:.82rem; font-family:'JetBrains Mono',monospace; }
footer .brand { color:var(--green); }
footer .links { margin-top:.75rem; display:flex; justify-content:center; gap:1.5rem; }
footer a { color:var(--text-dim); text-decoration:none; transition:color .2s; font-size:.8rem; display:flex; align-items:center; gap:.35rem; }
footer a:hover { color:var(--green); }

/* ANIMATIONS */
@keyframes fadeDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
@keyframes bounce { 0%,100% { transform:rotate(45deg) translateY(0); } 50% { transform:rotate(45deg) translateY(5px); } }
@keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(200%); } }
@keyframes badgeShimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(300%); } }
@keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
@keyframes underlineIn { to { transform:scaleX(1); } }
.reveal { opacity:0; transform:translateY(24px); transition:opacity .65s ease,transform .65s ease; }
.reveal.visible { opacity:1; transform:none; }

/* RESPONSIVE */
@media (max-width:768px) {
  #nav-dots { display:none; }
}
@media (max-width:640px) {
  .feature-grid { grid-template-columns:1fr; }
  .pain-grid { grid-template-columns:1fr; }
  .install-steps { grid-template-columns:1fr; }
  .pipeline::before { display:none; }
  .hero-sub { gap:1rem; }
  .section { padding:4rem 1.25rem; }
  .section-alt { padding:4rem 1.25rem; }
}
/* 뷰포트 높이가 낮을 때 scroll-hint 숨김 (요소 겹침 방지) */
@media (max-height:600px) {
  .scroll-hint { display:none; }
  .hero { min-height:auto; padding:5rem 2rem; }
}
```

---

### 페이지 구조 (섹션 선택 기준)

| 섹션 | 포함 조건 |
|------|----------|
| Hero | 항상 포함 |
| Why (배경/문제) | `motivation` 정보 있을 때 |
| Features | 항상 포함 (기능 없으면 주요 사용법으로 대체) |
| How it works | 단계별 흐름 파악 가능할 때 |
| Tech Stack | techStack 2개 이상일 때 |
| Install / 시작하기 | 설치 또는 실행 명령어 있을 때 |
| Footer | 항상 포함 |

---

### 고정 UI 요소 (body 시작 직후에 추가)

```html
<!-- 스크롤 진행바 -->
<div id="scroll-progress"></div>

<!-- 네비게이션 도트 (섹션 수만큼 생성) -->
<div id="nav-dots">
  <div class="nav-dot active" data-section="0" title="Hero"></div>
  <!-- 섹션마다 하나씩 추가 -->
</div>
```

---

### 섹션별 HTML 패턴

각 섹션에 `data-section="N"` 속성을 부여합니다 (0부터 순서대로).

#### Hero

```html
<section class="hero" data-section="0">
  <div class="grid-bg" id="parallax-grid"></div>
  <div class="badge"><span><!-- v{version} 또는 "npm에서 바로 사용 가능" --></span></div>
  <h1><span class="accent"><!-- 프로젝트명 --></span><br/><!-- 슬로건 (동사 포함, 짧게) --></h1>
  <p><!-- 2~3줄 설명. 무엇을 해결하는지 명확하게 --></p>
  <!-- 주요 명령어 있으면 -->
  <div class="install-box">
    <span class="prompt">$</span>
    <span class="cmd" id="hero-cmd"></span><span class="t-cursor"></span>
    <button class="copy-btn" onclick="copyCmd(this,'<!-- 명령어 -->')">copy</button>
  </div>
  <!-- 주요 수치/특징이 있으면 hero-sub 추가 (span 요소로 나열) -->
  <div class="hero-sub">
    <span><!-- 수치 + 라벨 (예: 4 Skills) --></span>
    <span><!-- 수치 + 라벨 (예: npx 설치 불필요) --></span>
  </div>
  <div class="scroll-hint"><div class="arrow"></div><span>scroll</span></div>
</section>
```

#### Why / 배경 (pain-card는 2~3개, before→after 형태로)

```html
<section class="section reveal" data-section="N">
  <div class="section-header">
    <div class="section-label">// why</div>
    <h2 class="section-title"><!-- "왜 만들었나요" 또는 문제 제기 제목 --></h2>
    <p class="section-desc"><!-- 배경 설명 1~2줄 --></p>
  </div>
  <div class="pain-grid">
    <div class="pain-card">
      <div class="icon"><i data-lucide="x-circle" style="color:var(--red);width:20px;height:20px"></i></div>
      <h3><!-- 문제점 제목 --></h3>
      <p><span class="strike"><!-- 기존 방식 --></span></p>
      <div class="after"><code><!-- 해결 방식 --></code></div>
    </div>
  </div>
</section>
```

#### Features (feature-card는 최대 4개)

각 `.terminal-content`에 `data-lines` 속성으로 터미널 출력 줄을 정의합니다.

```html
<section class="section reveal" data-section="N">
  <div class="section-header">
    <div class="section-label">// features</div>
    <h2 class="section-title">주요 기능</h2>
  </div>
  <div class="feature-grid">
    <div class="feature-card">
      <div class="card-header">
        <div class="card-icon icon-green"><i data-lucide="<!-- lucide 아이콘명 -->"></i></div>
        <div>
          <div class="card-title"><!-- 기능명 --></div>
          <div class="card-subtitle"><!-- 한 줄 설명 --></div>
        </div>
      </div>
      <div class="card-body">
        <!-- CLI 예시 있으면 terminal 블록 (data-lines로 타이핑 시퀀스 정의) -->
        <div class="terminal">
          <div class="terminal-bar">
            <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
          </div>
          <div class="terminal-content" data-lines='[
            {"type":"cmd","text":"<!-- 명령어 -->"},
            {"type":"out","text":"<!-- 출력 예시 -->"},
            {"type":"success","text":"<!-- 성공 메시지 -->"}
          ]'></div>
        </div>
        <!-- 또는 flow-steps -->
        <div class="flow-steps">
          <div class="flow-step">
            <div class="step-num">1</div>
            <div class="step-text"><strong>단계명</strong> — 설명</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

#### How it works (pipeline — 3~5단계)

```html
<div class="section-alt reveal" data-section="N">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-label">// how it works</div>
      <h2 class="section-title">동작 방식</h2>
    </div>
    <div class="pipeline">
      <div class="pipeline-step">
        <div class="pipe-dot">01</div>
        <div class="pipe-content">
          <h3><!-- 단계명 --></h3>
          <p><!-- 설명 --></p>
          <code class="pipe-code"><!-- 관련 명령어 (선택) --></code>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### Tech Stack

```html
<section class="section reveal" data-section="N" style="text-align:center">
  <div class="section-header">
    <div class="section-label">// stack</div>
    <h2 class="section-title">기술 스택</h2>
  </div>
  <div class="tech-grid">
    <span class="tech-badge">TypeScript</span>
    <!-- 각 기술 하나씩 -->
  </div>
</section>
```

#### Install / 시작하기

```html
<section class="section reveal" data-section="N" style="max-width:700px; text-align:center">
  <div class="section-header">
    <div class="section-label">// get started</div>
    <h2 class="section-title">시작하기</h2>
  </div>
  <div class="big-install">
    <div class="terminal-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
      <span style="margin-left:auto">
        <button class="copy-btn" onclick="copyCmd(this,'<!-- 설치 명령어 -->')">copy</button>
      </span>
    </div>
    <div class="big-install-code">
      <div><span style="color:var(--green)">$</span> <span style="color:var(--text)"><!-- 설치 명령어 --></span></div>
    </div>
  </div>
  <div class="install-steps">
    <div class="install-step"><div class="num">// 01</div><p><!-- 1단계 --></p></div>
    <div class="install-step"><div class="num">// 02</div><p><!-- 2단계 --></p></div>
    <div class="install-step"><div class="num">// 03</div><p><!-- 3단계 --></p></div>
  </div>
</section>
```

#### Footer

npm 패키지인 경우 npm 링크, GitHub 링크, Claude Code 링크를 포함합니다.

```html
<footer>
  <span class="brand"><!-- 프로젝트명 --></span> · v<!-- {version, package.json에서 읽은 값} --> · <!-- 라이선스 또는 기술 스택 요약 -->
  <div class="links">
    <!-- npm 패키지면 -->
    <a href="https://www.npmjs.com/package/<!-- 패키지명 -->" target="_blank">npm</a>
    <!-- GitHub 있으면 -->
    <a href="<!-- GitHub URL -->" target="_blank">github</a>
    <!-- Claude Code 관련 도구면 -->
    <a href="https://claude.ai/code" target="_blank">claude code</a>
  </div>
</footer>
```

---

### JS (body 닫기 전에 추가)

```html
<script>
  lucide.createIcons();

  // 섹션 목록 (data-section 속성 기준)
  const sections = Array.from(document.querySelectorAll('[data-section]'));
  const dots = Array.from(document.querySelectorAll('.nav-dot'));

  // 스크롤 진행바 + 네비게이션 도트
  window.addEventListener('scroll', () => {
    const prog = document.getElementById('scroll-progress');
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    if (prog) prog.style.width = pct + '%';

    let cur = 0;
    sections.forEach((s, i) => {
      if (window.scrollY >= s.offsetTop - window.innerHeight / 2) cur = i;
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === cur));
  });

  // 네비게이션 도트 클릭
  dots.forEach((d, i) => {
    d.addEventListener('click', () => {
      if (sections[i]) sections[i].scrollIntoView({ behavior: 'smooth' });
    });
  });

  // 히어로 타이핑 애니메이션
  const HERO_CMD = '<!-- 대표 명령어 (예: npx chrys-tools install) -->';
  function typeHero() {
    const el = document.getElementById('hero-cmd');
    if (!el) return;
    let i = 0;
    const iv = setInterval(() => {
      el.textContent = HERO_CMD.slice(0, ++i);
      if (i >= HERO_CMD.length) clearInterval(iv);
    }, 55);
  }
  setTimeout(typeHero, 800);

  // 패럴랙스 그리드
  document.addEventListener('mousemove', (e) => {
    const g = document.getElementById('parallax-grid');
    if (!g) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 18;
    const y = (e.clientY / window.innerHeight - 0.5) * 18;
    g.style.transform = `translate(${x}px,${y}px)`;
  });

  // copy 버튼 피드백
  function copyCmd(btn, cmd) {
    navigator.clipboard.writeText(cmd);
    const orig = btn.textContent;
    btn.textContent = '✓ copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1800);
  }

  // reveal (.reveal 섹션)
  const revealObs = new IntersectionObserver(
    (es) => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  // 스태거 애니메이션 (.in 클래스 방식)
  const staggerObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const items = entry.target.querySelectorAll(
        '.pain-card, .feature-card, .pipeline-step, .tech-badge, .install-step'
      );
      items.forEach((el, i) => {
        setTimeout(() => el.classList.add('in'), i * 80);
      });
      staggerObs.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.pain-grid, .feature-grid, .pipeline, .tech-grid, .install-steps')
    .forEach(el => staggerObs.observe(el));

  // 터미널 타이핑 시퀀스 (data-lines 속성)
  const termObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const tc = entry.target;
      let lines;
      try { lines = JSON.parse(tc.dataset.lines || '[]'); } catch { return; }
      tc.innerHTML = '';
      let delay = 0;
      lines.forEach(line => {
        setTimeout(() => {
          const div = document.createElement('div');
          if (line.type === 'cmd') {
            div.innerHTML = `<span class="t-prompt">$ </span><span class="t-cmd">${line.text}</span>`;
          } else {
            div.className = `t-${line.type}`;
            div.textContent = line.text;
          }
          tc.appendChild(div);
        }, delay);
        delay += line.type === 'cmd' ? line.text.length * 30 + 200 : 300;
      });
      termObs.unobserve(tc);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.terminal-content[data-lines]').forEach(el => termObs.observe(el));
</script>
```

---

## 출력 규칙

- 단일 파일 (인라인 CSS, CDN 폰트·lucide만 외부)
- 정보 없는 섹션은 과감히 생략 (빈 섹션 금지)
- 언어: README 언어 따름 (없으면 한국어)
- **version은 반드시 package.json에서 읽은 값 사용** — 하드코딩 금지
- nav-dot 수는 실제 섹션(data-section 부여된 것) 수와 일치시킴

### 기존 파일 처리

생성 전 프로젝트 루트에 `presentation.html`이 이미 있으면 덮어쓰지 말고 먼저 확인합니다:

```
presentation.html 이 이미 존재합니다.

[1] 덮어쓰기          (기존 파일 교체)
[2] 새 파일로 저장    (presentation-2.html, presentation-3.html 순으로 번호 증가)
[3] 취소
```

- **[1]** → `presentation.html` 덮어쓰기
- **[2]** → 존재하지 않는 번호를 찾아 `presentation-N.html`로 저장
- **[3]** → 생성 중단

### 완료 메시지

```
✅ presentation.html 생성 완료!
브라우저에서 열어보세요.
```
