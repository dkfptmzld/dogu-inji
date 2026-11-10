# 숨은 동물 정답: 동물마다 '자기 테두리'만 뽑는다.
# 방법: 동물 위치(점)가 속한 영역(회색 실루엣 또는 바탕·흰 틈)의 경계를 구하고, 그 동물 범위(상자) 안의 경계만 남긴다.
#       가장 큰 동물(말·소·코끼리, host)은 바깥 윤곽에서 다른 동물 상자 안 부분을 뺀다.
# 좌표는 1800×1200 그림(q1~4.jpg) 기준. (이름, 점x, 점y, (상자 x0,y0,x1,y1) 또는 'host')
import cv2, numpy as np

ANIMALS = {
    1: [('새', 385, 215, (345, 185, 445, 255)), ('말', 560, 400, 'host'), ('소', 1000, 470, (600, 440, 1410, 760)),
        ('돼지', 850, 800, (660, 735, 1190, 935)), ('토끼', 1010, 820, (955, 770, 1110, 930)),
        ('고양이', 900, 980, (815, 925, 1100, 1080)), ('쥐', 1010, 1052, (950, 1028, 1078, 1080)),   # 쥐 = 고양이 배 밑 노란 틈(사용자 확인 2026-11-10)
        ('달팽이', 735, 1040, (690, 1000, 790, 1080))],
    2: [('소', 900, 330, 'host'), ('양', 720, 560, (495, 440, 1560, 705)), ('돼지', 1000, 820, (670, 700, 1250, 1060)),
        ('토끼', 520, 930, (360, 800, 700, 1065)), ('쥐', 760, 1010, (690, 950, 810, 1065)), ('오리', 1080, 1000, (1005, 940, 1160, 1060))],
    3: [('코끼리', 600, 300, 'host'), ('가오리', 960, 205, (930, 180, 1010, 232)), ('물고기', 1070, 420, (1020, 390, 1120, 450)),
        ('잠자리', 460, 568, (410, 540, 505, 610)), ('말', 450, 680, (270, 450, 930, 1000)), ('개', 560, 780, (300, 650, 705, 1045)),
        ('펭귄', 800, 800, (680, 600, 910, 1010)), ('뱀', 1500, 580, (1180, 500, 1700, 650)), ('고양이', 330, 950, (250, 860, 420, 1050)),
        ('쥐', 475, 1015, (430, 985, 515, 1045))],
    4: [('코끼리', 1100, 300, 'host'), ('상어', 90, 300, (30, 260, 140, 330)), ('물고기', 530, 360, (470, 325, 590, 395)),
        ('거북이', 760, 270, (600, 150, 860, 410)), ('모기', 1290, 620, (1230, 510, 1350, 690)), ('뱀', 1640, 700, (1580, 500, 1730, 900)),
        ('악어', 380, 640, (270, 580, 510, 700)), ('당나귀', 760, 700, (690, 470, 1350, 1110)), ('강아지', 1230, 860, (960, 790, 1340, 1110)),
        ('고양이', 960, 1020, (870, 950, 1050, 1110)), ('쥐', 1140, 1075, (1040, 1040, 1220, 1105))],
}

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

def outlines(img_bgr, items):
    g = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, m = cv2.threshold(g, 0, 1, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)      # 1 = 회색 실루엣
    res = []
    boxes = [it[3] for it in items if it[3] != 'host']
    for name, x, y, box in items:
        if box == 'host':
            n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8)); cid = 1 + int(np.argmax(st[1:, 4]))
            cs, _ = cv2.findContours((lab == cid).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
            lines = []
            for c in cs:
                p = c[:, 0, :]; keep = np.ones(len(p), bool)
                for b in boxes: keep &= ~inside(p, b)
                lines += runs(p, keep)
        else:
            cls = m[y, x]; n, lab = cv2.connectedComponents((m == cls).astype(np.uint8)); cid = lab[y, x]
            cs, _ = cv2.findContours((lab == cid).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
            lines = []
            for c in cs:
                p = c[:, 0, :]; lines += runs(p, inside(p, box))
        res.append((name, x, y, lines))
    return res

if __name__ == '__main__':          # 확인용 그림: python -I animal_outlines.py <03-2 폴더> <출력 폴더>
    import sys
    d, o = sys.argv[1], sys.argv[2]
    cols = [(0, 0, 255), (0, 160, 0), (255, 0, 0), (255, 0, 255), (0, 200, 200), (0, 128, 255), (128, 0, 255), (128, 128, 0), (0, 0, 0), (200, 0, 100), (100, 50, 0)]
    for k, items in ANIMALS.items():
        a = cv2.imread(f'{d}/q{k}.jpg')
        for i, (name, x, y, lines) in enumerate(outlines(a, items)):
            for l in lines: cv2.polylines(a, [l.reshape(-1, 1, 2)], False, cols[i % 11], 5)
            cv2.circle(a, (x, y), 12, cols[i % 11], -1); cv2.putText(a, str(i + 1), (x + 14, y), 0, 1.5, cols[i % 11], 4)
        cv2.imwrite(f'{o}/ol{k}.jpg', cv2.resize(a, (1200, 800)))
