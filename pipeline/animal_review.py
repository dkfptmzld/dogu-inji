# 확인용 이미지: 그림 k의 동물마다 테두리를 한 칸씩 그려 모은 시트
# python -I pipeline/animal_review.py <그림번호> <출력.jpg>
import sys, os, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import animal_outlines as AO
k = int(sys.argv[1]); out = sys.argv[2]; a = cv2.imread(f'deliverable/videos/03-2/q{k}.jpg')
F = ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', 44); tiles = []
for i, (name, x, y, lines) in enumerate(AO.outlines(a, AO.ANIMALS[k], k)):
    c = a.copy()
    for l in lines:
        pts = [l.reshape(-1, 1, 2).astype(np.int32)]
        cv2.polylines(c, pts, False, (255, 255, 255), 16, cv2.LINE_AA); cv2.polylines(c, pts, False, (30, 30, 226), 9, cv2.LINE_AA)
    im = Image.fromarray(cv2.resize(c, (900, 600))[..., ::-1]); t = Image.new('RGB', (900, 670), 'white'); t.paste(im, (0, 70))
    ImageDraw.Draw(t).text((16, 8), f'{i + 1}. {name}', font=F, fill=(200, 40, 30)); tiles.append(np.array(t))
while len(tiles) % 3: tiles.append(np.full_like(tiles[0], 255))
sheet = Image.fromarray(np.vstack([np.hstack(tiles[i:i + 3]) for i in range(0, len(tiles), 3)]))
sheet.resize((1800, int(sheet.height * 1800 / sheet.width))).save(out, quality=88)
