# 고무줄 축·손가락 구간 측정 (색깔별로 나눠서) → gN.json
# bandgeo.py는 잘라낸 조각(qN_r*.png) 단위라, 색이 다른 두 줄이 붙어 있으면 하나로 잡힌다.
# 여기서는 원본 − 빈손 차이 영역을 색깔 묶음(검정·주황·노랑·초록·분홍)으로 나눈 뒤 줄마다 측정한다.
import os, sys, json, cv2, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', '..', '..', 'originals', 'fingering_images')
AST = os.path.join(HERE, '..', 'assets')
k = int(sys.argv[1])
im = cv2.imread(os.path.join(IMG, 'pattern%d.png' % k))
clean = cv2.imread(os.path.join(AST, 'hand_clean.png'))
diff = np.abs(im.astype(int) - clean.astype(int)).sum(2)
band = diff > 40
band[1550:] = False                                   # 아래쪽 번호 글씨 제외
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
H, S, V = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
colored = band & (S > 90) & (V > 90)
classes = {
    'black':  band & (V < 80),
    'orange': colored & (H >= 5) & (H < 22),
    'yellow': colored & (H >= 22) & (H < 45),
    'green':  colored & (H >= 45) & (H < 95),
    'pink':   colored & ((H >= 150) | (H < 5)),
}
hs = cv2.cvtColor(clean, cv2.COLOR_BGR2HSV)
skin = ((hs[..., 1] > 45) & (hs[..., 2] > 60)) | (hs[..., 2] < 150)
skin = cv2.morphologyEx(skin.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
out = []
for name, m in classes.items():
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    for i in range(1, n):
        if st[i][4] < 1500:
            continue
        ys, xs = np.where(lab == i)
        pts = np.stack([xs, ys], 1).astype(np.float64); c = pts.mean(0)
        _, _, vt = np.linalg.svd(pts - c, full_matrices=False); d = vt[0]
        if d[0] < 0: d = -d
        nrm = np.array([-d[1], d[0]])
        proj = (pts - c) @ d; thick = np.percentile(np.abs((pts - c) @ nrm), 95) * 2
        sel = classes[name][ys, xs]
        col = np.median(im[ys[sel], xs[sel]], axis=0)[::-1].astype(int).tolist()
        t0, t1 = float(proj.min()), float(proj.max())
        ts = np.arange(t0 - 60, t1 + 60, 1.0); runs = []; cur = None
        for t in ts:
            p = c + d * t; x, y = int(round(p[0])), int(round(p[1]))
            on = 0 <= x < skin.shape[1] and 0 <= y < skin.shape[0] and skin[y, x] > 0
            if on and cur is None: cur = [t, t]
            elif on: cur[1] = t
            elif cur is not None: runs.append(cur); cur = None
        if cur: runs.append(cur)
        runs = [q for q in runs if q[1] - q[0] > 25]
        fingers = [[max(a, t0 - 6), min(b, t1 + 6)] for a, b in runs if b > t0 + 10 and a < t1 - 10]
        fingers = [f for f in fingers if f[1] - f[0] > 25]
        out.append(dict(c=c.tolist(), d=d.tolist(), thick=float(thick), color=col, fingers=fingers,
                        t0=t0, t1=t1, cx=float(c[0]), cy=float(c[1]), cname=name))
out.sort(key=lambda b: (b['c'][0] > 1240, -b['c'][1]))
for i, b in enumerate(out):
    b['i'] = i
    print(i, b['cname'], 'L' if b['c'][0] < 1240 else 'R', [round(v) for v in b['c']], b['color'],
          round(b['thick']), [(round(a), round(e)) for a, e in b['fingers']])
json.dump(out, open(os.path.join(AST, 'g%d.json' % k), 'w'))
