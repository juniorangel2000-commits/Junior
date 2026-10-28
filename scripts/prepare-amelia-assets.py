"""Register original herbalist PNGs and frame metadata; no repainting or resampling."""
from pathlib import Path
import json,shutil,hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/visual/village/amelia';OUT.mkdir(parents=True,exist_ok=True)
for source,dest in [('exec-4ae6c580-fdfc-4f43-af4e-b9aa42a60468.png','fachada.png'),('exec-1c437d8e-8c7a-45aa-9cba-657db8a6331d.png','objetos.png'),('exec-8a19a5be-b51a-498f-944d-652dac0b91d7.png','janela.png')]:
 p=Path('/workspace/generated_images')/source
 if p.exists() and (dest!='fachada.png' or not (OUT/dest).exists()):shutil.copy2(p,OUT/dest)
plan=[
 ('counter','Balcão de remédios',288,210,150,64,'object',None),
 ('apothecary','Estante de ervas e frascos',423,149,89,109,'object',None),
 ('cabinet','Armário de medicamentos',102,176,66,101,'object',None),
 ('workbench','Bancada de preparo',459,246,113,79,'object',None),
 ('drying-herbs','Ervas em secagem',165,102,97,59,'wall',None),
 ('water-basin','Barril de água',92,292,53,47,'object',None),
 ('plant-stand','Vasos de plantas medicinais',457,329,87,54,'object',None),
 ('mushrooms','Cesta de cogumelos',146,245,39,30,'object',None),
 ('mortar','Almofariz e pilão',252,164,24,22,'object','amelia-counter'),
 ('scale','Balança da herbalista',326,164,34,29,'object','amelia-counter'),
 ('bandages','Bandeja de curativos',433,198,39,24,'object','amelia-workbench'),
 ('recipe-book','Livro de plantas',289,166,34,23,'object','amelia-counter'),
 ('lantern','Lanterna da herbalista',57,77,20,36,'wall',None),
 ('stool','Banco de atendimento',360,285,28,34,'object',None),
 ('rug','Tapete da herbalista',288,302,121,58,'floor',None),
 ('tea','Chaleira e chá de ervas',484,196,36,29,'object','amelia-workbench'),
]
xs=[[0,436,800,1120,1536],[0,430,765,1167,1536],[0,384,768,1152,1536],[0,384,746,1170,1536]];ys=[0,300,542,772,1024]
im=Image.open(OUT/'objetos.png');alpha=np.array(im)[:,:,3];assert im.size==(1536,1024)
assets=[];pieces=[dict(id='structure',asset='structure',x=0,y=0,sx=1,sy=1,visible=True,wallShade=1),dict(id='floor',asset='floor-wood',x=33,y=116,sx=510,sy=234,visible=True)]
for i,(name,title,x,y,w,h,layer,parent) in enumerate(plan):
 row,col=divmod(i,4);l,t,r,b=xs[row][col],ys[row],xs[row][col+1],ys[row+1];yy,xx=np.where(alpha[t:b,l:r]>=160);bounds=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
 assert min(bounds[0],bounds[1],r-l-bounds[2],b-t-bounds[3])>0,(name,bounds)
 x0,y0,x1,y1=bounds;scale=min(w/(x1-x0),h/(y1-y0));key='amelia-'+name
 collision=None if layer!='object' or parent else dict(x=x0+(x1-x0)*.07,y=y0+(y1-y0)*.68,width=(x1-x0)*.86,height=(y1-y0)*.31)
 assets.append(dict(id=key,name=title,file='assets/visual/village/amelia/objetos.png',frame=key,crop=dict(x=l,y=t,width=r-l,height=b-t),w=r-l,h=b-t,ox=(x0+x1)/2/(r-l),oy=y1/(b-t),bounds=bounds,collision=collision,layer=layer))
 pieces.append(dict(id=key,asset=key,x=x,y=y,sx=scale,sy=scale,visible=True,**({'parent':parent} if parent else {})))
lamp=next(p for p in pieces if p['id']=='amelia-lantern');pieces.append(dict(id='amelia-lantern-right',asset='amelia-lantern',x=520,y=77,sx=lamp['sx'],sy=lamp['sy'],visible=True))
window=Image.open(OUT/'janela.png');a=np.array(window)[:,:,3];yy,xx=np.where(a>=160);b=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)];scale=min(85/(b[2]-b[0]),69/(b[3]-b[1]))
assets.append(dict(id='amelia-window',name='Janela da herbalista',file='assets/visual/village/amelia/janela.png',w=window.width,h=window.height,ox=(b[0]+b[2])/2/window.width,oy=b[3]/window.height,bounds=b,collision=None,layer='wall'))
pieces.append(dict(id='amelia-window',asset='amelia-window',x=288,y=107,sx=scale,sy=scale,visible=True))
(OUT/'manifest.json').write_text(json.dumps(dict(npc='amelia',createdFromScratch=17,referenceCrops=0,assets=assets,sourceHashes={n:hashlib.sha256((OUT/n).read_bytes()).hexdigest() for n in ['fachada.png','objetos.png','janela.png']}),ensure_ascii=False,indent=2)+'\n')
layout=ROOT/'src/data/amelia-layout.json'
if not layout.exists() or '--write-layout' in __import__('sys').argv:layout.write_text(json.dumps(dict(version=1,pieces=pieces),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(objects=len(assets),pieces=len(pieces))))
