"""Pack supplied pet frames without resampling or changing their pixels."""
import argparse,hashlib,json,math,shutil,zipfile
from io import BytesIO
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('species',choices=['cat','dog']);parser.add_argument('archive');args=parser.parse_args()
directions=['south','south-east','east','north-east','north','north-west','west','south-west']
actions={'cat':{'idle':None,'rest':'Seated_on_Belly_Idle','stand':'Standing_from_Belly','sit':'Sitting_on_Belly','run':'Run','walk':'Walk','attack':'Jump'},'dog':{'idle':'Idle_Long','run':'Running','walk':'Walk','attack':'Jump_Attack'}}[args.species]
archive=Path(args.archive);z=zipfile.ZipFile(archive);meta=json.loads(z.read('metadata.json'));state=meta['states'][0];base=state['character']['size'];bw,bh=base['width'],base['height'];images=[];animations={};pivots={};frames={};sources={}
for direction in directions:
 idle=Image.open(BytesIO(z.read(state['frames']['rotations'][direction]))).convert('RGBA');box=idle.getbbox();pivots[direction]={'x':bw/2,'y':box[3]+1}
for action,name in actions.items():
 animations[action]={}
 for direction in directions:
  clips=state['frames']['animations'].get(name,{}) if name else {}
  if name and direction not in clips and action!='idle':continue
  paths=clips[direction] if name and direction in clips else [state['frames']['rotations'][direction]]
  animations[action][direction]=[]
  for n,path in enumerate(paths):
   image=Image.open(BytesIO(z.read(path))).convert('RGBA');key=f'{action}-{direction}-{n}';w,h=image.size
   assert w>=bw and h>=bh
   images.append((key,image,path,direction));animations[action][direction].append(key)
cell=max(max(im.size) for _,im,_,_ in images);columns=16;rows=math.ceil(len(images)/columns);atlas=Image.new('RGBA',(cell*columns,cell*rows))
for i,(key,im,path,direction) in enumerate(images):
 x=(i%columns)*cell;y=(i//columns)*cell;w,h=im.size;atlas.paste(im,(x,y));assert atlas.crop((x,y,x+w,y+h)).tobytes()==im.tobytes()
 frames[key]={'x':x,'y':y,'width':w,'height':h};sources[key]={'path':path,'sha256':hashlib.sha256(z.read(path)).hexdigest(),'pivot':{'x':pivots[direction]['x']+(w-bw)/2,'y':pivots[direction]['y']+(h-bh)/2}}
folder=root/'public/assets/visual/dungeons';png=folder/f'pet-{args.species}.png';atlas.save(png)
front=Image.open(BytesIO(z.read(state['frames']['rotations']['south']))).getbbox();manifest={'file':f'assets/visual/dungeons/{png.name}','sha256':hashlib.sha256(png.read_bytes()).hexdigest(),'alphaCutoff':0,'frames':frames,'animations':animations,'sources':sources,'animation':{'frameRate':10,'attackHitFrame':6,'referenceHeight':front[3]-front[1],'bodyHeight':22 if args.species=='cat' else 34},'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest()}
(folder/f'pet-{args.species}.json').write_text(json.dumps(manifest,indent=2)+'\n')
docs=root/f'docs/dungeons/animacoes-pet-{args.species}';docs.mkdir(parents=True,exist_ok=True);shutil.copyfile(archive,docs/'original.zip');(docs/'metadata.json').write_bytes(z.read('metadata.json'))
print(args.species,len(images),'frames',atlas.size,manifest['sha256'])
