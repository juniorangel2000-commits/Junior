"""Audit/extract original RGB with explicit masks; never generate hidden surfaces.
No input files are modified and no supplied scripts are executed.
"""
import argparse,json,hashlib,shutil,math,csv
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np
P=Path(__file__).resolve().parents[2]
NPCS=[('augusto','Augusto — Armazém'),('bento','Bento — Ferraria'),('amelia','Amélia — Herbalista'),('tobias','Tobias — Carpintaria'),('rosa','Rosa — Loja agrícola'),('nilo','Nilo — Antiguidades'),('celina','Celina — Costureira'),('damiao','Damião — Pescador'),('helena','Helena — Pousada'),('icaro','Ícaro — Oficina mecânica')]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(p,data):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,indent=2))
def save_clean(im,p):
 a=np.array(im.convert('RGBA'));a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(p)
def checker(size):
 im=Image.new('RGBA',size,'#e7e7e7');d=ImageDraw.Draw(im)
 for y in range(0,size[1],12):
  for x in range(0,size[0],12):
   if (x//12+y//12)%2:d.rectangle((x,y,x+11,y+11),fill='#aab2b5')
 return im

def build(entry,out):
 out.mkdir(parents=True,exist_ok=True);source=entry/'bento';base=entry/'base_codex';audit=P/'scripts/vila-reconstrucao/bento-mascaras.json';spec=json.loads(audit.read_text());rgb=Image.open(source/'interior.png').convert('RGB');raw=np.array(Image.open(source/'interior.png').convert('RGBA'));objects=[]
 original=out/'bento/originais';shutil.copytree(source,original,dirs_exist_ok=True);shutil.copytree(base,out/'compartilhado/pacote_base',dirs_exist_ok=True)
 # Compute the exact affine alignment from the 14 independent reference crops.
 layout=json.loads((base/'codex_v3/layout_10_lojas_referencia.json').read_text());layout=next(n for n in layout if n['npc']=='bento');alignment={}
 for el in layout['elements']:
  ref=Image.open(source/'recortes_referencia'/f"{el['id']}.png").convert('RGB');x,y,x1,y1=el['reference_bbox_xyxy'];actual=rgb.crop((x-30,y-719,x1-30,y1-719));exact=np.array_equal(np.array(ref),np.array(actual));alignment[el['id']]={'x':x-30,'y':y-719,'width':ref.width,'height':ref.height,'exactRGB':bool(exact),'mismatchedPixels':int(np.count_nonzero(np.any(np.array(ref)!=np.array(actual),axis=2)))}
  assert exact,el['id']
 for el in layout['elements']:
  id=el['id'];s=spec.get(id);status=s['status'] if s else 'incompleto';before=source/'sprites_alpha_limpo'/f'{id}.png';before=before if before.exists() else source/'recortes_referencia'/f'{id}.png'
  record={'id':id,'name':id.replace('_',' ').capitalize(),'status':status,'gameReady':status=='aprovado','original':f'bento/originais/recortes_referencia/{id}.png','before':str(before.relative_to(source)).join(['bento/originais/','']),'sourcePosition':alignment[id],'sourceReferenceBBox':el['reference_bbox_xyxy'],'hiddenSurfaceReconstructed':False,'interaction':None,'scale':.5}
  if s:
   box=s['box'];crop=rgb.crop(box);mask=Image.new('L',crop.size);ImageDraw.Draw(mask).polygon([tuple(p) for p in s['polygon']],fill=255)
   # Recover RGB under broken source alpha ONLY inside the documented foreground mask.
   result=Image.new('RGBA',(crop.width+16,crop.height+16));fg=crop.convert('RGBA');fg.putalpha(mask);result.paste(fg,(8,8));folder='aprovados' if status=='aprovado' else 'em_revisao';dest=out/'bento'/folder/f'{id}.png';dest.parent.mkdir(parents=True,exist_ok=True);save_clean(result,dest)
   active=np.array(mask)>0;old=raw[box[1]:box[3],box[0]:box[2],3];kept=np.array(result)[8:8+crop.height,8:8+crop.width];assert np.array_equal(kept[:,:,:3][active],np.array(crop)[active]);count=int(active.sum());bounds=result.getbbox()
   w,h=result.size;collision=None if s.get('blocking',True)==False else {'x':8+crop.width*.18,'y':8+crop.height*.76,'width':crop.width*.64,'height':crop.height*.20}
   record.update({'file':str(dest.relative_to(out)),'width':w,'height':h,'origin':{'x':.5,'y':(h-8)/h},'originPx':{'x':w/2,'y':h-8},'sourceBBox':box,'sourceOffsetPx':{'x':-8,'y':-8},'recommendedPosition':{'x':24+(box[0]+box[2])*.25,'y':24+box[3]*.5},'depth':{'mode':'feet','offset':0,'layer':'objects' if s.get('mount')!='wall' else 'structure'},'collision':collision,'interaction':s['interaction'],'reason':s['reason'],'padding':8,'alphaBBox':bounds,'opaquePixels':count,'restoredAlphaPixels':int(np.count_nonzero(active&(old<255))),'originalRGBMismatches':0,'sha256':sha(dest),'repair':'manual_foreground_polygon_and_original_RGB_alpha_recovery','maskPolygon':s['polygon']})
  else:
   record.update({'file':None,'reason':{'mesa_atendimento':'Balcão com decoração fundida e frente cortada no candidato; tampo sob os objetos está oculto. Não há reconstrução exata aprovada.','fornalha_completa':'Recorte contextual corta partes do capuz/chaminé e inclui piso, parede e objetos vizinhos. Requer separação arquitetônica e reconstrução revisada.','prateleira_ferramentas':'Composição de duas estantes, painel de ferramentas e janela; partes ocultas não podem ser tratadas como sprite único acabado.','estante_metal':'Recorte contém ferramentas de parede e partes de outras estações; base não está integralmente separada.','porta_ferramentas':'Painel se sobrepõe à estação de afiação. Precisa de máscara própria e revisão do topo.','cesto_lingotes':'O recorte é um módulo composto com carvão e lingotes; base cortada e nome comercial impreciso.','martelos_parede':'Ferramentas penduradas têm espaços vazios e suportes finos; máscara completa ainda não revisada.'}.get(id,'Ausência de contorno independente validado.')})
  objects.append(record)
 # Separate approved atlas: do not pack review candidates into the approved atlas.
 approved=[r for r in objects if r['gameReady']];atlas=Image.new('RGBA',(512,512));frames={};x=y=2;row=0
 for r in approved:
  im=Image.open(out/r['file']);w,h=im.size
  if x+w+2>512:x=2;y+=row+4;row=0
  assert y+h+2<=512;atlas.paste(im,(x,y));frames[r['id']]={'frame':{'x':x,'y':y,'w':w,'h':h},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':w,'h':h},'sourceSize':{'w':w,'h':h}};x+=w+4;row=max(row,h)
 ap=out/'bento/atlas';ap.mkdir(parents=True,exist_ok=True);save_clean(atlas,ap/'aprovados.png');write(ap/'aprovados.json',{'frames':frames,'meta':{'image':'aprovados.png','format':'RGBA8888','size':{'w':512,'h':512},'scale':'1','sampling':'nearest'}})
 # Rebuild bare floor from existing game tiles, never by painting over old furniture.
 layers=out/'bento/camadas';layers.mkdir(parents=True,exist_ok=True)
 floor=Image.new('RGBA',rgb.size);floorMask=Image.new('L',rgb.size);d=ImageDraw.Draw(floorMask);d.rectangle((72,190,1006,501),fill=255);d.rectangle((380,502,503,610),fill=255)
 tileInfo=[]
 for material,file,x0,x1 in [('madeira','piso_tabuas.png',0,531),('pedra','piso_pedra.png',531,rgb.width)]:
  p=P/'public/assets/visual/modules'/file;shutil.copy2(p,out/'compartilhado'/file);finishes=Image.open(P/'public/assets/visual/terrain/floor-finishes.png').convert('RGBA');tile=finishes.crop((0 if material=='madeira' else 887,0,887 if material=='madeira' else 1774,887)).resize((256,256),Image.Resampling.NEAREST);tileInfo.append({'file':file,'sha256':sha(p),'provenance':'Piso gerado do atlas floor-finishes.png do jogo atual, nearest 256px; módulo 64px também preservado como referência, sem atribuir origem v0.8.1 ao piso','originalSize':list(tile.size)})
  for yy in range(190,rgb.height,tile.height):
   for xx in range(x0,x1,tile.width):
    patch=tile.crop((0,0,min(tile.width,x1-xx),min(tile.height,rgb.height-yy)));floor.paste(patch,(xx,yy))
 floor.putalpha(floorMask);save_clean(floor,layers/'01-piso.png')
 # Fixed, visible original frame only; no old background furniture is retained.
 frame=Image.new('L',rgb.size);d=ImageDraw.Draw(frame)
 d.polygon([(42,2),(1020,2),(1020,62),(1055,62),(1055,589),(1020,589),(1020,555),(542,555),(542,589),(505,589),(505,610),(380,610),(380,589),(340,589),(340,555),(42,555),(42,550),(6,550),(6,62),(42,62)],fill=255)
 d.rectangle((73,54,1006,501),fill=0);d.rectangle((380,502,503,610),fill=0)
 # Cream plaster / framing uses the supplied official 0.8.1 module; floors stay separate.
 struct=Image.new('RGBA',rgb.size);wall=Image.open(base/'originais_v081/visual__modules__parede_creme.png').convert('RGBA').crop((12,28,68,78))
 for x0,x1 in [(73,1007)]:
  for xx in range(x0,x1,wall.width):
   for yy in range(54,190,wall.height):struct.alpha_composite(wall.crop((0,0,min(wall.width,x1-xx),min(wall.height,190-yy))),(xx,yy))
 originalFrame=rgb.convert('RGBA');originalFrame.putalpha(frame);struct.alpha_composite(originalFrame)
 shutil.copy2(P/'public/assets/visual/terrain/floor-finishes.png',out/'compartilhado/floor-finishes.png')
 # Preserve the approved window as architecture (plaster around it is permitted on a wall module).
 win=rgb.crop((190,64,290,180)).convert('RGBA');struct.alpha_composite(win,(190,64));save_clean(struct,layers/'02-estrutura.png')
 upper=Image.new('RGBA',rgb.size);m=Image.new('L',rgb.size);ImageDraw.Draw(m).rectangle((0,502,rgb.width,rgb.height),fill=255);upper.paste(struct,(0,0));upper.putalpha(Image.fromarray(np.minimum(np.array(upper.getchannel('A')),np.array(m))));save_clean(upper,layers/'04-superiores.png')
 structural={'floor':{'file':'bento/camadas/01-piso.png','provenance':'tiles atuais repetidos sem suavização; nenhum preenchimento sobre móveis'},'structure':{'file':'bento/camadas/02-estrutura.png','provenance':'moldura/janela RGB visível da referência + módulo oficial 0.8.1; não é réplica pixel a pixel do interior inteiro'},'upper':{'file':'bento/camadas/04-superiores.png','depth':'front-frame'},'tile':32,'scale':.5,'offset':{'x':24,'y':24},'world':{'width':576,'height':352},'walkable':{'left':60,'top':119,'right':527,'bottom':275,'door':{'left':214,'right':276,'bottom':329}},'spawn':{'x':245,'y':309},'interactions':[{'id':r['id'],'type':r['interaction'],'position':r.get('recommendedPosition'),'enabled':r['gameReady']} for r in objects if r.get('interaction')],'finalInteriorApproved':False,'reason':'Objetos essenciais incompletos: balcão, estantes e fornalha. Cena navegável é demonstração técnica, não interior artístico final.'}
 write(layers/'03-objetos.json',[r for r in objects if r['gameReady']]);write(layers/'05-interacoes.json',structural['interactions']);write(out/'bento/cena.json',structural)
 # Actor supplied earlier by the user, preserved byte for byte, for the depth/collision laboratory.
 actor=out/'compartilhado/ator';actor.mkdir(parents=True,exist_ok=True)
 for p in (P/'public/assets/visual/village/bento/Idle/rotations').glob('*.png'):shutil.copy2(p,actor/p.name)
 native=[]
 for p in sorted((base/'originais_v081').glob('*.png')):
  im=Image.open(p).convert('RGBA');a=np.array(im);native.append({'id':p.stem,'file':str((out/'compartilhado/pacote_base/originais_v081'/p.name).relative_to(out)),'width':im.width,'height':im.height,'sha256':sha(p),'partialAlphaPixels':int(np.count_nonzero((a[:,:,3]>0)&(a[:,:,3]<255))),'status':'precisa_revisao','reason':'Original oficial preservado; não herda aprovação do pacote sem inspeção visual individual para esta biblioteca.'})
 statuses={s:sum(r['status']==s for r in objects) for s in ['aprovado','precisa_revisao','incompleto']}
 stats={'providedNPCs':1,'expectedNPCs':10,'pendingNPCs':9,'bentoTargetObjects':len(objects),'bento':statuses,'objectFilesCorrected':len(spec),'newAtlasFrames':len(frames),'officialOriginalFiles':len(native),'referenceCropsExactRGB':sum(v['exactRGB'] for v in alignment.values()),'hiddenSurfacesReconstructed':0,'sourceFilesChanged':0,'restoredAlphaPixels':sum(r.get('restoredAlphaPixels',0) for r in objects)}
 stores=[{'id':id,'name':name,'received':id=='bento','manifest':'bento/manifest.json' if id=='bento' else None,'status':'fase_1_parcial' if id=='bento' else 'aguardando_pacote'} for id,name in NPCS]
 write(out/'bento/manifest.json',{'npc':'bento','objects':objects,'layers':structural,'atlas':'bento/atlas/aprovados.json','alignment':{'offset':[-30,-719],'matches':alignment},'sources':{'facade':{'file':'bento/originais/fachada.png','sha256':sha(source/'fachada.png')},'interior':{'file':'bento/originais/interior.png','sha256':sha(source/'interior.png')}},'stats':statuses})
 write(out/'biblioteca.json',{'version':'v3.1-auditoria-fase1','stores':stores,'stats':stats,'officials':native,'tiles':tileInfo,'githubChanged':False,'gameProductionScenesChanged':False})
 # Review board at native 1:1 pixels, with checkerboard and explicit verdicts.
 sheet=Image.new('RGBA',(1200,math.ceil(len(objects)/3)*270),'#e6dfca');d=ImageDraw.Draw(sheet)
 for i,r in enumerate(objects):
  xx=i%3*400;yy=i//3*270;d.text((xx+8,yy+6),r['id'],fill='#182a22');d.text((xx+8,yy+23),r['status'],fill='#176431' if r['gameReady'] else '#a0402a')
  for col,file in enumerate([r['original'],r['file'] or r['before']]):
   im=Image.open(out/file).convert('RGBA');bg=checker((190,210));scale=min(1,184/im.width,195/im.height);im=im.resize((max(1,int(im.width*scale)),max(1,int(im.height*scale))),Image.Resampling.NEAREST);bg.alpha_composite(im,((190-im.width)//2,10));sheet.alpha_composite(bg,(xx+4+col*198,yy+45))
 sheet.convert('RGB').save(out/'bento/previa-auditoria.png')
 # Baseline composed only from approved objects. Missing essentials stay absent.
 composed=floor.copy();composed.alpha_composite(struct)
 for r in sorted(approved,key=lambda r:r['recommendedPosition']['y']):
  im=Image.open(out/r['file']);box=r['sourceBBox'];composed.alpha_composite(im,(box[0]-8,box[1]-8))
 composed.alpha_composite(upper);save_clean(composed,out/'bento/interior-reconstruido-parcial.png')
 write(out/'auditoria.json',{'stats':stats,'inputFiles':[{'file':str(p.relative_to(entry)),'sha256':sha(p),'bytes':p.stat().st_size} for p in entry.rglob('*') if p.is_file()],'maskSpecificationSha256':sha(audit),'limitations':['Apenas Bento e pacote oficial recebidos. Os outros nove comércios não foram auditados.','Sprites em revisão e incompletos não entram no atlas aprovado nem na cena padrão.','Nenhuma superfície oculta foi inventada. Interior reconstruído não aprovado como final.','Arquivo de instruções cita 26 oficiais, mas o pacote contém 24 PNGs oficiais.']})
 print(json.dumps(stats,ensure_ascii=False,indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--input',type=Path,default=Path('/workspace/after-rain-vila-v31/entrada'));p.add_argument('--out',type=Path,default=P/'public/dev/vila-v31');a=p.parse_args();build(a.input,a.out)
