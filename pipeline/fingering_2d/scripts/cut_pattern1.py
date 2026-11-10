"""핑거링 1번 모양(손가락마다 짧은 고무줄 10개)을 고무줄 한 개씩 잘라낸다.

원본 그림 - 빈손(hand_clean.png) 차이로 알파를 만들고, 배경색을 빼서 고무줄 색만 복원한다.
붙어 있는 두 개(오른손 약지 주황 + 중지 검정)는 어두운 픽셀 기준으로 둘로 나눈다.

출력: ../assets/s1_r0.png ~ s1_r9.png, ../assets/s1.json
  s1.json 항목: file, x, y, w, h(잘라낸 위치), cx, cy(중심), dx, dy(손끝 방향 단위벡터), rgb
"""
import os
import json
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', '..', '..', 'originals', 'fingering_images')
AST = os.path.join(HERE, '..', 'assets')

im = cv2.imread(os.path.join(IMG, 'pattern1.png'))
clean = cv2.imread(os.path.join(AST, 'hand_clean.png'))
H, W = im.shape[:2]
d = np.abs(im.astype(int) - clean.astype(int)).sum(2).astype(np.float32)
m = (d > 40).astype(np.uint8)
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
n, lab, st, cen = cv2.connectedComponentsWithStats(m)
V = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)[..., 2]

comps = []
for i in range(1, n):
    x, y, w, h, a = st[i]
    if a < 800 or y > 1550:
        continue
    reg = (lab == i)
    if w > 200:   # 두 개가 붙은 덩어리
        dark = reg & (V < 90)
        cut = int(np.percentile(np.where(dark)[1], 2)) - 3
        comps.append(reg & (np.arange(W)[None, :] < cut))
        comps.append(reg & (np.arange(W)[None, :] >= cut))
    else:
        comps.append(reg)

alpha_full = np.clip((d - 15) / 45, 0, 1)
info = []
for reg in comps:
    ys, xs = np.where(reg)
    x, y, x2, y2 = xs.min(), ys.min(), xs.max(), ys.max()
    rg = cv2.dilate(reg.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    al = alpha_full * rg
    pad = 8
    x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(W, x2 + pad), min(H, y2 + pad)
    a3 = np.maximum(al[..., None], 1e-3)
    col = ((im.astype(np.float32) - (1 - al[..., None]) * clean.astype(np.float32)) / a3).clip(0, 255)
    col = np.where(al[..., None] > 0.02, col, im)
    k = len(info)
    fn = 's1_r%d.png' % k
    cv2.imwrite(os.path.join(AST, fn), np.dstack([col[y0:y1, x0:x1], al[y0:y1, x0:x1] * 255]).astype(np.uint8))
    pts = np.stack([xs, ys], 1).astype(np.float32)
    (cx, cy), (rw, rh), ang = cv2.minAreaRect(pts)
    a = np.deg2rad(ang)
    u = np.array([np.cos(a), np.sin(a)])
    v = np.array([-np.sin(a), np.cos(a)])
    dvec = v if rw >= rh else u
    if dvec[1] > 0:
        dvec = -dvec
    bgr = cv2.mean(im, mask=(reg & (al > 0.9)).astype(np.uint8))[:3]
    info.append(dict(file=fn, x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0),
                     cx=float(xs.mean()), cy=float(ys.mean()), dx=float(dvec[0]), dy=float(dvec[1]),
                     rgb=[int(bgr[2]), int(bgr[1]), int(bgr[0])]))
json.dump(info, open(os.path.join(AST, 's1.json'), 'w'))
print(len(info), '개 저장')
