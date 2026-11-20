# 숨은 동물 정답: 동물마다 '자기 테두리'만 뽑는다.
# 방법: 동물 위치(점)가 속한 영역(회색 실루엣 또는 바탕·흰 틈)의 경계를 구하고, 그 동물 범위(상자) 안의 경계만 남긴다.
#       가장 큰 동물(말·소·코끼리, host)은 바깥 윤곽에서 다른 동물 상자 안 부분을 뺀다.
# 좌표는 1800×1200 그림(q1~4.jpg) 기준. (이름, 점x, 점y, (상자 x0,y0,x1,y1) 또는 'host')
import cv2, numpy as np

ANIMALS = {
    1: [('새', 385, 215, (345, 185, 445, 255)), ('말', 560, 400, 'host'), ('소', 1000, 650, (600, 440, 1410, 760)),
        ('돼지', 850, 800, (660, 735, 1190, 995)), ('토끼', 1010, 820, (955, 770, 1110, 930)),
        ('고양이', 900, 980, (815, 925, 1100, 1080)), ('쥐', 1010, 1052, (870, 1028, 1085, 1076, 'region')),   # 쥐 = 고양이 배 밑 노란 틈(사용자 확인 2026-11-10)
        ('달팽이', 735, 1040, (690, 1000, 790, 1080))],
    2: [('소', 900, 330, 'host'), ('양', 720, 560, (495, 440, 1560, 705)), ('돼지', 1000, 820, (880, 740, 1545, 1065)),
        ('토끼', 520, 930, (480, 800, 800, 1065)), ('쥐', 700, 1048, (645, 1010, 775, 1060, 'region')), ('오리', 1080, 1000, (1005, 940, 1160, 1060))],
    3: [('코끼리', 600, 300, 'host'), ('가오리', 960, 205, (930, 180, 1010, 232)), ('물고기', 1070, 420, (1020, 390, 1120, 450)),
        ('잠자리', 460, 568, (410, 540, 505, 610)), ('말', 450, 680, (240, 440, 912, 1000)), ('개', 560, 780, (265, 640, 712, 1060)),
        ('펭귄', 840, 850, (745, 655, 925, 1030, 'open')), ('뱀', 1500, 580, (1250, 500, 1700, 650)), ('고양이', 480, 950, (414, 786, 543, 1043, 'open')),
        ('쥐', 475, 1015, (430, 985, 515, 1045))],
    4: [('코끼리', 1100, 300, 'host'), ('상어', 90, 300, (30, 260, 140, 330)), ('물고기', 530, 360, (470, 325, 590, 395)),
        ('거북이', 760, 270, (600, 150, 860, 410)), ('모기', 1290, 620, (1230, 510, 1350, 690)), ('뱀', 1640, 700, (1580, 500, 1730, 900)),
        ('악어', 380, 640, (270, 580, 510, 700)), ('당나귀', 760, 700, (690, 470, 1350, 1110)), ('강아지', 1230, 860, (970, 790, 1340, 1110)),
        ('고양이', 990, 1030, (940, 940, 1062, 1105)), ('쥐', 1140, 1075, (1040, 1040, 1220, 1105))],
}

# 쓸데없는 선을 지울 네모 (그림 번호, 이름) → [(x0,y0,x1,y1), ...]  (2026-11-11 사용자: '쓸데없는 곳 테두리 치지 마')
CUTS = {(3, '코끼리'): [(780, 340, 960, 470), (1180, 600, 1340, 740), (1170, 520, 1235, 615)],   # 말 귀 고리, 코끼리 입 아래
        (3, '말'): [(300, 960, 360, 1020), (600, 640, 760, 1060), (230, 840, 430, 1010), (895, 560, 940, 720)]}   # 개·펭귄 옆, 개 뒷다리 사이
# 3번 그림: 고양이 = 개 앞다리·뒷다리 사이에 앉은 노란 모양, 펭귄 = 코끼리 앞다리 사이에 선 노란 모양(대리님 정답 사진으로 확인)

# ── 한 바퀴 다 그리기 방식 (2026-11-11 사용자: 테두리가 덜 그려졌다, 하나씩 같이 점검) ──
# FULL에 든 그림은 동물마다 '닫힌 테두리'를 그린다. 한 장에 한 마리만 나오니 다른 동물과 선이 겹쳐도 괜찮다.
#  - 동물 모양 = 점이 있는 색(회색/노랑)의 덩어리 ∩ POLY(그 동물 범위를 손으로 정한 다각형, 없으면 상자)
#  - 큰 동물(host) = 자기 회색 덩어리 − (다른 회색 동물) + (안에 숨은 노란 동물)을 채운 바깥 테두리
FULL = {1, 2, 3}
OPEN = {(2, '양'), (3, '뱀')}                 # 범위 경계에서 잘린 선은 그리지 않음(배를 직선으로 막지 않고 허공에서 끝냄)
HOSTPARTS = {3: [(745, 850), (960, 1000)]}   # 큰 동물에 더할 떨어진 덩어리(3번 코끼리 앞다리 두 개: 말 목선에 막혀 몸통과 떨어져 있음)
NOSUB = {(3, '가오리'), (3, '뱀')}   # 큰 동물 모양에서 빼지 않음(코끼리 머리 윗부분, 코끼리 코 = 뱀)
OUTER = {3}                        # 큰 동물은 바깥 윤곽만(3번 코끼리: 사용자 요청). 안의 동물은 채우고, 다른 동물 발 쪽 땅선은 뺌
NOFILL = {2}                     # 큰 동물 안의 흰/노란 동물을 채우지 않고 그 모양을 따라 그림(2번 소 = 양을 따라)
POLY = {(1, '소'): [(580, 520), (1430, 440), (1430, 600), (1339, 600), (1336, 790), (1300, 790), (1215, 845), (1165, 845), (1150, 805),   # 턱 밑 줄(뿔처럼 보임)은 뺌
                   (1000, 795), (800, 805), (760, 805), (700, 818), (668, 848), (588, 848)],                                         # 배 = 돼지 등 따라
        (1, '토끼'): [(955, 770), (1060, 770), (1112, 890), (1097, 930), (1076, 990), (1040, 1005), (872, 1005), (826, 945), (812, 895), (972, 882)],   # 머리 + 몸통, 아래는 고양이 등선(사용자: 고양이랑 합쳐서)
        (1, '달팽이'): [(668, 985), (805, 985), (805, 1092), (640, 1092), (640, 1040)],
        (2, '돼지'): [(880, 680), (1500, 680), (1522, 728), (1535, 752), (1547, 775), (1556, 805), (1562, 845), (1567, 885), (1567, 1070), (1000, 1070), (1000, 936), (880, 936)],   # 등은 그림대로, 엉덩이는 둥글게, 턱 아래(앞다리) 뺌
        (2, '양'): [(480, 430), (1600, 430), (1600, 800), (915, 800), (905, 776), (850, 776), (480, 700)],   # 배 = 돼지 등·머리 따라, 돼지 얼굴 앞에서 허공으로 끝
        (2, '토끼'): [(470, 815), (640, 815), (760, 930), (775, 960), (790, 1066), (470, 1066)],         # 등 = 소 앞다리 앞에서 자름
        (2, '오리'): [(1005, 940), (1138, 940), (1142, 1000), (1116, 1030), (1102, 1062), (1005, 1062)],   # 돼지 앞다리와 붙은 곳에서 자름, 발톱 뺌
        (3, '뱀'): [(1250, 480), (1720, 480), (1720, 680), (1300, 680), (1240, 600)],                                 # 코끼리 코 = 뱀
        (3, '고양이'): [(470, 780), (548, 780), (548, 1046), (325, 1046), (325, 915), (380, 870)],   # 앉은 몸 + 개 배 밑 등 + 개 뒷다리 사이 꼬리
        (3, '펭귄'): [(745, 650), (930, 650), (930, 1032), (745, 1032)],
        (3, '잠자리'): [(405, 530), (510, 530), (510, 604), (405, 604)],
        (3, '말'): [(760, 474), (930, 474), (930, 560), (898, 628), (725, 1046), (600, 1046), (560, 800), (330, 795), (300, 1048), (220, 1048), (220, 560)]}   # 주둥이 오른쪽 튀어나온 곳·머리 위 뿔처럼 생긴 줄 뺌

def cut_closed(l, keep):
    """닫힌 선에서 keep인 구간만. 처음과 끝이 둘 다 남으면 하나로 이어 붙인다(이음새 틈 방지)."""
    out = runs(l, keep)
    if len(out) > 1 and keep[0] and keep[-1]: out = [np.vstack([out[-1], out[0]])] + out[1:-1]
    return out

import json as _json, os as _os
DRAWN = {}                               # (예전: 3번 가오리 손그림 pipeline/drawn/3_가오리.json — 지금은 RAY 모양 사용)
SMOOTH = {(3, '가오리'): 6}            # 테두리를 매끈하게(사용자: 그린 대로 말고 예쁘게 다듬기). 값 = 다듬는 정도(점 단위)
SHARP_BELOW = {(3, '가오리'): 372}
TAIL = {}
# 꼬리를 따로 그림: cut 아래 원래 모양은 지우고, pts를 따라 위는 굵고(w0) 끝은 가늘게(w1). 끝에서 안쪽으로 꺾임(사용자: 꼬리 꺾이는 게 포인트, 너무 통통해)     # 이 높이(y)보다 아래는 다듬지 않음 = 가오리 꼬리의 날카로운 꺾임 살리기(사용자)     # 사용자가 직접 그린 범위(pipeline/drawn/). 손그림 선을 조금 넓혀 그림의 실제 경계에 붙인다
def _drawn(k, name):
    f = DRAWN.get((k, name))
    if not f: return None
    return _json.load(open(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), 'drawn', f), encoding='utf-8'))['points']

# 3번 가오리 = 실제 가오리 모양(사용자: 그린 대로 말고 가오리 모양대로). 앞선 = 코끼리 머리 윗선, 날개 뒤선 = 오목한 곡선, 꼬리 = 가는 채찍 + 끝 꺾임
RAY = {(3, '가오리'): dict(left=(772, 233), right=(1080, 384), front=(1042, 262), ctlF=(1082, 300), baseL=(876, 366), baseR=(900, 374), ctlL=(862, 282), ctlR=(992, 338),
                         tailpoly=[(848, 398), (868, 368), (906, 370), (912, 452), (848, 458), (828, 448), (830, 400)], taildrawn='3_가오리.json', tailtop=368)}   # 꼬리 = 사용자 손그림 꼬리 범위 ∩ 그림의 회색

def _bez(a, c, b, n=40):
    t = np.linspace(0, 1, n)[:, None]; a, c, b = map(np.array, (a, c, b))
    return (1 - t) ** 2 * a + 2 * (1 - t) * t * c + t ** 2 * b

def _taper(img, pts, w0, w1):
    P = np.array(pts, np.float32); seg = np.linalg.norm(np.diff(P, axis=0), axis=1); tot = seg.sum(); acc = 0
    for a, b, L in zip(P[:-1], P[1:], seg):
        for f in np.linspace(0, 1, max(2, int(L))):
            q = a + (b - a) * f; r = (w0 + (w1 - w0) * (acc + L * f) / tot) / 2
            cv2.circle(img, (int(round(q[0])), int(round(q[1]))), max(1, int(round(r))), 1, -1)
        acc += L

def _ray(m, x, y, R):
    n, lab = cv2.connectedComponents((m == m[y, x]).astype(np.uint8)); body = (lab == lab[y, x]).astype(np.uint8)
    inv = (1 - body).astype(np.uint8); n2, l2 = cv2.connectedComponents(inv)       # 코끼리 안의 노란 구멍(눈썹 줄 등)은 채움
    for i in range(1, n2):
        ys, xs = np.nonzero(l2 == i)
        if ys.min() > 0 and xs.min() > 0 and ys.max() < m.shape[0] - 1 and xs.max() < m.shape[1] - 1 and len(ys) < 20000: body[l2 == i] = 1
    poly = np.vstack([[R['left']], [(R['left'][0], 120), (R['front'][0], 120)], _bez(R['front'], R['ctlF'], R['right']),
                      _bez(R['right'], R['ctlR'], R['baseR']), _bez(R['baseL'], R['ctlL'], R['left'])]).astype(np.int32)
    clip = np.zeros(m.shape, np.uint8); cv2.fillPoly(clip, [poly], 1)
    mk = (clip & body).astype(np.uint8)
    se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)); mk = cv2.morphologyEx(mk, cv2.MORPH_OPEN, se)
    tc = np.zeros(m.shape, np.uint8)
    if R.get('taildrawn'):                                        # 꼬리 = 사용자 손그림의 꼬리 부분(그 범위 안에서 그림의 회색 경계 따르기)
        dp = _json.load(open(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), 'drawn', R['taildrawn']), encoding='utf-8'))['points']
        cv2.fillPoly(tc, [np.array(dp, np.int32)], 1); tc[:R['tailtop']] = 0
        tc = cv2.dilate(tc, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    else: cv2.fillPoly(tc, [np.array(R['tailpoly'], np.int32)], 1)
    mk |= ((m == m[y, x]) & (tc > 0)).astype(np.uint8)
    n3, l3, st3, _ = cv2.connectedComponentsWithStats(mk); mk = (l3 == 1 + int(np.argmax(st3[1:, 4]))).astype(np.uint8)
    return mk

def _mask(m, x, y, box, poly, grow=0):
    clip = np.zeros(m.shape, np.uint8)
    if poly: cv2.fillPoly(clip, [np.array(poly, np.int32)], 1)
    else: clip[box[1]:box[3], box[0]:box[2]] = 1
    if grow: clip = cv2.dilate(clip, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1)))
    r = ((m == m[y, x]) & (clip > 0)).astype(np.uint8)
    n, lab = cv2.connectedComponents(r); return (lab == lab[y, x]).astype(np.uint8)

def _smooth(l, sig, ymax=None):
    p = l[:-1].astype(np.float32); n = len(p); k = int(sig * 3)
    if n < 4 * k: return l
    w = np.exp(-np.arange(-k, k + 1) ** 2 / (2 * sig * sig)); w /= w.sum()
    ext = np.concatenate([p[-k:], p, p[:k]])
    q = np.stack([np.convolve(ext[:, i], w, 'valid') for i in (0, 1)], 1)
    if ymax is not None:                                          # 아래쪽(꼬리)은 원래 점 그대로, 경계는 서서히 섞기
        t = np.clip((p[:, 1] - (ymax - 25)) / 25, 0, 1)[:, None]
        q = q * (1 - t) + p * t
    return np.round(np.vstack([q, q[:1]])).astype(np.int32)

def _closed(mask):
    cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    return [np.vstack([c[:, 0, :], c[:1, 0, :]]) for c in cs if len(c) > 30]

def outlines_full(img_bgr, items, k):
    g = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, m = cv2.threshold(g, 0, 1, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    masks = {}
    for name, x, y, box in items:
        if box != 'host':
            dp = _drawn(k, name)
            if (k, name) in RAY: masks[name] = _ray(m, x, y, RAY[(k, name)])
            else: masks[name] = _mask(m, x, y, box, dp, grow=8) if dp else _mask(m, x, y, box, POLY.get((k, name)))
    area = {n: int(mk.sum()) for n, mk in masks.items()}
    for n1 in masks:                                              # 같은 색 덩어리 안에 붙은 더 작은 동물은 빼기(돼지에서 오리)
        for n2 in masks:
            if n1 != n2 and area[n2] < area[n1] and (masks[n1] & masks[n2]).sum() > 0.3 * area[n2]:
                masks[n1] = masks[n1] & (1 - masks[n2])
    res = []
    for name, x, y, box in items:
        if box == 'host':
            n, lab = cv2.connectedComponents((m == m[y, x]).astype(np.uint8)); hm = (lab == lab[y, x]).astype(np.uint8)
            for px, py in HOSTPARTS.get(k, []):
                if lab[py, px] > 0: hm[lab == lab[py, px]] = 1
            for nm, mk in masks.items():
                if (k, nm) in NOSUB: continue
                xx, yy = [(it[1], it[2]) for it in items if it[0] == nm][0]
                if m[yy, xx] == m[y, x]: hm[mk > 0] = 0          # 같은 색(회색) 동물은 빼고
                elif k not in NOFILL: hm[mk > 0] = 1              # 안에 숨은 노란 동물 자리는 채움
            hm = cv2.morphologyEx(hm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
            n, lab, st, _ = cv2.connectedComponentsWithStats(hm); big = 1 + int(np.argmax(st[1:, 4]))
            keep = (lab == big)
            for px, py in HOSTPARTS.get(k, []): keep |= (lab == lab[py, px]) & (lab > 0)
            lines = _closed(keep.astype(np.uint8))
            if k in OUTER:
                own = (keep & (m == m[y, x])).astype(np.uint8)   # 코끼리 회색(몸통+다리)만
                full = own.copy()
                for nm, mk in masks.items():
                    if (k, nm) not in OPEN: full |= mk            # 안에 숨은 동물 자리 채우기(뱀=코는 빼고)
                full = cv2.morphologyEx(full, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
                cs, _ = cv2.findContours(full, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
                big = max(cs, key=cv2.contourArea); l = np.vstack([big[:, 0, :], big[:1, 0, :]])
                near = cv2.dilate(own, np.ones((5, 5), np.uint8))   # 코끼리 몸에 닿은 선만(땅선·다른 동물 발 빼기)
                edge = np.zeros(m.shape, np.uint8)
                for (kk, nn), poly in POLY.items():
                    if kk == k and (k, nn) in OPEN and (k, nn) not in NOSUB: cv2.polylines(edge, [np.array(poly, np.int32)], True, 1, 9)   # 코(뱀) 자른 곳
                lines = cut_closed(l, (near[l[:, 1], l[:, 0]] > 0) & (edge[l[:, 1], l[:, 0]] == 0))
                lines = [q for q in lines if len(q) > 40]
            if k in NOFILL:                                       # 다른 동물을 잘라 내느라 그은 직선은 큰 동물에서도 빼기
                edge = np.zeros(m.shape, np.uint8)
                for (kk, nn), poly in POLY.items():
                    it = [i for i in items if i[0] == nn]
                    if kk == k and it and m[it[0][2], it[0][1]] == m[y, x]:   # 같은 색(회색) 동물을 자른 선만
                        cv2.polylines(edge, [np.array(poly, np.int32)], True, 1, 7)
                lines = [l2 for l in lines for l2 in cut_closed(l, edge[l[:, 1], l[:, 0]] == 0)]
        else:
            mk = masks[name]
            if (k, name) in SMOOTH:                               # 작은 들쭉날쭉 먼저 정리
                se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
                sm = cv2.morphologyEx(cv2.morphologyEx(mk, cv2.MORPH_OPEN, se), cv2.MORPH_CLOSE, se)
                yb = SHARP_BELOW.get((k, name))
                if yb: sm[yb:] = mk[yb:]                          # 꼬리는 원래 모양
                tl = TAIL.get((k, name))
                if tl:                                            # 꼬리: 굵기가 점점 가늘어지는 선으로 새로 그림
                    sm[tl['cut']:, tl['xr'][0]:tl['xr'][1]] = 0; P = np.array(tl['pts'], np.float32)
                    seg = np.linalg.norm(np.diff(P, axis=0), axis=1); tot = seg.sum(); acc = 0
                    for a, b, L in zip(P[:-1], P[1:], seg):
                        for f in np.linspace(0, 1, max(2, int(L))):
                            q = a + (b - a) * f; r = (tl['w0'] + (tl['w1'] - tl['w0']) * (acc + L * f) / tot) / 2
                            cv2.circle(sm, (int(round(q[0])), int(round(q[1]))), max(1, int(round(r))), 1, -1)
                        acc += L
                mk = sm
            lines = _closed(mk)
            if (k, name) in SMOOTH: lines = [_smooth(l, SMOOTH[(k, name)], TAIL[(k, name)]['cut'] - 12 if (k, name) in TAIL else SHARP_BELOW.get((k, name))) for l in lines]
            if (k, name) in OPEN:
                edge = np.zeros(m.shape, np.uint8); poly = POLY.get((k, name))
                if poly: cv2.polylines(edge, [np.array(poly, np.int32)], True, 1, 7)
                else: cv2.rectangle(edge, box[:2], box[2:4], 1, 7)
                lines = [l2 for l in lines for l2 in cut_closed(l, edge[l[:, 1], l[:, 0]] == 0)]
        res.append((name, x, y, lines))
    return res

def runs(pts, keep):
    """점 목록에서 keep인 구간만 이어진 선들로 나눈다."""
    out, cur = [], []
    for p, k in zip(pts, keep):
        if k: cur.append(p)
        elif len(cur) > 8: out.append(np.array(cur)); cur = []
        else: cur = []
    if len(cur) > 8: out.append(np.array(cur))
    return out

def inside(p, b): return (b[0] <= p[:, 0]) & (p[:, 0] <= b[2]) & (b[1] <= p[:, 1]) & (p[:, 1] <= b[3])

def outlines(img_bgr, items, k=None):
    if k in FULL: return outlines_full(img_bgr, items, k)
    g = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, m = cv2.threshold(g, 0, 1, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)      # 1 = 회색 실루엣
    res = {}
    boxes = [it[3][:4] for it in items if it[3] != 'host']
    area = lambda b: (b[2] - b[0]) * (b[3] - b[1])
    order = sorted([i for i, it in enumerate(items) if it[3] != 'host'], key=lambda i: area(items[i][3])) + [i for i, it in enumerate(items) if it[3] == 'host']
    for idx in order:
        name, x, y, box = items[idx]
        if box == 'host':
            n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8)); cid = 1 + int(np.argmax(st[1:, 4]))
            cs, _ = cv2.findContours((lab == cid).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
            near = np.zeros(m.shape, np.uint8)                  # 다른 동물 테두리 자리 (큰 동물 안쪽 선 = 다른 동물 몸)
            for v in res.values():
                for l in v[3]: cv2.polylines(near, [l.reshape(-1, 1, 2).astype(np.int32)], False, 1, 34)
            lines = []
            for c in cs:
                p = c[:, 0, :]; keep = near[p[:, 1], p[:, 0]] == 0
                for b in boxes: keep &= ~inside(p, b)
                lines += [l for l in runs(p, keep) if len(l) > 60]   # 짧은 부스러기 선 버림
        elif len(box) > 4 and box[4] in ('region', 'open'):                 # 상자로 잘라 '닫힌' 테두리 (아래가 트인 노란 틈 동물: 1번 쥐)
            r = np.zeros(m.shape, np.uint8); r[box[1]:box[3], box[0]:box[2]] = (m[box[1]:box[3], box[0]:box[2]] == m[y, x])
            n, lab = cv2.connectedComponents(r); cs, _ = cv2.findContours((lab == lab[y, x]).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
            lines = [np.vstack([c[:, 0, :], c[:1, 0, :]]) for c in cs]
            if box[4] == 'open':                                  # 상자 가장자리에서 잘린 곧은 선은 빼고 실제 경계만
                edge = lambda p: (p[:, 0] <= box[0] + 2) | (p[:, 0] >= box[2] - 3) | (p[:, 1] <= box[1] + 2) | (p[:, 1] >= box[3] - 3)
                lines = [l2 for l in lines for l2 in runs(l, ~edge(l))]
        else:
            cls = m[y, x]; n, lab = cv2.connectedComponents((m == cls).astype(np.uint8)); cid = lab[y, x]
            cs, _ = cv2.findContours((lab == cid).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
            lines = []
            near = np.zeros(m.shape, np.uint8)                  # 이 상자 안에 든 더 작은 동물의 테두리 자리
            for j, v in res.items():
                b2 = items[j][3]; ov = max(0, min(b2[2], box[2]) - max(b2[0], box[0])) * max(0, min(b2[3], box[3]) - max(b2[1], box[1]))
                if ov >= 0.6 * area(b2):
                    for l in v[3]: cv2.polylines(near, [l.reshape(-1, 1, 2).astype(np.int32)], False, 1, 30)
            for c in cs:
                p = c[:, 0, :]; lines += [l for l in runs(p, inside(p, box) & (near[p[:, 1], p[:, 0]] == 0)) if len(l) > 25]
        for r in CUTS.get((k, name), []):
            lines = [l2 for l in lines for l2 in runs(l, ~inside(l, r))]
        res[idx] = (name, x, y, lines)
    return [res[i] for i in range(len(items))]

if __name__ == '__main__':          # 확인용 그림: python -I animal_outlines.py <03-2 폴더> <출력 폴더>
    import sys
    d, o = sys.argv[1], sys.argv[2]
    cols = [(0, 0, 255), (0, 160, 0), (255, 0, 0), (255, 0, 255), (0, 200, 200), (0, 128, 255), (128, 0, 255), (128, 128, 0), (0, 0, 0), (200, 0, 100), (100, 50, 0)]
    for k, items in ANIMALS.items():
        a = cv2.imread(f'{d}/q{k}.jpg')
        for i, (name, x, y, lines) in enumerate(outlines(a, items, k)):
            for l in lines: cv2.polylines(a, [l.reshape(-1, 1, 2)], False, cols[i % 11], 5)
            cv2.circle(a, (x, y), 12, cols[i % 11], -1); cv2.putText(a, str(i + 1), (x + 14, y), 0, 1.5, cols[i % 11], 4)
        cv2.imwrite(f'{o}/ol{k}.jpg', cv2.resize(a, (1200, 800)))
