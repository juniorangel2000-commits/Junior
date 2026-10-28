"""Register the original antique-shop atlas without repainting or resampling it."""
from pathlib import Path
import hashlib,json,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/visual/village/nilo'
# Crop rectangles follow the transparent gutters of the generated sheet.
xs=[[0,466,760,1120,1536],[0,416,768,1152,1536],[0,416,768,1152,1536],[0,416,738,1190,1536]]
ys=[[0,300,605,808,1024],[0,312,610,800,1024],[0,310,610,808,1024],[0,305,610,810,1024]]
plan=[
 ('counter','Balcão de antiguidades',288,205,148,83,'object',None),
 ('cabinet','Armário de coleção',104,183,73,107,'object',None),
 ('display','Vitrine de curiosidades',445,230,116,68,'object',None),
 ('workbench','Bancada de restauração',445,316,108,66,'object',None),
 ('clock','Relógio de pêndulo',480,166,38,110,'object',None),
 ('globe','Globo antigo',105,280,54,73,'object',None),
 ('chest','Baú de viagem',182,328,52,41,'object',None),
 ('bookshelf','Estante de livros antigos',195,158,74,91,'object',None),
 ('armillary','Esfera armilar',420,266,27,35,'object','nilo-workbench'),
 ('ledger','Livro de registros',313,160,32,19,'object','nilo-counter'),
 ('vase','Vaso de porcelana',474,266,20,31,'object','nilo-workbench'),
 ('maps','Mapas enrolados',451,275,30,19,'object','nilo-workbench'),
 ('lantern','Lanterna do antiquário',58,79,24,40,'wall',None),
 ('stool','Banco de avaliação',365,283,28,34,'object',None),
 ('rug','Tapete do antiquário',288,302,118,41,'floor',None),
 ('window','Janela do antiquário',330,105,77,73,'wall',None),
]
im=Image.open(OUT/'objetos.png');assert im.size==(1536,1024)
assets=[];pieces=[dict(id='structure',asset='structure',x=0,y=0,sx=1,sy=1,visible=True,wallShade=1),dict(id='floor',asset='floor-wood',x=33,y=116,sx=510,sy=234,visible=True)]
for i,(name,title,x,y,w,h,layer,parent) in enumerate(plan):
 row,col=divmod(i,4);l,t,r,b=xs[row][col],ys[col][row],xs[row][col+1],ys[col][row+1]
 mask=im.getchannel('A').crop((l,t,r,b)).point(lambda a:255 if a>=160 else 0)
 bounds=mask.getbbox();assert bounds is not None
 x0,y0,x1,y1=bounds
 assert min(x0,y0,r-l-x1,b-t-y1)>0,(name,bounds,(r-l,b-t))
 scale=min(w/(x1-x0),h/(y1-y0));key='nilo-'+name
 collision=None if layer!='object' or parent else dict(x=x0+(x1-x0)*.07,y=y0+(y1-y0)*.68,width=(x1-x0)*.86,height=(y1-y0)*.31)
 assets.append(dict(id=key,name=title,file='assets/visual/village/nilo/objetos.png',frame=key,crop=dict(x=l,y=t,width=r-l,height=b-t),w=r-l,h=b-t,ox=(x0+x1)/2/(r-l),oy=y1/(b-t),bounds=list(bounds),collision=collision,layer=layer))
 pieces.append(dict(id=key,asset=key,x=x,y=y,sx=scale,sy=scale,visible=True,**({'parent':parent} if parent else {})))
lamp=next(p for p in pieces if p['id']=='nilo-lantern');pieces.append(dict(lamp,id='nilo-lantern-right',x=520))
(OUT/'manifest.json').write_text(json.dumps(dict(npc='nilo',createdFromScratch=16,referenceCrops=0,assets=assets,sourceHashes={n:hashlib.sha256((OUT/n).read_bytes()).hexdigest() for n in ['fachada.png','objetos.png']}),ensure_ascii=False,indent=2)+'\n')
layout=ROOT/'src/data/nilo-layout.json'
if not layout.exists() or '--write-layout' in sys.argv:layout.write_text(json.dumps(dict(version=1,pieces=pieces),ensure_ascii=False,indent=2)+'\n')
print(f'{len(assets)} objetos; {len(pieces)} peças; PNGs originais preservados.')
