"""Espadas dos 4 níveis (arte do Junior, preview.41).

Uso: python3 -I scripts/import_swords.py
- Recorta cada espada de docs/arte-recebida/espadas/sprites_png_transparente/ e grava em
  public/assets/visual/items/swords/<nível>.png (improvisada, ferro, ouro, metal-negro).
- Coloca a improvisada no quadro "sword" do atlas de armas (weapons-remake.png), que o jogo
  usa no ícone do inventário, na espada do golpe e nas masmorras. O quadro mantém o tamanho
  (333 × 99); a espada é reduzida mantendo a proporção e centralizada nele."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/arte-recebida/espadas/sprites_png_transparente'
OUT = ROOT / 'public/assets/visual/items/swords'
ATLAS = ROOT / 'public/assets/visual/dungeons/weapons-remake.png'
FRAMES = ROOT / 'public/assets/visual/dungeons/weapons-remake.json'
TIERS = {'improvisada': '01_espada_improvisada.png', 'ferro': '02_espada_ferro.png', 'ouro': '03_espada_ouro.png', 'metal-negro': '04_espada_metal_negro.png'}

OUT.mkdir(parents=True, exist_ok=True)
cut = {}
for tier, name in TIERS.items():
    im = Image.open(SRC / name).convert('RGBA')
    im = im.crop(im.getbbox())
    im.save(OUT / f'{tier}.png', optimize=True)
    cut[tier] = im
    print(tier, im.size)

frame = json.loads(FRAMES.read_text())['frames']['sword']
atlas = Image.open(ATLAS).convert('RGBA')
box = (frame['x'], frame['y'], frame['x'] + frame['width'], frame['y'] + frame['height'])
atlas.paste((0, 0, 0, 0), box)
sword = cut['improvisada'].copy()
sword.thumbnail((frame['width'], frame['height']), Image.LANCZOS)
ox = frame['x'] + (frame['width'] - sword.width) // 2
oy = frame['y'] + (frame['height'] - sword.height) // 2
atlas.alpha_composite(sword, (ox, oy))
atlas.save(ATLAS, optimize=True)
import hashlib, re
text = FRAMES.read_text()
FRAMES.write_text(re.sub(r'"sha256": "[0-9a-f]+"', '"sha256": "' + hashlib.sha256(ATLAS.read_bytes()).hexdigest() + '"', text, count=1))
print('atlas: espada improvisada em', box, sword.size)
