import os
HERE=os.path.dirname(os.path.abspath(__file__))
IMG=os.path.join(HERE,'..','..','..','originals','fingering_images')
AST=os.path.join(HERE,'..','assets')
import cv2,numpy as np,json,sys
k=int(sys.argv[1]); out=os.path.join(AST,'q%d'%k)
im=cv2.imread(os.path.join(IMG,'pattern%d.png'%k)); clean=cv2.imread(os.path.join(AST,'hand_clean.png')); H,W=im.shape[:2]
d=np.abs(im.astype(int)-clean.astype(int)).sum(2).astype(np.float32)
m=(d>40).astype(np.uint8)
m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((3,3),np.uint8)); m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
n,lab,st,cen=cv2.connectedComponentsWithStats(m)
alpha_full=np.clip((d-15)/45,0,1)
info=[]
for i in range(1,n):
  x,y,w,h,a=st[i]
  if a<800 or y>1550: continue
  reg=cv2.dilate((lab==i).astype(np.uint8),np.ones((9,9),np.uint8)).astype(bool)
  al=(alpha_full*reg); al=cv2.GaussianBlur(al,(3,3),0)
  pad=6; x0,y0,x1,y1=max(0,x-pad),max(0,y-pad),min(W,x+w+pad),min(H,y+h+pad)
  # 반지 색(배경과 섞이지 않도록): 알파로 원래 색 복원  C = (I - (1-a)B)/a
  a3=np.maximum(al[...,None],1e-3)
  col=((im.astype(np.float32)-(1-al[...,None])*clean.astype(np.float32))/a3).clip(0,255)
  col=np.where(al[...,None]>0.02,col,im)
  rgba=np.dstack([col[y0:y1,x0:x1],(al[y0:y1,x0:x1]*255)]).astype(np.uint8)
  fn='%s_r%d.png'%(out,len(info)); cv2.imwrite(fn,rgba)
  ys,xs=np.where(lab==i); pts=np.stack([xs,ys],1).astype(np.float32)
  (cx,cy),(rw,rh),ang=cv2.minAreaRect(pts)
  info.append(dict(file=fn.split('/')[-1],x=int(x0),y=int(y0),w=int(x1-x0),h=int(y1-y0),cx=float(xs.mean()),cy=float(ys.mean()),long=float(max(rw,rh))))
json.dump(info,open(out+'.json','w'),indent=0)
print(k,len(info),[ (round(r['cx']),round(r['cy']),round(r['long'])) for r in info])
