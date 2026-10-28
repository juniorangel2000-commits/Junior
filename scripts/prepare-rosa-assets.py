"""Register new native artwork as atlas frames; never resample source PNGs."""
from pathlib import Path
from PIL import Image
import numpy as np
import json, shutil, hashlib

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/visual/village/rosa'
OUT.mkdir(parents=True,exist_ok=True)
shutil.copytree('/workspace/after-rain-rosa/recebido/Idle',OUT/'Idle',dirs_exist_ok=True)
(OUT/'personagem-sha256.json').write_text(json.dumps({str(p.relative_to(OUT/'Idle')):hashlib.sha256(p.read_bytes()).hexdigest() for p in (OUT/'Idle').rglob('*.png')},indent=2)+'\n')
shutil.copy2('/workspace/generated_images/exec-4fa19895-7ef1-4280-a83e-c4b4b6584f4b.png',OUT/'objetos.png')
if not (OUT/'fachada.png').exists():shutil.copy2('/workspace/generated_images/exec-ca970d45-1857-4d59-bac9-a6626aad9afc.png',OUT/'fachada.png')
spec=[
 ('counter','Balcão agrícola',288,218,158,64,'object',None),
 ('seeds','Estante de sementes',288,143,118,106,'object',None),
 ('cabinet','Armário de vasos',478,164,66,126,'object',None),
 ('produce','Expositor de hortaliças',443,286,112,57,'object',None),
 ('potting','Bancada de mudas',111,213,100,78,'object',None),
 ('sacks','Sacos de grãos e adubo',103,304,69,58,'object',None),
 ('tools','Suporte de utensílios agrícolas',116,108,91,78,'wall',None),
 ('window','Janela do comércio',404,108,63,64,'wall',None),
 ('basket','Cesto de colheitas',474,322,42,38,'object',None),
 ('seedlings','Caixote de mudas',417,168,62,46,'object',None),
 ('lantern','Lanterna de parede',190,94,20,47,'wall',None),
 ('stool','Banquinho da Rosa',358,161,25,27,'object',None),
 ('scale','Balança de colheitas',327,185,33,22,'object','rosa-counter'),
 ('ledger','Livro de vendas',250,186,27,17,'object','rosa-counter'),
 ('pots','Vasos e pazinha',168,309,42,39,'object',None),
 ('rug','Tapete de folhas',288,290,122,62,'floor',None),
]
im=Image.open(OUT/'objetos.png');alpha=np.array(im)[:,:,3]
columns=[[0,425,775,1030,im.width],[0,425,775,1110,im.width],[0,425,775,1095,im.width],[0,425,775,1050,im.width]];ys=[0,310,600,840,im.height]
assets=[];pieces=[dict(id='structure',asset='structure',x=0,y=0,sx=1,sy=1,visible=True,wallShade=1),dict(id='floor',asset='floor-wood',x=33,y=116,sx=510,sy=234,visible=True)]
for i,(name,title,x,y,w,h,layer,parent) in enumerate(spec):
 col,row=i%4,i//4;xs=columns[row];left,top,right,bottom=xs[col],ys[row],xs[col+1],ys[row+1]
 yy,xx=np.where(alpha[top:bottom,left:right]>=160);x0,y0,x1,y1=int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)
 assert min(x0,y0,right-left-x1,bottom-top-y1)>0,name
 width,height=right-left,bottom-top;scale=min(w/(x1-x0),h/(y1-y0));asset='rosa-'+name
 collision=None if layer!='object' or parent else dict(x=x0+(x1-x0)*.06,y=y0+(y1-y0)*.65,width=(x1-x0)*.88,height=(y1-y0)*.34)
 assets.append(dict(id=asset,name=title,file='assets/visual/village/rosa/objetos.png',frame=asset,crop=dict(x=left,y=top,width=width,height=height),w=width,h=height,ox=(x0+x1)/2/width,oy=y1/height,bounds=[x0,y0,x1,y1],collision=collision,layer=layer))
 pieces.append(dict(id=asset,asset=asset,x=x,y=y,sx=scale,sy=scale,visible=True,**({'parent':parent} if parent else {})))
# Second light, independent editable instance from the same source frame.
pieces.append(dict(id='rosa-lantern-right',asset='rosa-lantern',x=530,y=100,sx=pieces[12]['sx'],sy=pieces[12]['sy'],visible=True))
(OUT/'manifest.json').write_text(json.dumps(dict(npc='rosa',createdFromScratch=16,referenceCrops=0,assets=assets),ensure_ascii=False,indent=2)+'\n')
# Never overwrite an interior already edited by the author.
layout_path=ROOT/'src/data/rosa-layout.json'
if not layout_path.exists():
 layout_path.write_text(json.dumps(dict(version=1,pieces=pieces),ensure_ascii=False,indent=2)+'\n')
rocks=ROOT/'public/assets/visual/economy/deposits/rochas-detalhadas.png'
shutil.copy2('/workspace/generated_images/exec-ca7b0862-34c3-4bd1-b7b3-36b4c84cef6f.png',rocks)
im=Image.open(rocks);alpha=np.array(im)[:,:,3];frames=[]
for i,metal in enumerate(['iron','gold','blackMetal']):
 left=i*(im.width//3);w=im.width//3;yy,xx=np.where(alpha[:,left:left+w]>=160)
 b=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
 frames.append(dict(metal=metal,x=left,y=0,width=w,height=im.height,bounds=b))
(rocks.parent/'rochas-detalhadas.json').write_text(json.dumps(frames,indent=2)+'\n')
print(json.dumps(dict(objects=len(assets),layoutPieces=len(pieces),nativeCharacterPngs=len(list((OUT/'Idle').rglob('*.png'))),sourceHashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [OUT/'objetos.png',OUT/'fachada.png',rocks]})))
