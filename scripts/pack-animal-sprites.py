"""Pack the supplied PNGs by translation only; never resize or repaint their pixels."""
from pathlib import Path
from PIL import Image
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'public/assets/animals'
DIRECTIONS = ['south', 'west', 'east', 'north', 'south-west', 'south-east', 'north-west', 'north-east']
HEAD_CENTERS = {'south':(0,6),'west':(-31,-4),'east':(31,-4),'north':(0,-19),
                'south-west':(-24,4),'south-east':(24,4),'north-west':(-24,-11),'north-east':(24,-11)}

def head_anchor(image, kind, direction):
    """Measure the head in each original pose, without changing any image pixels."""
    points=[]
    if kind == 'chicken':
        for y in range(image.height//2):
            for x in range(image.width):
                r,g,b,a=image.getpixel((x,y))
                if a and r>110 and r>g*1.5 and r>b*1.5: points.append((x,y))
        # The comb and beak travel with the head, independently of the walking feet.
        x=sum(p[0] for p in points)/len(points)
        y=sum(p[1] for p in points)/len(points)+3
    else:
        dx,dy=HEAD_CENTERS[direction];cx=image.width/2+dx;cy=image.height/2+dy
        rx,ry=(22,12) if direction=='north' else (18,16)
        for y in range(max(0,int(cy-ry)),min(image.height,int(cy+ry)+1)):
            for x in range(max(0,int(cx-rx)),min(image.width,int(cx+rx)+1)):
                r,g,b,a=image.getpixel((x,y))
                if a and r>165 and b>75 and r-g>35 and r-b>10:points.append((x,y))
        x=sum(p[0] for p in points)/len(points) if points else cx
        y=sum(p[1] for p in points)/len(points) if points else cy
    x,y=round(x),round(y)
    if not image.getpixel((x,y))[3]:
        candidates=[(px,py) for py in range(max(0,y-8),min(image.height,y+9)) for px in range(max(0,x-8),min(image.width,x+9)) if image.getpixel((px,py))[3]]
        x,y=min(candidates,key=lambda p:(p[0]-x)**2+(p[1]-y)**2)
    return [x-image.width/2,y-image.height/2-(17 if kind=='chicken' else 34)]

anchors={}

for kind, animation, cell in [('chicken', 'Walking', 64), ('cow', 'Walk', 128)]:
    source = BASE / kind
    atlas = Image.new('RGBA', (cell * 9, cell * 8))
    records = []
    anchors[kind]=[]
    for row, direction in enumerate(DIRECTIONS):
        files = [source / 'Idle/rotations' / f'{direction}.png']
        files += [source / 'Idle/animations' / animation / direction / f'frame_{i:03d}.png' for i in range(8)]
        for column, path in enumerate(files):
            image = Image.open(path).convert('RGBA')
            anchors[kind].append(head_anchor(image,kind,direction))
            if max(image.size) > cell:
                raise ValueError(f'Cell too small: {path}')
            # PixelLab expands some frames symmetrically; their canvas center is stable.
            x, y = (cell-image.width)//2, (cell-image.height)//2
            atlas.paste(image, (column*cell+x, row*cell+y))
            assert atlas.crop((column*cell+x,row*cell+y,column*cell+x+image.width,row*cell+y+image.height)).tobytes() == image.tobytes()
            records.append({'file':str(path.relative_to(source)), 'sha256':hashlib.sha256(path.read_bytes()).hexdigest(), 'frame':row*9+column, 'width':image.width, 'height':image.height, 'x':x, 'y':y})
    atlas.save(source / 'atlas.png')
    (source / 'atlas.json').write_text(json.dumps({'cell':cell,'columns':9,'directions':DIRECTIONS,'frames':records},indent=2)+'\n')
    print(f'{kind}: {len(records)} original frames, {atlas.width}x{atlas.height}, all pixels verified')

(ROOT/'src/data/animal-head-anchors.json').write_text(json.dumps(anchors,separators=(',',':'))+'\n')
