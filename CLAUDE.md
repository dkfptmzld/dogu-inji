# 도구인지 활동 — 오프라인 튜토리얼 (인수인계 문서)

어르신 대상 "도구인지" 수업용 튜토리얼이다. USB에 담아 **인터넷 없이** 브라우저로 여는 HTML 한 장과 영상 폴더로 이루어진다.
이 문서는 Claude Code가 작업을 이어받을 때 필요한 배경, 구조, 재생성 방법, 남은 일을 정리한 것이다.

> 작업 환경 메모: 지금까지는 Linux 클라우드 컨테이너에서 만들었다. 아래 명령의 `/tmp`, `$(npm root -g)` 등은 Windows에서는 알맞게 바꿔 쓴다
> (예: `/tmp/frames` → `.\frames`, `NODE_PATH` 대신 각 폴더에서 `npm i -D playwright`). `node_modules`와 렌더 프레임은 용량 때문에 묶음에서 뺐다.

## 사용자 요구사항 (반드시 지킬 것)

- 대상이 **어르신**이다. 글씨는 크게, 화살표와 손가락 이름표로 안내하고, 동작은 천천히 보여 준다.
- **인터넷 없이** 동작해야 한다. CDN, 웹폰트, 외부 URL을 쓰지 않는다. 결과물은 `도구인지활동.html` + `videos/` 폴더뿐이다.
- 화면은 **PPT처럼 넘기는 방식**이다. 다음/이전 버튼, 방향키, 스페이스, 발표용 리모컨(PageUp/PageDown)으로 넘긴다.
- **한 장 = 활동 하나**다. 동작 단위로 쪼개지 않는다. 영상은 끝나면 **처음부터 반복**(video `loop`)한다.
- 목록 화면은 **프로그램명이 주인공**이고, 같은 주차의 프로그램 2개를 한 칸으로 묶는다.
- **유료 크레딧(힉스필드 등)은 쓰지 않는 방법**을 우선한다. 사용자 계정은 무료 플랜이다.
- 새 방식으로 크게 바꾸기 전에 **미리보기 이미지를 먼저 보여 주고** 확인을 받는다.
- 답변은 한국어로 한다.

## 폴더 구조

```
dogu-inji/
├─ CLAUDE.md                     ← 이 문서
├─ deliverable/                  ← USB에 그대로 넣는 최종 결과물
│  ├─ 도구인지활동.html
│  └─ videos/
│     ├─ 08-2/1.mp4              ← 8주차 산가지: 막대 10개 검지로 긁어오며 세기 (3D, 40초)
│     └─ 18-1/1.mp4              ← 18주차 핑거링: 1번 모양 (2D, 38초)
├─ originals/                    ← 사용자가 준 원본 자료
│  ├─ 도구인지_26주차_교구사용현황_2026.10.13.hwp   (26주차×2 = 52개 프로그램 목록)
│  ├─ 핑거링_모양자료.hwp                         (핑거링 1~4번 모양 그림 4장)
│  ├─ 참고_RingRingGame_캡처.jpg                  (사용자가 원하는 손·고무줄 퀄리티 참고 캡처)
│  └─ fingering_images/pattern1~4.png           (hwp에서 꺼낸 2480×1754 원본 그림)
├─ pipeline/
│  ├─ fingering_2d/              ← 핑거링 영상 만드는 2D 파이프라인 (Python + Canvas)
│  │  ├─ scripts/
│  │  └─ assets/                 ← 빈손 그림, 잘라낸 고무줄, 애니메이션 HTML
│  └─ sticks_3d/                 ← 산가지 영상 만드는 3D 파이프라인 (three.js)
├─ compare_rubberband_AB/        ← 핑거링 2번 모양 A안/B안 비교 페이지 (사용자 결정 대기)
└─ previews/                     ← 그동안 사용자에게 보여 준 미리보기 이미지
```

## 결과물 HTML (`deliverable/도구인지활동.html`)

한 파일에 CSS/JS가 모두 들어 있다. 고칠 곳은 스크립트 위쪽 두 상수뿐이다.

- `WEEKS`: 26주차 × 프로그램 2개 이름. 순서 = 화면 순서.
- `DETAILS`: 프로그램별 내용. 키는 `"주차-순서"` (예: 18주차 첫 번째 = `"18-1"`).
  ```js
  "18-1": {
    items: ["핑거링 10개 (...)"],                 // 표지의 준비물
    steps: [                                       // 한 장에 활동 하나
      { label: "1번 모양", text: "아래 자막" },    // 영상: videos/18-1/1.mp4
      { label: "2번 모양", text: "" },             // 영상: videos/18-1/2.mp4 (없으면 '모션그래픽 자리' 안내)
    ]
  }
  ```
- 영상 경로 규칙: `videos/<주차 두 자리>-<순서>/<활동 번호>.mp4`. 예: 8주차 두 번째 프로그램의 첫 활동 → `videos/08-2/1.mp4`.
- 내용이 없는 프로그램은 빈 활동 3장(`EMPTY_STEPS`)이 자리만 잡혀 있다.
- 슬라이드 순서: 표지(프로그램명·주차·준비물) → 활동 1, 2, … → 마지막 장에서 "다음 프로그램 ▶".
- 키: →/↓/PageDown/Space/Enter 다음, ←/↑/PageUp/Backspace 이전, Home 표지, F/F5 전체화면, Esc 목록.
- 영상은 `autoplay loop muted playsinline`. **H.264 MP4**로 넣는다 (크롬·엣지 기본 재생).
- **'다음 프로그램'은 같은 주차 안에서만** 넘어간다 (2026-11-02 사용자 지시): 1번째 프로그램 끝 → 2번째 표지, 2번째 끝 → "목록으로". 2번째 표지에서 이전 → 1번째 마지막 장, 1번째 표지에서는 이전 막힘.
- 목록 화면 맨 위에 **이루리 실버 스포츠 로고**(`Desktop\이루리 스포츠\이루리 로고1.png`를 220px로 줄여 base64로 `<img id="logo">`에 넣음, 슬라이드 위쪽 작은 로고는 JS로 같은 src 복사). 주차는 왼쪽 큰 숫자 칸, 프로그램마다 "활동 N개 / 준비 중" 표시.

현재 내용이 들어간 곳: `2-1`(색깔큐브 4장, 3D+효과음), `8-2`(산가지), `18-1`(핑거링 1~4번 모양).
- 활동에 `sound: true`를 주면 그 장의 영상은 소리를 켜고 재생한다(막히면 무음으로라도 재생). 효과음이 들어간 색깔큐브에 사용.

## 파이프라인 3 — 색깔큐브 3D (`pipeline/cube_3d`)

> 작업 위치: 2026-11-02부터 `Desktop\도구인지 보강영상\dogu-inji`. 사용자가 찍은 원본 영상은 `Desktop\도구인지 보강영상\색깔큐브\1~7.mp4`(HEVC 세로, 선생님 설명 음성 포함).

원본 영상 7개 = 소개(1) · 색깔 찾기(2) · 첫 번째 그림 한 줄씩(3~6) · 정리(7). 사용자 지시로 **촬영 영상을 쓰지 않고 3D로 다시 만들고, 목소리 대신 효과음만** 넣었다. 손은 넣지 않고 큐브가 스스로 움직이며 글씨·테두리·숫자로 안내한다. 3~6은 한 장(첫 번째 그림)으로 합쳤다.

- `src/cube.js`: `cube.html?s=1~4` 장면. 1 소개(14.7초) / 2 색깔 찾기(30.5초, 검정→빨강→파랑→노랑→초록→주황, 주황은 빨강과 나란히 비교) / 3 첫 번째 그림(27.6초, 검정·빨강·빨강·검정 세로줄) / 4 정리(25.8초, 카드 넘기기→16개 세며 주머니→카드도 담기). `window.EVENTS`에 효과음 시각을 남긴다.
- 큐브 면 순서는 `FACES`(+x 빨강, −x 주황, +y 검정, −y 노랑, +z 파랑, −z 초록), `upQuat(색)`으로 원하는 색을 위로 돌린다. 도안은 `P_INTRO`, `P_ONE`, `P_LAST`.
- `render.js <장면> <폴더> [시각들]`: 프레임 PNG + `events.json`. **`GPU=1`이면 이 PC 그래픽카드(d3d11)로 그려서 장면당 30초 안팎**이다(SwiftShader보다 훨씬 빠름).
- `sfx.py events.json sfx.wav`: 효과음 직접 합성(톡·뿅·휙·딩동·삑). 외부 음원 없음.
```powershell
cd pipeline/cube_3d; npm i            # three 0.169, esbuild, playwright
npx esbuild src/cube.js --bundle --outfile=cube.bundle.js
$env:GPU="1"; node render.js 3 .\frames\s3
python -I sfx.py .\frames\s3\events.json .\frames\s3\sfx.wav
ffmpeg -framerate 30 -i .\frames\s3\f%04d.png -i .\frames\s3\sfx.wav -c:v libx264 -pix_fmt yuv420p -crf 21 -c:a aac -b:a 128k -shortest -movflags +faststart ..\..\deliverable\videos\02-1\3.mp4
```

## 파이프라인 1 — 핑거링 2D (`pipeline/fingering_2d`)

사용자 원본 그림을 그대로 살려 움직인다. 손과 고무줄이 처음부터 같은 그림체라 가장 자연스럽다고 사용자가 고른 방식이다.

### 원리
1. **빈손 만들기** (`make_clean_hand.py`): 4장 그림의 손은 픽셀 단위로 같고 고무줄만 다르다. 각 장에서 고무줄이 없는 픽셀만 평균내고, 4장 모두 가려진 곳은 반대 손을 좌우 반전(양손이 x=1240 기준 거울상)해 채운다. → `assets/hand_clean.png`
2. **고무줄 잘라내기**: 원본 − 빈손 차이로 알파를 만들고 배경을 빼 고무줄 색을 복원한다.
   - `cut_pattern1.py` → `s1_r*.png`, `s1.json` (1번 모양, 붙은 두 개 분리 포함)
   - `cut.py N` → `qN_r*.png`, `qN.json` (N번 모양 일반)
3. **애니메이션**: `assets/*.html`을 헤드리스 크롬에서 열고 `draw(t)`를 프레임마다 호출해 PNG로 뽑은 뒤 ffmpeg로 MP4.

### 파일
| 파일 | 역할 |
|---|---|
| `scripts/make_clean_hand.py` | 빈손 그림 생성 |
| `scripts/cut_pattern1.py` | 1번 모양 고무줄 10개 잘라내기 |
| `scripts/cut.py N` | N번 모양 고무줄 잘라내기 |
| `scripts/bandgeo.py N` | 긴 고무줄(여러 손가락) 축·손가락 구간 측정 → `gN.json` |
| `scripts/pinch.py N 26` | 고무줄이 살을 조이는 왜곡 그림 → `warpN.png` |
| `assets/steps.html` | 1번 모양 애니메이션 (`drawSeq(T)`가 현재 쓰는 한 편짜리, `draw(k,t)`는 예전 단계별 버전) |
| `assets/p2.html` | 2번 모양 A안 `drawA(T)` / B안 `drawB(T)` |
| `assets/rubber.js` | 긴 고무줄을 코드로 그리는 함수 (`drawRubber`, `drawRubberPull`) |
| `scripts/render3.js` | steps.html → 1번 모양 한 편 프레임 렌더 |
| `scripts/render4.js` | p2.html → A/B안 프레임 렌더 |
| `scripts/render2.js` | (예전) 단계별 11개 클립 렌더 |

### 다시 만들기
```bash
cd pipeline/fingering_2d/scripts
python3 make_clean_hand.py && python3 cut_pattern1.py          # 이미 assets에 결과가 있으니 고칠 때만
# 1번 모양 영상
NODE_PATH=$(npm root -g) node render3.js "$PWD/../assets" /tmp/frames
ffmpeg -framerate 30 -i /tmp/frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 21 -movflags +faststart ../../../deliverable/videos/18-1/1.mp4
# 2번 모양 A안/B안
NODE_PATH=$(npm root -g) node render4.js "$PWD/../assets" /tmp/fa A
```
필요: Python3 + opencv-python + numpy, Node + playwright(크로미움), ffmpeg, 한글 폰트(Noto Sans CJK KR).

## 파이프라인 2 — 산가지 3D (`pipeline/sticks_3d`)

손가락 관절이 움직여야 해서 3D로 만들었다. 손 모델은 `@webxr-input-profiles/assets`의 generic-hand(MIT), 렌더는 three.js r169.

### 현재 영상 (`src/stickscrape.js`) — 사용자 최종 지시
- 네모난 막대 **10개**가 뒤쪽에 가로로 줄지어 있다.
- **앞에 있는 것부터** 하나씩, **양손 검지 끝을 막대 뒤쪽에 걸어 탁자 위로 앞쪽 흰 자리까지 긁어온다** (들어 올리지 않음).
- 화면에는 숫자 없이 **"갯수를 세어주세요"**만 띄운다.
- 막대 하나 3.6초, 한 바퀴 40초, 끝나면 반복. 시점은 내 손을 위에서 내려다보는 1인칭.

예전 버전(참고용): `stickanim.js` = 양손 검지로 양 끝 눌러 들어 옮기기(파랑·빨강·초록 3개), `stickcount.js` = 같은 방식 10개.

### 다시 만들기
```bash
cd pipeline/sticks_3d
npm install && npm i -D playwright && npx playwright install chromium
npx esbuild src/stickscrape.js --bundle --loader:.glb=binary --outfile=stickscrape.bundle.js
node rend_part.js "$PWD/stickscrape.html" /tmp/ss 0 2 & node rend_part.js "$PWD/stickscrape.html" /tmp/ss 1 2 & wait
ffmpeg -framerate 30 -i /tmp/ss/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 21 -movflags +faststart ../../deliverable/videos/08-2/1.mp4
```
GPU 없는 환경에서는 SwiftShader로 그리므로 1,200프레임에 30분 안팎이 걸린다. `rend_part.js`로 코어 수만큼 나눠 돌린다.
미리보기만 볼 때: `node rend_st.js "$PWD/stickscrape.html" /tmp/prev "1.6,2.3,20"`.

## 알아 둔 함정

- **헤드리스 크로미움(Playwright 기본)은 H.264를 재생하지 못한다.** HTML 재생 테스트는 webm으로 바꾼 복사본으로 하고, 실제 결과물은 MP4(H.264)로 둔다.
- `file://`에서 canvas를 `toDataURL`하려면 `--allow-file-access-from-files --disable-web-security` 실행 옵션이 필요하다. GLB는 fetch가 막히므로 esbuild `--loader:.glb=binary`로 번들에 넣는다.
- generic-hand의 **뼈대가 평평하다**(모든 뼈가 같은 부모). 손가락을 굽힐 때 자식 뼈가 따라오지 않으므로 `sticks2.js`의 `bend()`처럼 관절 위치를 직접 회전시켜 계산한다.
- `place(hand, pose, tipTarget, yaw, pitch)`에서 **pitch가 음수면 손목이 올라간다**. 양수면 손이 탁자 밑으로 들어간다. yaw 0 = 손가락이 화면 안쪽(-Z)을 향하고 손목이 카메라 쪽.
- 손목이 잘린 단면이 보여서 하늘색 **소매**를 달았다(`sticks2.js` loadHand).
- 핑거링 원본의 **긴 막대형 고무줄은 부자연스럽다**는 피드백이 있었다. 여러 손가락에 걸친 고무줄은 원본을 오리지 말고 `rubber.js`로 새로 그린다(얇게, 손가락 위에서 살짝 휘고, 사이는 팽팽하게, 뒷줄 비침, 살 눌림 warp).
- 3D 손은 무료 모델이라 점토 인형 느낌이다. 핑거링 같은 그림체 손에는 쓰지 않기로 했다.

## 결정 이력 (요약)

1. HTML 메뉴 + MP4 방식 채택 (오프라인, 설치 불필요).
2. 주차 중심 → 프로그램명 중심 + 같은 주차 묶기.
3. 영상 재생 → PPT식 넘기기 → 동작별 장 → **활동별 한 장 + 반복**으로 확정.
4. 핑거링: 3D·AI생성 비교 후 **원본 그림 살리는 2D 방식** 채택(크레딧 0). 화살표+손가락 이름표 추가.
5. 긴 고무줄: A안(완성된 고무줄이 통째로 내려옴) / B안(한 손가락에 걸고 옆 손가락으로 당겨 늘림) 비교 → **A안 확정 (2026-11-02)**. 2~4번 모양 모두 A안으로 제작.
6. 산가지: 색 지정 들어 옮기기 → 10개 앞에서부터 세기 → **검지로 긁어오기**로 확정.
8. 색깔큐브(2주차): 촬영 영상 → **3D 모션그래픽 + 효과음만**, 4장(소개·색깔 찾기·첫 번째 그림·정리)으로 확정 (2026-11-02). 미리보기 `previews/색깔큐브_3D_미리보기.png` 확인 후 제작.
7. 힉스필드 비용 문의: 40초 기준 Kling 약 60크레딧, Seedance 720p 약 280크레딧. 정확한 개수·순서 표현이 어렵고 구독이 필요해 현재 방식 유지.

## 남은 일

- [x] 핑거링 2~4번 모양 (A안): `videos/18-1/2.mp4`(= 비교용 A.mp4), `3.mp4`·`4.mp4`(각 31.4초) 완성, 자막 채움.
  - 3·4번은 `scripts/bandgeo2.py N`(색깔별로 고무줄을 나눠 측정 → `gN.json`, 붙어 있던 두 줄도 분리) → `assets/gN.js`(`window.G=` + json) → `scripts/pinch.py N 26` → `assets/pA.html?k=N`(A안 일반화, 엄지 포함) → `node scripts/renderA.js assets <프레임폴더> N` → ffmpeg.
  - pA.html은 살 눌림(warp)을 먼저 모두 깔고 고무줄을 위에 그린다. 고무줄끼리 가까우면 눌림 그림이 앞 고무줄을 지우기 때문.
  - Windows에서는 `pipeline/fingering_2d`에 `npm i -D playwright` 해 두었다(node_modules).
- [ ] 나머지 50개 프로그램은 내용이 없다. 사용자가 활동 순서·준비물을 알려 주면 같은 방식으로 채운다.
- [ ] 캡처(RingRingGame)처럼 색을 골라 끌어다 놓는 핑거링 도구는 아이디어 단계에서 멈춰 있다.

## 휴대폰용 한 파일 (2026-11-02)
- 문제: 카톡 등으로 HTML만 보내면 videos 폴더가 같이 안 가서 휴대폰에서 영상이 안 보임.
- 해결: `python pipeline/build_mobile.py` → `휴대폰용/도구인지활동_휴대폰용.html` (영상을 HTML 안에 base64로 넣은 한 파일, 현재 약 19MB).
- HTML의 `clipUrl()`이 `window.EMBED`가 있으면 내장 영상(Blob URL)을, 없으면 videos 폴더를 씀 → USB용 원본은 그대로 동작.
- 영상을 새로 만들거나 고치면 build_mobile.py를 다시 돌려야 휴대폰용에도 반영됨. 영상이 많아지면 파일이 커지므로(52개 다 차면 수백 MB 가능) 그때는 주차별로 나누는 방식 검토.
- 휴대폰 화면(폭 900px 이하)에서 하단 버튼 한 줄 정렬 CSS 추가.

## 색깔큐브 정리하기(02-1/4) 수정 (2026-11-02, 김유천 대리 피드백)
- 어르신들이 블록 16개 세기에만 집중해 카드 순서를 안 맞추고 넣어서 다음 수업 때 헷갈림.
- 순서 변경: ① 그림카드를 첫 장으로 넘김(카드 클로즈업, 약 5초 강조) → 카드를 먼저 주머니에 → ② 블록 16개 세며 담기. 카드는 8장 두께. 영상 33.6초.

## 색깔큐브 그림카드 순서 장 추가 (2026-11-02, 김유천 대리 피드백)
- 활동 소개 다음에 "그림카드 순서" 장 추가 → 02-1 영상: 1 소개 / 2 카드 순서(scene5) / 3 색깔 찾기(scene2) / 4 첫 번째 그림(scene3) / 5 정리(scene4).
- 장면 번호와 영상 번호가 다르니 주의: render.js 장면 5 → videos/02-1/2.mp4, 장면 2 → 3.mp4, 장면 3 → 4.mp4, 장면 4 → 5.mp4.
- 실제 카드 8장 사진(색깔큐브\KakaoTalk_20261102_223722769*.jpg, 접미사 없음=1번, _01~_07=2~8번)에서 무늬를 옮겨 cube.js `P_ALL`에 저장. 8번(P_LAST) 3번째 줄 수정(주황·빨강·주황·파랑).
- 준비물 "빨간 주머니" → "복주머니", "그림 도안 카드" → "그림 도안 카드 8장".
- 색깔큐브 5장 모두 `once: true` → 반복 안 하고 한 번 재생 후 끝나기 1.6초 전(마지막 문구가 보이는 화면)에서 멈춤. 다른 프로그램은 기존처럼 반복. 단계에 `once: true`를 넣으면 같은 방식으로 적용됨.
- 색깔 찾기(02-1/3.mp4, 장면 2): 색 하나당 문구가 약 5초 보이게 늘림(D 4.4→6.4, 주황 7.4→9.4). 영상 42.5초.
- 정리하기 영상 문구도 '복주머니'로 통일.

## 네 글자 이어 말하기 (2주차 2번째, 2-2) — 2026-11-03
- 원본: Desktop\도구인지 보강영상\네 글자 이어 말하기\ (카드 사진 29장 + 설명 영상 1개: "앞 두 글자를 보고 뒤 단어를 머릿속으로 생각해 완성하고 손을 높이 들어 발표")
- 사용자 결정: 정답은 넣지 않음(강사님이 직접). 장 구성은 Claude 판단 → 소개 1장 + 카드 7·7·7·8장 묶음 4장.
- cube.js 장면 6 = 소개(예시 카드 '허수○○', ①보기 ②생각 ③손 들고 발표), 장면 7~10 = 카드 묶음(카드마다 등장 → 5초 타이머(톡 소리) → "손을 높이 들어 발표해요!" + 손 그림).
- 영상 번호: 장면 6→videos/02-2/1.mp4, 7→2, 8→3, 9→4, 10→5. 단어 목록은 cube.js `WORDS`(사진 순서, 접미사 없음=1번, _01~_28=2~29번).
- 반복 재생(once 없음). 휴대폰용 파일 약 45MB로 커짐.
- (변경) 사용자 요청 "글자만 크게": 3D 카드·안내 문구·손 그림 제거. 흰 바탕에 큰 글자(bigWord)만, 왼쪽 위 "N / 29", 아래 가는 막대로 5초 생각 시간. 카드당 8.1초. 소개(장면 6)도 큰 '허수○○' + ①②③ 문구.
- (최종 변경) 사용자 요청 "영상 말고 PPT 형식으로 한 장씩": 2-2는 영상 없음. HTML 단계에 `word: "일기"`를 주면 영상 대신 큰 글자 슬라이드(.bigword: 검은 테두리 주황 글씨 + ○○ 고리)로 그림. 소개 1장(허수○○) + 카드 29장 = 30장.
  videos/02-2 폴더는 비움(만들었던 영상은 사용 안 함). cube.js 장면 6~10은 남아 있지만 쓰지 않음.

## 3~4주차 (2026-11-10, 김유천 대리 카톡 11/9 자료)
- 원본: Desktop\도구인지 보강 PPT\3주차_지오보드(8), 3주차_숨은동물그림찾기(5), 4주차_파이프블록(8), 4주차_초성퀴즈(영상1 + 초성카드_01~20.jpg). 카톡에서 직접 저장.
- 3-2 숨은 동물 그림 찾기: 영상 없이 그림 슬라이드(`img:`) + 정답 영상. 소개 1 + (문제 그림, 정답 영상)×4 = 9장.
  - `pipeline/animals.py`: 영상에서 가장 선명한 장면 → 카드 펴기 → 손글씨(펜=가장 진한 색) 지우고 2색 그림 q1~4.jpg (2배 처리로 눈·귀 같은 가는 선 살림).
  - `pipeline/animal_outlines.py`: 동물별 (점, 범위상자). 점이 속한 영역의 경계 중 상자 안 부분만 = 그 동물 테두리. 큰 동물(host)은 바깥 윤곽에서 다른 동물 상자 부분 제외.
  - `pipeline/animal_answers.py`: ans1~4.mp4 — 1번부터 빨간 테두리가 그려지고 그림 밖 이름표가 선으로 이어짐, 끝에 '정답 N마리!'(효과음 pop·ding). HTML에서 once+sound. 마지막 화면은 previews/숨은동물_정답N.jpg.
  - 대리님 정답 사진(손글씨)은 originals/숨은동물_정답사진/ 에 보관(결과물엔 안 넣음).
- 4-2 초성퀴즈: 영상 없이 큰 초성 슬라이드(`cho: "ㄱㄹ"`). 소개(ㄷ) + 카드 20장.
- HTML 새 단계 종류: `img:`(그림), `cho:`(초성). build_mobile.py는 jpg도 넣음.
- 3-1 지오보드, 4-1 파이프 블록: 3D 영상 예정. 3D 코드는 `pipeline/cube_3d/src/base.js`(색깔큐브 공통 부분) + `src/w34_body.js` → `src/w34.js` → `w34.bundle.js`, `w34.html?s=N`, 렌더는 `$env:PAGE="w34.html"; node render.js N 폴더`. 미리보기 previews/3-4주차_3D_미리보기.png 승인받음.
- (완료 2026-11-10) 3-1 지오보드 8장, 4-1 파이프 블록 7장 3D 영상(효과음, 반복 재생). 전부 다시 만들기: `pipeline/cube_3d/render_w34.ps1` (특정 장면만: `-Scenes 4,17`).
  - 지오보드 1 소개 / 2 준비(색깔별 분류) / 3 손가락 스트레칭(2D 손 그림, 오른손·왼손 10번) / 4 계단 모양 / 5 고무줄 빼기 / 6 뒷면 꽃무늬 / 7 도안(집·돛단배) / 8 정리(봉투→주머니).
  - 사용자 요청으로 지오보드 카메라는 **정면(거의 위에서)**: 판이 반듯한 네모로 크게 보이게.
  - 파이프 블록 11 소개 / 12 모양별 분류 + 큰 쪽·작은 쪽 / 13 지팡이 / 14 하나씩 빼기 / 15 네모난 액자 / 16 바람개비(스스로) / 17 정리(도안 지팡이 위로, 21개 세기). 조립 설계는 CANE·FRAME·WINDMILL(칸 단위).
  - 휴대폰용 파일 약 50MB(카톡 전송 가능, Claude 앱 전송 한도 30MB 초과).

- (2026-11-10) 지오보드 3번 장(손가락 스트레칭)은 사용자 요청 '리얼하게'로 **대리님 실제 영상(지오보드_03.mp4)** 사용: `python pipeline/geo_stretch.py <지오보드_03.mp4> deliverable/videos/03-1/3.mp4`. 목소리 빼고 단계 글씨 ①~④ + 대리님이 '하나~열' 세는 시각(whisper)에 숫자·삑 소리, 끝에 '왼손도 똑같이 10번!'. 53.5초. 실제 동작: 엄지·검지에 고무줄 2개 → 아래 줄 당겨 한 바퀴 꼬아 걸기 → 구멍에 새끼손가락 → 힘 주고 쥐었다 폈다. (render_w34.ps1 기본 목록에서 장면 3은 뺐음)
