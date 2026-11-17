"""Prepara as artes e os dados do teste da Propriedade na Godot (experimento, branch experimento/godot).

Uso, na raiz do repositório:
    python3 -I godot-teste/ferramentas/preparar_artes.py <pasta exportada do jogo>

A pasta exportada vem de um script de navegador que roda o jogo atual e grava:
- propriedade.json: o material de cada bloco (96 × 72) e a posição de cada objeto;
- objetos/objN.png: a arte de cada objeto, como o jogo desenha.

Gera em godot-teste/:
- arte/terreno/<material>.png: os 9 materiais do jogo (96 × 96, cada um cobre 3 × 3 blocos);
- arte/terreno/pintura.png: 9 amostras de 32 × 32, o "pincel" de cada material no editor;
- arte/objetos/<nome>.png e arte/personagem/...;
- dados/propriedade.json: terreno e objetos, lidos pelo montador da cena.
"""
import json, os, re, shutil, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'godot-teste')
SRC = sys.argv[1]
MATERIALS = ['grass', 'forest', 'meadow', 'path-dry', 'path-wet', 'soil', 'sand', 'moss', 'water']


def terrain():
    atlas = Image.open(os.path.join(ROOT, 'public/assets/visual/terrain/ground-materials.png')).convert('RGBA')
    cell = atlas.width // 3
    os.makedirs(os.path.join(OUT, 'arte/terreno'), exist_ok=True)
    swatches = Image.new('RGBA', (32 * len(MATERIALS), 32))
    for i, name in enumerate(MATERIALS):
        x, y = (i % 3) * cell, (i // 3) * cell
        # Como o jogo: o miolo da célula, sem a faixa da divisória.
        crop = atlas.crop((x + 9, y + 9, x + cell - 9, y + cell - 9))
        tile = crop.resize((96, 96), Image.LANCZOS)
        tile.save(os.path.join(OUT, f'arte/terreno/{name}.png'))
        swatches.paste(crop.resize((32, 32), Image.LANCZOS), (i * 32, 0))
    swatches.save(os.path.join(OUT, 'arte/terreno/pintura.png'))


def slug(texture):
    key, frame = texture.split('|')
    name = re.sub(r'[^a-z0-9]+', '-', key.lower()).strip('-')
    if frame != '__BASE':
        name += '-' + re.sub(r'[^a-z0-9]+', '-', frame.lower()).strip('-')
    return name


def objects():
    data = json.load(open(os.path.join(SRC, 'propriedade.json')))
    os.makedirs(os.path.join(OUT, 'arte/objetos'), exist_ok=True)
    renamed = {}
    for o in data['objs']:
        if o['file'] not in renamed:
            renamed[o['file']] = slug(o['tex']) + '.png'
            shutil.copy(os.path.join(SRC, 'objetos', o['file']), os.path.join(OUT, 'arte/objetos', renamed[o['file']]))
        o['arte'] = renamed[o['file']]
        for k in ('file', 'tex'):
            o.pop(k, None)
    # Pássaros animados ficam de fora do teste.
    data['objs'] = [o for o in data['objs'] if not o['arte'].startswith('ambient-wild-birds')]
    data['materiais'] = MATERIALS
    os.makedirs(os.path.join(OUT, 'dados'), exist_ok=True)
    json.dump(data, open(os.path.join(OUT, 'dados/propriedade.json'), 'w'))
    print('objetos:', len(data['objs']), 'artes:', len(renamed))


def character():
    base = os.path.join(ROOT, 'public/assets/visual/characters/farmer-female/Idle')
    dst = os.path.join(OUT, 'arte/personagem')
    if os.path.exists(dst):
        shutil.rmtree(dst)
    os.makedirs(dst)
    for d in os.listdir(os.path.join(base, 'animations/Walk')):
        shutil.copytree(os.path.join(base, 'animations/Walk', d), os.path.join(dst, 'andar', d))
    shutil.copytree(os.path.join(base, 'rotations'), os.path.join(dst, 'parada'))


if __name__ == '__main__':
    terrain()
    objects()
    character()
