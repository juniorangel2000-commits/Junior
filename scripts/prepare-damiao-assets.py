"""Register the original fishing-shop atlas without repainting or resampling it."""
from pathlib import Path
import hashlib,json,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/visual/village/damiao'
# Crop rectangles follow the transparent gutters of the generated sheet.
xs=[[0,432,768,1124,1536],[0,432,768,1124,1536],[0,384,768,1124,1536],[0,432,768,1152,1536]]
ys=[[0,310,565,772,1024]]*4
plan=[
 ('counter','Balcão de pesca',288,205,148,72,'object',None),
 ('rods','Suporte de varas',104,183,73,107,'object',None),
 ('cabinet','Armário de redes',445,213,116,95,'object',None),
 ('workbench','Bancada de reparos',445,316,108,66,'object',None),
 ('basin','Bacia de água',105,295,62,50,'object',None),
 ('barrel','Barril de materiais',195,158,50,75,'object',None),
 ('crates','Caixas de equipamentos',182,328,52,41,'object',None),
 ('net','Rede pendurada',480,110,60,70,'wall',None),
 ('tackle','Caixa de anzóis e iscas',413,277,26,20,'object','damiao-workbench'),
 ('logbook','Livro de pescarias',313,160,32,19,'object','damiao-counter'),
 ('floats','Boias de pesca',477,276,20,25,'object','damiao-workbench'),
 ('rope','Corda enrolada',470,340,35,29,'object',None),
 ('lantern','Lanterna da cabana',58,79,24,40,'wall',None),
 ('stool','Banco do pescador',365,283,28,34,'object',None),
 ('rug','Tapete da cabana',288,302,118,41,'floor',None),
 ('window','Janela da cabana',330,105,77,73,'wall',None),
]
im=Image.open(OUT/'objetos.png');assert im.size==(1536,1024)
assets=[];pieces=[dict(id='structure',asset='structure',x=0,y=0,sx=1,sy=1,visible=True,wallShade=1),dict(id='floor',asset='floor-wood',x=33,y=116,sx=510,sy=234,visible=True)]
for i,(name,title,x,y,w,h,layer,parent) in enumerate(plan):
 row,col=divmod(i,4);l,t,r,b=xs[row][col],ys[col][row],xs[row][col+1],ys[col][row+1]
 mask=im.getchannel('A').crop((l,t,r,b)).point(lambda a:255 if a>=160 else 0)
 bounds=mask.getbbox();assert bounds is not None
 x0,y0,x1,y1=bounds
 assert min(x0,y0,r-l-x1,b-t-y1)>0,(name,bounds,(r-l,b-t))
 scale=min(w/(x1-x0),h/(y1-y0));key='damiao-'+name
 collision=None if layer!='object' or parent else dict(x=x0+(x1-x0)*.07,y=y0+(y1-y0)*.68,width=(x1-x0)*.86,height=(y1-y0)*.31)
 assets.append(dict(id=key,name=title,file='assets/visual/village/damiao/objetos.png',frame=key,crop=dict(x=l,y=t,width=r-l,height=b-t),w=r-l,h=b-t,ox=(x0+x1)/2/(r-l),oy=y1/(b-t),bounds=list(bounds),collision=collision,layer=layer))
 pieces.append(dict(id=key,asset=key,x=x,y=y,sx=scale,sy=scale,visible=True,**({'parent':parent} if parent else {})))
lamp=next(p for p in pieces if p['id']=='damiao-lantern');pieces.append(dict(lamp,id='damiao-lantern-right',x=520))
(OUT/'manifest.json').write_text(json.dumps(dict(npc='damiao',createdFromScratch=16,referenceCrops=0,assets=assets,sourceHashes={n:hashlib.sha256((OUT/n).read_bytes()).hexdigest() for n in ['fachada.png','objetos.png']}),ensure_ascii=False,indent=2)+'\n')
layout=ROOT/'src/data/damiao-layout.json'
if not layout.exists() or '--write-layout' in sys.argv:layout.write_text(json.dumps(dict(version=1,pieces=pieces),ensure_ascii=False,indent=2)+'\n')
print(f'{len(assets)} objetos; {len(pieces)} peças; PNGs originais preservados.')
