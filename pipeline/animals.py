# 숨은 동물 그림 찾기(3-2): 카톡 영상에서 도안 카드를 뽑아 반듯하게 펴고, 손글씨(정답)를 지운 깨끗한 '문제' 그림을 만든다.
# python -I animals.py <원본 폴더(동물_01~05.mp4)> <출력 폴더>
# 출력: q1~q4.jpg(문제: 그림만). 다음에 animal_answers.py로 ans1~4.jpg(정답 화면)를 그린다.
import sys, os, subprocess, cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
W, H = 1800, 1200

def grab(video, t):
    tmp = os.path.join(out, '_f.png')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(t), '-i', video, '-frames:v', '1', tmp], check=True)
    return cv2.imread(tmp)

def sharpest(video, t0=0.3, t1=None, n=14):
    """영상에서 가장 선명한(초점이 잘 맞은) 장면을 고른다."""
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout)
    t1 = t1 or dur - 0.3; best, bs = None, -1
    for i in range(n):
        f = grab(video, t0 + (t1 - t0) * i / (n - 1)); h, w = f.shape[:2]
        s = cv2.Laplacian(cv2.cvtColor(f[h // 4:3 * h // 4, w // 6:5 * w // 6], cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
        if s > bs: best, bs = f, s
    return best

def flatten(img):
    """밝은 카드(가장 큰 사각형)를 찾아 정면으로 편다."""
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, th = cv2.threshold(cv2.GaussianBlur(g, (9, 9), 0), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    cs, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(cs, key=cv2.contourArea); peri = cv2.arcLength(c, True)
    q = cv2.approxPolyDP(c, 0.02 * peri, True)
    if len(q) != 4: q = cv2.boxPoints(cv2.minAreaRect(c))
    q = np.array(q, np.float32).reshape(4, 2)
    s, d = q.sum(1), np.diff(q, axis=1).ravel()
    tl, br, tr, bl = q[np.argmin(s)], q[np.argmax(s)], q[np.argmin(d)], q[np.argmax(d)]
    M = cv2.getPerspectiveTransform(np.float32([tl, tr, br, bl]), np.float32([[0, 0], [W, 0], [W, H], [0, H]]))
    r = cv2.warpPerspective(img, M, (W, H), flags=cv2.INTER_CUBIC)
    m = 30; return cv2.resize(r[m:H - m, m:W - m], (W, H), interpolation=cv2.INTER_CUBIC)   # 가장자리(코팅 반사) 조금 잘라냄

def flat(img, k=7, use_pen=True):
    """실루엣(회색 면)만 남긴 깨끗한 2색 그림. 2배로 키워 처리해 눈·귀 같은 가는 흰 선까지 살리고, 가장자리는 부드럽게."""
    big = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    g = cv2.GaussianBlur(cv2.cvtColor(big, cv2.COLOR_BGR2GRAY), (3, 3), 0)
    t, _ = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    dk = g[g < t]; tp, _ = cv2.threshold(dk.reshape(-1, 1), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)   # 어두운 것 중 더 어두운 쪽 = 펜
    pen = cv2.dilate((g < tp).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    if not use_pen: pen[:] = False                                     # 손글씨 없는 사진(말 문제)은 펜 구분 안 함
    lab0 = (g < t).astype(np.uint8)                                       # 1 실루엣, 0 바탕
    keep = (~pen).astype(np.uint8)                                        # 펜 자리는 가장 가까운 '펜 아닌' 픽셀의 값으로
    _, idx = cv2.distanceTransformWithLabels(1 - keep, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(keep); lab_of = np.zeros(idx.max() + 1, np.uint8); lab_of[idx[ys, xs]] = lab0[ys, xs]
    sil = (np.where(pen, lab_of[idx], lab0) * 255).astype(np.uint8)
    sil = cv2.morphologyEx(sil, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    sil = cv2.medianBlur(sil, 5)                                          # 울퉁불퉁한 가장자리 정리
    b = 80; sil[:b, :] = 0; sil[-b:, :] = 0; sil[:, :b] = 0; sil[:, -b:] = 0          # 가장자리 얼룩 제거
    n, lab, st, _ = cv2.connectedComponentsWithStats(sil)                 # 작은 부스러기(글씨 조각) 제거
    big_i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); bx, by, bw, bh = st[big_i, :4]   # 가장 큰 동물 덩어리의 범위
    for i in range(1, n):
        x, y, w, h, area = st[i]; cx, cy = x + w / 2, y + h / 2
        inside = bx - 0.02 * bw < cx < bx + 1.02 * bw and by - 0.02 * bh < cy < by + 1.02 * bh
        if area < 3600 or (i != big_i and not inside and area < 0.05 * st[big_i, 4]): sil[lab == i] = 0   # 범위 밖 작은 덩어리 = 손글씨
    hole = cv2.bitwise_not(sil); n, lab, st, _ = cv2.connectedComponentsWithStats(hole)   # 실루엣 속 작은 점(펜 흔적) 메우기
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 60: sil[lab == i] = 255
    gg = cv2.cvtColor(big, cv2.COLOR_BGR2GRAY); bgm = (sil == 0) & (gg < np.percentile(gg, 90))
    bg = np.median(big[bgm], axis=0); fg = np.median(big[(sil > 0) & (gg > np.percentile(gg[sil > 0], 30))], axis=0)
    bg = bg * (245.0 / max(bg.max(), 1)); fg = fg * min(1.15, 200.0 / max(fg.max(), 1))   # 바탕은 밝게(흰 카드가 회색으로 찍힘)
    a = cv2.resize(cv2.GaussianBlur(sil, (3, 3), 0), (img.shape[1], img.shape[0]), interpolation=cv2.INTER_AREA).astype(np.float32)[..., None] / 255
    return np.clip(bg * (1 - a) + fg * a, 0, 255).astype(np.uint8)

V = lambda n: os.path.join(src, f'동물_0{n}.mp4')
# 말: 1번 영상 앞부분(정답 글씨 없음)에서 가장 선명한 장면
cv2.imwrite(os.path.join(out, 'q1.jpg'), flat(flatten(sharpest(V(1), 0.3, 7.0)), use_pen=False), [cv2.IMWRITE_JPEG_QUALITY, 93])
# (정답 사진은 결과물에 넣지 않음: 정답 화면은 animal_answers.py가 새로 그린다)
for k, n in [(2, 3), (3, 4), (4, 5)]:
    cv2.imwrite(os.path.join(out, f'q{k}.jpg'), flat(flatten(sharpest(V(n)))), [cv2.IMWRITE_JPEG_QUALITY, 93])
os.remove(os.path.join(out, '_f.png')); print('ok')
