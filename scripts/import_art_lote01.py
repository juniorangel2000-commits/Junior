"""Importa o lote 01 de artes da fazenda (ChatGPT, enviado pelo Junior em 16/11/2026).

Uso: python3 -I scripts/import_art_lote01.py <pasta do zip extraído>

- Guarda os originais em docs/arte-recebida/lote01-fazenda/.
- Copia cada arte para o caminho do jogo, na resolução original (o jogo só reduz na tela).
- Nos ícones, apaga pontinhos soltos do recorte (grupos de até 12 pixels separados do
  desenho). Na colmeia não: o rastro de voo das abelhas é feito de pontinhos.
- A colmeia do lote não é usada (o Junior preferiu a antiga, com abelhas por código).
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
    # A colmeia do lote ficou só guardada: o Junior preferiu a colmeia antiga.
    'inventario/cavilhas.png': 'items/peg.png',
    'inventario/ervas.png': 'items/herb.png',
    'inventario/ervas_raras.png': 'items/rareHerb.png',
    'inventario/mapa_antigo.png': 'items/oldMap.png',
    'inventario/mochila_reforcada.png': 'items/backpack.png',
    'inventario/botas.png': 'items/boots.png',
    'inventario/parafuso_e_porcas.png': 'items/metalPart.png',
    # Peças de construção (preview.41): o Ícaro separa da sucata; o Bento vende caro.
    'inventario/pregos.png': 'items/nails.png',
    'inventario/dobradica.png': 'items/hinge.png',
    'inventario/molas.png': 'items/spring.png',
    'inventario/engrenagem.png': 'items/gear.png',
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


def clean_fringe(paths):
    """Tira a franja branca do contorno (scripts/clean_white_fringe.py)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location('fringe', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clean_white_fringe.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    for p in paths:
        mod.clean(p)


def import_only(names):
    """Importa só alguns ícones do lote já guardado em docs/arte-recebida (sem refazer os outros)."""
    for src in names:
        im = despeckle(Image.open(os.path.join(SRC, src)).convert('RGBA'))
        out = os.path.join(VIS, ICONS[src]); im.save(out, optimize=True); print(f'{src} -> {ICONS[src]} {im.size}')
    clean_fringe([os.path.join(VIS, ICONS[n]) for n in names])


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


    clean_fringe([os.path.join(VIS, d) for d in ICONS.values()])

if __name__ == '__main__':
    if len(sys.argv) > 2:
        import_only(sys.argv[2:])
    else:
        main()
