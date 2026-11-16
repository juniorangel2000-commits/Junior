"""Compacta os atlas dos animais sem mudar nenhum pixel (docs/planejamento/DESEMPENHO.md).

Cada quadro do atlas original ocupa uma célula fixa (64, 192 ou 224 px) com muito espaço
vazio. Aqui cada quadro é recortado no que tem desenho e os recortes são empacotados num PNG
menor. O JSON (formato "hash" do Phaser) guarda, para cada quadro, onde ficou o recorte e
onde ele estava dentro da célula, então o Phaser desenha exatamente igual ao original.

Uso: python3 -I scripts/pack_animal_atlases.py
Lê public/assets/animals/<tipo>/atlas.png e grava atlas-packed.png e atlas-packed.json.
"""
import json, os, re, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ART = open(os.path.join(ROOT, 'src/data/animal-art.ts'), encoding='utf-8').read()
MAX_WIDTH = 2048
PAD = 1  # 1 px transparente entre recortes: sem vazamento de cor vizinha na filtragem


def cell_of(kind):
    m = re.search(r'\b' + kind + r'\s*:\s*\{cell\s*:\s*(\d+)', ART)
    if not m:
        raise SystemExit(f'célula de {kind} não encontrada em animal-art.ts')
    return int(m.group(1))


def pack(kind):
    base = os.path.join(ROOT, 'public/assets/animals', kind)
    src = Image.open(os.path.join(base, 'atlas.png')).convert('RGBA')
    cell = cell_of(kind)
    cols, rows = src.width // cell, src.height // cell
    pieces = []
    for i in range(cols * rows):
        x, y = (i % cols) * cell, (i // cols) * cell
        tile = src.crop((x, y, x + cell, y + cell))
        bb = tile.getbbox() or (0, 0, 1, 1)
        pieces.append((i, bb, tile.crop(bb)))
    # Prateleiras: maiores alturas primeiro.
    order = sorted(pieces, key=lambda p: -p[2].height)
    placed, x, y, shelf = {}, 0, 0, 0
    for i, bb, img in order:
        if x + img.width > MAX_WIDTH:
            x, y, shelf = 0, y + shelf + PAD, 0
        placed[i] = (x, y)
        x += img.width + PAD
        shelf = max(shelf, img.height)
    height = y + shelf
    out = Image.new('RGBA', (MAX_WIDTH, height), (0, 0, 0, 0))
    frames = {}
    for i, bb, img in pieces:
        px, py = placed[i]
        out.paste(img, (px, py))
        frames[str(i)] = {
            'frame': {'x': px, 'y': py, 'w': img.width, 'h': img.height},
            'rotated': False, 'trimmed': True,
            'spriteSourceSize': {'x': bb[0], 'y': bb[1], 'w': img.width, 'h': img.height},
            'sourceSize': {'w': cell, 'h': cell},
        }
    # Largura final: só o necessário.
    used = max(f['frame']['x'] + f['frame']['w'] for f in frames.values())
    out = out.crop((0, 0, used, height))
    out.save(os.path.join(base, 'atlas-packed.png'), optimize=True)
    meta = {'frames': frames, 'meta': {'image': 'atlas-packed.png', 'size': {'w': used, 'h': height}, 'scale': '1',
            'app': 'scripts/pack_animal_atlases.py', 'cell': cell}}
    with open(os.path.join(base, 'atlas-packed.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, separators=(',', ':'))
    # Conferência: cada quadro remontado na célula é idêntico ao original.
    for i, bb, img in pieces:
        x, y = (i % cols) * cell, (i // cols) * cell
        cell_img = Image.new('RGBA', (cell, cell), (0, 0, 0, 0))
        px, py = placed[i]
        cell_img.paste(out.crop((px, py, px + img.width, py + img.height)), (bb[0], bb[1]))
        if list(cell_img.getdata()) != list(src.crop((x, y, x + cell, y + cell)).getdata()):
            raise SystemExit(f'{kind}: quadro {i} diferente do original')
    return src.width * src.height * 4, used * height * 4


if __name__ == '__main__':
    kinds = sys.argv[1:] or sorted(k for k in os.listdir(os.path.join(ROOT, 'public/assets/animals'))
                                   if os.path.exists(os.path.join(ROOT, 'public/assets/animals', k, 'atlas.png')))
    total = [0, 0]
    for k in kinds:
        a, b = pack(k)
        total[0] += a; total[1] += b
        print(f'{k:8} {a / 1048576:6.1f} MB -> {b / 1048576:5.1f} MB na memória de vídeo (pixels idênticos)')
    print(f'TOTAL {total[0] / 1048576:.0f} MB -> {total[1] / 1048576:.0f} MB')
