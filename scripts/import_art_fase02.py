"""Importa a fase 02 de artes (fogueira acesa e abelha voando), enviada pelo Junior em 16/11/2026.

Uso: python3 -I scripts/import_art_fase02.py <pasta do zip extraído>

As folhas vêm em RGB com fundo branco e quadros lado a lado, do mesmo tamanho.
- O fundo é apagado por preenchimento a partir das bordas: só some o branco ligado à borda
  da imagem; brilhos claros dentro do desenho (fogo, asas) ficam.
- Cada quadro é recortado numa caixa comum a todos (os quadros continuam alinhados).
- Resolução original: o jogo só reduz na tela.
Originais em docs/arte-recebida/fase02-fogueira-abelhas/.
"""
import os, shutil, sys
from collections import deque
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = sys.argv[1]
SHEETS = {  # arquivo -> (quadros, destino)
    'fogueira_3_quadros.png': (3, 'public/assets/visual/kitchen/campfire-lit.png'),
    'abelha_4_quadros.png': (4, 'public/assets/visual/machines/bee-flight.png'),
}


def background(px, w, h, x, y):
    r, g, b = px[x, y][:3]
    return min(r, g, b) >= 236 and max(r, g, b) - min(r, g, b) <= 18


def clear_background(im):
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        queue.extend([(0, y), (w - 1, y)])
    while queue:
        x, y = queue.popleft()
        if seen[y * w + x] or not background(px, w, h, x, y):
            continue
        seen[y * w + x] = 1
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                queue.append((nx, ny))
    return im


def clean_fringe(paths):
    """Tira a franja branca do contorno (scripts/clean_white_fringe.py)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location('fringe', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clean_white_fringe.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    for p in paths:
        mod.clean(p)


def main():
    keep = os.path.join(ROOT, 'docs/arte-recebida/fase02-fogueira-abelhas')
    os.makedirs(keep, exist_ok=True)
    for name, (count, dst) in SHEETS.items():
        shutil.copy(os.path.join(SRC, name), os.path.join(keep, name))
        im = clear_background(Image.open(os.path.join(SRC, name)))
        fw = im.width // count
        frames = [im.crop((i * fw, 0, (i + 1) * fw, im.height)) for i in range(count)]
        boxes = [f.getbbox() for f in frames]
        box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
        cw, ch = box[2] - box[0], box[3] - box[1]
        sheet = Image.new('RGBA', (cw * count, ch), (0, 0, 0, 0))
        for i, f in enumerate(frames):
            sheet.paste(f.crop(box), (i * cw, 0))
        out = os.path.join(ROOT, dst)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        sheet.save(out, optimize=True)
        print(f'{name} -> {dst}: {count} quadros de {cw}x{ch}')

    clean_fringe([os.path.join(ROOT, dst) for _, dst in SHEETS.values()])

if __name__ == '__main__':
    main()
