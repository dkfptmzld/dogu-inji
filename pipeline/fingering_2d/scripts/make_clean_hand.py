"""핑거링 원본 그림 4장(pattern1~4)에서 고무줄이 없는 '빈손' 그림을 만든다.

원리
- 4장의 손 그림은 픽셀 단위로 동일하고 고무줄 위치만 다르다.
- 각 그림에서 고무줄 영역(색으로 검출 + 볼록껍질 + 팽창)을 빼고, 고무줄이 없는 픽셀만 평균낸다.
- 4장 모두 고무줄이 덮인 곳은 반대쪽 손을 좌우로 뒤집은 그림(양손이 거울상)으로 채운다.
- 그래도 남는 몇 픽셀만 inpaint.

출력: ../assets/hand_clean.png
"""
import os
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', '..', '..', 'originals', 'fingering_images')
AST = os.path.join(HERE, '..', 'assets')

ims = [cv2.imread(os.path.join(IMG, 'pattern%d.png' % i)) for i in range(1, 5)]
H, W = ims[0].shape[:2]


def ringmask(im):
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    h, s, v = [c.astype(int) for c in cv2.split(hsv)]
    col = ((s > 150) & (v > 120)) | ((h >= 40) & (h <= 90) & (s > 45) & (v > 120)) | ((h >= 150) & (s > 90) & (v > 120))
    blk = (v < 70)
    col = cv2.morphologyEx(col.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    blk = cv2.morphologyEx(blk.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    m = cv2.bitwise_or(col, blk)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    out = np.zeros_like(m)
    for i in range(1, n):
        x, y, w, hh, a = st[i]
        if a < 1500 or y > 1500:   # 작은 점, 페이지 번호 제외
            continue
        ys, xs = np.where(lab == i)
        cv2.fillConvexPoly(out, cv2.convexHull(np.stack([xs, ys], 1).astype(np.int32)), 255)
    return cv2.dilate(out, np.ones((31, 31), np.uint8))


def mirror(a):
    # 양손은 x=1240 기준 거울상 (x' = 2480 - x)
    return np.roll(a[:, ::-1], 2480 - (W - 1), axis=1)


masks = [ringmask(im) for im in ims]
srcs = ims + [mirror(im) for im in ims]
mks = masks + [mirror(m) for m in masks]

acc = np.zeros(ims[0].shape, np.float64)
cnt = np.zeros((H, W), np.float64)
for k, (im, m) in enumerate(zip(srcs, mks)):
    f = (m == 0)
    w = cv2.GaussianBlur(f.astype(np.float32), (0, 0), 4) * f
    if k >= 4:
        w *= 0.02   # 거울 그림은 원본이 없는 곳에서만 쓰이도록
    acc += im * w[..., None]
    cnt += w

hole = cnt < 1e-4
clean = (acc / np.maximum(cnt, 1e-9)[..., None]).clip(0, 255).astype(np.uint8)
if hole.sum():
    clean = cv2.inpaint(clean, hole.astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)
os.makedirs(AST, exist_ok=True)
cv2.imwrite(os.path.join(AST, 'hand_clean.png'), clean)
print('hand_clean.png 저장, 남은 구멍 픽셀:', int(hole.sum()))
