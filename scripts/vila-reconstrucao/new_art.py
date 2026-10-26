"""Copy 14 newly generated independent PNGs unchanged; compute placement metadata.
No cropping, masks, recoloring or image resampling is performed by this script.
"""
import json, hashlib, shutil, argparse
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,data):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,indent=2))
def build(sources,library):
    old=json.loads((library/'bento/manifest.json').read_text())
    rows=json.loads(sources.read_text());images={r['id']:Path(r['file']) for r in rows}
    assert len(images)==14
    out=library/'bento/novas-sprites';out.mkdir(parents=True,exist_ok=True);objects=[]
    wall={'porta_ferramentas','martelos_parede','lamparina'}
    for prev in old['objects']:
        id=prev['id'];source=images[id];dest=out/(id+'.png');shutil.copy2(source,dest)
        im=Image.open(dest).convert('RGBA');a=np.array(im);ys,xs=np.where(a[:,:,3]>=128)
        assert len(xs)>0 and np.any(a[:,:,3]==0)
        x0,y0,x1,y1=int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)
        w,h=x1-x0,y1-y0;original=prev['sourcePosition'];scale=min(original['width']*.5/w,original['height']*.5/h)
        position={'x':24+(original['x']+original['width']/2)*.5,'y':24+(original['y']+original['height'])*.5}
        # The new shelf is a complete furnishing, unlike the old composite crop.
        # Place it below the window rather than over the approved architecture.
        if id=='prateleira_ferramentas':
            scale=min(64/w,116/h);position={'x':92,'y':224}
        collision=None if id in wall or id=='tapete_ferraria' else {'x':x0+w*.16,'y':y0+h*.77,'width':w*.68,'height':h*.19}
        record={'id':id,'name':prev['name'],'status':'precisa_revisao','gameReady':False,'previewReady':True,
            'textureKey':'fresh-'+id,'file':'bento/novas-sprites/'+dest.name,'before':prev['original'],'original':prev['original'],
            'width':im.width,'height':im.height,'origin':{'x':(x0+x1)/2/im.width,'y':y1/im.height},
            'scale':scale,'recommendedPosition':position,'collision':collision,
            'depth':{'mode':'feet','layer':'structure' if id in wall else 'objects'},
            'interaction':{'fornalha_completa':'fundir','bigorna_e_toco':'trabalhar_metal','tanque_resfriamento':'resfriar','mesa_atendimento':'comercio','lamparina':'iluminar'}.get(id),
            'reason':'Arte nova independente, criada do zero. Prévia técnica completa; acabamento e proporções aguardam revisão visual do conjunto. Nenhum recorte do interior foi utilizado.',
            'sourceKind':'new_independent_art','croppedFromInterior':False,'pixelsChanged':0,'sha256':sha(dest),
            'sourceSha256':sha(source),'visibleBoundsAlpha128':[x0,y0,x1,y1],
            'technicalValidation':{'rgba':im.mode=='RGBA','transparentPixels':int(np.count_nonzero(a[:,:,3]==0)),'visiblePixels':int(np.count_nonzero(a[:,:,3]>=128)),'fullyContainedAlpha128':x0>0 and y0>0 and x1<im.width and y1<im.height}}
        assert record['technicalValidation']['fullyContainedAlpha128'],id
        objects.append(record)
    manifest={'npc':'bento','collection':'new_independent_art','objects':objects,'layers':old['layers'],
        'stats':{'newIndependentSprites':14,'croppedFromInterior':0,'existingSpritesReplaced':0,'pendingArtReview':14},
        'note':'Interior e objetos existentes preservados; a nova coleção não modifica a partida.'}
    write(library/'bento/novas-sprites.json',manifest)
    preservation=json.loads(Path('/workspace/after-rain-vila-v31/checkpoints/sprites-existentes-preservadas.json').read_text())
    for r in preservation:
        p=ROOT/'public/assets/visual'/r['file'];assert sha(p)==r['sha256'];target=library/'preservados-jogo'/r['file'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
    write(library/'preservados-jogo/manifest.json',{'unchangedFiles':preservation,'preserved':True})
    print(json.dumps(manifest['stats']))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,default=Path('/workspace/after-rain-vila-v31/novas-artes/fontes.json'));p.add_argument('--library',type=Path,default=ROOT/'public/dev/vila-v31');a=p.parse_args();build(a.sources,a.library)
