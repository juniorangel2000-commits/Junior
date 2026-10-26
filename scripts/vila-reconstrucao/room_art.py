"""Register independent new floor/wainscot/partition art; keep source PNG bytes."""
import json,shutil,hashlib,argparse
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def build(sources,library):
    manifest=library/'bento/novas-sprites.json';data=json.loads(manifest.read_text());room=[];out=library/'bento/interior-novo';out.mkdir(parents=True,exist_ok=True)
    for row in json.loads(sources.read_text()):
        id=row['id'];source=Path(row['file']);dest=out/(id+'.png');shutil.copy2(source,dest);im=Image.open(dest).convert('RGBA');a=np.array(im);ys,xs=np.where(a[:,:,3]>=128);box=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
        r={'id':id,'file':'bento/interior-novo/'+dest.name,'width':im.width,'height':im.height,'sha256':sha(dest),'sourceSha256':sha(source),'pixelsChanged':0,'sourceKind':'new_independent_art','visibleBoundsAlpha128':box,'origin':{'x':(box[0]+box[2])/2/im.width,'y':box[3]/im.height}}
        if id=='meia-divisoria':
            scale=208/(box[3]-box[1]);cx=(box[0]+box[2])/2;bottom=box[3]
            data['objects'].append({**r,'name':'Meia divisória vertical','status':'precisa_revisao','gameReady':False,'previewReady':True,'textureKey':'room-'+id,'before':r['file'],'original':r['file'],'scale':scale,'scaleX':18/(box[2]-box[0]),'recommendedPosition':{'x':281.5,'y':232},'collision':{'x':cx-4/scale,'y':bottom-108/scale,'width':8/scale,'height':100/scale},'depth':{'mode':'feet','layer':'objects'},'interaction':None,'reason':'Divisória reta encaixada no vão central da parede de fundo, alinhada aos contornos arquitetônicos. Borda superior em y=24; passagem frontal mantida. Nenhuma imagem anterior foi substituída.','croppedFromInterior':False})
        else:room.append(r)
    data['roomMaterials']=room;data['stats'].update({'newRoomMaterials':3,'newPartition':1,'pendingArtReview':18})
    data['layers']['reason']='Proposta nova com objetos completos e independentes, materiais separados e divisória vertical. Em revisão artística; não é recuperação exata de superfícies ocultas do original.'
    data['layers']['interactions']=[{'id':r['id'],'type':r['interaction'],'position':r['recommendedPosition'],'enabled':False,'previewEnabled':True} for r in data['objects'] if r.get('interaction')]
    manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2));print('3 materiais de interior + meia divisória independente registrados')
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,default=Path('/workspace/after-rain-vila-v31/novas-artes/interior-fontes.json'));p.add_argument('--library',type=Path,default=ROOT/'public/dev/vila-v31');a=p.parse_args();build(a.sources,a.library)
