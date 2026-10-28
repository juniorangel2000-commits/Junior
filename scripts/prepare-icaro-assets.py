"""Register the original mechanic atlas without repainting or resampling it."""
from pathlib import Path
import hashlib,json,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/visual/village/icaro'
# Crop rectangles follow the transparent gutters of the generated sheet.
xs=[[0,444,758,1163,1536],[0,390,768,1120,1536],[0,392,774,1138,1536],[0,380,752,1152,1536]]
ys=[[0,302,550,754,1024],[0,302,525,754,1024],[0,302,521,754,1024],[0,302,530,754,1024]]
plan=[
 ('counter','Balcão da oficina',288,205,148,72,'object',None),
 ('parts','Armário de peças',104,183,73,85,'object',None),
 ('workbench','Bancada com morsa',445,213,116,95,'object',None),
 ('table','Mesa de reparos',445,316,108,66,'object',None),
 ('compressor','Compressor de ar',105,295,88,82,'object',None),
 ('tools','Painel de ferramentas',182,103,72,47,'wall',None),
 ('crate','Caixote de peças',182,328,52,41,'object',None),
 ('engine','Motor em manutenção',449,274,44,40,'object','icaro-table'),
 ('oil','Latas de óleo',413,277,26,24,'object','icaro-table'),
 ('register','Livro de ordens de serviço',313,160,32,19,'object','icaro-counter'),
 ('toolbox','Caixa de ferramentas',477,282,27,24,'object','icaro-table'),
 ('gears','Correias e engrenagens',263,159,25,19,'object','icaro-counter'),
 ('lantern','Lanterna de segurança',58,79,24,40,'wall',None),
 ('stool','Banco de mecânico',365,283,28,34,'object',None),
 ('rug','Tapete da oficina',288,302,118,41,'floor',None),
 ('window','Janela industrial',330,105,77,73,'wall',None),
]
im=Image.open(OUT/'objetos.png');assert im.size==(1536,1024)
assets=[];pieces=[dict(id='structure',asset='structure',x=0,y=0,sx=1,sy=1,visible=True,wallShade=1),dict(id='floor',asset='floor-wood',x=33,y=116,sx=510,sy=234,visible=True)]
for i,(name,title,x,y,w,h,layer,parent) in enumerate(plan):
 row,col=divmod(i,4);l,t,r,b=xs[row][col],ys[col][row],xs[row][col+1],ys[col][row+1]
 mask=im.getchannel('A').crop((l,t,r,b)).point(lambda a:255 if a>=160 else 0)
 bounds=mask.getbbox();assert bounds is not None
 x0,y0,x1,y1=bounds
 assert min(x0,y0,r-l-x1,b-t-y1)>0,(name,bounds,(r-l,b-t))
 scale=min(w/(x1-x0),h/(y1-y0));key='icaro-'+name
 collision=None if layer!='object' or parent else dict(x=x0+(x1-x0)*.07,y=y0+(y1-y0)*.68,width=(x1-x0)*.86,height=(y1-y0)*.31)
 assets.append(dict(id=key,name=title,file='assets/visual/village/icaro/objetos.png',frame=key,crop=dict(x=l,y=t,width=r-l,height=b-t),w=r-l,h=b-t,ox=(x0+x1)/2/(r-l),oy=y1/(b-t),bounds=list(bounds),collision=collision,layer=layer))
 pieces.append(dict(id=key,asset=key,x=x,y=y,sx=scale,sy=scale,visible=True,**({'parent':parent} if parent else {})))
lamp=next(p for p in pieces if p['id']=='icaro-lantern');pieces.append(dict(lamp,id='icaro-lantern-right',x=520))
(OUT/'manifest.json').write_text(json.dumps(dict(npc='icaro',createdFromScratch=16,referenceCrops=0,assets=assets,sourceHashes={n:hashlib.sha256((OUT/n).read_bytes()).hexdigest() for n in ['fachada.png','objetos.png']}),ensure_ascii=False,indent=2)+'\n')
layout=ROOT/'src/data/icaro-layout.json'
if not layout.exists() or '--write-layout' in sys.argv:layout.write_text(json.dumps(dict(version=1,pieces=pieces),ensure_ascii=False,indent=2)+'\n')
print(f'{len(assets)} objetos; {len(pieces)} peças; PNGs originais preservados.')
