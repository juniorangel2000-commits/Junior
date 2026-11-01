"""Analyze supplied running poses for rope anchors. Original PNGs are never changed."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
DIRECTIONS=['south','west','east','north','south-west','south-east','north-west','north-east']
AXES={'south':(1,0),'north':(-1,0),'west':(0,1),'east':(0,-1),'south-west':(1,1),'south-east':(1,-1),'north-west':(-1,1),'north-east':(-1,-1)}
walking=json.loads((ROOT/'src/data/character-left-hand.json').read_text())
def components(image):
    points=set()
    for y in range(140,190):
        for x in range(55,200):
            r,g,b,a=image.getpixel((x,y))
            if a and r>145 and g>80 and b>80 and r>g*1.18 and r-b>r*.4:points.add((x,y))
    result=[]
    while points:
        component=[points.pop()]
        for x,y in component:
            for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
                p=(x+dx,y+dy)
                if p in points:points.remove(p);component.append(p)
        if len(component)>=40:result.append(component)
    return result

def grip(component):
    bottom=max(y for x,y in component);palm=[(x,y) for x,y in component if y>=bottom-8]
    return [round(sum(x for x,y in palm)/len(palm)),round(sum(y for x,y in palm)/len(palm))-1]
anchors={}
for kind,walk_count in [('farmer-female',6),('farmer-male',8)]:
    root=ROOT/'public/assets/visual/characters'/kind/'Idle';anchors[kind]=[];fallbacks=0
    for row,direction in enumerate(DIRECTIONS):
        anchors[kind].append(walking[kind][row*(walk_count+1)])
        for phase in range(8):
            image=Image.open(root/'animations/Running'/direction/f'frame_{phase:03d}.png').convert('RGBA');parts=components(image)
            if not parts:
                anchors[kind].append(walking[kind][row*(walk_count+1)+1+phase*walk_count//8]);fallbacks+=1;continue
            ax,ay=AXES[direction];x,y=grip(max(parts,key=lambda c:grip(c)[0]*ax+grip(c)[1]*ay))
            if direction=='east':
                near=max(parts,key=len);nx,ny=grip(near);projection=(256-nx,ny-10)
                other=[c for c in parts if c is not near and abs(grip(c)[0]-nx)+abs(grip(c)[1]-ny)>8]
                far=min(other,key=lambda c:(grip(c)[0]-projection[0])**2+(grip(c)[1]-projection[1])**2) if other else None
                x,y=grip(far) if far and (grip(far)[0]-projection[0])**2+(grip(far)[1]-projection[1])**2<22**2 else projection
            elif direction in ['south-east','north-east'] and len(parts)==1:x,y=256-x,y-10
            anchors[kind].append([x,y])
    print(kind,len(anchors[kind]),'anchors;',fallbacks,'fallbacks')
(ROOT/'src/data/character-run-left-hand.json').write_text(json.dumps(anchors,separators=(',',':'))+'\n')
