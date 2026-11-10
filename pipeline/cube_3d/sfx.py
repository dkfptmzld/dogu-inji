# 효과음 합성: events.json({T, events:[{t,type,p}]}) → sfx.wav
# 외부 음원 없이 직접 만든 소리라 저작권 걱정 없음.
#  tok 블록 놓는 '톡' / pop 색 보여줄 때 '뿅' / whoosh 카드 넘길 때 '휙' / ding 완성 '딩동' / count 셀 때 '삑'(점점 높아짐)
import sys, json, wave, numpy as np
SR = 44100
ev = json.load(open(sys.argv[1], encoding='utf-8')); out = sys.argv[2]
T = ev['T']; buf = np.zeros(int(SR * (T + 0.2)))
rng = np.random.default_rng(7)
def t_(d): return np.arange(int(SR * d)) / SR
def tok(p):
    t = t_(0.22); f = 760 * (1 + 0.03 * ((p % 5) - 2))
    s = (np.sin(2*np.pi*f*t) + 0.5*np.sin(2*np.pi*f*2.3*t) + 0.25*np.sin(2*np.pi*f*3.9*t)) * np.exp(-t*38)
    n = rng.standard_normal(len(t)) * np.exp(-t*160) * 0.35
    return (s + n) * 0.5
def pop(p):
    t = t_(0.28); f = 380 + 1100 * (1 - np.exp(-t*30)); ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph) * np.exp(-t*14) * np.minimum(1, t*400) * 0.45
def whoosh(p):
    t = t_(0.7); n = rng.standard_normal(len(t))
    k = np.ones(40) / 40; n = np.convolve(n, k, 'same') * 6          # 거친 바람 소리
    env = np.sin(np.pi * np.clip(t / 0.7, 0, 1)) ** 2
    return n * env * 0.22
def bell(f, d):
    t = t_(d); return (np.sin(2*np.pi*f*t) + 0.4*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*6) + 0.2*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*10)) * np.exp(-t*3.2) * np.minimum(1, t*300)
def ding(p):
    a = bell(1318.5, 1.6) * 0.35; b = bell(1046.5, 1.8) * 0.35
    s = np.zeros(int(SR*2.2)); s[:len(a)] += a; o = int(SR*0.32); s[o:o+len(b)] += b[:len(s)-o]; return s
def count(p):
    t = t_(0.16); f = 523.25 * 2 ** (p / 16)                         # 1→16으로 갈수록 한 옥타브 올라감
    return np.sin(2*np.pi*f*t) * np.exp(-t*22) * np.minimum(1, t*500) * 0.4
F = dict(tok=tok, pop=pop, whoosh=whoosh, ding=ding, count=count)
for e in ev['events']:
    s = F[e['type']](e.get('p', 0)); i = int(e['t'] * SR); j = min(len(buf), i + len(s)); buf[i:j] += s[:j-i]
buf = buf[:int(SR*T)]
GAIN = float(sys.argv[3]) if len(sys.argv) > 3 else 0.25     # 최대 크기 (처음 0.7은 너무 크다는 피드백 → 0.25)
pk = np.max(np.abs(buf)) or 1; buf = buf / pk * GAIN
fade = int(SR*0.05); buf[-fade:] *= np.linspace(1, 0, fade)
with wave.open(out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((buf * 32767).astype(np.int16).tobytes())
print(out, len(ev['events']), 'events', round(T, 1), 's')
