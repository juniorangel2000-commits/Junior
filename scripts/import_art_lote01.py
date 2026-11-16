"""Importa o lote 01 de artes da fazenda (ChatGPT, enviado pelo Junior em 16/11/2026).

Uso: python3 -I scripts/import_art_lote01.py <pasta do zip extraído>

- Guarda os originais em docs/arte-recebida/lote01-fazenda/.
- Copia cada arte para o caminho do jogo, na resolução original (o jogo só reduz na tela).
- Nos ícones, apaga pontinhos soltos do recorte (grupos de até 12 pixels separados do
  desenho). Na colmeia não: o rastro de voo das abelhas é feito de pontinhos.
- A colmeia vira uma folha de 3 quadros alinhados (parada, abelhas à esquerda, à direita),
  e o atlas das máquinas recebe o tamanho novo do quadro.
"""
import json, os, re, shutil, sys
from collections import deque
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = sys.argv[1]
VIS = os.path.join(ROOT, 'public/assets/visual')

ICONS = {  # arquivo do lote -> destino no jogo
    'provisorios/esterco.png': 'kitchen/manure.png',
    'provisorios/adubo.png': 'kitchen/fertilizer.png',
    'produtos/mel_margarida.png': 'kitchen/daisy-honey.png',
    'produtos/mel_girassol.png': 'kitchen/sunflower-honey.png',
    'produtos/tecido_la.png': 'machines/woolCloth.png',
    'colmeia/colmeia_vazia.png': 'kitchen/empty-hive.png',
    'colmeia/colmeia_parada.png': 'machines/beehive-icon.png',
    'inventario/cavilhas.png': 'items/peg.png',
    'inventario/ervas.png': 'items/herb.png',
    'inventario/ervas_raras.png': 'items/rareHerb.png',
    'inventario/mapa_antigo.png': 'items/oldMap.png',
    'inventario/mochila_reforcada.png': 'items/backpack.png',
    'inventario/botas.png': 'items/boots.png',
    'inventario/parafuso_e_porcas.png': 'items/metalPart.png',
    'terreno/lamacal_chiqueiro.png': 'farm/interior/mud.png',
}
NO_DESPECKLE = {'colmeia/colmeia_parada.png', 'colmeia/colmeia_vazia.png', 'terreno/lamacal_chiqueiro.png'}


def despeckle(im, limit=12):
    """Apaga grupos de pixels visíveis com até `limit` pixels (8 vizinhos)."""
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if seen[y * w + x] or px[x, y][3] == 0:
                continue
            group, queue = [], deque([(x, y)])
            seen[y * w + x] = 1
            while queue:
                cx, cy = queue.popleft()
                group.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny][3] > 0:
                            seen[ny * w + nx] = 1
                            queue.append((nx, ny))
            if len(group) <= limit:
                for gx, gy in group:
                    px[gx, gy] = (0, 0, 0, 0)
    return im.crop(im.getbbox())


def main():
    keep = os.path.join(ROOT, 'docs/arte-recebida/lote01-fazenda')
    if os.path.exists(keep):
        shutil.rmtree(keep)
    shutil.copytree(SRC, keep)
    for src, dst in ICONS.items():
        im = Image.open(os.path.join(SRC, src)).convert('RGBA')
        if src not in NO_DESPECKLE:
            im = despeckle(im)
        out = os.path.join(VIS, dst)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im.save(out, optimize=True)
        print(f'{src} -> {dst} {im.size}')
    frames = [Image.open(os.path.join(SRC, f'animacoes/colmeia_{n}.png')).convert('RGBA')
              for n in ('parada', 'abelhas_esquerda', 'abelhas_direita')]
    fw, fh = frames[0].size
    sheet = Image.new('RGBA', (fw * 3, fh), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f, (i * fw, 0))
    sheet.save(os.path.join(VIS, 'machines/beehive.png'), optimize=True)
    # Só a linha da colmeia muda: o resto do art.json mantém o formato de quem o gerou.
    art_path = os.path.join(VIS, 'machines/art.json')
    text = open(art_path, encoding='utf-8').read()
    text = re.sub(r'"beehive":\{"width":\d+,"height":\d+,"cuts":\[\]\}', f'"beehive":{{"width":{fw},"height":{fh},"cuts":[]}}', text)
    json.loads(text)
    open(art_path, 'w', encoding='utf-8').write(text)
    print(f'colmeia: 3 quadros de {fw}x{fh}')


if __name__ == '__main__':
    main()
