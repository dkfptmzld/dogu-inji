import os
HERE=os.path.dirname(os.path.abspath(__file__))
IMG=os.path.join(HERE,'..','..','..','originals','fingering_images')
AST=os.path.join(HERE,'..','assets')
import json,cv2,numpy as np,sys
k=int(sys.argv[1]); TH=float(sys.argv[2]) if len(sys.argv)>2 else 26
G=json.load(open(os.path.join(AST,'g%d.json'%k))); clean=cv2.imread(os.path.join(AST,'hand_clean.png')); H,W=clean.shape[:2]
mapx,mapy=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32))
dxm=np.zeros((H,W),np.float32); dym=np.zeros((H,W),np.float32)
for B in G:
  c=np.array(B['c']); d=np.array(B['d']); n=np.array([-d[1],d[0]])
  for (a,b) in B['fingers']:
    mid=(a+b)/2; sig=TH*0.6; amp=3.0
    P0=c+d*a; P1=c+d*b
    x0=int(min(P0[0],P1[0])-25); x1=int(max(P0[0],P1[0])+25); y0=int(min(P0[1],P1[1])-TH*2.5); y1=int(max(P0[1],P1[1])+TH*2.5)
    yy,xx=np.mgrid[y0:y1,x0:x1].astype(np.float32)
    rt=(xx-c[0])*d[0]+(yy-c[1])*d[1]; rs=(xx-c[0])*n[0]+(yy-c[1])*n[1]
    prof=np.exp(-(rs/sig)**2)-0.3*np.exp(-((np.abs(rs)-1.7*sig)/(0.55*sig))**2)
    ea=rt-a; eb=b-rt   # 손가락 안쪽이면 양수
    ok=(rt>a-14)&(rt<b+14)
    side=np.where(np.abs(ea)<np.abs(eb),-1.0,1.0)   # 가까운 가장자리 쪽
    edge=np.minimum(np.abs(ea),np.abs(eb))
    near=np.exp(-(edge/10.0)**2)*ok
    disp=amp*prof*near*side
    dxm[y0:y1,x0:x1]+=disp*d[0]; dym[y0:y1,x0:x1]+=disp*d[1]
warp=cv2.remap(clean,mapx+dxm,mapy+dym,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
cv2.imwrite(os.path.join(AST,'warp%d.png'%k),warp); print('warp ok')
