# 잔불 (Still) — 비공식 팬 메이드 웹앱

## 1. 내 컴퓨터에서 실행
VS Code에서 폴더를 열고 **Live Server** 확장으로 `index.html`을 여세요.
(파일을 더블클릭해서 열면 Firebase·Spine이 막힙니다)

## 2. 파일 구성
| 파일 | 내용 |
| --- | --- |
| `index.html` / `style.css` / `main.js` | 화면 · 스타일 · 동작 전부. 바꿀 값은 `main.js` 맨 위 `CONFIG`에 모여 있음 |
| `firebase.js` | 별 공유 · 온기 · 신고 서버 연결 (CONFIG.firebase가 있을 때만 불러옴) |
| `firestore.rules` | Firestore 보안 규칙 (콘솔에 붙여 넣기) |
| `firestore.indexes.json` | 필요한 색인 2개 (참고용 — 콘솔에서 만들어도 됨) |
| `members-spine.js` + `lib/spine-webgl-4.2.min.js` | 멤버 Spine 캐릭터 |
| `assets/spine-sample/` | Spine 동작 확인용 공식 예제(spineboy). **배포 전에 삭제** |
| `.nojekyll` | GitHub Pages가 파일을 건드리지 않게 하는 빈 파일 (지우지 말 것) |

## 3. 교체할 것
| 자리 | 위치 |
| --- | --- |
| 폰트 | `fonts/` 에 HeirOfLight-Regular·Bold(.woff2 또는 .ttf), PretendardVariable.woff2 |
| 배경음악 | `assets/bgm.mp3` — 넣기만 하면 자동 재생 |
| 효과음 | `assets/sfx/` — intro(인트로 터치), wind(바람·계속), click(터치), warm(온기 더하기·태워보내기·불씨로 띄우기), talk(말풍선), fire(장작 탈 때), star(별 될 때), cheer(100°C). 볼륨은 `main.js`의 `SFX` |
| 공유 썸네일 · 아이콘 | `assets/og.png` (1200×630), `assets/favicon.png` (512×512) |
| 멤버 대사 · 환호 · 태움/지핌 대사 · 공통 대기 대사 · 위로 멘트 · 장작 안내 | `CONFIG.lines / cheer / burnLines / dreamLines / commonLines / comforts / guide` |
| 카드 가사 (수록곡별 구절 · 링크) | `lyrics.txt` — 정리한 형식 그대로 붙여 넣기 (`(1)제목 링크` / `1.구절` / `(br)`), 설명은 파일 맨 위 |
| 멤버 자리 순서 | `CONFIG.members` (왼쪽부터 이승협, 차훈, 김재현, 유회승, 서동성) |
| 다짐 금지어 | `CONFIG.banned` |

## 4. Firebase 연결 (별 공유 · 온기 · 신고)
비워 두면 이 기기 안에서만 동작합니다. 연결 순서:

1. https://console.firebase.google.com → **프로젝트 추가** (애널리틱스는 꺼도 됨)
2. **Authentication** → 시작하기 → 로그인 방법 → **익명** 사용 설정
3. **Firestore Database** → 데이터베이스 만들기 → 위치 **asia-northeast3 (서울)** → 프로덕션 모드
4. Firestore → **규칙** 탭 → `firestore.rules` 내용 전체 붙여 넣기 → 게시
5. **프로젝트 설정(톱니)** → 내 앱 → 웹(</>) 앱 추가 → 나오는 `firebaseConfig` 값을 `main.js`의
   `CONFIG.firebase: null` 자리에 그대로 붙여 넣기
   ```js
   firebase: { apiKey: '…', authDomain: '…', projectId: '…', storageBucket: '…', messagingSenderId: '…', appId: '…' },
   ```
6. Live Server로 열어 다짐을 하나 띄워 보기. 처음엔 브라우저 콘솔(F12)에 **"The query requires an index"** 링크가 뜹니다 →
   링크를 눌러 색인 만들기 (2개, 몇 분 걸림). 다 만들어지면 새로고침.
7. (권장) Google Cloud 콘솔 → API 및 서비스 → 사용자 인증 정보 → 브라우저 키 → **웹사이트 제한**에
   `https://내아이디.github.io/*` 와 `http://127.0.0.1:5500/*` 추가

규칙이 막는 것: 남의 별 고치기, 온기·신고 한 사람당 한 번, 다짐 50자 초과, 같은 사람 30초 안에 연달아 올리기.
신고 3번이면 자동 숨김(숨긴 별은 콘솔 Firestore에서 `hidden`을 false로 바꾸면 복구).

## 5-0. 멤버 그림 (Spine 전 임시, 프레임 애니메이션)
- 멤버별 6장: 대기(숨쉬기) 1·2, 말하기 1·2, 환호 1·2
- 파일 이름: `assets/member-{번호}-{idle|talk|cheer}{1|2}.png` — 예) `member-1-idle1.png`, `member-1-talk2.png`, `member-3-cheer1.png`
- 번호: 1 이승협, 2 차훈, 3 김재현, 4 유회승, 5 서동성
- 눈 깜박임: `member-{번호}-idle3.png` (대기 자세에서 눈만 감은 것). 대기 중에 2.5~6초마다 0.13초, 가끔 두 번 연속
- **배경과 같은 942×1671 투명 PNG**에 그루터기 위 제자리로 그린 것 (6장 모두 같은 자리 기준)
- 동작: 평소엔 대기 1·2 번갈아(0.7초), 말풍선 뜨면 말하기 1·2(0.18초), 100°C·장작 넣을 때 환호 1·2. 속도는 `CONFIG.memberArt`
- 빠진 장은 비슷한 장으로 대신함. 터치 영역·말풍선 위치는 그림에 맞춰 자동
- Spine을 켜면(`CONFIG.spine.enabled: true`) 그림은 자동으로 꺼짐

## 5. Spine 캐릭터
1. Spine 에디터 버전 확인 → 4.2가 아니면 런타임 교체 (`lib/` 파일과 `CONFIG.spine.runtime`)
2. 내보내기: **바이너리(.skel)** + 아틀라스(.atlas + .png). 멤버별로 `assets/spine/` 에 넣기
3. 애니메이션 이름 4개: 대기 · 말하기 · 리액션(장작) · 환호(100°C) — 이름은 자유, `anims`에 적기
4. `CONFIG.spine.enabled: true`, `members[i]`의 `skel / atlas / scale / dx / dy / anims`를 멤버별로 채우기
5. 발끝이 그루터기 윗면에 오도록 `dy`, 크기는 `scale`로 맞추기. 머리가 잘리면 `area.top`을 줄이기

## 6. GitHub Pages 배포
1. GitHub에서 새 저장소(예: `janbul`) 만들기 → 이 폴더 안의 파일 전부 올리기 (`assets/spine-sample/` 은 빼고)
2. 저장소 **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save
3. 1~2분 뒤 `https://내아이디.github.io/janbul/` 에서 열림
4. 공유 썸네일 주소는 `https://mongttattry.github.io/janbul/assets/og.png` 로 맞춰 둠 → `assets/og.png` 만 넣으면 됨 (저장소 이름을 janbul이 아닌 다른 이름으로 하면 `index.html`의 og 주소 2곳도 바꾸기)
5. 카카오톡에 링크를 이미 공유했는데 썸네일이 옛날 것이면: 카카오 디벨로퍼스 사이트의 **공유 디버거** 도구에서 주소를 넣고 캐시 초기화

## 7. 알아 둘 것
- 카카오톡·인스타그램 안에서 열면 이미지 저장이 막혀 있어 **"이미지를 길게 눌러 저장"** 화면이 대신 뜹니다.
- 통계(GA4): `main.js` 맨 위 `CONFIG.GA_ID`(G-VQRB6FSD5N)로 방문·기능별 이벤트가 집계됩니다. `mongttattry.github.io`에서 열렸을 때만 보내서, 내 컴퓨터·미리보기 방문은 섞이지 않습니다. 유저가 쓴 글 내용은 보내지 않습니다.
