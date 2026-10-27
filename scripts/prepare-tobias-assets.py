"""Register new native carpenter artwork without changing any source PNG pixel."""
from pathlib import Path
import json,shutil,hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/visual/village/tobias';OUT.mkdir(parents=True,exist_ok=True)
shutil.copy2('/workspace/generated_images/exec-124868b1-bc98-4586-a284-ebe55b4faeba.png',OUT/'fachada.png')
shutil.copy2('/workspace/generated_images/exec-e0644e48-a7d8-42af-a922-fdca553b311f.png',OUT/'objetos.png')
shutil.copy2('/workspace/generated_images/exec-c7adfe25-22d1-49f0-884d-cb1be92b3ce3.png',OUT/'janela.png')
plan=[
 ('counter','Balcão de encomendas',270,218,147,60,'object',None),
 ('timber-rack','Estante de madeiras',482,157,73,112,'object',None),
 ('tool-rack','Painel de ferramentas',398,108,107,67,'wall',None),
 ('workbench','Bancada com morsa',447,246,115,77,'object',None),
 ('cabinet','Armário em exposição',92,182,76,86,'object',None),
 ('planks','Tábuas agrupadas',465,309,83,48,'object',None),
 ('chair','Cadeira em construção',140,276,42,67,'object',None),
 ('offcuts','Barril de retalhos',490,208,36,60,'object',None),
 ('sawhorses','Cavaletes de montagem',113,330,89,48,'object',None),
 ('clamps','Suporte de grampos',133,106,83,70,'wall',None),
 ('blueprint','Projeto e lápis',243,182,39,25,'object','tobias-counter'),
 ('ledger','Livro de encomendas',294,183,31,19,'object','tobias-counter'),
 ('hand-tools','Plaina, esquadro e malho',436,201,41,26,'object','tobias-workbench'),
 ('lantern','Lanterna da carpintaria',204,89,21,40,'wall',None),
 ('stool','Banco de trabalho',368,281,27,33,'object',None),
 ('mat','Tapete de atendimento',288,291,118,59,'floor',None),
]
columns=[[0,440,755,1110,1536],[0,425,800,1110,1536],[0,435,785,1120,1536],[0,460,770,1110,1536]];ys=[0,285,560,765,1024]
image=Image.open(OUT/'objetos.png');alpha=np.array(image)[:,:,3];assert image.size==(1536,1024)
assets=[];pieces=[dict(id='structure',asset='structure',x=0,y=0,sx=1,sy=1,visible=True,wallShade=1),dict(id='floor',asset='floor-wood',x=33,y=116,sx=510,sy=234,visible=True)]
for i,(name,title,x,y,w,h,layer,parent) in enumerate(plan):
 col,row=i%4,i//4;xs=columns[row];l,t,r,b=xs[col],ys[row],xs[col+1],ys[row+1];yy,xx=np.where(alpha[t:b,l:r]>=160);bounds=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
 assert min(bounds[0],bounds[1],r-l-bounds[2],b-t-bounds[3])>0,(name,bounds)
 x0,y0,x1,y1=bounds;scale=min(w/(x1-x0),h/(y1-y0));asset='tobias-'+name
 collision=None if layer!='object' or parent else dict(x=x0+(x1-x0)*.07,y=y0+(y1-y0)*.68,width=(x1-x0)*.86,height=(y1-y0)*.31)
 assets.append(dict(id=asset,name=title,file='assets/visual/village/tobias/objetos.png',frame=asset,crop=dict(x=l,y=t,width=r-l,height=b-t),w=r-l,h=b-t,ox=(x0+x1)/2/(r-l),oy=y1/(b-t),bounds=bounds,collision=collision,layer=layer))
 pieces.append(dict(id=asset,asset=asset,x=x,y=y,sx=scale,sy=scale,visible=True,**({'parent':parent} if parent else {})))
lamp=next(p for p in pieces if p['id']=='tobias-lantern')
pieces.append(dict(id='tobias-lantern-right',asset='tobias-lantern',x=535,y=92,sx=lamp['sx'],sy=lamp['sy'],visible=True))
window=Image.open(OUT/'janela.png');a=np.array(window)[:,:,3];yy,xx=np.where(a>=160);b=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)];scale=min(82/(b[2]-b[0]),72/(b[3]-b[1]))
assets.append(dict(id='tobias-window',name='Janela com venezianas',file='assets/visual/village/tobias/janela.png',w=window.width,h=window.height,ox=(b[0]+b[2])/2/window.width,oy=b[3]/window.height,bounds=b,collision=None,layer='wall'))
pieces.append(dict(id='tobias-window',asset='tobias-window',x=288,y=109,sx=scale,sy=scale,visible=True))
(OUT/'manifest.json').write_text(json.dumps(dict(npc='tobias',createdFromScratch=17,referenceCrops=0,assets=assets,sourceHashes={n:hashlib.sha256((OUT/n).read_bytes()).hexdigest() for n in ['fachada.png','objetos.png','janela.png']}),ensure_ascii=False,indent=2)+'\n')
# Never overwrite an interior already edited by the author.
layout_path=ROOT/'src/data/tobias-layout.json'
if not layout_path.exists() or '--write-layout' in __import__('sys').argv:
 layout_path.write_text(json.dumps(dict(version=1,pieces=pieces),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(objects=len(assets),pieces=len(pieces))))
