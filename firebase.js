// 잔불 — Firebase 연결 (main.js가 CONFIG.firebase 가 있을 때만 불러옴)
// 로그인 없이 '익명 로그인'으로 기기마다 아이디를 받아, 온기·신고를 한 사람당 한 번으로 제한한다.
// 서버 쪽 규칙은 firestore.rules 에 있음 (콘솔 > Firestore > 규칙에 붙여 넣기)
const V = '10.12.2';
const SDK = `https://www.gstatic.com/firebasejs/${V}/`;

export async function createDB(config, opt) {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(config);
  const A = auth.getAuth(app);
  await A.authStateReady();
  if (!A.currentUser) await auth.signInAnonymously(A);
  const uid = A.currentUser.uid;

  const db = fs.getFirestore(app);
  const stars = fs.collection(db, 'stars');
  const starRef = id => fs.doc(db, 'stars', id);
  const toStar = d => ({ id: d.id, text: d.data().text, hearts: d.data().hearts || 0 });
  const mineQuery = n => fs.query(stars, fs.where('uid', '==', uid), fs.orderBy('createdAt', 'desc'), fs.limit(n));

  return {
    mode: 'firebase',

    // 최근 다짐 (숨김 제외)
    async fetchPool() {
      const q = fs.query(stars, fs.where('hidden', '==', false), fs.orderBy('createdAt', 'desc'), fs.limit(opt.poolSize));
      return (await fs.getDocs(q)).docs.map(toStar);
    },

    // 다짐 올리기 — 같은 사람은 30초에 한 번 (users/{uid}.lastPost 로 규칙에서 검사)
    async addStar(text) {
      const ref = fs.doc(stars), b = fs.writeBatch(db);
      b.set(fs.doc(db, 'users', uid), { lastPost: fs.serverTimestamp() });
      b.set(ref, { text, uid, hearts: 0, reports: 0, hidden: false, createdAt: fs.serverTimestamp() });
      await b.commit();
      return { id: ref.id, text, hearts: 0 };
    },

    // 온기 켜기/끄기 — stars/{id}/hearts/{uid} 문서 + 숫자 ±1 을 한 번에
    async setHeart(id, on) {
      const b = fs.writeBatch(db), h = fs.doc(db, 'stars', id, 'hearts', uid);
      if (on) b.set(h, { at: fs.serverTimestamp() }); else b.delete(h);
      b.update(starRef(id), { hearts: fs.increment(on ? 1 : -1) });
      await b.commit();
    },

    // 신고 — 한 사람당 한 번, 누적 opt.hideAfterReports 이상이면 숨김
    async report(id) {
      await fs.runTransaction(db, async tx => {
        const snap = await tx.get(starRef(id));
        if (!snap.exists()) return;
        const n = (snap.data().reports || 0) + 1;
        tx.set(fs.doc(db, 'stars', id, 'reports', uid), { at: fs.serverTimestamp() });
        tx.update(starRef(id), { reports: n, hidden: n >= opt.hideAfterReports });
      });
    },

    // 내 별들의 온기 수 { id: n }
    async getHearts() {
      const snap = await fs.getDocs(mineQuery(opt.watchMine));
      return Object.fromEntries(snap.docs.map(d => [d.id, d.data().hearts || 0]));
    },

    // 내 별 온기 실시간 — 바뀔 때마다 cb({ id: n }), 반환값은 구독 해제 함수
    watchHearts(_ids, cb) {
      return fs.onSnapshot(mineQuery(opt.watchMine),
        snap => cb(Object.fromEntries(snap.docs.map(d => [d.id, d.data().hearts || 0]))),
        err => console.warn('[잔불] 온기 실시간 끊김', err));
    },
  };
}
