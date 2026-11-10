import os
HERE=os.path.dirname(os.path.abspath(__file__))
IMG=os.path.join(HERE,'..','..','..','originals','fingering_images')
AST=os.path.join(HERE,'..','assets')
import json,cv2,numpy as np,sys
k=int(sys.argv[1]); R=json.load(open(os.path.join(AST,'q%d.json'%k)))
clean=cv2.imread(os.path.join(AST,'hand_clean.png')); hsv=cv2.cvtColor(clean,cv2.COLOR_BGR2HSV)
skin=((hsv[...,1]>45)&(hsv[...,2]>60)) | (hsv[...,2]<150)   # 피부 + 갈색 외곽선
skin=cv2.morphologyEx(skin.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
out=[]
for i,r in enumerate(R):
  s=cv2.imread(os.path.join(AST,r['file']),cv2.IMREAD_UNCHANGED); a=s[...,3]>200
  ys,xs=np.where(a); xs=xs+r['x']; ys=ys+r['y']
  pts=np.stack([xs,ys],1).astype(np.float64); c=pts.mean(0)
  u,sv,vt=np.linalg.svd(pts-c,full_matrices=False); d=vt[0]
  if d[0]<0: d=-d
  n=np.array([-d[1],d[0]])
  proj=(pts-c)@d; thick=np.percentile(np.abs((pts-c)@n),95)*2
  col=np.median(s[...,:3][a],axis=0)[::-1].astype(int).tolist()
  t0,t1=proj.min(),proj.max()
  # 선을 따라 손가락 구간 찾기 (양 끝은 조금 더 넓게 탐색)
  ts=np.arange(t0-60,t1+60,1.0); runs=[]; cur=None
  for t in ts:
    p=c+d*t; x,y=int(round(p[0])),int(round(p[1]))
    on=skin[y,x]>0 if 0<=x<skin.shape[1] and 0<=y<skin.shape[0] else False
    if on and cur is None: cur=[t,t]
    elif on: cur[1]=t
    elif cur is not None: runs.append(cur); cur=None
  if cur: runs.append(cur)
  runs=[q for q in runs if q[1]-q[0]>25]
  # 원래 밴드가 덮던 범위와 겹치는 손가락만
  fingers=[q for q in runs if q[1]>t0+10 and q[0]<t1-10]
  out.append(dict(i=i,c=c.tolist(),d=d.tolist(),thick=float(thick),color=col,fingers=fingers,t0=float(t0),t1=float(t1),cx=r['cx'],cy=r['cy']))
  print(i,col,round(thick),[ (round(a),round(b)) for a,b in fingers], round(t0),round(t1))
json.dump(out,open(os.path.join(AST,'g%d.json'%k),'w'))
