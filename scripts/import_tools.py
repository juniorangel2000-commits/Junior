"""Ferramentas no estilo das espadas (arte do Junior, preview.41).

Uso: python3 -I scripts/import_tools.py <pasta do zip extraído>

O zip traz cada ferramenta em 256 × 256, de pé (cabo embaixo). O jogo usa um quadro de
128 × 128 (mochila, ferraria e a ferramenta de metal na mão), com o desenho entre as linhas
8 e 120 e a mão segurando o cabo na linha 104. Cada desenho é encaixado nesse quadro e o
ponto de pegada (src/data/tool-art-anchors.json) é medido de novo: o meio do cabo na linha 104.
Foice e pá de pedra não vieram: ficam os desenhos antigos. A pá veio com a lâmina embaixo e
é virada para ficar com a cabeça em cima, como as outras.
Originais em docs/arte-recebida/ferramentas/.
"""
import json, os, shutil, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = sys.argv[1]
OUT = os.path.join(ROOT, 'public/assets/visual/economy/tools')
ANCHORS = os.path.join(ROOT, 'src/data/tool-art-anchors.json')
TOOLS = {'machadinha': 'hatchet', 'picareta': 'pickaxe', 'enxada': 'hoe', 'foice': 'sickle', 'pa': 'shovel'}
MATERIALS = {'pedra': 'stone', 'ferro': 'iron', 'ouro': 'gold', 'metal-negro': 'blackMetal'}
FRAME, TOP, BOTTOM, GRIP_Y = 128, 8, 120, 104


def grip_x(im, y):
    """Meio do cabo na linha y (as colunas opacas mais perto do centro do desenho)."""
    alpha = im.getchannel('A')
    cols = [x for x in range(im.width) if alpha.getpixel((x, y)) > 128]
    if not cols:
        return FRAME // 2
    # Agrupa colunas seguidas e fica com o grupo mais largo (o cabo).
    groups, start = [], cols[0]
    for a, b in zip(cols, cols[1:] + [None]):
        if b is None or b != a + 1:
            groups.append((start, a))
            start = b
    a, b = max(groups, key=lambda g: g[1] - g[0])
    return round((a + b) / 2)


def main():
    keep = os.path.join(ROOT, 'docs/arte-recebida/ferramentas')
    if os.path.exists(keep):
        shutil.rmtree(keep)
    shutil.copytree(SRC, keep)
    anchors = json.load(open(ANCHORS))
    for pt, tool in TOOLS.items():
        for pm, material in MATERIALS.items():
            path = os.path.join(SRC, 'ferramentas', f'{pt}-{pm}.png')
            if not os.path.exists(path):
                print(f'{material}-{tool}: sem arte nova, fica a antiga')
                continue
            im = Image.open(path).convert('RGBA')
            im = im.crop(im.getbbox())
            if tool == 'shovel':  # veio com a lâmina embaixo; no jogo a cabeça fica em cima, como nas outras
                im = im.transpose(Image.FLIP_TOP_BOTTOM)
            scale = (BOTTOM - TOP) / im.height
            im = im.resize((max(1, round(im.width * scale)), BOTTOM - TOP), Image.LANCZOS)
            frame = Image.new('RGBA', (FRAME, FRAME), (0, 0, 0, 0))
            frame.alpha_composite(im, ((FRAME - im.width) // 2, TOP))
            frame.save(os.path.join(OUT, f'{material}-{tool}.png'), optimize=True)
            anchors[f'{material}-{tool}'] = {'x': grip_x(frame, GRIP_Y), 'y': GRIP_Y}
            print(f'{material}-{tool}', im.size, anchors[f'{material}-{tool}'])
    json.dump(anchors, open(ANCHORS, 'w'), indent=2)
    open(ANCHORS, 'a').write('\n')


if __name__ == '__main__':
    main()
