"""Locate the anatomical left hand in the supplied character poses; PNGs stay untouched."""
from pathlib import Path
from PIL import Image, ImageDraw
import json

ROOT=Path(__file__).resolve().parents[1]
DIRECTIONS=['south','west','east','north','south-west','south-east','north-west','north-east']

def skin_components(image):
    points=set()
    for y in range(140,190):
        for x in range(55,200):
            r,g,b,a=image.getpixel((x,y))
            if a and r>145 and g>80 and b>80 and r>g*1.18 and r-b>r*.4:points.add((x,y))
    components=[]
    while points:
        first=points.pop();component=[first]
        for x,y in component:
            for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
                point=(x+dx,y+dy)
                if point in points:points.remove(point);component.append(point)
        if len(component)>=40:components.append(component)
    return components

def grip(component):
    bottom=max(y for x,y in component)
    palm=[(x,y) for x,y in component if y>=bottom-8]
    return (round(sum(x for x,y in palm)/len(palm)),round(sum(y for x,y in palm)/len(palm))-1)

anchors={}
for kind,animation,count in [('farmer-female','Walk',6),('farmer-male','Walking',8)]:
    root=ROOT/'public/assets/visual/characters'/kind/'Idle';anchors[kind]=[]
    review=Image.new('RGB',(8*150,2*270),(65,86,60));draw=ImageDraw.Draw(review)
    for row,direction in enumerate(DIRECTIONS):
        files=[root/'rotations'/f'{direction}.png']+[root/'animations'/animation/direction/f'frame_{phase:03d}.png' for phase in range(count)]
        for phase,path in enumerate(files):
            image=Image.open(path).convert('RGBA');components=skin_components(image)
            # Project onto the left/right axis perpendicular to the facing direction.
            # Swinging a hand forward must not make it switch anatomical sides.
            left_axis={'south':(1,0),'north':(-1,0),'west':(0,1),'east':(0,-1),
                       'south-west':(1,1),'south-east':(1,-1),'north-west':(-1,1),'north-east':(-1,-1)}[direction]
            ax,ay=left_axis
            component=max(components,key=lambda c:grip(c)[0]*ax+grip(c)[1]*ay)
            x,y=grip(component)
            if direction=='east':
                near=max(components,key=len);nx,ny=grip(near);projection=(256-nx,ny-10)
                other=[c for c in components if c is not near and abs(grip(c)[0]-nx)+abs(grip(c)[1]-ny)>8]
                far=min(other,key=lambda c:(grip(c)[0]-projection[0])**2+(grip(c)[1]-projection[1])**2) if other else None
                x,y=grip(far) if far and (grip(far)[0]-projection[0])**2+(grip(far)[1]-projection[1])**2<22**2 else projection
            elif direction in ['south-east','north-east'] and len(components)==1:
                # Left arm is the far arm here; a single visible grip is the right hand.
                # Project its counter-swing from the visible right arm; never switch hands.
                x,y=256-x,y-10
            anchors[kind].append([x,y])
            if phase in [0,3]:
                rr=0 if phase==0 else 1;ox=row*150-53;oy=rr*270+15
                review.paste(image,(ox,oy),image);draw.ellipse((ox+x-3,oy+y-3,ox+x+3,oy+y+3),fill='red')
                draw.text((row*150+4,rr*270+2),direction,fill='white')
    review.save(Path('/tmp')/f'{kind}-left-hand-review.png')
    print(kind,len(anchors[kind]),'left-hand poses')
(ROOT/'src/data/character-left-hand.json').write_text(json.dumps(anchors,separators=(',',':'))+'\n')
