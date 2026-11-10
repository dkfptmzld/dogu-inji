# 지오보드 3번 장(손가락 스트레칭) = 김유천 대리님 실제 영상(지오보드_03.mp4) + 글씨·숫자·효과음
# 사용자 요청(2026-11-10): 2D 손 그림 대신 '리얼하게' → 실제 영상 A안 선택.
# 목소리는 빼고, 대리님이 '하나~열' 세는 시각(whisper로 측정)에 맞춰 숫자와 '삑' 소리를 넣는다.
# 사용: python pipeline/geo_stretch.py <지오보드_03.mp4> <출력.mp4>
import sys, os, json, subprocess, tempfile, shutil
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
W, H, FPS = 1920, 1080, 30
ACC, DARK = (240, 122, 46), (31, 42, 55)
FONT = 'C:/Windows/Fonts/malgunbd.ttf'

# (원본 시작, 원본 끝) 구간을 이어 붙임
SEGS = [(19.0, 42.3), (49.0, 75.6)]
HOLD = 3.6                                   # 마지막 화면 멈춤(왼손 안내)
COUNTS = [59.98, 61.08, 62.58, 64.3, 66.42, 67.56, 69.38, 71.14, 72.16, 73.86]   # 원본 시각
STEPS = [(19.0, 26.0, '① 엄지와 검지에 고무줄 2개를 끼워요'),
         (26.0, 35.0, '② 아래 고무줄을 당겨 한 바퀴 꼬아 걸어요'),
         (35.0, 42.3, '③ 생긴 구멍에 새끼손가락을 끼워요'),
         (49.0, 59.3, '④ 손에 힘을 꽉 주고 쥐었다 폈다!')]

def src_to_out(s):                            # 원본 시각 → 결과 영상 시각
    acc = 0
    for a, b in SEGS:
        if a <= s <= b: return acc + s - a
        acc += b - a
    return None
SEG_T = sum(b - a for a, b in SEGS); T = SEG_T + HOLD

# ── 글씨 그림 (기존 3D 장면과 같은 둥근 주황 상자) ──
def font(sz): return ImageFont.truetype(FONT, sz)
def pill(text, size=64, bg=ACC, fg=(255, 255, 255)):
    f = font(size); l, t, r, b = f.getbbox(text); tw, th = r - l, b - t
    pw, ph = tw + size * 1.3, th + size * 0.9
    im = Image.new('RGBA', (int(pw) + 60, int(ph) + 60), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((30, 36, 30 + pw, 36 + ph), ph / 2, fill=(0, 0, 0, 70))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(12)))
    d = ImageDraw.Draw(im); d.rounded_rectangle((30, 30, 30 + pw, 30 + ph), ph / 2, fill=bg)
    d.text((30 + pw / 2, 30 + ph / 2), text, font=f, fill=fg, anchor='mm'); return im
def circle(n):
    R = 130; im = Image.new('RGBA', (2 * R + 60, 2 * R + 60), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse((30, 38, 30 + 2 * R, 38 + 2 * R), fill=(0, 0, 0, 60))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(12)))
    d = ImageDraw.Draw(im); d.ellipse((30, 30, 30 + 2 * R, 30 + 2 * R), fill='white', outline=ACC, width=13)
    d.text((30 + R, 30 + R + 4), str(n), font=font(150), fill=DARK, anchor='mm'); return im
def rgba(im): a = np.asarray(im).astype(np.float32); return a[..., :3][..., ::-1], a[..., 3:] / 255   # BGR, alpha

LAYERS = []                                   # (시작, 끝, 그림, 가운데 x, 가운데 y)
def add(t0, t1, im, cx, cy): LAYERS.append((t0, t1, rgba(im), cx, cy))
add(0.2, 4.6, pill('고무줄로 손가락 스트레칭', 66), W / 2, 110)
for a, b, txt in STEPS: add(src_to_out(a) + 0.15, src_to_out(b) - 0.1, pill(txt, 56), W / 2, H - 110)
c0 = src_to_out(COUNTS[0]) - 0.6
add(c0, SEG_T, pill('오른손 10번', 70), W / 2, 110)
add(c0, SEG_T, pill('손에 힘을 꽉 주고 천천히!', 54), W / 2, H - 110)
outs = [src_to_out(c) for c in COUNTS]
for k, t0 in enumerate(outs):
    add(t0, outs[k + 1] if k < 9 else SEG_T, circle(k + 1), W - 270, H / 2)
add(SEG_T, T, pill('왼손도 똑같이 10번!', 76), W / 2, H / 2 - 30)
add(SEG_T + 0.3, T, pill('스트레칭 끝나면 지오보드 시작!', 50, bg=(255, 255, 255), fg=DARK), W / 2, H / 2 + 110)

def comp(frame, t):
    for t0, t1, (rgb, al), cx, cy in LAYERS:
        if not (t0 <= t < t1): continue
        k = min(1, (t - t0) / 0.25, (t1 - t) / 0.25)
        h, w = rgb.shape[:2]; x, y = int(cx - w / 2), int(cy - h / 2)
        roi = frame[y:y + h, x:x + w].astype(np.float32); a = al * k
        frame[y:y + h, x:x + w] = (roi * (1 - a) + rgb * a).astype(np.uint8)
    return frame

# ── 원본 한 장 → 1920×1080 (손 부분을 크게, 양옆은 흐린 배경) ──
CY0 = 300                                     # 세로 영상 1920 중 위쪽 300은 천장이라 잘라 냄(손이 위로 올라가는 장면이 있어 조금만)
def layout(fr):
    h, w = fr.shape[:2]; crop = fr[int(h * CY0 / 1920):, :]
    s = H / crop.shape[0]; fg = cv2.resize(crop, (int(crop.shape[1] * s), H), interpolation=cv2.INTER_AREA)
    bg = BGIMG.copy(); x = (W - fg.shape[1]) // 2; bg[:, x:x + fg.shape[1]] = fg; return bg
# 양옆 = 다른 장면과 같은 밝은 바탕 + 영상 가장자리 그림자
BGIMG = np.full((H, W, 3), (230, 239, 243), np.uint8)
_sh = np.zeros((H, W), np.float32); _sh[:, W // 2 - 368:W // 2 + 368] = 1; _sh = cv2.GaussianBlur(_sh, (0, 0), 14)   # 영상 폭 약 720
BGIMG = (BGIMG * (1 - 0.25 * _sh[..., None])).astype(np.uint8)

tmp = tempfile.mkdtemp(); src = os.path.join(tmp, 'src.mp4'); shutil.copy(SRC, src)
cap = cv2.VideoCapture(src); sfps = cap.get(cv2.CAP_PROP_FPS)
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', os.path.join(tmp, 'v.mp4')], stdin=subprocess.PIPE)
last = None
for i in range(int(T * FPS)):
    t = i / FPS
    if t < SEG_T:
        acc = 0
        for a, b in SEGS:
            if t < acc + b - a: s = a + t - acc; break
            acc += b - a
        if i == 0 or s - cur > 0.5 or s < cur - 0.1: cap.set(cv2.CAP_PROP_POS_MSEC, s * 1000); cur = -1
        fr = None
        while cur < s - 0.5 / sfps:                                          # 원본을 순서대로 읽으며 시각 맞추기
            ok, f2 = cap.read()
            if not ok: break
            fr, cur = f2, cap.get(cv2.CAP_PROP_POS_MSEC) / 1000
        if fr is not None: last = layout(fr)
        img = last.copy()
        cut = min(abs(t - src_to_out(SEGS[1][0])), 9) if t > 1 else 9      # 구간 이음새는 살짝 어둡게
        if cut < 0.2: img = (img * (0.55 + 0.45 * cut / 0.2)).astype(np.uint8)
    else:
        img = (last * 0.85 + 255 * 0.15).astype(np.uint8)                 # 멈춘 화면 살짝 밝게
    ff.stdin.write(comp(img, t).tobytes())
ff.stdin.close(); ff.wait(); cap.release()

ev = [{'t': src_to_out(a), 'type': 'pop'} for a, _, _ in STEPS] + [{'t': c0, 'type': 'pop'}]
ev += [{'t': t, 'type': 'count', 'p': k + 1} for k, t in enumerate(outs)] + [{'t': SEG_T + 0.1, 'type': 'ding'}]
json.dump({'T': T, 'events': ev}, open(os.path.join(tmp, 'ev.json'), 'w'))
here = os.path.dirname(os.path.abspath(__file__))
subprocess.run(['python', '-I', os.path.join(here, 'cube_3d', 'sfx.py'), os.path.join(tmp, 'ev.json'), os.path.join(tmp, 's.wav')], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(tmp, 'v.mp4'), '-i', os.path.join(tmp, 's.wav'), '-c:v', 'copy',
                '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', OUT], check=True)
shutil.rmtree(tmp); print('done', OUT, round(T, 1), 's')
