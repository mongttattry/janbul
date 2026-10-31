// 잔불 — 멤버 Spine 캐릭터
// main.js 가 CONFIG.spine.enabled 일 때만 런타임(lib/spine-webgl.min.js)과 이 파일을 불러온다.
// 캐릭터 5명을 캔버스 하나에 그린다 (멤버 버튼은 그대로 위에 남아 터치 영역 역할).
//
// 각 멤버 설정 (CONFIG.spine.members[i]):
//   skel   : .skel(바이너리) 또는 .json 경로      atlas : .atlas 경로 (png는 atlas 옆에 같이)
//   scale  : 크기 배율          dx, dy : 그루터기 중심에서 어긋난 만큼 (디자인 px, 아래가 +)
//   flip   : true면 좌우 반전   skin   : 스킨 이름 (없으면 기본)
//   anims  : { idle, talk, react, cheer } — Spine 애니메이션 이름. 없는 이름은 건너뜀
window.JanbulSpine = (() => {
  let app = null, ready = false;
  const actors = []; // { skeleton, state, cfg }

  function start({ config, scene, getScale, members }) {
    const S = config.spine, W = config.W, H = config.H, area = S.area;
    const cv = document.createElement('canvas');
    cv.id = 'spineCv';
    cv.style.cssText = `position:absolute;left:0;top:${area.top}px;width:${W}px;height:${area.height}px;pointer-events:none;`;
    scene.insertBefore(cv, scene.querySelector('#members'));

    app = new spine.SpineCanvas(cv, {
      pathPrefix: '',
      webglConfig: { alpha: true, preserveDrawingBuffer: true }, // 불씨 카드 저장 때 캔버스를 그대로 복사하려고
      app: {
        loadAssets(c) {
          for (const m of S.members) {
            if (!m) continue;
            if (/\.json$/i.test(m.skel)) c.assetManager.loadJson(m.skel); else c.assetManager.loadBinary(m.skel);
            c.assetManager.loadTextureAtlas(m.atlas);
          }
        },
        initialize(c) {
          S.members.forEach((m, i) => {
            if (!m) return;
            try {
              const atlas = c.assetManager.require(m.atlas);
              const loader = new spine.AtlasAttachmentLoader(atlas);
              const reader = /\.json$/i.test(m.skel) ? new spine.SkeletonJson(loader) : new spine.SkeletonBinary(loader);
              reader.scale = m.scale ?? 1;
              const data = reader.readSkeletonData(c.assetManager.require(m.skel));
              const skeleton = new spine.Skeleton(data);
              if (m.skin) { skeleton.setSkinByName(m.skin); skeleton.setSlotsToSetupPose(); }
              const seat = config.seats[i];
              skeleton.x = seat.x + (m.dx || 0);
              skeleton.y = H - (seat.y + (m.dy || 0)); // Spine은 위가 +, 화면은 아래가 +
              skeleton.scaleX = m.flip ? -1 : 1;
              const stateData = new spine.AnimationStateData(data);
              stateData.defaultMix = S.mix ?? 0.2;
              const state = new spine.AnimationState(stateData);
              const has = n => n && data.findAnimation(n);
              if (has(m.anims?.idle)) {
                const e = state.setAnimation(0, m.anims.idle, true);
                e.trackTime = Math.random() * e.animationEnd; // 다섯 명이 똑같이 숨쉬지 않게
              }
              actors[i] = { skeleton, state, cfg: m, has, pma: !!atlas.pages[0]?.pma };
              members[i].classList.add('spine'); // 자리표시(점선 동그라미) 숨김
            } catch (err) { console.warn(`[잔불] ${i + 1}번 멤버 Spine 불러오기 실패`, err); }
          });
          ready = true;
        },
        update(c, delta) {
          for (const a of actors) {
            if (!a) continue;
            a.state.update(delta); a.state.apply(a.skeleton);
            a.skeleton.update?.(delta);
            a.skeleton.updateWorldTransform(spine.Physics ? spine.Physics.update : undefined);
          }
        },
        render(c) {
          // 장면 배율에 맞춰 선명하게: 실제 화면 픽셀 = 디자인 px × 배율 × 기기 픽셀비
          const k = Math.min(getScale() * Math.min(window.devicePixelRatio || 1, 2), 2);
          const w = Math.round(W * k), h = Math.round(area.height * k);
          if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
          const r = c.renderer, cam = r.camera;
          c.gl.viewport(0, 0, w, h);
          cam.setViewport(W, area.height);
          cam.position.x = W / 2; cam.position.y = H - (area.top + area.height / 2);
          cam.update();
          c.clear(0, 0, 0, 0);
          r.begin();
          for (const a of actors) if (a) r.drawSkeleton(a.skeleton, a.pma);
          r.end();
        },
        error(c, errors) { console.warn('[잔불] Spine 파일을 못 불러옴', errors); },
      },
    });
  }

  // anim: 'talk' | 'react' | 'cheer' — 한 번 재생 후 대기 동작으로 돌아감
  function play(i, anim) {
    const a = actors[i]; if (!ready || !a) return false;
    const name = a.cfg.anims?.[anim], idle = a.cfg.anims?.idle;
    if (!a.has(name)) return false;
    a.state.setAnimation(0, name, false);
    if (a.has(idle)) a.state.addAnimation(0, idle, true, 0);
    return true;
  }

  return { start, play, get ready() { return ready; } };
})();
