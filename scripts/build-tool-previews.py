"""Assemble lossless animated PNG reviews from real Phaser captures (qa-tools.cjs)."""
from pathlib import Path
import base64, io, json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / 'docs' / 'ferramentas'
FONT = ImageFont.truetype('DejaVuSans.ttf', 16)
TITLE = ImageFont.truetype('DejaVuSans.ttf', 20)
posters=[]
for folder,title in [('fazendeira','Fazendeira'),('fazendeiro','Fazendeiro')]:
    clips=json.loads((ROOT/f'{folder}-quadros.json').read_text())
    def sheet(index):
        result=Image.new('RGB',(1280,380),'#f4e6c5');draw=ImageDraw.Draw(result)
        draw.text((640,10),title,font=TITLE,anchor='mt',fill='#3d5030')
        for column,clip in enumerate(clips):
            label=('Picareta' if clip['tool']=='pickaxe' else 'Machado')+' · '+('direita' if clip['direction']=='right' else 'esquerda')
            draw.text((column*320+160,37),label,font=FONT,anchor='mt',fill='#3d5030')
            frame=Image.open(io.BytesIO(base64.b64decode(clip['frames'][index].split(',')[1]))).convert('RGB')
            assert frame.size==(320,320)
            result.paste(frame,(column*320,60))
        return result
    frames=[sheet(0)]+[sheet(i) for i in range(1,10)]+[sheet(0)]
    durations=[450]+[round((i+1)*1000/18)-round(i*1000/18) for i in range(9)]+[350]
    frames[0].save(ROOT/f'{folder}-ferramentas.png',save_all=True,append_images=frames[1:],duration=durations,loop=0)
    sheet(5).save(ROOT/f'{folder}-contato.png')
    posters.append(sheet(5))
    print(folder, '11 frames, APNG, 1280×380, original rendered pixels')
poster=Image.new('RGB',(1280,760))
for row,im in enumerate(posters):poster.paste(im,(0,row*380))
poster.save(ROOT/'personagens-com-ferramentas.png')
