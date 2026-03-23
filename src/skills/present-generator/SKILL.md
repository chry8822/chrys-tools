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
- `package.json` → name, version, description, scripts 파악
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
body { background:var(--bg); color:var(--text); font-family:'Noto Sans KR','Inter',sans-serif; overflow-x:hidden; word-break:keep-all; }

/* HERO */
.hero { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; padding:2rem; overflow:hidden; text-align:center; }
.hero::before { content:''; position:absolute; inset:0; background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,255,136,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(88,166,255,0.05) 0%, transparent 50%); pointer-events:none; }
.grid-bg { position:absolute; inset:0; background-image:linear-gradient(rgba(48,54,61,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(48,54,61,0.3) 1px,transparent 1px); background-size:40px 40px; mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%); pointer-events:none; }
.badge { display:inline-flex; align-items:center; gap:.5rem; background:rgba(0,255,136,.08); border:1px solid rgba(0,255,136,.25); border-radius:999px; padding:.45rem 1.2rem; font-size:.88rem; font-weight:500; color:var(--green); margin-bottom:2rem; animation:fadeDown .6s ease both; }
.badge::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green); animation:pulse 2s ease infinite; }
.hero h1 { font-family:'JetBrains Mono',monospace; font-size:clamp(2.2rem,5vw,3.6rem); font-weight:700; line-height:1.15; animation:fadeDown .7s ease .1s both; }
.hero h1 .accent { color:var(--green); }
.hero > p { margin-top:1.5rem; font-size:clamp(.95rem,1.8vw,1.1rem); color:var(--text-dim); max-width:560px; line-height:1.85; animation:fadeDown .7s ease .2s both; }
.install-box { margin-top:2.5rem; display:flex; align-items:center; gap:1rem; background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:1rem 1.5rem; font-family:'JetBrains Mono',monospace; font-size:1rem; animation:fadeDown .7s ease .3s both; position:relative; overflow:hidden; }
.install-box::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(0,255,136,.03),transparent); animation:shimmer 3s ease infinite; }
.install-box .prompt { color:var(--green); }
.copy-btn { margin-left:auto; background:none; border:1px solid var(--border); border-radius:6px; color:var(--text-dim); padding:.3rem .7rem; font-size:.75rem; cursor:pointer; transition:all .2s; }
.copy-btn:hover { border-color:var(--green); color:var(--green); }
.scroll-hint { position:absolute; bottom:2rem; display:flex; flex-direction:column; align-items:center; gap:.5rem; color:var(--text-dim); font-size:.75rem; animation:fadeDown 1s ease .8s both; }
.scroll-hint .arrow { width:20px; height:20px; border-right:2px solid var(--border); border-bottom:2px solid var(--border); transform:rotate(45deg); animation:bounce 1.5s ease infinite; }

/* SECTIONS */
.section { padding:6rem 2rem; max-width:960px; margin:0 auto; }
.section-alt { background:var(--bg2); border-top:1px solid var(--border); border-bottom:1px solid var(--border); padding:6rem 2rem; }
.section-alt .section-inner { max-width:960px; margin:0 auto; }
.section-header { text-align:center; margin-bottom:3rem; }
.section-title { font-size:clamp(1.55rem,3vw,2.1rem); font-weight:700; line-height:1.3; margin-bottom:1rem; letter-spacing:-.01em; }
.section-desc { color:var(--text-dim); font-size:.97rem; line-height:1.85; max-width:600px; margin:0 auto; }

/* PAIN CARDS */
.pain-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:1rem; margin-top:2.5rem; }
.pain-card { background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:1.5rem; transition:border-color .2s; }
.pain-card:hover { border-color:#444c56; }
.pain-card .icon { margin-bottom:.85rem; }
.pain-card h3 { font-size:.92rem; font-weight:600; margin-bottom:.5rem; }
.pain-card p { font-size:.87rem; color:var(--text-dim); line-height:1.7; }
.pain-card .strike { text-decoration:line-through; color:var(--red); opacity:.7; }
.pain-card .after { color:var(--green); font-size:.95rem; font-weight:600; margin-top:.75rem; display:block; }
.pain-card .after code { font-family:'JetBrains Mono',monospace; font-size:.85rem; background:rgba(0,255,136,.1); padding:.1em .35em; border-radius:4px; }

/* FEATURE CARDS */
.feature-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:1.5rem; }
.feature-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:transform .2s,border-color .2s; }
.feature-card:hover { transform:translateY(-3px); border-color:rgba(0,255,136,.3); }
.card-header { padding:1.5rem 1.5rem 1rem; border-bottom:1px solid var(--border); display:flex; align-items:flex-start; gap:1rem; }
.card-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.card-icon svg { width:20px; height:20px; stroke-width:1.8; }
.icon-green { background:rgba(0,255,136,.1); border:1px solid rgba(0,255,136,.2); }
.icon-green svg { stroke:#00ff88; }
.icon-blue { background:rgba(88,166,255,.1); border:1px solid rgba(88,166,255,.2); }
.icon-blue svg { stroke:#58a6ff; }
.icon-yellow { background:rgba(255,166,87,.1); border:1px solid rgba(255,166,87,.2); }
.icon-yellow svg { stroke:#ffa657; }
.icon-red { background:rgba(255,110,110,.1); border:1px solid rgba(255,110,110,.2); }
.icon-red svg { stroke:#ff6e6e; }
.card-title { font-size:1rem; font-weight:600; margin-bottom:.3rem; }
.card-subtitle { font-size:.8rem; color:var(--text-dim); line-height:1.5; }
.card-body { padding:1.25rem 1.5rem 1.5rem; }

/* TERMINAL */
.terminal { background:var(--bg); border:1px solid var(--border); border-radius:8px; overflow:hidden; font-family:'JetBrains Mono',monospace; font-size:.88rem; }
.terminal-bar { padding:.5rem .75rem; background:var(--bg3); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:.4rem; }
.dot { width:10px; height:10px; border-radius:50%; }
.dot-red { background:#ff6058; } .dot-yellow { background:#ffbd2e; } .dot-green { background:#28c840; }
.terminal-content { padding:.9rem 1.1rem; line-height:2.0; }
.t-prompt { color:var(--green); } .t-cmd { color:var(--text); } .t-out { color:var(--text-dim); }
.t-success { color:var(--green); } .t-info { color:var(--blue); } .t-warn { color:var(--yellow); }

/* FLOW STEPS */
.flow-steps { margin-top:1rem; display:flex; flex-direction:column; gap:.5rem; }
.flow-step { display:flex; align-items:flex-start; gap:.75rem; font-size:.85rem; }
.step-num { width:22px; height:22px; border-radius:50%; background:rgba(0,255,136,.1); border:1px solid rgba(0,255,136,.3); display:flex; align-items:center; justify-content:center; font-size:.75rem; color:var(--green); flex-shrink:0; font-family:'JetBrains Mono',monospace; }
.step-text { color:var(--text-dim); line-height:1.6; padding-top:2px; }
.step-text strong { color:var(--text); }

/* PIPELINE */
.pipeline { display:flex; flex-direction:column; gap:0; position:relative; }
.pipeline::before { content:''; position:absolute; left:24px; top:24px; bottom:24px; width:1px; background:linear-gradient(to bottom,var(--green),var(--blue),transparent); }
.pipeline-step { display:flex; gap:1.5rem; padding:1.25rem 0; }
.pipe-dot { width:48px; height:48px; border-radius:50%; background:var(--bg3); border:2px solid var(--border); display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-size:.85rem; color:var(--green); flex-shrink:0; z-index:1; }
.pipe-content h3 { font-size:1rem; font-weight:600; margin-bottom:.3rem; }
.pipe-content p { font-size:.86rem; color:var(--text-dim); line-height:1.7; }
.pipe-code { margin-top:.5rem; font-family:'JetBrains Mono',monospace; font-size:.85rem; color:var(--blue); background:var(--bg); border:1px solid var(--border); border-radius:6px; padding:.4rem .75rem; display:inline-block; }

/* TECH STACK */
.tech-grid { display:flex; flex-wrap:wrap; gap:.75rem; justify-content:center; margin-top:2rem; }
.tech-badge { background:var(--bg2); border:1px solid var(--border); border-radius:8px; padding:.5rem 1rem; font-size:.85rem; color:var(--text-dim); font-family:'JetBrains Mono',monospace; transition:all .2s; }
.tech-badge:hover { border-color:var(--green); color:var(--green); }

/* INSTALL */
.big-install { margin-top:2rem; background:var(--bg2); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.big-install-code { padding:1.5rem 2rem; font-family:'JetBrains Mono',monospace; font-size:1.1rem; }
.install-steps { margin-top:2rem; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem; text-align:left; }
.install-step { padding:1rem; background:var(--bg2); border:1px solid var(--border); border-radius:8px; }
.install-step .num { font-family:'JetBrains Mono',monospace; font-size:.82rem; color:var(--green); margin-bottom:.4rem; }
.install-step p { font-size:.84rem; color:var(--text-dim); line-height:1.65; }

/* FOOTER */
footer { border-top:1px solid var(--border); padding:2rem; text-align:center; color:var(--text-dim); font-size:.82rem; font-family:'JetBrains Mono',monospace; }
footer span { color:var(--green); }

/* ANIMATIONS */
@keyframes fadeDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
@keyframes bounce { 0%,100% { transform:rotate(45deg) translateY(0); } 50% { transform:rotate(45deg) translateY(4px); } }
@keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(200%); } }
.reveal { opacity:0; transform:translateY(20px); transition:opacity .6s ease,transform .6s ease; }
.reveal.visible { opacity:1; transform:none; }
@media (max-width:640px) { .feature-grid { grid-template-columns:1fr; } .install-steps { grid-template-columns:1fr; } .pipeline::before { display:none; } }
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

### 섹션별 HTML 패턴

#### Hero

```html
<section class="hero">
  <div class="grid-bg"></div>
  <div class="badge"><!-- v버전 또는 "npm에서 바로 사용 가능" 같은 태그 --></div>
  <h1><span class="accent"><!-- 프로젝트명 --></span><br/><!-- 슬로건 (동사 포함, 짧게) --></h1>
  <p><!-- 2~3줄 설명. 무엇을 해결하는지 명확하게 --></p>
  <!-- 주요 명령어 있으면 -->
  <div class="install-box">
    <span class="prompt">$</span>
    <span class="cmd"><!-- 대표 명령어 --></span>
    <button class="copy-btn" onclick="navigator.clipboard.writeText('명령어')">copy</button>
  </div>
  <div class="scroll-hint"><div class="arrow"></div><span>scroll</span></div>
</section>
```

#### Why / 배경 (pain-card는 2~3개, before→after 형태로)

```html
<section class="section reveal">
  <div class="section-header">
    <h2 class="section-title"><!-- "왜 만들었나요" 또는 문제 제기 제목 --></h2>
    <p class="section-desc"><!-- 배경 설명 1~2줄 --></p>
  </div>
  <div class="pain-grid">
    <div class="pain-card">
      <div class="icon"><i data-lucide="x-circle" style="color:var(--red);width:20px;height:20px"></i></div>
      <h3><!-- 문제점 제목 --></h3>
      <p><span class="strike"><!-- 기존 방식 --></span></p>
      <span class="after"><code><!-- 해결 방식 --></code></span>
    </div>
  </div>
</section>
```

#### Features (feature-card는 최대 4개)

```html
<section class="section reveal">
  <div class="section-header">
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
        <!-- CLI 예시 있으면 terminal 블록 -->
        <div class="terminal">
          <div class="terminal-bar">
            <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
          </div>
          <div class="terminal-content">
            <div><span class="t-prompt">$ </span><span class="t-cmd"><!-- 명령어 --></span></div>
            <div class="t-out"><!-- 출력 예시 --></div>
            <div class="t-success"><!-- 성공 메시지 --></div>
          </div>
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
<div class="section-alt reveal">
  <div class="section-inner">
    <div class="section-header">
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
<section class="section reveal" style="text-align:center">
  <div class="section-header">
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
<section class="section reveal" style="max-width:700px; text-align:center">
  <div class="section-header">
    <h2 class="section-title">시작하기</h2>
  </div>
  <div class="big-install">
    <div class="terminal-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
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

```html
<footer>
  <span><!-- 프로젝트명 --></span> · <!-- 버전 --> · <!-- 라이선스 또는 기술 스택 요약 -->
</footer>
```

---

### JS (body 닫기 전에 추가)

```html
<script>
  lucide.createIcons();
  const obs = new IntersectionObserver(
    (es) => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
</script>
```

---

## 출력 규칙

- 파일명: `presentation.html` (프로젝트 루트)
- 단일 파일 (인라인 CSS, CDN 폰트·lucide만 외부)
- 정보 없는 섹션은 과감히 생략 (빈 섹션 금지)
- 언어: README 언어 따름 (없으면 한국어)
- 생성 완료 후: `presentation.html 생성 완료! 브라우저에서 열어보세요.` 출력
