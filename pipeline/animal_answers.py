# 숨은 동물 정답 영상 + 정답 그림 만들기.
# 1번 동물부터 하나씩: 빨간 테두리가 그려지고 → 그림 밖 이름표가 선으로 이어지며 나타난다. 끝에 '정답 N마리'.
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
FPS, INTRO, DRAW, POP, HOLD, END = 30, 1.2, 1.7, 0.35, 0.65, 4.0
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

for k, items in ANIMALS.items():
    pic = cv2.imread(os.path.join(d, f'q{k}.jpg')); ol = outlines(pic, items)
    A = layout(ol); N = len(A)
    canvas = Image.new('RGB', (CW, CH), BG); canvas.paste(Image.fromarray(pic[..., ::-1]), (ML, TOP))
    start = canvas.copy(); title(ImageDraw.Draw(start), '숨은 동물을 하나씩 찾아봐요')
    base = np.array(start)                                    # 지금까지 끝난 동물이 그려진 배경(테두리 + 이름표)
    per = DRAW + POP + HOLD; T = INTRO + N * per + END; ev = []
    tmp = os.path.join(d, f'_ans{k}'); os.makedirs(tmp, exist_ok=True); raw = os.path.join(tmp, 'v.mp4')
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{VW}x{VH}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', raw], stdin=subprocess.PIPE)
    done = -1; fin = False
    for fi in range(int(T * FPS)):
        t = fi / FPS; i = int((t - INTRO) // per) if t >= INTRO else -1; tt = t - INTRO - i * per
        while done < min(i, N) - 1 or (0 <= i < N and done < i and tt >= DRAW + POP):   # 끝난 동물은 배경에 굳힌다
            done += 1; a = A[done]; stroke(base, a['lines']); im = Image.fromarray(base); label(ImageDraw.Draw(im), a); base = np.array(im)
            ev.append({'t': round(INTRO + done * per + DRAW, 3), 'type': 'pop', 'p': done})
        fr = base.copy()
        if 0 <= i < N and done < i:
            a = A[i]; p = min(1, tt / DRAW); stroke(fr, a['lines'], 1 - (1 - p) ** 2)
            if tt >= DRAW: im = Image.fromarray(fr); label(ImageDraw.Draw(im), a); fr = np.array(im)
        if i >= N:                                               # 끝: 정답 N마리
            if not fin:
                fin = True; im = Image.fromarray(base); title(ImageDraw.Draw(im), f'정답 {N}마리!', RED); base = np.array(im); fr = base.copy()
                ev.append({'t': round(INTRO + N * per + 0.1, 3), 'type': 'ding', 'p': 0})
        ff.stdin.write(to_video(fr).tobytes())
    ff.stdin.close(); ff.wait()
    Image.fromarray(base).save(os.path.join(d, '..', '..', '..', 'previews', f'숨은동물_정답{k}.jpg'), quality=90)   # 마지막 화면은 미리보기 폴더에만
    js = os.path.join(tmp, 'ev.json'); wav = os.path.join(tmp, 'sfx.wav')
    json.dump({'T': T, 'events': ev}, open(js, 'w', encoding='utf-8'))
    subprocess.run([sys.executable, '-I', SFX, js, wav], check=True, capture_output=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart',
                    os.path.join(d, f'ans{k}.mp4')], check=True)
    for f_ in os.listdir(tmp): os.remove(os.path.join(tmp, f_))
    os.rmdir(tmp); print(k, N, f'{T:.1f}s')
