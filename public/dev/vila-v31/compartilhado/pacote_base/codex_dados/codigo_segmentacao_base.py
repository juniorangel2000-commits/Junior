from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
from io import BytesIO
from zipfile import ZipFile,ZIP_DEFLATED
import numpy as np, cv2, json, csv, os, shutil, math, hashlib
SOURCE=Path('/mnt/data/After_Rain_Vila_10_Comercios_Assets_Detalhados_Codex_v1.zip')
PREVIOUS=Path('/mnt/data/After_Rain_Vila_10_Comercios_Revisao_Qualidade_v1_1')
DEST=Path('/mnt/data/After_Rain_Vila_10_Comercios_Reconstrucao_v2')
if DEST.exists():shutil.rmtree(DEST)
DEST.mkdir()
# Small props that can be separated with limited background contamination. Selections are editable.
selected={
'augusto':['barril_canto','placa_botanica','enfeite_floral','tapete_central'],
'bento':['bigorna_e_toco','tanque_resfriamento','cesto_lingotes','caixa_minerios','tapete_ferraria','lamparina','banquinho','barril_hastes'],
'amelia':['almofariz','cesto_cogumelos','planta_grande','tapete_folhas','mudas_caixotes'],
'tobias':['barril_rolos','toras_empilhadas','banquinho','tapete_verde'],
'rosa':['vaso_flores','caixa_aboboras','tapete_verde','sacos_adubo'],
'nilo':['globo_terrestre','busto_esquerda','tapete_persa','estatua_direita'],
'celina':['cadeira_costura','espelho_oval','tapete_redondo','tesouras_na_parede'],
'damiao':['corda_enrolada','tapete_azul','varas_pesca'],
'helena':['barris_bebidas','plantas_canto','tapete_vermelho'],
'icaro':['barril_azul','tapete_vermelho','peças_engrenagens']}
# Target-specific core guides; fractions of the item's rectangular crop. These are documented for independent corrections.
config={
 'bento/bigorna_e_toco': {'fg':[(.30,.10,.75,.37),(.30,.43,.74,.86)],'prob':(.04,.03,.96,.95),'seed_mode':'grabcut'},
 'bento/tanque_resfriamento':{'fg':[(.26,.24,.73,.45),(.28,.49,.73,.84)],'prob':(.08,.09,.90,.95)},
 'bento/barril_hastes':{'fg':[(.30,.28,.72,.53),(.31,.55,.72,.90)],'prob':(.06,.07,.91,.96)},
 'bento/cesto_lingotes':{'fg':[(.25,.29,.72,.62),(.30,.69,.70,.91)],'prob':(.07,.07,.88,.94)},
 'bento/caixa_minerios':{'fg':[(.28,.30,.75,.64),(.30,.72,.70,.88)],'prob':(.05,.05,.93,.94)},
 'augusto/barril_canto':{'fg':[(.25,.31,.70,.52),(.30,.55,.71,.83)],'prob':(.08,.08,.87,.93)},
 'amelia/almofariz':{'fg':[(.34,.27,.65,.48),(.30,.52,.68,.78)],'prob':(.07,.12,.94,.88)},
 'amelia/planta_grande':{'fg':[(.30,.30,.72,.55),(.37,.64,.75,.89)],'prob':(.05,.1,.90,.95)},
 'amelia/cesto_cogumelos':{'fg':[(.23,.25,.72,.65),(.30,.72,.75,.88)],'prob':(.07,.04,.91,.92)},
 'tobias/barril_rolos':{'fg':[(.26,.15,.70,.46),(.32,.50,.67,.86)],'prob':(.09,.04,.90,.94)},
 'rosa/vaso_flores':{'fg':[(.22,.18,.75,.56),(.36,.58,.65,.83)],'prob':(.05,.04,.94,.95)},
 'rosa/caixa_aboboras':{'fg':[(.22,.22,.72,.57),(.28,.63,.78,.86)],'prob':(.06,.07,.94,.94)},
 'nilo/globo_terrestre':{'fg':[(.27,.25,.72,.55),(.40,.56,.67,.85)],'prob':(.08,.09,.91,.94)},
 'nilo/busto_esquerda':{'fg':[(.30,.22,.72,.55),(.30,.56,.70,.85)],'prob':(.05,.05,.95,.95)},
 'celina/cadeira_costura':{'fg':[(.26,.23,.73,.53),(.35,.57,.69,.86)],'prob':(.08,.05,.91,.92)},
 'celina/espelho_oval':{'fg':[(.32,.22,.73,.57),(.36,.59,.70,.89)],'prob':(.05,.05,.95,.95)},
 'damiao/corda_enrolada':{'fg':[(.26,.23,.65,.72)],'prob':(.08,.06,.91,.94)},
 'helena/barris_bebidas':{'fg':[(.29,.26,.69,.64)],'prob':(.07,.07,.94,.93)},
 'helena/plantas_canto':{'fg':[(.29,.20,.69,.61)],'prob':(.07,.07,.95,.94)},
 'icaro/barril_azul':{'fg':[(.28,.19,.75,.62),(.30,.63,.71,.86)],'prob':(.05,.05,.92,.95)},
}
# Rugs have explicit transparent border and original intact pixels inside, no image synthesis.
manual_rugs={
 'augusto/tapete_central':(.06,.12,.92,.87),
 'bento/tapete_ferraria':(.11,.14,.88,.89),
 'amelia/tapete_folhas':(.07,.08,.91,.91),
 'tobias/tapete_verde':(.12,.13,.91,.90),
 'rosa/tapete_verde':(.07,.18,.94,.88),
 'nilo/tapete_persa':(.07,.12,.94,.92),
 'celina/tapete_redondo':(.09,.07,.90,.93),
 'damiao/tapete_azul':(.09,.13,.91,.87),
 'helena/tapete_vermelho':(.08,.09,.92,.92),
 'icaro/tapete_vermelho':(.10,.17,.88,.88),
}

def rect(mask,coords,val):
 h,w=mask.shape
 x1,y1,x2,y2=coords
 xa=max(0,min(w-1,round(x1*w)));xb=max(xa+1,min(w,round(x2*w)))
 ya=max(0,min(h-1,round(y1*h)));yb=max(ya+1,min(h,round(y2*h)))
 mask[ya:yb,xa:xb]=val

def segment(img,key):
 a=np.asarray(img.convert('RGB'))
 h,w=a.shape[:2]
 if key in manual_rugs:
  x1,y1,x2,y2=manual_rugs[key]
  m=np.zeros((h,w),np.uint8)
  if 'redondo' in key:
   cv2.ellipse(m,(round(w*(x1+x2)/2),round(h*(y1+y2)/2)),(round(w*(x2-x1)/2),round(h*(y2-y1)/2)),0,0,360,255,-1,cv2.LINE_8)
  else:
   # Rug shape: crisp flattened corner contours
   x1,y1,x2,y2=round(x1*w),round(y1*h),round(x2*w),round(y2*h)
   pts=np.array([[x1+5,y1],[x2-5,y1],[x2,y1+3],[x2,y2-3],[x2-5,y2],[x1+5,y2],[x1,y2-3],[x1,y1+3]],dtype=np.int32)
   cv2.fillPoly(m,[pts],255)
  return m,'poligono_guiado'
 c=config.get(key,{})
 prob=c.get('prob',(.08,.08,.92,.91))
 mask=np.full((h,w),cv2.GC_BGD,np.uint8)
 rect(mask,prob,cv2.GC_PR_FGD)
 fg=c.get('fg',[(.37,.34,.63,.63)])
 for r in fg:rect(mask,r,cv2.GC_FGD)
 # Additional ring probable background, to reduce floor and walls.
 cvimg=cv2.cvtColor(a,cv2.COLOR_RGB2BGR)
 bgm=np.zeros((1,65),np.float64);fgm=np.zeros((1,65),np.float64)
 try:
  cv2.grabCut(cvimg,mask,None,bgm,fgm,7,cv2.GC_INIT_WITH_MASK)
  m=np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD),255,0).astype(np.uint8)
 except cv2.error:
  m=np.where(mask==cv2.GC_FGD,255,0).astype(np.uint8)
 # Keep connected parts touching a core region, and substantial accessory parts.
 n,cc,stats,centers=cv2.connectedComponentsWithStats(m,8)
 sizes=[stats[i,cv2.CC_STAT_AREA] for i in range(1,n)]
 if sizes:
  maxa=max(sizes)
  for i in range(1,n):
   if stats[i,cv2.CC_STAT_AREA]<max(5,round(.012*maxa)):
    m[cc==i]=0
 return m,'grabcut_guiado'

def checker(size,step=14):
 w,h=size; yy,xx=np.indices((h,w)); tile=((xx//step+yy//step)%2).astype(np.uint8)
 a=np.empty((h,w,3),np.uint8);a[tile==0]=(85,103,104);a[tile==1]=(126,142,139)
 return Image.fromarray(a,'RGB').convert('RGBA')

# All source visual elements preserved for comparison; no lossy conversion on the original.
with ZipFile(SOURCE) as z:
 root=z.namelist()[0].split('/')[0]
 manifest=json.loads(z.read(root+'/00_LEIA_PRIMEIRO/MANIFEST_GERAL.json'))
 progress=[]; infos=[]; all_src=[]; catalog=[]; preview_sheet=[]; src_paths=[]
 for shop in manifest['npc']:
  sid=shop['id'];base=shop['directory'];dst=DEST/'01_LOJAS'/sid;dst.mkdir(parents=True)
  for name,outname in [('00_REFERENCIA_COMPLETA.png','referencia_aprovada.png'),('01_FACHADA/fachada_transparente.png','fachada.png'),('02_INTERIOR/interior_transparente.png','interior.png')]:
   (dst/outname).write_bytes(z.read(f'{root}/{base}/{name}'))
  arr=json.loads(z.read(f'{root}/{base}/03_ITENS_INDIVIDUAIS/itens_manifest.json'))
  refdir=dst/'00_REFERENCIAS_RECORTES';cand=dst/'01_SPRITES_EM_RECONSTRUCAO';refdir.mkdir();cand.mkdir()
  count=0
  for it in arr:
   src=Image.open(BytesIO(z.read(f'{root}/{base}/{it["faithful_crop"]}'))).convert('RGBA')
   key=f'{sid}/{it["id"]}'
   (refdir/f'{it["id"]}.png').write_bytes(z.read(f'{root}/{base}/{it["faithful_crop"]}'))
   if it['id'] not in selected[sid]:continue
   mask,mode=segment(src,key)
   img=src.copy();img.putalpha(Image.fromarray(mask))
   # Crop to alpha bounds with 4px padding, prevent jumping anchor in game via manifest coordinates
   bb=img.getbbox()
   if not bb:continue
   pad=4
   x1=max(0,bb[0]-pad);y1=max(0,bb[1]-pad);x2=min(src.width,bb[2]+pad);y2=min(src.height,bb[3]+pad)
   img=img.crop((x1,y1,x2,y2))
   image_path=cand/f'{it["id"]}.png';img.save(image_path,optimize=True)
   mask_ratio=float(np.count_nonzero(mask))/mask.size
   obj={
     'npc':sid,'item':it['id'],'arquivo':str(image_path.relative_to(DEST)),'original':str((refdir/f'{it["id"]}.png').relative_to(DEST)),
     'resolution_px':[img.width,img.height],'source_bbox_xyxy':it['reference_bbox_xyxy'],
     'offset_from_source_crop_px':[x1,y1],
     'restored_source_coordinate_xy':[it['reference_bbox_xyxy'][0]+x1,it['reference_bbox_xyxy'][1]+y1],
     'opaque_ratio':round(mask_ratio,3),'method':mode,
     'status':'CANDIDATO_EM_REVISAO_MANUAL','game_ready':False,
     'notice':'Remocao parcial de fundo por segmentacao; bordas e partes ocultas ainda requerem verificacao pixel a pixel.'}
   infos.append(obj);count+=1
   # Side by side exact pre/post asset
   preview_sheet.append((sid,it['id'],src,img))
  progress.append({'npc':sid,'facade':True,'interior':True,'original_contextual_crops':len(arr),'isolated_candidates':count,'approved_isolated':0})
 # Copy native game components from prior audited list
 original_source=PREVIOUS/'02_SPRITES_ORIGINAIS_PRONTOS'
 shutil.copytree(original_source,DEST/'02_SPRITES_ORIGINAIS_V081')
 cnt=len(list((DEST/'02_SPRITES_ORIGINAIS_V081').glob('*.png')))

# Generate contact sheets by NPC plus 2 general previews
from PIL import ImageFont
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
except Exception:font=None
try:boldfont=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',18)
except Exception:boldfont=None
per_shop=DEST/'03_PREVIAS_AUDITORIA';per_shop.mkdir()
for sid in selected:
  items=[i for i in preview_sheet if i[0]==sid]
  cols=3;cellw=410;cellh=260;rows=math.ceil(len(items)/cols)
  pan=Image.new('RGB',(cols*cellw,rows*cellh+60),'#263539');d=ImageDraw.Draw(pan)
  d.text((18,17),f'AFTER RAIN  |  {sid.upper()}  |  ORIGINAL x CANDIDATO RGBA',font=boldfont,fill='#f2e7d4')
  for k,(_,nm,source,masked) in enumerate(items):
   bx=(k%cols)*cellw;by=(k//cols)*cellh+60
   d.rounded_rectangle((bx+5,by+4,bx+cellw-5,by+cellh-4),radius=10,fill='#395155')
   src=source.copy();src.thumbnail((185,201),Image.Resampling.NEAREST)
   fig=masked.copy();fig.thumbnail((185,201),Image.Resampling.NEAREST)
   bg=checker((185,201),12)
   bg.alpha_composite(fig,((185-fig.width)//2,(201-fig.height)//2))
   pan.paste(src.convert('RGB'),(bx+13+(185-src.width)//2,by+15+(201-src.height)//2))
   pan.paste(bg.convert('RGB'),(bx+210,by+15))
   d.text((bx+14,by+225),nm[:36],font=font,fill='white')
  pan.save(per_shop/f'{sid}_comparacao.png',optimize=True)
# All NPC map - original facade + interior
cols=5;cw=300;ch=360
allpan=Image.new('RGB',(cols*cw,ch*2+65),'#233235');d=ImageDraw.Draw(allpan)
d.text((16,16),'AFTER RAIN — 10 COMERCIOS: ARTES PRESERVADAS PARA INTEGRACAO',font=boldfont,fill='#f3e8d7')
for i,shop in enumerate(manifest['npc']):
 sid=shop['id'];bx=(i%cols)*cw;by=(i//cols)*ch+60
 root=DEST/'01_LOJAS'/sid
 f=Image.open(root/'fachada.png').convert('RGBA'); f.thumbnail((280,153),Image.Resampling.NEAREST)
 inter=Image.open(root/'interior.png').convert('RGBA');inter.thumbnail((280,175),Image.Resampling.NEAREST)
 d.rectangle((bx+3,by+2,bx+cw-3,by+ch-5),fill='#485e61')
 allpan.paste(f.convert('RGB'),(bx+(cw-f.width)//2,by+6),f)
 allpan.paste(inter.convert('RGB'),(bx+(cw-inter.width)//2,by+167),inter)
 d.text((bx+12,by+333),sid.upper(),font=font,fill='white')
allpan.save(per_shop/'00_todos_comercios.png',optimize=True)
# generate selected thumbnails CONTACT collage
items=preview_sheet
cols=5;cw=265;ch=235;rows=math.ceil(len(items)/cols)
pa=Image.new('RGB',(cols*cw,ch*rows+60),'#263336');dr=ImageDraw.Draw(pa)
dr.text((16,19),'RECORTES APROVADOS COMO REFERENCIA -> MASCARAS EM REVISAO',font=boldfont,fill='white')
for k,(sid,nm,ori,img) in enumerate(items):
 x=(k%cols)*cw;y=(k//cols)*ch+60
 dr.rounded_rectangle((x+5,y+4,x+cw-5,y+ch-3),12,fill='#3c555a')
 ss=ori.copy(); ss.thumbnail((113,170),Image.Resampling.NEAREST)
 ii=img.copy();ii.thumbnail((115,170),Image.Resampling.NEAREST)
 bg=checker((120,174),12)
 bg.alpha_composite(ii,((120-ii.width)//2,(174-ii.height)//2))
 pa.paste(ss,(x+7+(115-ss.width)//2,y+10+(174-ss.height)//2),ss)
 pa.paste(bg.convert('RGB'),(x+136,y+10))
 dr.text((x+10,y+193),sid[:12],font=font,fill='#bfeccf')
 dr.text((x+10,y+211),nm[:26],font=font,fill='white')
pa.save(per_shop/'01_antes_depois_todos.png',optimize=True)

# metadata and edit instructions
meta=DEST/'04_DADOS_CODEX';meta.mkdir()
(meta/'recortes_candidatos.json').write_text(json.dumps(infos,ensure_ascii=False,indent=2),encoding='utf8')
(meta/'progresso.json').write_text(json.dumps({'source':'Pacote v1.0','version':'2.0 - reconstrução em revisão','stores':progress,'native_sprites_ready':cnt,'candidate_objects':len(infos),'approved_rebuilt_sprites':0,'github_changes':False},ensure_ascii=False,indent=2),encoding='utf8')
with (meta/'progresso.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=list(progress[0]));w.writeheader();w.writerows(progress)
(DEST/'LEIA_PRIMEIRO.md').write_text('''# After Rain — Biblioteca de comércios / Reconstrução v2.0

Esta entrega **não é 100% concluída**: 10 fachadas e 10 interiores aprovados foram preservados, recortes contextuais originais disponíveis, e uma nova série de PNGs com máscaras de segmentação foi produzida.

Os arquivos em `01_SPRITES_EM_RECONSTRUCAO` são *CANDIDATOS* a sprites individuais: a remoção do fundo foi realizada automaticamente com máscaras orientadas e requer retoque manual em contornos, peças parcialmente ocultas, pixels residuais e sombras. **Não devem ser confundidos com assets prontos ou usados sem inspeção.** Os 26 PNGs em `02_SPRITES_ORIGINAIS_V081` são recursos independentes extraídos da versão do jogo e conferidos na revisão anterior.

Pastas:
- `01_LOJAS/`: referência completa, fachada, interior, recortes originais e novos candidatos RGBA de cada comércio.
- `02_SPRITES_ORIGINAIS_V081/`: recursos independentes preservados do executável.
- `03_PREVIAS_AUDITORIA/`: comparação lado a lado (original / máscara), 10 panoramas por comércio e overview.
- `04_DADOS_CODEX/`: status por NPC e mapeamento da posição original de cada item para reedição e integração.

Para obter 100%: finalizar contornos manualmente, reconstruir partes não visíveis de cada item, revisar 100% dos sprites em três fundos diferentes, remover objetos das cenas e refazer o piso sob cada um, identificar os que não devem mover (prateleiras embutidas), testar ordenação por profundidade, colisões, entradas e interações com NPCs dentro de Phaser. Este pacote **não** realiza essas etapas nem modifica o GitHub.

**Não reamostrar o pixel art original, preservar os nomes de NPC, usar escala nearest-neighbor.**
''',encoding='utf8')
# Save algorithm/tooling for further polishing of masks and produce ZIP (avoid large duplicate original interiors at original res? 25MB).
shutil.copy2(Path(__file__),DEST/'04_DADOS_CODEX'/'codigo_segmentacao_base.py')
outzip=Path('/mnt/data/After_Rain_Vila_Comercios_Reconstrucao_Visual_v2.zip')
with ZipFile(outzip,'w',ZIP_DEFLATED,compresslevel=6) as z:
 for f in sorted(DEST.rglob('*')):
  if f.is_file():z.write(f,DEST.name+'/'+str(f.relative_to(DEST)))
with ZipFile(outzip) as z:
 assert z.testzip() is None
print('COMERCIOS',len(manifest['npc']),'SPRITES V081',cnt,'SPRITES CANDIDATOS',len(infos),'ZIP',outzip,'MB',round(outzip.stat().st_size/1e6,2))
