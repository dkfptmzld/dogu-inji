# 숨은 동물 그림(q1~4.jpg)을 '깔끔하게 다시 그리기'.
# 사진에서 따온 그림이라 테두리가 울퉁불퉁 → 테두리 선을 따서 매끈하게 다듬고, 단색 두 가지로 새로 칠한다(가장자리 부드럽게).
# animals.py 다음에 실행:  python -I animal_clean.py <03-2 폴더>   (q1~4.jpg를 덮어씀. 그 다음 animal_answers.py 다시 실행)
import sys, os, cv2, numpy as np

d = sys.argv[1]
S = 2            # 2배 크기에서 테두리를 찾고
R = 4            # 4배 크기로 그린 뒤 줄여서 가장자리를 부드럽게

def smooth(c, sig):
    p = c.reshape(-1, 2).astype(np.float32)
    n = len(p); s = min(sig, n / 8)
    if s < 0.8: return p
    k = int(s * 3); x = np.arange(-k, k + 1); w = np.exp(-x ** 2 / (2 * s * s)); w /= w.sum()
    ext = np.concatenate([p[-k:], p, p[:k]])            # 닫힌 선이라 앞뒤를 이어서 흐리게
    return np.stack([np.convolve(ext[:, i], w, 'valid') for i in (0, 1)], 1)

for q in range(1, 5):
    path = os.path.join(d, f'q{q}.jpg'); img = cv2.imread(path); h, w = img.shape[:2]
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    t, m = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)   # 실루엣(어두운 쪽) = 255
    bg = np.median(img[m == 0], axis=0); fg = np.median(img[m > 0], axis=0)
    big = cv2.resize(cv2.GaussianBlur(g, (3, 3), 0), (w * S, h * S), interpolation=cv2.INTER_CUBIC)
    mb = (big < t).astype(np.uint8) * 255
    cs, hi = cv2.findContours(mb, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    hi = hi[0]; depth = []
    for i in range(len(cs)):
        k, dd = i, 0
        while hi[k][3] >= 0: k = hi[k][3]; dd += 1
        depth.append(dd)
    canvas = np.zeros((h * R, w * R), np.uint8)
    for i in sorted(range(len(cs)), key=lambda i: depth[i]):
        area = cv2.contourArea(cs[i])
        if area < 40 * S * S: continue                       # 아주 작은 얼룩은 버림
        pts = smooth(cs[i], 5.0 * S) * (R / S)
        cv2.fillPoly(canvas, [np.round(pts * 16).astype(np.int32)], 255 if depth[i] % 2 == 0 else 0, cv2.LINE_AA, 4)
    a = cv2.resize(canvas, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32)[..., None] / 255
    out = np.clip(bg * (1 - a) + fg * a, 0, 255).astype(np.uint8)
    cv2.imwrite(path, out, [cv2.IMWRITE_JPEG_QUALITY, 94]); print('ok', path)
