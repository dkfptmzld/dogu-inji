# 숨은 동물 정답 영상 + 정답 그림 만들기.
# 1번 동물부터 한 마리씩: 그 동물 빨간 테두리만 그려지고 → 이름표가 나타난다 → 다음 동물로 넘어갈 때 지운다(사용자 요청 2026-11-11: 테두리가 섞이면 헷갈림). 끝에 전체 정답 + '정답 N마리'.
# 동물 위치·테두리는 animal_outlines.py(ANIMALS)에서 가져온다. 이름표는 그림을 가리지 않게 양옆에 세운다.
# python -I animal_answers.py <03-2 폴더>   → ans1~4.mp4(효과음 포함) + ans1~4.jpg(마지막 화면)
import sys, os, json, subprocess, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from animal_outlines import ANIMALS, outlines

d = sys.argv[1]
SFX = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cube_3d', 'sfx.py')
F = 'C:/Windows/Fonts/malgunbd.ttf'
ORANGE = (232, 116, 59); INK = (31, 42, 55); BG = (246, 244, 238); RED = (226, 30, 40)
PW, PH, ML, TOP = 1800, 1200, 470, 170          # 그림 크기, 양옆 여백(이름표 자리), 위 띠(제목)
CW, CH = PW + 2 * ML, PH + TOP + 40
LH, GAP = 84, 22
VW, VH = 1920, 1080; SC = VW / CW; VY = int((VH - CH * SC) / 2)        # 영상 크기·배율·위아래 여백
FPS, INTRO, DRAW, POP, HOLD, END = 30, 1.2, 1.7, 0.35, 1.6, 5.0     # 한 마리씩 보여 주고(다음 동물 때 지움), 끝에 전체
fn, fl, fh = ImageFont.truetype(F, 46), ImageFont.truetype(F, 56), ImageFont.truetype(F, 88)

def spread(ys, lo, hi):
    out = []; step = LH + GAP
    for y in ys: out.append(max(y, (out[-1] + step) if out else lo))
    over = out[-1] - hi if out else 0
    if over > 0:
        out = [y - over for y in out]
        for i in range(len(out) - 2, -1, -1): out[i] = min(out[i], out[i + 1] - step)
    return out

def layout(items):
    """이름표 자리와 번호(읽는 순서: 왼쪽 위→아래, 오른쪽 위→아래)."""
    pts = [(name, ML + x, TOP + y, lines) for name, x, y, lines in items]; res = []
    for side in ('L', 'R'):
        grp = sorted([p for p in pts if (p[1] < ML + PW / 2) == (side == 'L')], key=lambda p: p[2])
        for (name, px, py, lines), ly in zip(grp, spread([p[2] for p in grp], TOP + LH / 2, TOP + PH - LH / 2)):
            res.append(dict(n=len(res) + 1, name=name, px=px, py=py, ly=ly, side=side, lines=[l + [ML, TOP] for l in lines]))
    return res

def title(dr, text, color=ORANGE):
    tw = dr.textlength(text, font=fh); cx = CW / 2
    dr.rectangle((0, 0, CW, TOP - 8), fill=BG)                         # 예전 제목 지우기
    dr.rounded_rectangle((cx - tw / 2 - 50, 25, cx + tw / 2 + 50, 150), radius=62, fill=color)
    dr.text((cx, 89), text, font=fh, fill='white', anchor='mm')

def label(dr, a):
    tw = dr.textlength(a['name'], font=fl); w = tw + 130; ly = a['ly']
    x0 = ML - 30 - w if a['side'] == 'L' else ML + PW + 30; x1 = x0 + w; ax = x1 if a['side'] == 'L' else x0
    for wdt, col in ((14, 'white'), (6, ORANGE)): dr.line((a['px'], a['py'], ax, ly), fill=col, width=wdt)
    dr.ellipse((a['px'] - 20, a['py'] - 20, a['px'] + 20, a['py'] + 20), fill='white'); dr.ellipse((a['px'] - 13, a['py'] - 13, a['px'] + 13, a['py'] + 13), fill=ORANGE)
    dr.rounded_rectangle((x0, ly - LH / 2, x1, ly + LH / 2), radius=LH / 2, fill='white', outline=ORANGE, width=6)
    cx = x0 + 42; dr.ellipse((cx - 32, ly - 32, cx + 32, ly + 32), fill=ORANGE)
    dr.text((cx, ly + 1), str(a['n']), font=fn, fill='white', anchor='mm'); dr.text((cx + 40 + tw / 2, ly + 1), a['name'], font=fl, fill=INK, anchor='mm')

def stroke(arr, lines, frac=1.0):
    """테두리를 frac(0~1)만큼만 그린다(여러 선을 길이 비율로 나눠서 동시에 자라게)."""
    for wdt, col in ((14, (255, 255, 255)), (7, RED)):
        for l in lines:
            k = max(2, int(round(len(l) * frac)))
            if frac > 0: cv2.polylines(arr, [l[:k].reshape(-1, 1, 2).astype(np.int32)], False, col, wdt, lineType=cv2.LINE_AA)

def to_video(arr):
    v = cv2.resize(arr, (VW, int(CH * SC)), interpolation=cv2.INTER_AREA)
    f = np.empty((VH, VW, 3), np.uint8); f[:] = BG; f[VY:VY + v.shape[0]] = v; return f[..., ::-1].copy()   # RGB → BGR

def clip(out, T, frame_at, ev):
    """frame_at(t) → 그림(np RGB). 효과음 ev를 붙여 out.mp4로."""
    tmp = out[:-4] + '_tmp'; os.makedirs(tmp, exist_ok=True); raw = os.path.join(tmp, 'v.mp4')
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{VW}x{VH}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', raw], stdin=subprocess.PIPE)
    for fi in range(int(T * FPS)): ff.stdin.write(to_video(frame_at(fi / FPS)).tobytes())
    ff.stdin.close(); ff.wait()
    js = os.path.join(tmp, 'ev.json'); wav = os.path.join(tmp, 'sfx.wav')
    json.dump({'T': T, 'events': ev}, open(js, 'w', encoding='utf-8'))
    subprocess.run([sys.executable, '-I', SFX, js, wav], check=True, capture_output=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out], check=True)
    for f_ in os.listdir(tmp): os.remove(os.path.join(tmp, f_))
    os.rmdir(tmp)

# 사용자 요청(2026-11-11): 정답은 한 마리당 한 장(PPT 1장). 앞 동물 테두리는 안 보이게. 마지막 장에 전체 정답.
#  ans{k}_{i}.mp4 = i번째 동물 하나(테두리가 그려지고 → 이름표 + 뿅), ans{k}.mp4 = 전체(모든 테두리가 함께 그려지고 → 이름표 전부 + 딩동)
#  HTML에서 once(끝나기 1.6초 전에 멈춤)라서 이름표가 보이는 화면에서 멈춘다.
LEAD, SHOW = 0.3, 3.0
names = {}
for k, items in ANIMALS.items():
    pic = cv2.imread(os.path.join(d, f'q{k}.jpg')); A = layout(outlines(pic, items, k)); N = len(A)
    canvas = Image.new('RGB', (CW, CH), BG); canvas.paste(Image.fromarray(pic[..., ::-1]), (ML, TOP))
    T = LEAD + DRAW + SHOW
    for i, a in enumerate(A):
        im = canvas.copy(); title(ImageDraw.Draw(im), f'숨은 동물 {i + 1} / {N}'); base = np.array(im)
        done = base.copy(); stroke(done, a['lines']); im = Image.fromarray(done); label(ImageDraw.Draw(im), a); done = np.array(im)
        def fa(t, base=base, done=done, a=a):
            if t < LEAD: return base
            if t >= LEAD + DRAW: return done
            fr = base.copy(); p = (t - LEAD) / DRAW; stroke(fr, a['lines'], 1 - (1 - p) ** 2); return fr
        clip(os.path.join(d, f'ans{k}_{i + 1}.mp4'), T, fa, [{'t': LEAD + DRAW, 'type': 'pop', 'p': i}])
    im = canvas.copy(); title(ImageDraw.Draw(im), f'정답 {N}마리!', RED); base = np.array(im)
    full = base.copy()
    for a in A: stroke(full, a['lines'])
    im = Image.fromarray(full); dr = ImageDraw.Draw(im)
    for a in A: label(dr, a)
    full = np.array(im)
    def fa(t):
        if t < LEAD: return base
        if t >= LEAD + DRAW: return full
        fr = base.copy(); p = (t - LEAD) / DRAW
        for a in A: stroke(fr, a['lines'], 1 - (1 - p) ** 2)
        return fr
    clip(os.path.join(d, f'ans{k}.mp4'), LEAD + DRAW + SHOW + 0.5, fa, [{'t': LEAD + DRAW, 'type': 'ding', 'p': 0}])
    Image.fromarray(full).save(os.path.join(d, '..', '..', '..', 'previews', f'숨은동물_정답{k}.jpg'), quality=90)   # 마지막 화면은 미리보기 폴더에만
    names[k] = [a['name'] for a in A]; print(k, N)
json.dump(names, open(os.path.join(d, '..', '..', '..', 'pipeline', 'animal_names.json'), 'w', encoding='utf-8'), ensure_ascii=False)
