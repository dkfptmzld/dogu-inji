# 핑거링(18-1)·산가지(8-2) 영상에 효과음 입히기 (화면은 그대로, 소리만 합성해서 붙임)
# 시각은 애니메이션 코드의 박자에서 계산:
#  - 핑거링 steps.html / p2.html / pA.html: 고무줄 하나 B=3.4초. 이름표 등장(0초) 뿅 → 고무줄 내려옴(1.0) 휙 → 끼워짐(1.95) 톡 → 끝 '완성' 딩동
#  - 산가지 stickscrape.js: 막대 하나 D=3.6초. 검지 닿음(1.2) 톡 → 긁어옴(1.3) 휙 → 자리 도착(2.9) 삑(1,2,3… 점점 높게) → 끝 딩동
# 사용: python pipeline/add_sfx_fs.py   (원본 무음 영상은 originals/무음영상/ 에 한 번만 보관하고, 항상 그것에서 다시 만든다)
import os, json, subprocess, shutil, tempfile
here = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(here, '..', 'deliverable', 'videos')
SFX = os.path.join(here, 'cube_3d', 'sfx.py')

def dur(f): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)

def fingering(n, B=3.4):
    ev = []
    for k in range(n):
        t = k * B
        ev += [{'t': t + 0.05, 'type': 'pop'}, {'t': t + 1.0, 'type': 'whoosh'}, {'t': t + 1.95, 'type': 'tok', 'p': k}]
    return ev + [{'t': n * B + 0.1, 'type': 'ding'}]

def sticks(n=10, D=3.6, LEAVE=1.0):
    ev = [{'t': 0.1, 'type': 'pop'}]
    for i in range(n):
        t = i * D
        ev += [{'t': t + 1.2, 'type': 'tok', 'p': i}, {'t': t + 1.3, 'type': 'whoosh'}, {'t': t + 2.9, 'type': 'count', 'p': i + 1}]
    return ev + [{'t': n * D + LEAVE, 'type': 'ding'}]

JOBS = [('18-1/1.mp4', fingering(10)), ('18-1/2.mp4', fingering(6)), ('18-1/3.mp4', fingering(8)), ('18-1/4.mp4', fingering(8)),
        ('08-2/1.mp4', sticks())]
tmp = tempfile.mkdtemp()
for rel, ev in JOBS:
    out = os.path.join(V, rel); keep = os.path.join(here, '..', 'originals', '무음영상'); os.makedirs(keep, exist_ok=True)
    src = os.path.join(keep, rel.replace('/', '_'))      # 결과물 폴더(USB)에 안 섞이게 originals에 보관
    if not os.path.exists(src): shutil.copy(out, src)
    T = dur(src); j = os.path.join(tmp, 'e.json'); w = os.path.join(tmp, 's.wav')
    json.dump({'T': T, 'events': ev}, open(j, 'w'))
    subprocess.run(['python', '-I', SFX, j, w], check=True, capture_output=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-i', w, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
                    '-shortest', '-movflags', '+faststart', out], check=True)
    print('ok', rel, round(T, 1), 's', len(ev), 'sounds')
shutil.rmtree(tmp)
