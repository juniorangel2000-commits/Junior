"""Package native newly generated Augusto props without changing image pixels.
PIL/numpy are used only for metadata and alpha QA. Preview uses browser rendering.
"""
import hashlib, json, re, shutil, zipfile
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WORK = Path('/workspace/after-rain-augusto')
OUT = ROOT/'public/dev/augusto'
SOURCE = WORK/'novas-artes'
REF = WORK/'recebido/After_Rain_Vila_Comercios_Assets_v1_0/01_LOJAS/01_augusto'
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

def build():
    plan = json.loads((SOURCE/'plano.json').read_text()) + json.loads((SOURCE/'plano-expansao.json').read_text())
    rows = json.loads((SOURCE/'fontes.json').read_text()) + json.loads((SOURCE/'expansao-fontes-6.json').read_text())
    sources = {p['id']: p for p in rows}
    assert len(sources) == len(plan) == 31
    for sub in ['sprites', 'referencias', 'materiais']: (OUT/sub).mkdir(parents=True, exist_ok=True)
    # x, foot y, intended visible width, maximum visible height, layer
    placements = [
        (480,350,300,110,'objects'),(535,280,40,38,'counter'),(435,277,42,24,'counter'),
        (480,232,260,160,'objects'),(760,238,115,163,'objects'),(205,244,105,154,'objects'),
        (113,450,82,80,'objects'),(219,488,110,90,'objects'),(700,478,100,76,'table'),
        (838,430,95,91,'objects'),(480,520,300,150,'floor'),(315,139,45,72,'wall'),
        (110,350,65,80,'objects'),(596,283,40,45,'counter'),(117,142,28,50,'wall'),
        (296,248,40,128,'objects'),(600,410,43,50,'objects'),(669,171,100,76,'wall'),
        (367,284,63,46,'counter'),(700,505,130,88,'objects'),(321,472,65,59,'objects'),
        (480,576,100,52,'floor'),(480,324,106,49,'counter'),(111,499,72,63,'objects'),
        (868,520,47,60,'objects'),
        (230,337,130,65,'objects'),(96,246,58,94,'objects'),
        (260,568,140,56,'objects'),(657,270,42,63,'objects'),
        (850,315,65,105,'objects'),(680,332,80,60,'objects'),
    ]
    assert len(placements)==len(plan)
    wall = {'placa_botanica','lamparina_parede','ervas_penduradas','escada_estoque'}
    floor = {'tapete_central','capacho_entrada'}
    small = {'balanca_balcoes','livro_caixa','enfeite_floral','caixa_registro','toalha_balcao','cesta_macas','vaso_ervas'}
    objects=[]
    for p, placement in zip(plan,placements):
        source=Path(sources[p['id']]['source']); dest=OUT/'sprites'/f"{p['id']}.png"
        shutil.copy2(source,dest)
        im=Image.open(dest); assert im.mode=='RGBA',p['id']
        pixels=np.asarray(im); alpha=pixels[:,:,3]; yy,xx=np.where(alpha>=128)
        x0,y0,x1,y1=int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)
        assert x0>0 and y0>0 and x1<im.width and y1<im.height,p['id']
        assert np.any(alpha==0) and sha(source)==sha(dest),p['id']
        x,y,w,h,layer=placement; scale=min(w/(x1-x0),h/(y1-y0))
        collision=None if p['id'] in wall|floor|small else {'x':x0+(x1-x0)*.12,'y':y0+(y1-y0)*.78,'width':(x1-x0)*.76,'height':(y1-y0)*.2}
        objects.append({
            'id':p['id'],'name':p['name'],'file':'sprites/'+dest.name,'textureKey':'augusto-'+p['id'],
            'width':im.width,'height':im.height,'origin':{'x':(x0+x1)/2/im.width,'y':y1/im.height},
            'visibleBoundsAlpha128':[x0,y0,x1,y1],'scale':scale,
            'recommendedPosition':{'x':x,'y':y},'collision':collision,
            'depth':{'mode':'floor' if p['id'] in floor else 'wall' if p['id'] in wall else 'feet','previewLayer':layer},
            'supportId':'balcao_central' if layer=='counter' else 'mesa_expositora' if layer=='table' else None,
            'interaction':{'balcao_central':'comercio','lamparina_parede':'iluminacao'}.get(p['id']),
            'status':'em_revisao','previewReady':True,'gameReady':False,
            'sourceKind':'new_independent_art','croppedFromInterior':False,'pixelsChanged':0,
            'sha256':sha(dest),'sourceSha256':sha(source),
            'technicalValidation':{'rgba':True,'fullyContainedAlpha128':True,
                'transparentPixels':int(np.count_nonzero(alpha==0)),
                'visiblePixels':int(np.count_nonzero(alpha>=128)),
                'softAlphaPixels':int(np.count_nonzero((alpha>0)&(alpha<128)))},
            'review':'Arte independente completa. Validar proporções e acabamento no conjunto antes da integração ao jogo.'
        })
    for src,dest in [
        (REF/'01_FACHADA/fachada_referencia_sem_edicao.png',OUT/'referencias/fachada-original.png'),
        (REF/'02_INTERIOR/interior_referencia_sem_edicao.png',OUT/'referencias/interior-original.png'),
        (ROOT/'public/dev/vila-v31/bento/interior-novo/piso-madeira.png',OUT/'materiais/piso-madeira.png'),
        (ROOT/'public/assets/visual/village/augusto/Idle/rotations/south.png',OUT/'materiais/augusto-down.png'),
    ]: shutil.copy2(src,dest)
    shutil.copytree(ROOT/'public/assets/visual/village/augusto',OUT/'personagem',dirs_exist_ok=True)
    # Use the real smith palette as the single source for the plaster color.
    match=re.search(r'SMITH_WALL_COLOR=\[(\d+),(\d+),(\d+)\]',(ROOT/'src/smith-finish.ts').read_text())
    assert match is not None
    wall_color='#'+''.join(f'{int(c):02x}' for c in match.groups())
    total=len(objects)
    manifest={'npc':'augusto','version':2,'collection':'novas-artes-independentes',
        'preview':{'width':960,'height':640,'draftArchitecture':True,'wallColor':wall_color,'wallColorSource':'src/smith-finish.ts#SMITH_WALL_COLOR'},'objects':objects,
        'stats':{'createdFromScratch':total,'addedThisRevision':6,'croppedFromReference':0,'nativePngsUnchanged':total,'pendingVisualReview':total,'existingAssetsReplaced':0},
        'note':'Etapa de criação de objetos. A arquitetura da prévia é um guia; comércio, colisões e editor em jogo ainda não foram integrados.'}
    write(OUT/'manifest.json',manifest)
    assert all(sha(OUT/o['file'])==o['sourceSha256'] for o in objects)
    write(WORK/'validacao-assets.json',{'passed':True,'objects':total,'rgba':total,'containedSilhouettes':total,'sourceHashesMatch':total,'nativeResolutionPreserved':True,'wallColor':wall_color,'matchesSmithWall':True,'visualApproval':False})
    print(json.dumps(manifest['stats']))

def package():
    target=WORK/'After-Rain-Augusto-Sprites-v2.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
        for p in sorted(OUT.rglob('*')):
            if p.is_file(): archive.write(p,Path('After-Rain-Augusto')/p.relative_to(OUT))
    write(WORK/'pacote.json',{'file':str(target),'bytes':target.stat().st_size,'sha256':sha(target)})
    print(target)

if __name__=='__main__':
    import sys
    package() if '--package' in sys.argv else build()
