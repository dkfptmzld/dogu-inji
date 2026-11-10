# 휴대폰용 한 파일 만들기: deliverable/도구인지활동.html + videos/*.mp4 → 휴대폰용/도구인지활동_휴대폰용.html
# 카톡 등으로 HTML 하나만 보내면 videos 폴더가 같이 안 가서 영상이 안 보임 → 영상을 HTML 안에 넣는다.
# 영상을 새로 만들거나 고친 뒤에는 이 스크립트를 다시 돌리면 됨:  python pipeline/build_mobile.py
import base64, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'deliverable' / '도구인지활동.html'
html = src.read_text(encoding='utf-8')
emb = {}
for f in sorted([*(root / 'deliverable' / 'videos').rglob('*.mp4'), *(root / 'deliverable' / 'videos').rglob('*.jpg')]):   # 영상 + 그림 슬라이드 사진
    emb[f.relative_to(root / 'deliverable').as_posix()] = base64.b64encode(f.read_bytes()).decode()
tag = '<script>window.EMBED=' + json.dumps(emb) + ';</script>\n'
i = html.index('<script>')
out = root / '휴대폰용' / '도구인지활동_휴대폰용.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html[:i] + tag + html[i:], encoding='utf-8')
print(out, len(emb), 'videos', round(out.stat().st_size / 1e6, 1), 'MB')
