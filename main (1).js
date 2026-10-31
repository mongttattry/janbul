/* 잔불 — 1차 프로토타입
 * 디자인 좌표: 941 × 1672 (시안과 동일). 모든 위치값은 이 좌표 기준.
 * 임시 요소: 멤버(점선 도형) · 멤버 대사 · 위로 멘트 · 카드 가사 · 원곡 링크 · BGM 파일
 */
(() => {
  'use strict';

  // ───────────── 설정 (여기만 고치면 되는 값) ─────────────
  const CONFIG = {
    W: 941, H: 1672,
    MV_URL: 'https://youtu.be/gYAduKnFHG4', // 공식 뮤비
    fire: { x: 470, y: 1262 },
    fireOpacity: 0.8,                      // 불꽃 레이어 불투명도             // 불꽃이 시작되는 점 (장작 꼭지점 아래)
    seats: [                               // 그루터기 윗면 중심 (배경 기준)
      { x: 212, y: 1212 }, { x: 340, y: 1182 }, { x: 505, y: 1170 }, { x: 627, y: 1194 }, { x: 760, y: 1224 },
    ],
    members: ['이승협', '차훈', '김재현', '유회승', '서동성'], // 자리 1~5 (왼쪽부터)
    temp: { start: 30, tap: 1, wood: 10, cool: 0.4, coolAfterPeak: 0.1, holdMs: 4000, keepCardAbove: 90 },
    sky: { x0: 110, x1: 830, y0: 210, y1: 760 }, // 별빛이 뜰 수 있는 영역
    // 멤버 그림 (Spine 전 임시) — 배경과 같은 942×1671 투명 PNG에 그루터기 위 제자리로 그린 것, 멤버별 1장
    //  파일: assets/member-1.png ~ member-5.png (자리 순서). 없는 파일은 점선 자리표시로 남음. Spine을 켜면 그림은 자동으로 꺼짐
    memberArt: {
      enabled: true,
      // 멤버별 6장: 대기(숨쉬기) 1·2, 말하기 1·2, 환호 1·2 — 예) assets/member-1-idle1.png
      // + 눈 감은 장: idle3 (대기 자세에서 눈만 감은 것) — 대기 중 가끔 깜박임
      file: (n, pose, f) => `assets/member-${n}-${pose}${f}.png`,
      idleMs: 700,    // 숨쉬기: 두 장을 번갈아 보여 주는 간격
      talkMs: 180,    // 말하기: 입 움직임 간격
      talkFor: 1600,  // 말풍선이 뜬 뒤 말하는 시간
      cheerMs: 220,   // 환호 간격
      cheerFor: 2000, // 100°C 환호 시간
      reactFor: 1200, // 장작 연출 뒤 대사하는 멤버 (장작이 타는 동안은 전원 계속 환호)
      blinkMs: 130,   // 눈 감고 있는 시간
      blinkEvery: [2500, 6000], // 다음 깜박임까지 (무작위, 가끔 두 번 연속)
    },
    // 멤버 Spine — 파일 받으면 enabled: true 로 켜고 members 경로만 바꿈. 자세한 항목은 members-spine.js 맨 위 설명
    //  런타임 버전은 Spine 에디터 버전과 같아야 함 (지금 4.2). 4.1/4.3이면 lib 파일 교체
    spine: {
      enabled: false,
      runtime: 'lib/spine-webgl-4.2.min.js',
      area: { top: 850, height: 600 }, // 캐릭터를 그리는 띠 (디자인 좌표) — 머리가 잘리면 top을 줄이기
      mix: 0.2,                        // 동작이 바뀔 때 섞는 시간(초)
      // 지금은 공식 예제(spineboy)로 동작 확인용. 자리 순서: 이승협, 차훈, 김재현, 유회승, 서동성
      members: Array.from({ length: 5 }, (_, i) => ({
        skel: 'assets/spine-sample/spineboy-pro.skel', atlas: 'assets/spine-sample/spineboy.atlas',
        scale: 0.22, dx: 0, dy: 10, flip: i > 2,
        anims: { idle: 'idle', talk: 'shoot', react: 'jump', cheer: 'jump' },
      })),
    },
    // 구글 애널리틱스(GA4) 측정 ID — 'G-XXXXXXXXXX' 형태. 비워 두면 통계를 보내지 않음
    GA_ID: 'G-VQRB6FSD5N',
    GA_HOST: 'mongttattry.github.io', // 이 주소에서 열렸을 때만 통계 전송 (내 컴퓨터·미리보기 방문은 빼기)
    // Firebase 설정값 — 콘솔 > 프로젝트 설정 > 내 앱 > SDK 설정의 firebaseConfig를 그대로 붙여 넣기. 비워 두면 이 기기 안에서만 동작
    firebase: {
      apiKey: 'AIzaSyATb9g988YE17FGg5s2Gx0CMf-xboE_no4',
      authDomain: 'janbul-81a90.firebaseapp.com',
      projectId: 'janbul-81a90',
      storageBucket: 'janbul-81a90.firebasestorage.app',
      messagingSenderId: '611362406867',
      appId: '1:611362406867:web:83f15dc458793677b62f26',
    },
    stars: { poolSize: 100, refreshMs: 180000, hideAfterReports: 3, heartNoticeMs: 30000, watchMine: 10 }, // hideAfterReports는 firestore.rules 숫자와 같게
    sway: { enabled: false, top: 1340, fadeTo: 1450, amp: 2.6 }, // 근경 풀 흔들림 — 풀만 분리한 레이어 받으면 다시 켬
    // 멤버 대사 (자리 순서: 이승협, 차훈, 김재현, 유회승, 서동성) 
    lines: [
      ['지나고 보면 알걸. 지금이 우리 제일 뜨거울 때라는 거.', '다 식은 줄 알았는데, 아직 뜨겁네.', '그냥 지금 이 순간만 생각하자.', '붉은 하늘 보니까 네 생각나더라.', '안 꺼져, 내 마음은.', '요즘 내 안에서 가장 뜨겁게 불타고있는게 있나요?', '잔불과 가장 잘 어울리는건 누구야?'], // 이승협
      ['처음엔 좀 쓸쓸해도, 결국엔 다시 타오를 거야.', '식어버린 줄 알았는데, 밑바닥에서 다시 시작되는 소리가 나.', '가장 조용할 때, 내 진짜 소리가 시작돼.', '외롭다고 멈추지 마, 불꽃은 곧 튈 테니까.', '내 전부를 담아서 마지막까지 버텨볼게.'], // 차훈
      ['버티고 버텨서 겨우 남은 게 나야.', '너 지치면 말해. 내가 불 붙여줄게.', '단 한 명이라도 남아있으면, 조금만 더 가보는 거야.', '우리가 서로 버팀목이 되어준 게 진짜 우리 이야기지.', '내 말이 너한테 작은 위로라도 됐으면 좋겠다.', '졸린날은 있어도 슬픈날은 크게 없어'], // 김재현
      ['이 조용한 침묵 끝에, 내 진심이 전해지겠지.', '노래가 끝나도 여운 때문에 숨도 못 쉬겠더라.', '마지막까지 이어지는 내 목소리, 잘 들어봐.', '진짜 뜨거운 게 뭔지 제대로 보여줄게.', '내 숨소리 하나까지 다 너한테 맞추고 있어.', '꺼진 게 아니라 잔불로 남아있는 거야'], // 유회승
      ['치여 살다 보니 잊고 있던 열정, 다시 깨워줄게.', '마음속 깊이 숨겨둔 네 불씨, 모른 척하지 마.', '끝난 거 아냐. 아직 불씨는 있어.', '다시 시작하는 건, 아주 작은 계기 하나면 돼.', '식어버린 마음에 조금이라도 온기가 돌길 바라.'], // 서동성
    ],
    cheer: '와~~!',                                   // 100°C 도달 시 전원 환호
    burnLines: ['훨훨 날려 보내자!', '다 타서 재가 됐어. 이제 좀 가볍지?', '괜찮아, 다 태워버렸어.', '연기랑 같이 멀리 날아갔어.', '이제 그 고민은 여기 없어.', '불이 다 가져갔어. 걱정 마.', '무거운 거 내려놓으니까 어때?', '재는 바람이 데려갈 거야.', '잘했어, 털어내는 것도 용기야.', '또 생기면 언제든 여기 넣어.'],   // 태우기 후 멤버 한 명
    dreamLines: ['저기 네 별 보여?', '네 다짐, 하늘에서 반짝이고 있어.', '그 불씨, 꺼지지 않게 같이 지켜볼게.', '방금 별 하나가 새로 떴어!', '그 다짐, 우리가 응원할게.', '누군가 네 별을 보고 힘낼지도 몰라.', '오늘 밤하늘이 더 밝아졌다.', '작은 불씨가 별이 됐네.', '꼭 이뤄질 거야, 천천히 가도 돼.', '멋진 다짐이다. 기억할게.'], // 지피기 후 멤버 한 명
    comforts: ['고민은 재가 되어 날아갔어요. 오늘은 가볍게 잠들어요.', '작아진 불씨도 다시 타오를 수 있어요.', '애쓴 오늘의 나에게 따뜻한 온기를 보내요.', '꺼진 게 아니라 잠시 쉬는 중이에요.', '내려놓은 만큼 내일은 조금 더 가벼울 거예요.', '오늘 여기까지 온 것만으로도 충분해요.', '마음이 식은 날에도 불씨는 남아 있어요.', '무거웠던 하루, 여기 두고 가요.', '천천히 가도 괜찮아요. 불은 기다려 줘요.', '당신 안의 온기는 아직 따뜻해요.'],
    // 카드 가사는 lyrics.txt 에 (수록곡별 구절 · 링크, 정리한 형식 그대로)
    // 첫 방문 안내 (멤버 말풍선, 한 번씩만) — 실제 대사 받으면 교체
    guide: { woodAfterTaps: 5, woodLine: '고민이나 다짐, 장작으로 넣어볼래?', ms: 4500 },
    commonLines: ['하늘에 별 보여? 누군가의 다짐이야. 눌러봐!', '불 좀 더 지펴볼까?', '오늘 하루는 어땠어?', '여기 앉아서 잠깐 쉬어 가.', '불 앞에 있으니까 좀 따뜻해졌지?', '마음에 걸리는 거 있으면 장작으로 넣어 봐.', '별이 하나씩 늘어나는 거 보여?', '천천히 해도 돼. 불은 안 꺼져.', '오늘도 여기까지 와 줘서 고마워.', '같이 불 보고 있으니까 좋다.'], // 멤버 누구를 눌러도 섞여 나오는 대기 대사
    // 다짐(공개) 금지어 — 띄어쓰기·숫자·기호를 지운 뒤 포함 여부로 검사 ('시 1 발' → '시발'). 태우는 고민은 검사 안 함
    banned: ['씨발', '시발', '씨팔', '시팔', '씹새', '씹년', 'ㅅㅂ', 'ㅆㅂ', 'ㅅ발', '병신', '븅신', '빙신', 'ㅂㅅ', '좆', 'ㅈ같', '존나', '졸라', 'ㅈㄴ',
      '개새', '개색', 'ㅅㄲ', '지랄', 'ㅈㄹ', '미친놈', '미친년', '미친새', '닥쳐', '꺼져', '엿먹', '느금', '니애미', '느그애미', '니애비',
      '창녀', '섹스', '야동', 'fuck', 'shit', 'bitch', 'sex', 'porn'],
  };
  const { W, H } = CONFIG;
  const MV = CONFIG.MV_URL || 'https://www.youtube.com/results?search_query=' + encodeURIComponent('N.Flying 잔불');

  // ───────────── 유틸 ─────────────
  const $ = (s, r = document) => r.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('janbul.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('janbul.' + k, JSON.stringify(v)); } catch { /* 저장 불가 환경 */ } },
  };
  // 통계 (GA4): CONFIG.GA_ID가 있으면 gtag를 불러와 이벤트를 보냄. 유저가 쓴 글 내용은 보내지 않음
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  const GA_ON = !!CONFIG.GA_ID && location.hostname === CONFIG.GA_HOST;
  if (GA_ON) {
    const t = document.createElement('script'); t.async = true; t.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.GA_ID);
    document.head.appendChild(t); gtag('js', new Date()); gtag('config', CONFIG.GA_ID);
  }
  function track(name, params = {}) {
    try { if (GA_ON) gtag('event', name, params); } catch { /* 광고 차단 등 */ }
  }

  // ───────────── 이미지 미리 불러오기 (상태가 바뀔 때 버튼이 잠깐 비는 것 방지) ─────────────
  // 인트로가 떠 있는 동안 앱에 쓰는 이미지·글꼴을 전부 받아 두고, 다 받으면 '화면을 터치해…'를 보여 줌
  const PRELOAD = ['bg.webp', 'bg2.webp', 'bg3.webp', 'ui-mv.png', 'ui-sound.png', 'ui-temp.png', 'ui-wood.png', 'ui-fire-hint.png',
    'thermo-empty.png', 'thermo-fill.png', 'thermo-line.png', 'thermo-cool.png',
    'ui-pop.png', 'ui-btn-on.png', 'ui-btn-off.png', 'ui-flame.png', 'ui-letterbox.png',
    'ui-wood-panel.png', 'ui-card-on.png', 'ui-card-off.png', 'ui-submit-on.png', 'ui-submit-off.png', 'ui-flame-big.png', 'ico-burn.png', 'ico-dream.png',
    'card-badge.png', 'card-badge-low.png', 'card-paper.png', 'card-save.png', 'card-share.png', 'ui-box.png', 'ui-cardbtn.png',
    ...(CONFIG.memberArt.enabled && !CONFIG.spine.enabled ? [1, 2, 3, 4, 5].flatMap(n => [['idle', 1], ['idle', 2], ['idle', 3], ['talk', 1], ['talk', 2], ['cheer', 1], ['cheer', 2]].map(([p, f]) => CONFIG.memberArt.file(n, p, f).replace('assets/', ''))) : [])];
  let assetsReady = false;
  window.__keepImgs = [];
  const loadAll = (() => {
    let done = 0; const total = PRELOAD.length + 1;
    const tick = () => { done++; const el = document.getElementById('loadPct'); if (el) el.textContent = Math.round(done / total * 100) + '%'; };
    const imgs = PRELOAD.map(f => new Promise(res => {
      const im = new Image(); window.__keepImgs.push(im);
      im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => { tick(); res(); });
      im.onerror = () => { tick(); res(); }; // 없는 파일은 건너뜀
      im.src = 'assets/' + f;
    }));
    const fonts = (document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 4000))]) : Promise.resolve()).then(tick);
    const minShow = new Promise(r => setTimeout(r, 2600)); // 인트로 글씨가 다 떠오를 때까지는 기다림
    return Promise.all([...imgs, fonts, minShow]).then(() => {
      assetsReady = true;
      document.getElementById('loadHint')?.classList.add('done');
      document.getElementById('touchHint')?.classList.add('ready');
    });
  })();

  // ───────────── 레이아웃 ─────────────
  const app = $('#app'), frame = $('#frame'), stage = $('#stage'), world = $('#world'), scene = $('#scene');
  const cvs = $('#fx');
  let ctx = cvs.getContext('2d');
  // UI 위(팝업 위)에 그리는 이펙트 전용 캔버스
  const cvsTop = document.createElement('canvas'); cvsTop.id = 'fxTop'; cvsTop.setAttribute('aria-hidden', 'true');
  const ctxTop = cvsTop.getContext('2d');
  let s = .5, offX = 0, offY = 0, fw = 0, fh = 0, dpr = 1;
  // 안드로이드는 키보드가 올라오면 화면 높이 자체가 줄어듦 → 그대로 다시 맞추면 앱 전체가 쪼그라듦
  //  입력 중에 높이만 줄어든 경우엔 크기를 그대로 두고, 키보드 처리는 onViewport가 맡음
  let baseH = 0;
  const typing = () => document.activeElement && document.activeElement.tagName === 'TEXTAREA';
  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    if (typing() && fw && Math.abs(vw - fw) < 2 && vh < baseH - 80) return;
    baseH = vh;
    const wide = vw / vh > 0.75;
    fw = wide ? Math.round(vh * W / H) : vw;
    fh = vh;
    app.classList.toggle('wide', wide);
    frame.style.width = fw + 'px';
    s = Math.max(fw / W, fh / H);
    offX = (fw - W * s) / 2; offY = (fh - H * s) / 2;
    stage.style.transform = `translate(${offX}px, ${offY}px) scale(${s})`;
    const cl = document.getElementById('cardLayer'); if (cl) cl.style.transform = stage.style.transform;
    frame.style.setProperty('--u', s);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = cvsTop.width = Math.round(fw * dpr); cvs.height = cvsTop.height = Math.round(fh * dpr);
  }
  layout();
  window.addEventListener('resize', layout);

  // 카메라: 0 = 인트로, 1 = 베이스캠프
  let cam = 0;
  const INTRO_TOP = -731; // 인트로가 베이스캠프 위로 겹쳐 놓인 위치 (인트로 화면 y = 월드 y + 731)
  const worldOffset = () => (1 - cam) * -INTRO_TOP;
  function applyCam() { world.style.transform = `translateY(${worldOffset()}px)`; }
  applyCam();
  const toWorld = (cx, cy) => { const r = frame.getBoundingClientRect(); return { x: (cx - r.left - offX) / s, y: (cy - r.top - offY) / s - worldOffset() }; };
  const toScreen = (x, y) => ({ x: offX + x * s, y: offY + (y + worldOffset()) * s });

  // ───────────── 파티클 ─────────────
  function sprite(r, g, b) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(.35, `rgba(${r},${g},${b},.55)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c;
  }
  const SP = { ashSoft: sprite(48, 42, 38), ashHot: sprite(150, 55, 20), core: sprite(255, 236, 170), mid: sprite(255, 150, 45), outer: sprite(210, 60, 15), ember: sprite(255, 200, 110), ash: sprite(40, 34, 30), white: sprite(255, 250, 230) };
  const parts = [], topParts = [];
  const add = p => { p.age = 0; parts.push(p); return p; };
  const addTop = p => { p.age = 0; topParts.push(p); return p; };

  function spawnFire(I, dt) {
    const f = CONFIG.fire, n = (3 + 6 * I) * dt;
    for (let i = 0; i < n; i++) {
      add({ k: 'flame', x: f.x + rand(-1, 1) * (30 + 44 * I), y: f.y + rand(-6, 10), vx: rand(-.4, .4) + wind * 1.4, vy: -rand(1.8, 2.8) * (0.75 + I), max: rand(28, 48) * (0.8 + .4 * I), size: rand(16, 30) * (0.65 + .5 * I) });
    }
    if (Math.random() < (0.12 + .45 * I) * dt) add({ k: 'ember', x: f.x + rand(-40, 40), y: f.y - rand(20, 80) * I, vx: rand(-.6, .6), vy: -rand(1.6, 3.6) * (0.7 + I), max: rand(80, 150), size: rand(2.5, 5), ph: rand(0, 6) });
  }
  function burst(x, y, n = 46, power = 1, put = add) { // 터치한 곳에서 원형으로 팟
    put({ k: 'ring', x, y, max: 38, size: 20 });
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-.1, .1), v = rand(5, 11) * power;
      put({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: rand(28, 46), size: rand(3, 6) });
    }
  }
  function ash(x, y, n = 36) {
    for (let i = 0; i < n; i++) add({ k: 'ash', x: x + rand(-50, 50), y: y + rand(-20, 20), vx: rand(-1, 1), vy: -rand(.6, 2.2), max: rand(70, 130), size: rand(6, 14), rot: rand(0, 6) });
  }

  let wind = 0, gust = 0, flare = 0, busy = false;
  function drawParts(dt, parts) {
    const wo = worldOffset();
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * offX, dpr * (offY + wo * s));
    ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      const t = p.age / p.max;
      if (t >= 1) { if (p.done) p.done(p); parts.splice(i, 1); continue; }
      switch (p.k) {
        case 'flame': {
          p.vx += (CONFIG.fire.x - p.x) * .010 * dt + wind * .05 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 1 - .004 * dt;
          const img = t < .14 ? SP.core : t < .5 ? SP.mid : SP.outer, sz = p.size * (1 - t * .75);
          ctx.globalAlpha = (1 - t) * (t < .14 ? .3 : .4) * CONFIG.fireOpacity; ctx.drawImage(img, p.x - sz, p.y - sz * 1.7, sz * 2, sz * 3.4); break;
        }
        case 'ember': {
          p.x += (p.vx + Math.sin(p.age * .08 + p.ph) * .6 + wind) * dt; p.y += p.vy * dt; p.vy *= 1 - .003 * dt;
          const sz = p.size * 2.2; ctx.globalAlpha = (1 - t) * (.6 + .4 * Math.sin(p.age * .4)) * CONFIG.fireOpacity * (p.a ?? 1); ctx.drawImage(SP.ember, p.x - sz, p.y - sz, sz * 2, sz * 2); break;
        }
        case 'spark': {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - .07 * dt; p.vy = p.vy * (1 - .07 * dt) - .08 * dt;
          const sz = p.size * 2 * (1 - t * .5); ctx.globalAlpha = 1 - t; ctx.drawImage(t < .3 ? SP.white : SP.ember, p.x - sz, p.y - sz, sz * 2, sz * 2); break;
        }
        case 'ring': {
          const r = 20 + ease(t) * 150; ctx.globalAlpha = (1 - t) * .9; ctx.strokeStyle = '#ffb25a'; ctx.lineWidth = 10 * (1 - t) + 1;
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
          const g = 120 * (1 - t); ctx.globalAlpha = (1 - t) * .8; ctx.drawImage(SP.mid, p.x - g, p.y - g, g * 2, g * 2); break;
        }
        case 'ash': {
          ctx.globalCompositeOperation = 'source-over';
          p.x += (p.vx + Math.sin(p.age * .05) * .5) * dt; p.y += p.vy * dt; p.rot += .05 * dt;
          // 테두리가 보이지 않는 흐릿한 재 (처음엔 붉게 달아올랐다가 회색으로 식음)
          const rr = p.size * (1 + .25 * Math.sin(p.rot)) * 1.4;
          ctx.globalAlpha = (t < .2 ? t / .2 : 1 - t) * .45; ctx.drawImage(t < .15 ? SP.ashHot : SP.ashSoft, p.x - rr, p.y - rr, rr * 2, rr * 2);
          ctx.globalCompositeOperation = 'lighter'; break;
        }
        case 'dream': { // 불씨가 밤하늘 목표 지점으로 솟아오름
          const e = ease(t), x = p.sx + (p.tx - p.sx) * e + Math.sin(t * 9) * 30 * (1 - t), y = p.sy + (p.ty - p.sy) * e;
          if (Math.random() < .7) add({ k: 'ember', x, y, vx: rand(-.3, .3), vy: rand(.2, .8), max: rand(20, 40), size: rand(2, 3.5), ph: 0 });
          const sz = 26 + 10 * Math.sin(p.age * .3); ctx.globalAlpha = 1; ctx.drawImage(SP.core, x - sz, y - sz, sz * 2, sz * 2); ctx.drawImage(SP.mid, x - sz * 2, y - sz * 2, sz * 4, sz * 4); break;
        }
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function drawGlow(I, now) { // 모닥불 주변 바닥 빛
    const f = CONFIG.fire, flick = .85 + .15 * Math.sin(now * .011) * Math.sin(now * .017 + 1);
    const r = 260 * (.55 + .6 * I) * (1 + .12 * flare), boost = 1 + .25 * flare;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(f.x, f.y + 30); ctx.scale(1.5, .7);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(255,150,60,${.32 * flick * (.5 + I * .6) * boost})`); g.addColorStop(.5, `rgba(255,110,40,${.12 * flick * (.5 + I * .6) * boost})`); g.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    if (flare > .01) { // 터치 순간 불 주변에만 작고 둥근 빛
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const R = 150, cy = f.y - 50, h = ctx.createRadialGradient(f.x, cy, 0, f.x, cy, R);
      h.addColorStop(0, `rgba(255,200,120,${.28 * flare})`); h.addColorStop(.6, `rgba(255,150,70,${.1 * flare})`); h.addColorStop(1, 'rgba(255,130,60,0)');
      ctx.fillStyle = h; ctx.beginPath(); ctx.arc(f.x, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  function flareUp() { // 모닥불 터치: 불꽃이 확 치솟음
    flare = 1; const f = CONFIG.fire;
    for (let i = 0; i < 16; i++) add({ k: 'flame', x: f.x + rand(-60, 60), y: f.y + rand(-10, 10), vx: rand(-.6, .6), vy: -rand(3.6, 6.2), max: rand(30, 48), size: rand(26, 44) });
    for (let i = 0; i < 18; i++) { const a = -Math.PI / 2 + rand(-.9, .9), v = rand(5, 10); add({ k: 'spark', x: f.x + rand(-30, 30), y: f.y - rand(40, 110), vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: rand(30, 55), size: rand(2.5, 4.5) }); }
    for (let i = 0; i < 8; i++) add({ k: 'ember', x: f.x + rand(-40, 40), y: f.y - rand(60, 160), vx: rand(-1, 1), vy: -rand(3, 5.5), max: rand(90, 150), size: rand(3, 5), ph: rand(0, 6) });
  }

  // ───────────── 상태 ─────────────
  let state = 'intro';
  let temp = CONFIG.temp.start, peak = false, burnCount = 0;
  let lastDream = store.get('lastDream', '');
  let lastEntry = null; // 마지막으로 넣은 장작 { mode, text } — 태운 고민은 저장하지 않고 이 화면에서만 씀
  const tempVal = $('#tempVal'), tempRate = $('#tempRate'), tempBadge = $('#tempBadge'), tempFloats = $('#tempFloats'), cardBtn = $('#cardBtn'), sunset = $('#sunset');
  // 온도 옆 표시: 방금 오른 만큼(+2°C) 잠깐 → 평소에는 식는 속도(-0.5°C)
  let riseUntil = 0, coolClock = 0, lastShownT = null, dropUntil = 0, dropAmt = 1;
  const fmt = n => (Math.round(n * 10) / 10).toString();
  function floatText(txt, cls) {
    const el = document.createElement('span'); el.className = 'tf ' + cls; el.textContent = txt;
    el.style.marginLeft = (Math.random() * 14).toFixed(0) + 'px';
    el.addEventListener('animationend', () => el.remove());
    tempFloats.appendChild(el);
  }
  function addTemp(v) {
    temp = Math.min(100, temp + v);
    riseUntil = performance.now() + 1500; coolClock = 0; dropUntil = 0;
    floatText(`+${fmt(v)}°C`, 'up');
    if (temp >= 100 && !peak) { peak = true; track('reach_100'); cheerAll(); sfx.cheer(); toast('잔불이 다시 타올랐어요\n불씨 카드를 받으세요'); }
  }
  // 배경 2·3(노을)이 있으면 온도에 따라 겹쳐 바꾸고, 없으면 노을 색 덧칠로 대신함
  const bgLayers = [$('#bg2'), $('#bg3')];
  const hasLayer = el => el && el.complete && el.naturalWidth > 0;
  const skyMix = () => ({ a2: clamp((temp - 55) / 25, 0, 1), a3: clamp((temp - 80) / 20, 0, 1) });
  function updateTemp(dt) {
    if (state !== 'main') return;
    const rate = peak ? CONFIG.temp.coolAfterPeak : CONFIG.temp.cool;
    const nowT = performance.now(), rising = nowT < riseUntil; // 방금 올렸으면(누르는 중) 식지 않음
    const holding = !rising && nowT < riseUntil + CONFIG.temp.holdMs; // 손 뗀 뒤 잠깐은 그대로 (–)
    if (!busy && !rising && !holding) temp = Math.max(0, temp - rate * dt / 60); // 장작 연출 중에도 식지 않음

    if (peak && temp < CONFIG.temp.keepCardAbove) peak = false;
    const t = Math.round(temp);
    if (tempVal.textContent !== t + '°C') tempVal.textContent = t + '°C';
    // 파란 글씨: 표시 온도가 1°C 떨어질 때만 '-1°C'를 잠깐 보여 주고, 평소엔 '+0°C'
    const now2 = performance.now();
    if (lastShownT != null && t < lastShownT) { dropUntil = now2 + 1400; dropAmt = lastShownT - t; }
    lastShownT = t;
    // 변화 표시: 오르는 중 ▲(주황) · 내려갈 때 ▼(파랑) · 변화 없음 –(회색)
    const dir = rising ? 'up' : (busy || holding || temp <= 0) ? 'flat' : 'down'; // ▲ → – (잠깐 멈춤) → ▼
    if (tempRate.dataset.dir !== dir) { tempRate.dataset.dir = dir; tempRate.textContent = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '–'; tempRate.setAttribute('aria-label', dir === 'up' ? '오르는 중' : dir === 'down' ? '내려가는 중' : '변화 없음'); }
    // 수은 기둥: 아래 둥근 부분(약 32%)은 항상 차 있고, 그 위 기둥이 0~100°C에 맞춰 차오름
    tempBadge.style.setProperty('--fillPct', (32 + 68 * clamp(temp, 0, 100) / 100).toFixed(1) + '%');
    tempBadge.classList.toggle('hot', temp >= 95);
    cardBtn.hidden = !peak;
    const { a2, a3 } = skyMix();
    if (hasLayer(bgLayers[0])) {
      bgLayers[0].style.opacity = a2.toFixed(3);
      if (hasLayer(bgLayers[1])) bgLayers[1].style.opacity = a3.toFixed(3);
      sunset.style.opacity = 0;
    } else sunset.style.opacity = clamp((temp - 65) / 35, 0, 1).toFixed(3);
  }

  // ───────────── 오디오 (BGM: assets/bgm.mp3 / 터치·장작 효과음은 임시 합성음) ─────────────
  let ac = null, master = null, muted = false;
  const bgm = $('#bgm');
  // 효과음 파일 (assets/sfx) — 볼륨은 0~1
  const SFX = {
    wind:  { file: 'assets/sfx/wind.mp3',  vol: .9, loop: true }, // 캠프 바람 소리 (계속)
    click: { file: 'assets/sfx/click.mp3', vol: .5 },  // 버튼·터치
    warm:  { file: 'assets/sfx/warm.mp3',  vol: .7 },  // 온기 더하기 · 태워보내기 · 불씨로 띄우기
    talk:  { file: 'assets/sfx/talk.mp3',  vol: .6 },  // 멤버 말풍선
    fire:  { file: 'assets/sfx/fire.mp3',  vol: .8 },  // 장작이 불에 닿아 탈 때
    star:  { file: 'assets/sfx/star.mp3',  vol: .7 },  // 다짐이 올라가 별이 될 때
    cheer: { file: 'assets/sfx/cheer.mp3', vol: .7 },  // 100°C
  };
  // 인트로 터치 소리는 터치하는 순간 바로 나야 해서 <audio>로 미리 준비
  let introGain = null;
  const introSnd = new Audio('assets/sfx/intro.mp3'); introSnd.preload = 'auto'; introSnd.volume = .8;
  const sfxRaw = {}, sfxBuf = {};
  for (const [k, v] of Object.entries(SFX)) sfxRaw[k] = fetch(v.file).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null); // 인트로 동안 미리 받아 둠
  function initAudio() {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ac.destination);
      try { introGain = ac.createGain(); introGain.gain.value = 1; ac.createMediaElementSource(introSnd).connect(introGain).connect(master); } catch { introGain = null; } // 인트로 소리도 볼륨 조절되게 (아이폰은 <audio> 볼륨이 안 먹음)
      for (const k of Object.keys(SFX)) sfxRaw[k].then(ab => ab && ac.decodeAudioData(ab)).then(buf => { if (!buf) return; sfxBuf[k] = buf; if (SFX[k].loop) play(k); }).catch(() => {});
    } catch { ac = null; }
    bgm.volume = .55; bgm.play().catch(() => { /* BGM 파일이 아직 없음 */ });
  }
  function fadeIntro(sec = 2.5) { // 메인 화면이 나오면 인트로 소리를 서서히 줄이고 멈춤
    if (introSnd.paused) return;
    if (introGain && ac) { const t = ac.currentTime; introGain.gain.cancelScheduledValues(t); introGain.gain.setValueAtTime(introGain.gain.value, t); introGain.gain.linearRampToValueAtTime(0, t + sec); }
    else { const v0 = introSnd.volume, t0 = performance.now(); (function step() { const k = Math.min(1, (performance.now() - t0) / (sec * 1000)); introSnd.volume = v0 * (1 - k); if (k < 1) requestAnimationFrame(step); })(); }
    setTimeout(() => introSnd.pause(), sec * 1000 + 100);
  }
  function play(k) {
    const buf = sfxBuf[k]; if (!ac || !buf) return;
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = buf; src.loop = !!SFX[k].loop; g.gain.value = SFX[k].vol;
    src.connect(g).connect(master); src.start();
  }
  const sfx = { warm: () => play('warm'), click: () => play('click'), talk: () => play('talk'), fire: () => play('fire'), star: () => play('star'), cheer: () => play('cheer') };
  // 버튼·별·멤버·모닥불 등 누를 수 있는 것을 누르면 터치 소리
  document.addEventListener('pointerdown', e => { const t = e.target.closest('button, a, .star, #fireHit, .member, .mode'); if (t && !t.matches('#heartBtn, #submitBtn')) sfx.click(); /* 이 둘은 warm 소리 */ }, true);
  const muteBtn = $('#muteBtn');
  muteBtn.addEventListener('click', () => {
    muted = !muted; muteBtn.classList.toggle('muted', muted); muteBtn.setAttribute('aria-label', muted ? '소리 켜기' : '소리 끄기');
    if (master) master.gain.value = muted ? 0 : 1; bgm.muted = muted; track('mute', { muted });
  });
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) { ac.suspend(); bgm.pause(); } else { ac.resume(); if (state === 'main') bgm.play().catch(() => {}); }
  });

  // ───────────── 인트로 ─────────────
  const introText = $('#introText'), introBlock = $('#introBlock'), ui = $('#ui');
  const TEXT_BOXES = [[300, 314, 640, 420], [290, 500, 690, 720], [350, 732, 590, 782]]; // 인트로 좌표 기준 글자 영역
  scene.style.filter = 'brightness(.22)';
  // ───────────── 인트로 글씨 (캔버스로 그려서 대기 중 효과와 타들어가는 효과를 같은 그림으로 이어감) ─────────────
  const IT = { TOP: 290, HGT: 520 };            // 인트로 화면 좌표에서 글씨 영역
  const introCanvas = document.createElement('canvas');
  introCanvas.style.cssText = `position:absolute;left:0;top:${IT.TOP}px;width:${W}px;height:${IT.HGT}px;pointer-events:none;`;
  introText.after(introCanvas);
  const ictx = introCanvas.getContext('2d', { willReadFrequently: true });
  let intro = null; // { k, layers, title: {...}, t0 }

  function makeNoise(cell, cols, rows) {
    const grid = new Float32Array(cols * rows).map(() => Math.random());
    return (x, y) => { // x, y: 셀 단위가 아닌 픽셀 좌표, 바둑판처럼 반복
      const gx = x / cell, gy = y / cell, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const x0 = ((ix % cols) + cols) % cols, x1 = (x0 + 1) % cols, y0 = ((iy % rows) + rows) % rows, y1 = (y0 + 1) % rows;
      const a = grid[y0 * cols + x0], b = grid[y0 * cols + x1], c = grid[y1 * cols + x0], d = grid[y1 * cols + x1];
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
  }

  function buildIntro() {
    const k = Math.min(s * dpr, 2), cw = Math.ceil(W * k), ch = Math.ceil(IT.HGT * k);
    introCanvas.width = cw; introCanvas.height = ch;
    const fam = getComputedStyle($('.slogan')).fontFamily, ink = '#f6e7cc', cx = W / 2;
    const layer = draw => {
      const c = document.createElement('canvas'); c.width = cw; c.height = ch;
      const x = c.getContext('2d', { willReadFrequently: true }); x.scale(k, k);
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = ink; draw(x); return c;
    };
    const ls = (x, v) => { if ('letterSpacing' in x) x.letterSpacing = v + 'px'; };
    const slogan = layer(x => { x.font = `400 34px ${fam}`; ls(x, -2.04); x.fillText('불이 작아진 것뿐,', cx, 339 - IT.TOP); x.fillText('우린 여전히 타고 있다', cx, 389 - IT.TOP); });
    const sub = layer(x => { x.font = `700 34px ${fam}`; ls(x, -2.04); x.fillText('Still - N.Flying', cx, 757 - IT.TOP); });
    let tw = 0;
    const titleSrc = layer(x => { x.font = `700 196px ${fam}`; ls(x, -11.76); tw = x.measureText('잔불').width; x.fillText('잔불', cx, 592 - IT.TOP); });
    // 제목 픽셀 목록과 각 픽셀의 가로 위치(0=왼쪽 끝, 1=오른쪽 끝)
    const sd = titleSrc.getContext('2d').getImageData(0, 0, cw, ch).data, idx = [], ux = [], pxy = [];
    const left = (cx - tw / 2) * k, right = (cx + tw / 2) * k;
    for (let py = 0; py < ch; py++) for (let px = left | 0; px < right + 2; px++) {
      const i = (py * cw + px) * 4; if (sd[i + 3] > 6) { idx.push(i); ux.push((px - left) / (right - left)); pxy.push(px, py); }
    }
    const out = new ImageData(cw, ch), titleCv = document.createElement('canvas'); titleCv.width = cw; titleCv.height = ch;
    // 터치하자마자 탈 수 있게, 타는 순서에 쓸 노이즈를 미리 계산해 둠
    const bn = makeNoise(22 * k, 64, 32), all = [slogan, sub, titleSrc].map(c => c.getContext('2d').getImageData(0, 0, cw, ch).data);
    const bIdx = [], bNoise = [];
    for (let py = 0; py < ch; py++) for (let px = 0; px < cw; px++) {
      const i = (py * cw + px) * 4;
      if (all[0][i + 3] > 8 || all[1][i + 3] > 8 || all[2][i + 3] > 8) { bIdx.push(i); bNoise.push((bn(px, py) * .65 + bn(px * 2.3 + 77, py * 2.3 + 31) * .35) * 280); }
    }
    intro = { k, cw, ch, slogan, sub, titleCv, sd, idx, ux, pxy, out, bIdx, bNoise, t0: performance.now(), frame: 0,
      nA: makeNoise(26 * k, 24, 24), nB: makeNoise(18 * k, 24, 24), nV: makeNoise(11 * k, 32, 32) };
  }

  // 대기 중: '불' 끝자락에 희미한 불씨가 남아, 꺼질 듯 말 듯 아주 천천히 숨 쉼
  function heatTitle(now) {
    const I = intro, t = (now - I.t0) / 1000, od = I.out.data, sd = I.sd;
    const breath = .5 + .5 * Math.sin(t * 1.25) * (.75 + .25 * Math.sin(t * .37 + 2));           // 느린 숨
    const flick = .92 + .08 * Math.sin(t * 7.3) * Math.sin(t * 4.1 + 1);                           // 아주 약한 떨림
    const glow = clamp(breath * flick, 0, 1), rise = t * 10 * I.k;
    for (let j = 0; j < I.idx.length; j++) {
      const i = I.idx[j], px = I.pxy[j * 2], py = I.pxy[j * 2 + 1];
      const n = I.nA(px, py + rise);
      const h = clamp((I.ux[j] - .6) / .4 + (n - .5) * .35, 0, 1) * (.45 + .55 * glow);
      // 종이빛 → 호박빛 → 은은한 주황 (검게 타거나 붉게 타오르지 않음)
      let r = 246, g = 231, b = 204;
      if (h > .02) {
        if (h < .55) { const q = h / .55; r = 246 + 9 * q; g = 231 - 31 * q; b = 204 - 64 * q; }
        else { const q = (h - .55) / .45; r = 255 - 8 * q; g = 200 - 52 * q; b = 140 - 58 * q; }
      }
      od[i] = r; od[i + 1] = g; od[i + 2] = b; od[i + 3] = sd[i + 3];
    }
    I.titleCv.getContext('2d').putImageData(I.out, 0, 0);
    return glow;
  }

  const appear = (t, at, dur) => clamp((t - at) / dur, 0, 1);
  function renderIntro(now) {
    if (!intro) return;
    const I = intro, t = (now - I.t0) / 1000, k = I.k;
    if (I.frame++ % 2 === 0) I.pulse = heatTitle(now); // 두 프레임에 한 번 계산
    ictx.setTransform(1, 0, 0, 1, 0, 0); ictx.clearRect(0, 0, I.cw, I.ch);
    const put = (cv, a) => { if (a <= 0) return; const e = 1 - Math.pow(1 - a, 3); ictx.globalAlpha = e; ictx.drawImage(cv, 0, (1 - e) * 14 * k); };
    put(I.slogan, appear(t, .3, 1.6));
    put(I.sub, appear(t, 1.6, 1.4));
    const ta = appear(t, 1, 1.8);
    if (ta > 0) {
      ictx.save(); ictx.shadowColor = `rgba(255,150,70,${(.1 + .2 * (I.pulse || .5)) * ta})`; ictx.shadowBlur = 22 * k;
      put(I.titleCv, ta); ictx.restore();
    }
    ictx.globalAlpha = 1;
  }

  const fontsReady = Promise.race([
    Promise.all(['400 34px "Gowun Batang"', '700 196px "Gowun Batang"', '400 34px HeirOfLight', '700 34px HeirOfLight'].map(f => document.fonts.load(f).catch(() => {}))),
    new Promise(r => setTimeout(r, 1500)),
  ]);
  fontsReady.then(() => { if (state === 'intro') buildIntro(); });
  window.addEventListener('resize', () => { if (state === 'intro' && intro) { const t0 = intro.t0; buildIntro(); intro.t0 = t0; } });

  // 터치: 지금 보이는 그대로에서 터치한 곳부터 불규칙하게 타들어감 (그을림 → 불붙은 가장자리 → 재)
  function burnText(lx, ly, DUR) {
    if (!intro) buildIntro();
    renderIntro(performance.now());
    const { k, cw, ch, bIdx, bNoise } = intro, x = ictx;
    const src = x.getImageData(0, 0, cw, ch), sd = src.data, out = x.createImageData(cw, ch), od = out.data;
    const tx = lx * k, ty = (ly - IT.TOP) * k, idx = bIdx, bt = new Float32Array(idx.length);
    let maxB = 0;
    for (let j = 0; j < idx.length; j++) { const pi = idx[j] / 4, px = pi % cw, py = (pi / cw) | 0; const b = Math.hypot(px - tx, py - ty) / k * .75 + bNoise[j]; bt[j] = b; if (b > maxB) maxB = b; }
    intro = null; // 대기 효과 멈춤
    const CHAR = 70, EMBER = 70, t0 = performance.now();
    (function step(now) {
      const t = clamp((now - t0) / DUR, 0, 1), T = -10 + (maxB + CHAR + EMBER + 20) * (1 - Math.pow(1 - t, 1.6)); // 터치 즉시 시작
      for (let j = 0; j < idx.length; j++) {
        const i = idx[j], b = bt[j] - T;
        let r = sd[i], gg = sd[i + 1], bl = sd[i + 2], a = sd[i + 3];
        if (b > CHAR) { /* 아직 그대로 */ }
        else if (b > 0) { // 불기운이 닿아 호박빛으로 따뜻해짐
          const q = 1 - b / CHAR, w = q * q;
          r += (255 - r) * w; gg += (186 - gg) * w; bl += (110 - bl) * w;
        } else if (b > -EMBER) { // 은은한 불씨가 되어 스러짐
          const q = -b / EMBER; r = 255; gg = 186 - 70 * q; bl = 110 - 70 * q; a *= (1 - q) * (1 - q * .3);
        } else a = 0;
        od[i] = r; od[i + 1] = gg; od[i + 2] = bl; od[i + 3] = a;
      }
      x.putImageData(out, 0, 0);
      for (let n = 0; n < 10; n++) { // 스러지는 자리에서 불티가 조용히 떠오름
        const j = (Math.random() * idx.length) | 0, b = bt[j] - T;
        if (b < 10 && b > -EMBER) {
          const pi = idx[j] / 4, wx = (pi % cw) / k, wy = ((pi / cw) | 0) / k + IT.TOP + INTRO_TOP;
          add({ k: 'ember', x: wx, y: wy, vx: rand(-.4, .4), vy: -rand(.6, 1.8), max: rand(50, 100), size: rand(1.8, 3.4), ph: rand(0, 6) });
        }
      }
      if (t < 1) requestAnimationFrame(step); else x.clearRect(0, 0, cw, ch);
    })(t0);
  }

  function startIntro(e) {
    if (state !== 'intro' || !assetsReady) return;
    state = 'burning';
    const p = toWorld(e.clientX, e.clientY), lx = p.x, ly = p.y - INTRO_TOP;
    try { introSnd.muted = muted; introSnd.play().catch(() => {}); } catch { /* 소리 없음 */ }
    initAudio(); burst(p.x, p.y, 54, 1.2); track('intro_start');
    for (const el of [$('#touchHint'), $('#loadHint')]) { el.style.animation = 'none'; el.style.transition = 'opacity .8s'; el.style.opacity = '0'; }
    const BURN = 3000, PAN_AT = 2000, PAN = 2800;
    burnText(lx, ly, BURN);
    setTimeout(() => {
      const c0 = performance.now();
      (function pan(now) {
        const t = clamp((now - c0) / PAN, 0, 1); cam = ease(t); applyCam();
        scene.style.filter = `brightness(${(.22 + .78 * ease(clamp(t * 1.15 - .05, 0, 1))).toFixed(3)})`;
        introBlock.style.opacity = (1 - ease(clamp((t - .15) / .7, 0, 1))).toFixed(3); // 겹친 어둠이 걷힘
        if (t < 1) return requestAnimationFrame(pan);
        scene.style.filter = ''; introBlock.style.visibility = 'hidden';
        state = 'main'; ui.classList.remove('hidden'); onEnterMain();
      })(c0);
    }, PAN_AT);
  }
  frame.addEventListener('pointerdown', e => { if (state === 'intro') startIntro(e); });

  // ───────────── 메인: 멤버 ─────────────
  const membersEl = $('#members');
  const memberEls = CONFIG.seats.map((seat, i) => {
    const b = document.createElement('button');
    b.className = 'member'; b.style.left = seat.x + 'px'; b.style.top = (seat.y - 150) + 'px';
    b.setAttribute('aria-label', CONFIG.members[i] + ' (임시 자리)');
    b.innerHTML = `<span class="body">${i + 1}</span><span class="tag">${CONFIG.members[i]} · 임시</span>`;
    b.addEventListener('click', () => talk(i));
    membersEl.appendChild(b);
    return b;
  });
  // 멤버 그림: 전체 크기 투명 PNG를 장면에 겹치고, 그림이 실제로 있는 영역에 맞춰 터치 영역을 옮김
  // 멤버 그림 (프레임 애니메이션): 6장을 받아 그림이 있는 영역만 잘라 두고, 캔버스 하나에 번갈아 그림
  //  (942×1671 원본 30장을 그대로 띄우면 휴대폰 메모리가 부족해서 잘라 씀)
  const memberArts = [], memberBoxes = [];
  const POSES = ['idle', 'talk', 'cheer'];
  const loadImg = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  async function addMemberArt(btn, seat, i) {
    const A = CONFIG.memberArt, imgs = {};
    await Promise.all([...POSES.flatMap(p => [1, 2].map(f => [p, f])), ['idle', 3]].map(async ([p, f]) => { imgs[p + f] = await loadImg(A.file(i + 1, p, f)); }));
    const pickImg = (p, f) => imgs[p + f] || imgs[p + 1] || imgs.idle1 || imgs.idle2; // 빠진 장은 비슷한 장으로 대신
    if (!pickImg('idle', 1)) return; // 그림이 하나도 없으면 점선 자리표시 유지
    let box = null; // 6장을 합친 영역
    for (const im of Object.values(imgs)) {
      const b = im && alphaBox(im); if (!b) continue;
      box = !box ? b : (() => { const x = Math.min(box.x, b.x), y = Math.min(box.y, b.y); return { x, y, w: Math.max(box.x + box.w, b.x + b.w) - x, h: Math.max(box.y + box.h, b.y + b.h) - y }; })();
    }
    if (!box) return;
    const sx = imgs.idle1 ? (imgs.idle1.naturalWidth / W) : 1, pad = 8;
    box = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), w: box.w + pad * 2, h: box.h + pad * 2 };
    const crop = im => { const c = document.createElement('canvas'); c.width = Math.round(box.w * sx); c.height = Math.round(box.h * sx); c.getContext('2d').drawImage(im, box.x * sx, box.y * sx, c.width, c.height, 0, 0, c.width, c.height); return c; };
    const frames = {}; for (const p of POSES) frames[p] = [crop(pickImg(p, 1)), crop(pickImg(p, 2))];
    if (imgs.idle3) { const b = crop(imgs.idle3); frames.blink = [b, b]; } // 눈 감은 장 (idle3)
    const cv = document.createElement('canvas'); cv.className = 'memberArt'; cv.width = frames.idle[0].width; cv.height = frames.idle[0].height;
    Object.assign(cv.style, { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' });
    const ctx = cv.getContext('2d');
    const nextBlink = now => now + rand(A.blinkEvery[0], A.blinkEvery[1]);
    const art = { cv, frames, pose: 'idle', until: 0, phase: i * 0.37, shown: null, blinkAt: nextBlink(performance.now()), blinkUntil: 0 };
    art.draw = now => {
      if (art.pose !== 'idle' && now > art.until) art.pose = 'idle';
      const ms = art.pose === 'idle' ? A.idleMs : art.pose === 'talk' ? A.talkMs : A.cheerMs;
      const k = Math.floor(now / ms + art.phase * (art.pose === 'idle' ? 1 : 0)) % 2;
      if (frames.blink && now > art.blinkAt) { // 눈 깜박임 (가끔 두 번 연속)
        art.blinkUntil = now + A.blinkMs;
        art.blinkAt = Math.random() < .2 ? now + A.blinkMs + 160 : nextBlink(now);
      }
      const fr = art.pose === 'idle' && frames.blink && now < art.blinkUntil ? frames.blink[k] : frames[art.pose][k];
      if (fr !== art.shown) { ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(fr, 0, 0); art.shown = fr; }
    };
    art.play = (pose, ms) => { if (art.pose === pose && art.until === Infinity && ms !== Infinity) return; art.pose = pose; art.until = performance.now() + ms; }; // 장작 연출 중 환호는 끝까지 유지
    membersEl.insertBefore(cv, membersEl.firstChild); memberArts[i] = art; memberBoxes[i] = box;
    btn.classList.add('art'); btn.setAttribute('aria-label', CONFIG.members[i]);
    Object.assign(btn.style, { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px', marginLeft: '0' });
    art.draw(performance.now());
  }
  if (CONFIG.memberArt.enabled && !CONFIG.spine.enabled) memberEls.forEach((b, i) => addMemberArt(b, CONFIG.seats[i], i));
  (function artLoop(now) { memberArts.forEach(a => a && a.draw(now)); requestAnimationFrame(artLoop); })(performance.now());
  function alphaBox(img) { // 투명하지 않은 픽셀이 있는 사각형 (디자인 좌표)
    try {
      const k = 1 / 4, w = Math.round(W * k), h = Math.round(H * k), c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) if (d[(y * w + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return x1 < 0 ? null : { x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k };
    } catch { return null; }
  }
  // Spine 캐릭터 (켜져 있을 때만 런타임을 불러옴, 실패하면 자리표시 그대로)
  if (CONFIG.spine.enabled) {
    const load = src => new Promise((ok, fail) => { const t = document.createElement('script'); t.src = src; t.onload = ok; t.onerror = fail; document.head.appendChild(t); });
    load(CONFIG.spine.runtime).then(() => load('members-spine.js'))
      .then(() => window.JanbulSpine.start({ config: CONFIG, scene, getScale: () => s, members: memberEls }))
      .catch(err => console.warn('[잔불] Spine 런타임을 못 불러옴', err));
  }
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  let bubbleEl = null;
  // 멤버 한 명이 말풍선으로 말함 (anim: talk / react / cheer)
  function say(i, text, { anim = 'talk', lift = 0, multi = false, ms = 3100 } = {}) {
    const el = memberEls[i], seat = CONFIG.seats[i];
    if (!multi) sfx.talk();
    el.classList.remove('talk', 'react', 'cheer'); void el.offsetWidth; el.classList.add(anim); window.JanbulSpine?.play(i, anim); artAnim(i, anim);
    if (!multi) { bubbleEl?.remove(); document.querySelectorAll('.bubble').forEach(b => b.remove()); }
    sayBubble(i, text, lift, multi, ms);
  }
  function sayBubble(i, text, lift = 0, multi = true, ms = 3100) { // 말풍선만 (동작은 그대로)
    const seat = CONFIG.seats[i];
    const b = document.createElement('div'); b.className = 'bubble' + (multi ? ' short' : '');
    b.textContent = text;
    b.style.left = (multi ? seat.x : clamp(seat.x, 200, W - 200)) + 'px'; b.style.top = (memberBoxes[i] ? memberBoxes[i].y - 12 : seat.y - 175) - lift + 'px'; // 그림이 있으면 머리 바로 위
    if (ms !== 3100) b.style.animation = `pop .35s ease-out, fade .4s ${(ms - 500) / 1000}s ease-in forwards`;
    scene.appendChild(b); setTimeout(() => b.remove(), ms);
    if (!multi) { const hw = b.offsetWidth / 2 + 16; b.style.left = clamp(seat.x, hw, W - hw) + 'px'; } // 화면 밖으로 잘리지 않게
    if (!multi) bubbleEl = b;
  }
  function talk(i) {
    if (state !== 'main' || busy) return;
    say(i, pick([...CONFIG.lines[i], ...CONFIG.commonLines])); track('member_tap', { member: i });
  }
  function cheerAll() { // 100°C: 다 같이 환호
    document.querySelectorAll('.bubble').forEach(b => b.remove());
    memberEls.forEach((_, i) => setTimeout(() => say(i, CONFIG.cheer, { anim: 'cheer', lift: i % 2 ? 60 : 0, multi: true }), i * 90));
  }
  function cheerBubbles() { // 장작 넣을 때: 다섯 명 머리 위에 '와~~!' 말풍선
    document.querySelectorAll('.bubble').forEach(b => b.remove());
    memberEls.forEach((_, i) => setTimeout(() => sayBubble(i, CONFIG.cheer, i % 2 ? 60 : 0), i * 90));
  }
  const randomMember = () => Math.floor(Math.random() * memberEls.length);
  function reactAll() { cheerBubbles(); memberEls.forEach((el, i) => setTimeout(() => { el.classList.remove('react'); void el.offsetWidth; el.classList.add('react'); window.JanbulSpine?.play(i, 'react'); memberArts[i]?.play('cheer', Infinity); }, i * 70)); } // 장작 연출이 끝날 때까지 환호
  function artAnim(i, anim) {
    const a = memberArts[i], A = CONFIG.memberArt; if (!a) return;
    if (anim === 'talk') a.play('talk', A.talkFor); else if (anim === 'cheer') a.play('cheer', A.cheerFor); else if (anim === 'react') a.play('cheer', A.reactFor);
  }

  // ───────────── 메인: 모닥불 터치 ─────────────
  $('#fireHit').addEventListener('pointerdown', e => {
    if (state !== 'main' || busy) return; // 장작이 타는 동안엔 모닥불을 눌러도 오르지 않음
    e.preventDefault();
    const p = toWorld(e.clientX, e.clientY);
    addTemp(CONFIG.temp.tap); gust = 1; wind = rand(-.6, .6); flareUp();
    for (let i = 0; i < 6; i++) add({ k: 'spark', x: p.x, y: p.y, vx: rand(-4, 4), vy: -rand(3, 8), max: rand(20, 36), size: rand(2, 4) });
    try { navigator.vibrate?.(12); } catch { /* 진동 미지원 */ }
    track('fire_tap');
    if (!guide.wood && ++fireTaps >= CONFIG.guide.woodAfterTaps) setTimeout(guideWood, 700);
  });
  // ───────────── 첫 방문 안내 ─────────────
  const guide = store.get('guide', { wood: false, star: false });
  const guideDone = k => { if (guide[k]) return; guide[k] = true; store.set('guide', guide); };
  let fireTaps = 0;
  function guideWood() {
    if (guide.wood || state !== 'main' || busy || !$('#woodModal').hidden) return;
    guideDone('wood'); say(randomMember(), CONFIG.guide.woodLine, { ms: CONFIG.guide.ms });
    $('#woodBtn').classList.add('guide'); setTimeout(() => $('#woodBtn').classList.remove('guide'), CONFIG.guide.ms);
    track('guide_wood');
  }

  // ───────────── 데이터: 로컬 ↔ Firebase ─────────────
  // 같은 모양의 함수 묶음(DB) 두 가지. CONFIG.firebase 가 채워져 있으면 Firebase, 아니면 이 기기 안(localStorage)에서만 동작.
  //   init() · fetchPool() → 최근 별 목록 · addStar(text) → 별 · setHeart(id, on) · report(id) · watchHearts(ids, cb)
  const localDB = {
    mode: 'local',
    async init() {},
    async fetchPool() { return store.get('stars', []).filter(st => !st.hidden).map(st => ({ id: String(st.id), text: st.text, hearts: st.hearts || 0 })); },
    async addStar(text) {
      const all = store.get('stars', []), st = { id: 'l' + Date.now(), text, hearts: 0, reports: 0, hidden: false, createdAt: Date.now() };
      all.push(st); store.set('stars', all.slice(-200)); return { id: st.id, text, hearts: 0 };
    },
    async setHeart(id, on) {
      const all = store.get('stars', []), st = all.find(o => String(o.id) === id);
      if (st) { st.hearts = Math.max(0, (st.hearts || 0) + (on ? 1 : -1)); store.set('stars', all); }
    },
    async report(id) {
      const all = store.get('stars', []), st = all.find(o => String(o.id) === id);
      if (st) { st.reports = (st.reports || 0) + 1; st.hidden = st.reports >= CONFIG.stars.hideAfterReports; store.set('stars', all); }
    },
    async getHearts(ids) { const all = store.get('stars', []); return Object.fromEntries(ids.map(id => [id, (all.find(o => String(o.id) === id) || {}).hearts || 0])); },
    watchHearts() { return () => {}; }, // 로컬은 다른 사람이 없으니 실시간 알림 없음
  };
  let DB = localDB;
  const dbReady = (async () => {
    if (!CONFIG.firebase?.apiKey) return;
    try { const m = await import('./firebase.js'); DB = await m.createDB(CONFIG.firebase, CONFIG.stars); }
    catch (err) { console.warn('[잔불] Firebase 연결 실패 → 이 기기 안에서만 동작', err); DB = localDB; }
  })();

  // 예전 버전 데이터 옮기기 (stars 안의 mine/hearted 표시 → myStars / hearted)
  if (!store.get('myStars', null)) {
    const old = store.get('stars', []);
    store.set('myStars', old.filter(st => st.mine).map(st => ({ id: String(st.id), text: st.text, x: st.x, y: st.y })));
    store.set('hearted', old.filter(st => st.hearted).map(st => String(st.id)));
    store.set('stars', old.map(st => ({ ...st, id: String(st.id) })));
  }

  // ───────────── 별빛 ─────────────
  const starsEl = $('#stars'), starPop = $('#starPop');
  let openStar = null;
  const byId = new Map();                       // id → 별 객체 { id, text, hearts } (팝업이 열려 있어도 숫자만 갱신)
  let pool = [];                                // 하늘에 돌릴 다른 사람 별 (최근 100개)
  const myStars = store.get('myStars', []);     // 내가 띄운 별 { id, text, x, y } — 마지막이 최신
  const hearted = new Set(store.get('hearted', []));
  const reported = new Set(store.get('reported', []));
  const isMine = id => myStars.some(m => m.id === id);
  const keep = st => { const o = byId.get(st.id); if (o) { o.hearts = st.hearts; o.text = st.text; return o; } byId.set(st.id, st); return st; };
  function myLatest() {
    const m = myStars[myStars.length - 1]; if (!m) return null;
    return byId.get(m.id) || keep({ id: m.id, text: m.text, hearts: 0 });
  }
  // 하늘 규칙: 최대 12개 (다른 사람 11 + 내 최신 1), 10초마다 1개씩 교체
  //  - 고정: 팝업이 열린 별 · 누른 지 3초 안 된 별 · 내 최신 별
  const SKY = { max: 12, rotateMs: 10000, touchHoldMs: 3000, fadeMs: 1200 };
  const shown = new Map(); // id → { st, el, x, y, touched }
  const shownAt = new Map(); // id → 마지막으로 하늘에 띄운 시각 (오래 안 보인 별 우선)
  const starPool = () => { const me = myLatest(); return pool.filter(st => st !== me && !reported.has(st.id)); };
  function renderStar(st, how) {
    const me = myLatest(), mine = st === me, m = mine && myStars[myStars.length - 1];
    const pos = mine && m.x != null ? { x: m.x, y: m.y } : pickStarPos();
    const b = document.createElement('button');
    b.className = 'star' + (how ? ' ' + how : '') + (mine ? ' mine' : ''); b.style.left = pos.x + 'px'; b.style.top = pos.y + 'px';
    b.style.setProperty('--tw', rand(2.4, 4.2).toFixed(2) + 's'); b.setAttribute('aria-label', mine ? '내 다짐 보기' : '누군가의 다짐 보기');
    const rec = { st, el: b, x: pos.x, y: pos.y, touched: 0 };
    b.addEventListener('click', ev => { ev.stopPropagation(); rec.touched = performance.now(); showStar(st, b, rec); });
    starsEl.appendChild(b); shown.set(st.id, rec); shownAt.set(st.id, Date.now());
    return rec;
  }
  function removable(rec) {
    return rec.st !== openStar && rec.st !== myLatest() && performance.now() - rec.touched > SKY.touchHoldMs;
  }
  function fadeOut(rec) {
    shown.delete(rec.st.id); rec.el.classList.add('out'); rec.el.style.pointerEvents = 'none';
    setTimeout(() => rec.el.remove(), SKY.fadeMs);
  }
  function nextFromPool() {
    const cand = starPool().filter(st => !shown.has(st.id));
    if (!cand.length) return null;
    cand.sort((a, b) => (shownAt.get(a.id) || 0) - (shownAt.get(b.id) || 0));
    return pick(cand.slice(0, Math.max(1, Math.ceil(cand.length / 3)))); // 오래 안 보인 쪽에서 무작위
  }
  function fillSky() { // 빈자리가 있으면 채움 (처음 불러왔을 때 · 풀이 늘었을 때)
    const me = myLatest(); if (me && !shown.has(me.id)) renderStar(me);
    while (shown.size < SKY.max) { const st = nextFromPool(); if (!st) break; renderStar(st, 'fadeIn'); }
  }
  function rotateSky() {
    if (state !== 'main' || document.hidden) return;
    if (shown.size < SKY.max) { fillSky(); return; }
    const add = nextFromPool(); if (!add) return; // 바꿀 별이 없으면 그대로
    const out = [...shown.values()].filter(removable);
    if (!out.length) return;
    out.sort((a, b) => (shownAt.get(a.st.id) || 0) - (shownAt.get(b.st.id) || 0));
    fadeOut(out[0]); // 가장 오래 떠 있던 별부터
    setTimeout(() => renderStar(add, 'fadeIn'), 500);
  }
  async function refreshPool() {
    try {
      const list = await DB.fetchPool();
      pool = list.filter(st => !reported.has(st.id)).map(keep);
      if (openStar) $('#heartCount').textContent = openStar.hearts || 0;
    } catch (err) { console.warn('[잔불] 별 목록을 못 불러옴', err); }
  }
  dbReady.then(refreshPool).then(fillSky);
  setInterval(rotateSky, SKY.rotateMs);
  setInterval(() => { if (!document.hidden) refreshPool(); }, CONFIG.stars.refreshMs);
  function pickStarPos() {
    const k = CONFIG.sky, others = [...shown.values()];
    for (let i = 0; i < 40; i++) {
      const p = { x: rand(k.x0, k.x1), y: rand(k.y0, k.y1) };
      if (others.every(o => Math.hypot(o.x - p.x, o.y - p.y) > 100)) return { x: Math.round(p.x), y: Math.round(p.y) };
    }
    return { x: Math.round(rand(k.x0, k.x1)), y: Math.round(rand(k.y0, k.y1)) };
  }
  // 다짐이 길어도 잘리지 않게: 칸 안에 들어갈 때까지 글자 크기를 줄임 (26 → 최소 16)
  function fitText(el) {
    el.style.setProperty('--fs', '26px');
    for (let f = 26; f > 16; f -= 1) {
      const inner = document.createElement('span'); inner.textContent = el.textContent;
      el.textContent = ''; el.appendChild(inner);
      const fits = inner.offsetHeight <= el.clientHeight && inner.offsetWidth <= el.clientWidth + 1;
      el.textContent = inner.textContent;
      if (fits) return;
      el.style.setProperty('--fs', (f - 1) + 'px');
    }
  }
  const reportBtn = $('#reportBtn');
  function showStar(st, el, rec) {
    if (state !== 'main') return;
    openStar = st;
    const stText = $('#starText');
    stText.textContent = st.text;
    const on = hearted.has(st.id);
    $('#heartCount').textContent = st.hearts || 0;
    $('#heartBtn').classList.toggle('done', on); $('#heartBtn').setAttribute('aria-pressed', on);
    reportBtn.hidden = isMine(st.id); reportBtn.classList.remove('confirm'); reportBtn.textContent = '신고';
    starPop.hidden = false;
    fitText(stText);
    const sc = toScreen(rec ? rec.x : 0, rec ? rec.y : 0), popH = starPop.offsetHeight;
    let top = sc.y + 50 * s; if (top + popH > fh - 260 * s) top = sc.y - popH - 50 * s;
    starPop.style.top = clamp(top, 140 * s, fh - popH - 20) + 'px';
    track('star_open');
  }
  // 온기 더하기: 별 하나당 한 번만, 다시 누르면 취소 (켜기/끄기)
  $('#heartBtn').addEventListener('click', e => {
    if (!openStar) return;
    const st = openStar, on = !hearted.has(st.id);
    if (on) { const r = e.currentTarget.getBoundingClientRect(), p = toWorld(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2); burst(p.x, p.y, 40, .9, addTop); sfx.warm(); } else sfx.click();
    on ? hearted.add(st.id) : hearted.delete(st.id); store.set('hearted', [...hearted]);
    st.hearts = Math.max(0, (st.hearts || 0) + (on ? 1 : -1));
    $('#heartCount').textContent = st.hearts; $('#heartBtn').classList.toggle('done', on);
    $('#heartBtn').setAttribute('aria-pressed', on);
    DB.setHeart(st.id, on).catch(err => console.warn('[잔불] 온기 저장 실패', err));
    track(on ? 'heart_on' : 'heart_off');
  });
  // 신고: 한 번 누르면 '신고할까요?'로 바뀌고, 한 번 더 누르면 신고 (브라우저 확인창은 쓰지 않음)
  reportBtn.addEventListener('click', e => {
    e.stopPropagation(); if (!openStar) return;
    if (!reportBtn.classList.contains('confirm')) { reportBtn.classList.add('confirm'); reportBtn.textContent = '신고할까요?'; return; }
    const st = openStar; reported.add(st.id); store.set('reported', [...reported]);
    DB.report(st.id).catch(err => console.warn('[잔불] 신고 저장 실패', err));
    starPop.hidden = true; openStar = null;
    const rec = shown.get(st.id); if (rec) fadeOut(rec);
    pool = pool.filter(o => o !== st);
    toast('신고했어요\n이 별은 다시 보이지 않아요'); track('star_report');
  });
  starPop.querySelector('[data-close]').addEventListener('click', () => { starPop.hidden = true; openStar = null; });
  frame.addEventListener('pointerdown', e => { if (!starPop.hidden && !starPop.contains(e.target) && !e.target.closest('.star')) { starPop.hidden = true; openStar = null; } });

  // 온기 알림 (B안): 다시 왔을 때 지난번 이후 합계 1번 + 머무는 동안 실시간, 최대 30초에 한 번 묶어서
  const heartSeen = store.get('heartSeen', {}); // 내 별 id → 마지막으로 알려 준 온기 수
  let heartPending = 0, heartFlushAt = 0, heartTimer = 0;
  function noteHearts(map, silent) {
    let gained = 0;
    for (const [id, n] of Object.entries(map)) {
      const before = heartSeen[id]; heartSeen[id] = n;
      if (before != null && n > before) gained += n - before;
      const o = byId.get(id); if (o) o.hearts = n;
    }
    store.set('heartSeen', heartSeen);
    if (silent || !gained) return 0;
    heartPending += gained; scheduleHeartToast(); return gained;
  }
  function scheduleHeartToast() {
    if (heartTimer) return;
    const wait = Math.max(0, heartFlushAt - Date.now());
    heartTimer = setTimeout(() => {
      heartTimer = 0; if (!heartPending) return;
      if (state !== 'main' || busy || !cardModal.hidden || !woodModal.hidden) { heartFlushAt = Date.now() + 5000; scheduleHeartToast(); return; } // 다른 연출 중이면 잠시 뒤
      toast(`당신이 띄운 불씨에 온기 ${heartPending}개가 닿았어요`); track('heart_notice', { n: heartPending });
      heartPending = 0; heartFlushAt = Date.now() + CONFIG.stars.heartNoticeMs;
    }, wait);
  }
  let stopWatch = () => {};
  async function watchMyHearts() {
    const ids = myStars.slice(-CONFIG.stars.watchMine).map(m => m.id); if (!ids.length) return;
    try { noteHearts(await DB.getHearts(ids)); } catch { /* 오프라인 */ }
    stopWatch(); stopWatch = DB.watchHearts(ids, map => noteHearts(map));
  }

  // 공개되는 다짐 검사: 욕설 · 링크 · 연락처
  function blocked(text) {
    const t = text.toLowerCase();
    if (/https?:|www\.|\.(com|net|kr|io|me|ly)\b|open\.kakao|t\.me\//.test(t)) return '링크는 별빛에 담을 수 없어요.';
    if (/\d[\d\s-]{8,}\d/.test(t) || /@[a-z0-9_.]{3,}/.test(t)) return '연락처·계정은 별빛에 담을 수 없어요.';
    const n = t.replace(/[\s\d.,!?~\-_*·'"`^@#$%&()+=\[\]{}<>/\\|:;♡♥☆★…]+/g, '');
    if (CONFIG.banned.some(w => n.includes(w))) return '모두가 보는 별빛이라 고운 말로 바꿔 주세요.';
    return '';
  }

  // ───────────── 장작 넣기 ─────────────
  const woodModal = $('#woodModal'), woodForm = $('#woodForm'), input = $('#woodInput'), submitBtn = $('#submitBtn');
  let mode = 'dream';
  const MODE_TEXT = {
    dream: { label: '나의 다짐·소원·응원', ph: '내가 좋아하는 일을 끝까지 해볼래요.', note: '따뜻한 마음을 모두와 나눠요', btn: '불씨로 띄우기' },
    burn: { label: '태워버릴 고민', ph: '남들 시선이 자꾸 신경 쓰여요.', note: '아무에게도 보이지 않아요', btn: '태워보내기' },
  };
  function setMode(m) {
    mode = m;
    woodForm.querySelectorAll('.mode').forEach(b => { const on = b.dataset.mode === m; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    const t = MODE_TEXT[m];
    $('#inputLabel').textContent = t.label; input.placeholder = t.ph; $('#modeNote').textContent = t.note;
    submitBtn.querySelector('span').textContent = t.btn; submitBtn.classList.toggle('burnMode', m === 'burn');
  }
  woodForm.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  const syncReady = () => submitBtn.classList.toggle('ready', input.value.trim().length > 0);
  input.addEventListener('input', () => { $('#formErr').textContent = ''; syncReady(); });
  $('#woodBtn').addEventListener('click', () => { if (state !== 'main' || busy) return; guideDone('wood'); $('#woodBtn').classList.remove('guide'); starPop.hidden = true; clearTimeout(woodHideT); woodModal.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => { woodModal.classList.add('show'); $('#woodDim').classList.add('show'); app.classList.add('dim'); })); track('wood_open'); });
  woodModal.querySelector('[data-close]').addEventListener('click', closeWood);
  let woodHideT = 0;
  const setDim = on => { $('#woodDim').classList.toggle('show', on); app.classList.toggle('dim', on); };
  function closeWood(keepDim = false) {
    input.blur(); woodModal.classList.remove('show'); if (!keepDim) setDim(false);
    clearTimeout(woodHideT); woodHideT = setTimeout(() => { woodModal.hidden = true; woodModal.classList.remove('kb'); frame.classList.remove('kbOpen'); }, 460);
  }

  // 키보드가 올라오면 입력창+버튼을 키보드 위로
  const vv = window.visualViewport;
  function onViewport() {
    if (!vv || woodModal.hidden) return;
    const kb = typing() && vv.height < Math.max(window.innerHeight, baseH) - 120;
    woodModal.classList.toggle('kb', kb); frame.classList.toggle('kbOpen', kb); // 키보드 떠 있는 동안 아래 버튼들 숨김
    woodModal.style.setProperty('--kbTop', (vv.offsetTop + 10) + 'px');
    if (kb) woodModal.style.height = vv.height + vv.offsetTop + 'px'; else woodModal.style.height = '';
  }
  vv?.addEventListener('resize', onViewport); vv?.addEventListener('scroll', onViewport);
  input.addEventListener('focus', () => setTimeout(onViewport, 300));
  input.addEventListener('blur', () => setTimeout(() => { onViewport(); layout(); }, 250)); // 키보드 내려가면 원래 크기로

  woodForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim().replace(/\s+/g, ' ').slice(0, 50);
    if (!text) { $('#formErr').textContent = '한 줄이라도 적어 주세요.'; return; }
    if (mode === 'dream') {
      const why = blocked(text);
      if (why) { $('#formErr').textContent = why; return; }
      const wait = Math.ceil((store.get('lastPost', 0) + 30000 - Date.now()) / 1000); // 서버 규칙과 같은 30초
      if (wait > 0) { $('#formErr').textContent = `${wait}초 뒤에 다시 띄울 수 있어요.`; return; }
      store.set('lastPost', Date.now());
    }
    sfx.warm(); closeWood(true); input.value = ''; syncReady(); // 장작이 타는 동안에도 영화처럼 어둡게 유지
    throwWood(text, mode);
  });

  function throwWood(text, m) {
    const paper = document.createElement('div'); paper.className = 'paper';
    paper.textContent = text; paper.style.left = CONFIG.fire.x + 'px'; paper.style.top = '1420px';
    scene.appendChild(paper);
    const f = CONFIG.fire, LAND = 'translateY(-250px) scale(.72) rotate(-6deg)';
    busy = true; $('#woodBtn').disabled = true;
    // ① 종이가 날아가 모닥불 위에 얹힘 (1.3초)
    paper.animate([
      { transform: 'translateY(0) scale(1) rotate(0)' },
      { transform: 'translateY(-330px) scale(.85) rotate(-10deg)', offset: .6 },
      { transform: LAND },
    ], { duration: 1300, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' }).finished.then(() => {
      addTemp(CONFIG.temp.wood); gust = 1.4; flareUp(); reactAll(); sfx.fire();
      return m === 'burn' ? burnPaper() : kindlePaper();
    }).finally(() => { busy = false; $('#woodBtn').disabled = false; setDim(false); memberArts.forEach(a => { if (a) a.until = 0; }); });

    // ② 태우기: 가장자리부터 그을리고 → 검게 타서 → 재로 부서져 날아감 (약 2.6초)
    function burnPaper() {
      paper.classList.add('charring');
      const py = f.y - 75;
      const tick = setInterval(() => { // 타는 동안 계속 재와 불티
        for (let i = 0; i < 4; i++) add({ k: 'ash', x: f.x + rand(-80, 80), y: py + rand(-30, 30), vx: rand(-.8, .8), vy: -rand(.4, 1.6), max: rand(140, 220), size: rand(5, 12), rot: rand(0, 6) });
        add({ k: 'ember', x: f.x + rand(-70, 70), y: py, vx: rand(-.6, .6), vy: -rand(1, 2.5), max: rand(60, 100), size: rand(2.5, 4), ph: rand(0, 6) });
      }, 90);
      return paper.animate([
        { transform: LAND, opacity: 1 },
        { transform: 'translateY(-250px) scale(.66) rotate(-4deg)', opacity: 1, offset: .65 },
        { transform: 'translateY(-270px) scale(.4) rotate(6deg)', opacity: 0 },
      ], { duration: 2600, easing: 'ease-in', fill: 'forwards' }).finished.then(() => {
        clearInterval(tick); paper.remove(); ash(f.x, py, 30); burnCount++; lastEntry = { mode: 'burn', text };
        toast('고민이 재가 되어 사라졌어요'); track('wood_burn');
        if (!peak || temp < 100) setTimeout(() => say(randomMember(), pick(CONFIG.burnLines), { anim: 'react' }), 400);
      });
    }

    // ③ 다짐: 종이가 황금빛으로 달아오르고 → 불씨 하나로 모여 → 천천히 하늘로 올라가 별이 됨 (약 5초)
    function kindlePaper() {
      paper.classList.add('kindling');
      return paper.animate([
        { transform: LAND, opacity: 1 },
        { transform: 'translateY(-270px) scale(.78) rotate(-2deg)', opacity: 1, offset: .6 },
        { transform: 'translateY(-300px) scale(.08) rotate(0)', opacity: 0 },
      ], { duration: 1500, easing: 'ease-in', fill: 'forwards' }).finished.then(() => new Promise(done => {
        paper.remove(); sfx.star();
        const pos = pickStarPos(), saving = DB.addStar(text).catch(err => { console.warn('[잔불] 다짐 저장 실패', err); return null; });
        burst(f.x, f.y - 120, 16, .5);
        add({ k: 'dream', sx: f.x, sy: f.y - 120, tx: pos.x, ty: pos.y, max: 210, done: () => saving.then(saved => {
          const st = keep(saved || { id: 'tmp' + Date.now(), text, hearts: 0 });
          if (shown.size >= SKY.max) { const out = [...shown.values()].filter(removable); if (out.length) fadeOut(out[0]); }
          const prevSt = myLatest(), prev = prevSt && shown.get(prevSt.id);
          if (prev) prev.el.classList.remove('mine');
          if (prevSt && !pool.includes(prevSt)) pool.push(prevSt); // 이전 내 별은 일반 별로 돌아감
          myStars.push({ id: st.id, text, x: pos.x, y: pos.y }); store.set('myStars', myStars.slice(-30));
          renderStar(st, 'born'); burst(pos.x, pos.y, 22, .6);
          toast(saved ? '다짐이 밤하늘의 별빛이 되었어요' : '별빛을 띄웠지만 저장하지 못했어요\n다른 사람에게는 보이지 않아요');
          setTimeout(() => say(randomMember(), pick(CONFIG.dreamLines), { anim: 'react' }), 400);
          if (saved) watchMyHearts();
          done();
        }) });
        lastDream = text; store.set('lastDream', text); lastEntry = { mode: 'dream', text }; track('wood_dream');
      }));
    }
  }

  // ───────────── 불씨 카드 ─────────────
  const cardModal = $('#cardModal'), cardImg = $('#cardImg');
  let cardBlob = null;
  cardBtn.addEventListener('click', async () => { await makeCard(); ui.classList.add('hidden'); frame.classList.add('carding'); starPop.hidden = true; document.querySelectorAll('.bubble').forEach(b => b.remove()); cardModal.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => cardModal.classList.add('show'))); track('card_open'); });
  cardModal.querySelector('[data-close]').addEventListener('click', () => { ui.classList.remove('hidden'); frame.classList.remove('carding'); cardModal.classList.remove('show'); setTimeout(() => { cardModal.hidden = true; }, 500); });
  function wrap(c, text, maxW) {
    const out = []; let line = '';
    for (const ch of text) { const t = line + ch; if (c.measureText(t).width > maxW && line) { out.push(line); line = ch; } else line = t; }
    if (line) out.push(line); return out;
  }
  // 마음 카드: 지금 하늘(노을) 위에 온도 배지와 종이 카드를 얹은 한 장 (화면 표시와 저장이 같은 그림)
  const cardAssets = {};
  ['card-badge', 'card-badge-low', 'card-paper', 'ui-flame-big'].forEach(n => { const im = new Image(); im.src = 'assets/' + n + '.png'; cardAssets[n] = im; window.__keepImgs?.push(im); });
  let badgeFull = true;
  function setCardBadge() { // 100°C면 '100%' 배지, 아니면 빈 배지에 지금 온도
    const t = Math.round(temp); badgeFull = t >= 100;
    $('#cardBadgeImg').src = 'assets/' + (badgeFull ? 'card-badge' : 'card-badge-low') + '.png';
    $('#cardBadgeTemp').textContent = badgeFull ? '' : t + '°C';
    $('#cardBadge').setAttribute('aria-label', '잔불 온도 ' + (badgeFull ? '100%' : t + '°C'));
  }
  async function makeCard() {
    setCardBadge();
    const disp = getComputedStyle($('.slogan')).fontFamily;
    try { await Promise.all([`700 46px ${disp}`, `400 20px ${disp}`].map(f => document.fonts.load(f))); } catch { /* 대체 글꼴 */ }
    await Promise.all(Object.values(cardAssets).map(im => im.decode ? im.decode().catch(() => {}) : 0));
    // 화면용: 종이 카드만 투명 캔버스에 그림 (뒤로는 실제 장면과 모닥불이 그대로 보임)
    const K = 1.5, c = document.createElement('canvas'); c.width = W * K; c.height = H * K;
    const x = c.getContext('2d'); x.scale(K, K);
    const P = cardAssets['card-paper'], F = cardAssets['ui-flame-big'];
    if (P.naturalWidth) x.drawImage(P, 104, 156);
    if (F.naturalWidth) x.drawImage(F, 423, 192, 88, 98);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const ls = v => { if ('letterSpacing' in x) x.letterSpacing = v + 'px'; };
    const entry = lastEntry; // 이번 방문에서 넣은 장작만 (예전 방문 다짐은 쓰지 않음)
    const head = !entry ? '오늘의 잔불' : entry.mode === 'burn' ? '오늘 태워보낸 고민' : '오늘 지펴낸 다짐';
    x.fillStyle = '#b8601a'; x.font = `700 25px ${disp}`; ls(-.5); x.fillText(head, 467, 318);
    const body = !entry ? '불이 작아진 것뿐, 우린 여전히 타고 있다' : entry.mode === 'burn' ? (entry.comfort ||= pick(CONFIG.comforts)) : entry.text; // 태운 고민은 어디에도 남기지 않고 위로 멘트로
    let fs = 46, lines;
    for (; fs >= 26; fs -= 2) { x.font = `700 ${fs}px ${disp}`; ls(-fs * .02); lines = wrap(x, body, 450); if (lines.length * fs * 1.55 <= 340) break; }
    const lh = fs * 1.55, y0 = 555 - (lines.length - 1) * lh / 2;
    x.fillStyle = '#5b2a14'; lines.forEach((l, i) => x.fillText(l, 467, y0 + i * lh));
    // 가사: 곡 하나 → 구절 하나 (lyrics.js). 줄바꿈(\n)은 줄을 나눠 아래(출처 위)에 맞춰 쌓음
    const songs = LYRICS.filter(t => t.lines.length);
    const song = songs.length ? pick(songs) : null;
    cardSong = song;
    if (song) { // 구분선(y≈780)과 출처(y 908) 사이에 가사 한 줄 — 길면 글자를 줄여 카드 폭에 맞춤
      const t = '“' + pick(song.lines).join(' ') + '”';
      let lfs = 30;
      for (; lfs > 16; lfs--) { x.font = `700 ${lfs}px ${disp}`; ls(-lfs * .02); if (x.measureText(t).width <= 600) break; }
      x.fillStyle = '#b5561c'; x.fillText(t, 467, 846);
    }
    // 출처: 곡 제목 - N.Flying (오른쪽 '원곡 들으러 가기'와 겹치지 않게 폭에 맞춰 줄임)
    x.textAlign = 'left'; x.fillStyle = '#a08a74'; ls(0);
    let credit = `${song ? song.song : '잔불'} - N.Flying`, cfs = 19;
    const fitC = () => { for (cfs = 19; cfs > 13; cfs--) { x.font = `400 ${cfs}px ${disp}`; if (x.measureText(credit).width <= 195) return true; } return false; };
    if (!fitC() && song) { credit = song.song; fitC(); }
    x.fillText(credit, 388, 908);
    $('#cardListen').href = song?.url || MV;
    cardPaper = c;
    cardImg.src = c.toDataURL('image/png');
  }
  let cardPaper = null, cardSong = null;
  // 카드 가사: lyrics.txt (정리한 형식 그대로) → [{ song, url, lines: [[줄, 줄], …] }]
  let LYRICS = [];
  function parseLyrics(txt) {
    const out = []; let song = null, item = null;
    const close = () => { if (item && song) { const ls2 = item.split(/\(br\)|\n/i).map(t => t.trim()).filter(Boolean); if (ls2.length) song.lines.push(ls2); } item = null; };
    for (const raw of txt.split(/\r?\n/)) {
      const line = raw.trim(); if (!line || line.startsWith('#')) { if (!line && item != null) item += '\n'; continue; }
      const h = line.match(/^\((\d+)\)\s*(.+?)(?:\s+(https?:\/\/\S+))?$/);
      if (h) { close(); song = { song: h[2].trim(), url: h[3] ? h[3].split('?')[0] : MV, lines: [] }; out.push(song); continue; }
      const it = line.match(/^(\d+)\.\s*(.*)$/);
      if (it && song) { close(); item = it[2]; continue; }
      if (item != null) item += '\n' + line;
    }
    close(); return out;
  }
  fetch('lyrics.txt').then(r => r.ok ? r.text() : '').then(t => { LYRICS = parseLyrics(t); }).catch(() => {});
  // 저장: 버튼을 뺀 지금 화면을 그대로 한 장으로 (하늘 + 모닥불·불티 + 배지 + 카드)
  window.__snap = () => snapshotCard().then(b => URL.createObjectURL(b));
  function snapshotCard() {
    const K = 1.5, c = document.createElement('canvas'); c.width = W * K; c.height = H * K;
    const x = c.getContext('2d'); x.scale(K, K);
    x.drawImage($('#bg'), 0, 0, W, H);
    const { a2, a3 } = skyMix();
    if (hasLayer(bgLayers[0])) { x.globalAlpha = a2; x.drawImage(bgLayers[0], 0, 0, W, H); }
    if (hasLayer(bgLayers[1])) { x.globalAlpha = a3; x.drawImage(bgLayers[1], 0, 0, W, H); }
    x.globalAlpha = 1;
    memberArts.forEach((a, i) => { if (a) { const bx = memberBoxes[i]; x.drawImage(a.cv, bx.x, bx.y, bx.w, bx.h); } }); // 멤버 그림
    const sp = $('#spineCv'); if (sp) x.drawImage(sp, 0, CONFIG.spine.area.top, W, CONFIG.spine.area.height); // 멤버 캐릭터
    // 화면에 그려진 불꽃·불티(효과 캔버스)를 장면 좌표로 옮겨 그림
    x.save(); x.translate(-offX / s, -offY / s); x.scale(1 / (s * dpr), 1 / (s * dpr)); x.drawImage(cvs, 0, 0); x.restore();
    const bt = parseFloat(getComputedStyle($('#cardBadge')).translate?.split(' ')[1] || 0) || 0;
    const B = cardAssets[badgeFull ? 'card-badge' : 'card-badge-low'];
    if (B.naturalWidth) x.drawImage(B, 282, 27 + bt);
    if (!badgeFull) { x.fillStyle = '#fff'; x.font = `700 40px ${getComputedStyle($('.slogan')).fontFamily}`; x.textAlign = 'left'; x.textBaseline = 'middle'; if ('letterSpacing' in x) x.letterSpacing = '-.8px'; x.fillText($('#cardBadgeTemp').textContent, 480, 85 + bt); }
    if (cardPaper) x.drawImage(cardPaper, 0, 0, W, H);
    return new Promise(r => c.toBlob(r, 'image/png'));
  }
  // 앱 안 브라우저(카카오톡·인스타그램·페이스북·라인·네이버 앱 등)
  const IN_APP = /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER\(inapp|DaumApps|everytimeApp/i.test(navigator.userAgent);
  const pressSave = $('#pressSave');
  function showLongPress(blob) {
    const img = pressSave.querySelector('img'); URL.revokeObjectURL(img.src); img.src = URL.createObjectURL(blob);
    pressSave.hidden = false; track('card_save_longpress');
  }
  pressSave.addEventListener('click', () => { pressSave.hidden = true; });
  $('#saveBtn').addEventListener('click', async () => {
    track('card_save');
    try {
      cardBlob = await snapshotCard();
      if (!cardBlob) throw new Error('no image');
      const file = new File([cardBlob], 'janbul-card.png', { type: 'image/png' });
      if (IN_APP) { showLongPress(cardBlob); return; } // 카톡·인스타 등 앱 안 브라우저는 다운로드가 막혀 있음 → 길게 눌러 저장
      if (navigator.canShare?.({ files: [file] })) { // 휴대폰: 공유 시트에서 '이미지 저장'
        try { await navigator.share({ files: [file] }); toast('저장되었습니다'); }
        catch (err) { if (err?.name !== 'AbortError') toast('저장에 실패했습니다'); } // 사용자가 닫은 경우는 안내 없음
        return;
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(cardBlob); a.download = 'janbul-card.png';
      document.body.appendChild(a); a.click(); a.remove();
      toast('저장되었습니다');
    } catch { toast('저장에 실패했습니다'); }
  });
  $('#shareBtn').addEventListener('click', async () => {
    track('card_share');
    const data = { title: '잔불', text: '불이 작아진 것뿐, 우린 여전히 타고 있다', url: location.href };
    try { if (navigator.share) { await navigator.share(data); return; } } catch { return; }
    try { await navigator.clipboard.writeText(location.href); toast('링크를 복사했어요'); } catch { toast('주소창의 링크를 복사해 공유해 주세요'); }
  });

  // ───────────── 원곡 링크 ─────────────
  for (const a of [$('#listenBtn'), $('#cardListen')]) {
    a.href = MV; a.addEventListener('click', () => track('listen_click', { from: a.id === 'listenBtn' ? 'top' : 'card' }));
  }

  frame.appendChild(cvsTop);
  // ───────────── 토스트 ─────────────
  const toastEl = $('#toast'); let toastTimer = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600); }

  function onEnterMain() {
    fadeIntro();
    track('enter_main');
    heartFlushAt = Date.now() + 1500; dbReady.then(watchMyHearts); // 지난번 이후 받은 온기는 들어오고 잠시 뒤 한 번
    bgm.play().catch(() => {});
  }

  // ───────────── 근경 풀 흔들림 (배경에서 아래쪽 띠를 잘라 줄 단위로 살짝 좌우로 밀어 바람을 표현) ─────────────
  const swayCv = $('#sway'), swayCtx = swayCv.getContext('2d');
  swayCv.hidden = !CONFIG.sway.enabled;
  let swayK = 0;
  function drawSway(now) {
    const S = CONFIG.sway, k = Math.min(s * dpr, 2), h = H - S.top;
    if (k !== swayK) { swayK = k; swayCv.width = Math.ceil(W * k); swayCv.height = Math.ceil(h * k); }
    const t = now / 1000, x = swayCtx, imgs = [[$('#bg'), 1]];
    const { a2, a3 } = skyMix();
    if (hasLayer(bgLayers[0]) && a2 > .01) imgs.push([bgLayers[0], a2]);
    if (hasLayer(bgLayers[1]) && a3 > .01) imgs.push([bgLayers[1], a3]);
    x.setTransform(k, 0, 0, k, 0, 0); x.clearRect(0, 0, W, h);
    const gust = .6 + .4 * Math.sin(t * .45) * Math.sin(t * .23 + 1); // 바람이 셌다 약해졌다
    const ROW = 3;
    for (let y = 0; y < h; y += ROW) {
      const wy = S.top + y, w = clamp((wy - S.top) / (S.fadeTo - S.top), 0, 1);
      const dx = S.amp * gust * w * (Math.sin(t * 1.3 + wy * .045) + .5 * Math.sin(t * 2.2 + wy * .11 + 2));
      for (const [img, a] of imgs) { x.globalAlpha = a; x.drawImage(img, 0, wy, W, ROW, dx, y, W, ROW); }
    }
    x.globalAlpha = 1;
  }

  // ───────────── 루프 ─────────────
  let last = performance.now(), swayTick = 0;
  function loop(now) {
    const dt = clamp((now - last) / 16.667, 0, 3); last = now;
    updateTemp(dt);
    gust = Math.max(0, gust - .02 * dt); wind *= 1 - .03 * dt; flare = Math.max(0, flare - .045 * dt);
    const I = clamp(.3 + .7 * (temp / 100) + gust * .35 + flare * .5, 0, 1.8);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cvs.width, cvs.height);
    const wo = worldOffset();
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * offX, dpr * (offY + wo * s));
    if (cam > .4) { ctx.globalAlpha = clamp((cam - .4) / .6, 0, 1); drawGlow(I, now); ctx.globalAlpha = 1; }
    if (state !== 'intro' || cam > 0) spawnFire(cam < 1 ? I * cam : I, dt);
    if (state === 'intro' && Math.random() < .18 * dt) { // 타이틀과 성냥 끝의 잔불
      add({ k: 'ember', x: rand(610, 665), y: rand(560, 690) + INTRO_TOP, vx: rand(-.15, .3), vy: -rand(.4, 1.1), max: rand(70, 120), size: rand(1.6, 2.8), ph: rand(0, 6) });
    }
    if (state === 'main' && temp >= 98 && Math.random() < .9 * dt) { // 100°C: 화면 가득 잔불이 흩날림
      add({ k: 'ember', x: rand(-20, W + 20), y: rand(H * .55, H + 30), vx: rand(-.6, .9), vy: -rand(1.2, 2.8), max: rand(220, 360), size: rand(2.4, 4.6), ph: rand(0, 6), a: .5 }); // 100°C 잔불은 50%
    }
    if (state === 'intro') renderIntro(now);
    if (CONFIG.sway.enabled && cam > .3 && (swayTick++ & 1) === 0) drawSway(now);
    drawParts(dt, parts);
    ctxTop.setTransform(1, 0, 0, 1, 0, 0); ctxTop.clearRect(0, 0, cvsTop.width, cvsTop.height);
    if (topParts.length) { const c0 = ctx; ctx = ctxTop; drawParts(dt, topParts); ctx = c0; }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
