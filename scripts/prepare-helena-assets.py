"""Register the original inn atlas without repainting or resampling it."""
from pathlib import Path
import hashlib,json,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/visual/village/helena'
# Crop rectangles follow the transparent gutters of the generated sheet.
xs=[[0,432,768,1124,1536],[0,384,768,1124,1536],[0,384,768,1124,1536],[0,432,744,1152,1536]]
ys=[[0,314,577,775,1024]]*4
plan=[
 ('counter','Recepção da pousada',288,205,148,72,'object',None),
 ('linen','Armário de roupas de cama',104,183,73,85,'object',None),
 ('hearth','Lareira da pousada',445,213,116,95,'object',None),
 ('table','Mesa de refeições',445,316,108,66,'object',None),
 ('bed','Cama de hóspedes',105,295,80,110,'object',None),
 ('bench','Banco de espera',195,158,60,45,'object',None),
 ('chest','Baú de viagem',182,328,52,41,'object',None),
 ('meal','Bandeja de refeição',449,274,40,25,'object','helena-table'),
 ('tea','Chaleira e chá',413,277,26,24,'object','helena-table'),
 ('register','Livro de hóspedes',313,160,32,19,'object','helena-counter'),
 ('bread','Cesta de pães',477,282,20,20,'object','helena-table'),
 ('pitcher','Jarra de água',263,159,20,28,'object','helena-counter'),
 ('lantern','Lanterna da pousada',58,79,24,40,'wall',None),
 ('chair','Cadeira de hóspedes',365,283,28,34,'object',None),
 ('rug','Tapete da pousada',288,302,118,41,'floor',None),
 ('window','Janela da pousada',330,105,77,73,'wall',None),
]
im=Image.open(OUT/'objetos.png');assert im.size==(1536,1024)
assets=[];pieces=[dict(id='structure',asset='structure',x=0,y=0,sx=1,sy=1,visible=True,wallShade=1),dict(id='floor',asset='floor-wood',x=33,y=116,sx=510,sy=234,visible=True)]
for i,(name,title,x,y,w,h,layer,parent) in enumerate(plan):
 row,col=divmod(i,4);l,t,r,b=xs[row][col],ys[col][row],xs[row][col+1],ys[col][row+1]
 mask=im.getchannel('A').crop((l,t,r,b)).point(lambda a:255 if a>=160 else 0)
 bounds=mask.getbbox();assert bounds is not None
 x0,y0,x1,y1=bounds
 assert min(x0,y0,r-l-x1,b-t-y1)>0,(name,bounds,(r-l,b-t))
 scale=min(w/(x1-x0),h/(y1-y0));key='helena-'+name
 collision=None if layer!='object' or parent else dict(x=x0+(x1-x0)*.07,y=y0+(y1-y0)*.68,width=(x1-x0)*.86,height=(y1-y0)*.31)
 assets.append(dict(id=key,name=title,file='assets/visual/village/helena/objetos.png',frame=key,crop=dict(x=l,y=t,width=r-l,height=b-t),w=r-l,h=b-t,ox=(x0+x1)/2/(r-l),oy=y1/(b-t),bounds=list(bounds),collision=collision,layer=layer))
 pieces.append(dict(id=key,asset=key,x=x,y=y,sx=scale,sy=scale,visible=True,**({'parent':parent} if parent else {})))
lamp=next(p for p in pieces if p['id']=='helena-lantern');pieces.append(dict(lamp,id='helena-lantern-right',x=520))
(OUT/'manifest.json').write_text(json.dumps(dict(npc='helena',createdFromScratch=16,referenceCrops=0,assets=assets,sourceHashes={n:hashlib.sha256((OUT/n).read_bytes()).hexdigest() for n in ['fachada.png','objetos.png']}),ensure_ascii=False,indent=2)+'\n')
layout=ROOT/'src/data/helena-layout.json'
if not layout.exists() or '--write-layout' in sys.argv:layout.write_text(json.dumps(dict(version=1,pieces=pieces),ensure_ascii=False,indent=2)+'\n')
print(f'{len(assets)} objetos; {len(pieces)} peças; PNGs originais preservados.')
