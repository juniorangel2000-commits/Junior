"""Compose the reference inventory from independent art; never edit PNG pixels."""
import argparse,copy,hashlib,json,shutil
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def info(p):
    im=Image.open(p).convert('RGBA');a=np.asarray(im);ys,xs=np.where(a[:,:,3]>=128)
    box=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
    return {'width':im.width,'height':im.height,'visibleBoundsAlpha128':box,
        'origin':{'x':(box[0]+box[2])/2/im.width,'y':box[3]/im.height},
        'sha256':sha(p),'sourceSha256':sha(p),'pixelsChanged':0}
def place(asset,definition):
    if 'box' not in definition:return
    sx,sy,ex,ey=definition['box'];x0,y0,x1,y1=asset['visibleBoundsAlpha128'];w,h=x1-x0,y1-y0
    width,height=(ex-sx)*.5,(ey-sy)*.5
    scale=min(width/w,height/h)
    asset.update({'recommendedPosition':{'x':24+(sx+ex)*.25,'y':24+ey*.5},
        'scale':scale,'referenceBBox':definition['box'],'referenceRole':definition.get('referenceRole',definition.get('note',asset['name']))})
    asset.pop('scaleX',None)
    if definition.get('fit')=='bounds':asset['scale']=height/h;asset['scaleX']=width/w
    asset['supportId']=definition.get('supportId')
    if definition.get('mounted') or asset['supportId']:
        asset['collision']=None;asset['depth']={'mode':'support' if asset['supportId'] else 'feet','layer':'objects' if asset['supportId'] else 'structure'}
    else:
        asset['collision']={'x':x0+w*.16,'y':y0+h*.77,'width':w*.68,'height':h*.19}
        asset['depth']={'mode':'feet','layer':'objects'}
def build(sources,library):
    source_map={r['id']:Path(r['file']) for r in json.loads(sources.read_text())};assert len(source_map)==14
    layout=json.loads((ROOT/'scripts/vila-reconstrucao/bento-fidelidade.json').read_text())
    path=library/'bento/novas-sprites.json';data=json.loads(path.read_text());canonical={r['id']:r for r in data['objects']};out=library/'bento/fidelidade';out.mkdir(exist_ok=True)
    for id,p in source_map.items():shutil.copy2(p,out/(id+'.png'))
    for definition in layout['canonical']:
        asset=canonical[definition['id']]
        if definition.get('newSource'):
            p=out/(definition['newSource']+'.png');asset.update(info(p));asset['file']=str(p.relative_to(library))
            asset['reason']='Balcão redesenhado para a referência: tampo mais profundo e dois painéis frontais, sem gavetas. Versão anterior preservada.'
        place(asset,definition)
        if 'sceneVisible'in definition:asset['sceneVisible']=definition['sceneVisible']
    extras=[]
    for definition in layout['additions']:
        source_kind='new_independent_art'
        if definition.get('existing'):
            file='preservados-jogo/'+definition['existing'];source_kind='existing_preserved_art'
        elif definition.get('canonicalSource'):file=canonical[definition['canonicalSource']]['file']
        else:file='bento/fidelidade/'+definition['source']+'.png'
        asset={'id':definition['id'],'name':definition['name'],'status':'precisa_revisao','gameReady':False,'previewReady':True,
            'textureKey':'fidelity-'+definition['id'],'file':file,'before':layout['reference'],'original':layout['reference'],
            'sourceKind':source_kind,'croppedFromInterior':False,'interaction':None,
            'reason':'Objeto independente posicionado conforme o inventário da referência. '+('Sprite já existente reutilizada sem alterações.' if source_kind=='existing_preserved_art' else 'Arte nova; PNG integral preservado.'),**info(library/file)}
        place(asset,definition);extras.append(asset)
    data['fidelityObjects']=extras
    all_objects=data['objects']+extras
    by_id={a['id']:a for a in all_objects}
    def translate(asset,dx,dy):
        asset['recommendedPosition']['x']+=dx;asset['recommendedPosition']['y']+=dy
        for child in all_objects:
            if child.get('supportId')==asset['id']:translate(child,dx,dy)
    for offset in layout.get('assemblyOffsets',[]):
        translate(by_id[offset['id']],offset['dx'],offset['dy'])
    for anchor in layout.get('wallAnchors',[]):
        asset=by_id[anchor['id']];x0,y0,x1,y1=asset['visibleBoundsAlpha128'];sx=asset.get('scaleX',asset['scale']);sy=asset['scale'];p=asset['recommendedPosition']
        if anchor['edge']=='left':dx=anchor['value']-(p['x']-(x1-x0)*sx/2);dy=0
        elif anchor['edge']=='right':dx=anchor['value']-(p['x']+(x1-x0)*sx/2);dy=0
        else:dx=0;dy=anchor['value']-p['y']
        translate(asset,dx,dy);asset['wallAnchor']=anchor
    for adjustment in layout.get('clearanceAdjustments',[]):
        translate(by_id[adjustment['id']],adjustment['dx'],adjustment['dy'])
    data['sideWallOcclusion']=layout.get('sideWallOcclusion',[])
    transitions=[]
    for definition in layout.get('floorTransitions',[]):
        file='bento/fidelidade/'+definition['source']+'.png';record=info(library/file);x0,y0,x1,y1=record['visibleBoundsAlpha128']
        transitions.append({**record,**definition,'file':file,'scaleX':definition['visibleWidth']/(x1-x0),
            'scale':definition['visibleHeight']/(y1-y0),'status':'precisa_revisao','sourceKind':'new_independent_art'})
    data['floorTransitions']=transitions
    data['fidelity']={'reference':layout['reference'],'referenceSha256':sha(library/layout['reference']),
        'referenceSize':[1062,617],'scale':.5,'offset':{'x':24,'y':24},'newPNGs':len(source_map),'reusedUniquePNGs':4,
        'additionalInstances':len(extras),'visibleInstances':sum(r.get('sceneVisible',True) for r in data['objects']+extras),
        'wallAnchors':layout.get('wallAnchors',[]),
        'assemblyOffsets':layout.get('assemblyOffsets',[]),
        'clearanceAdjustments':layout.get('clearanceAdjustments',[]),
        'preservedVariants':[{'file':'bento/novas-sprites/'+id+'.png','sha256':sha(library/'bento/novas-sprites'/(id+'.png'))} for id in ['mesa_atendimento','martelos_parede']],
        'note':'Composição aproximada por marcos visuais; não é cópia pixel a pixel da referência. Todas as imagens anteriores permanecem disponíveis.'}
    data['stats'].update({'fidelityNewSprites':len(source_map),'fidelityAddedObjects':len(extras),'fidelityReusedUniqueSprites':4,'floorTransitionPieces':len(transitions)})
    png_count=sum(len(list((library/'bento'/folder).glob('*.png'))) for folder in ['novas-sprites','interior-novo','fidelidade'])
    data['stats'].update({'totalGeneratedPNGFiles':png_count,'catalogObjectRecords':len(all_objects),
        'sceneObjectInstances':data['fidelity']['visibleInstances'],'pendingArtReview':png_count,'pendingArtReviewUnit':'new_png_files_including_preserved_variants'})
    data['layers']['interactions']=[{'id':r['id'],'type':r['interaction'],'position':r['recommendedPosition'],'enabled':False,'previewEnabled':True}for r in data['objects']+extras if r.get('interaction')]
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2));print(json.dumps(data['fidelity'],ensure_ascii=False))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,default=Path('/workspace/after-rain-vila-v31/novas-artes/fidelidade-fontes.json'));p.add_argument('--library',type=Path,default=ROOT/'public/dev/vila-v31');a=p.parse_args();build(a.sources,a.library)
