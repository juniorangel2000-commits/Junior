"""Tira a franja branca do contorno das sprites recortadas de folhas com fundo branco.

Uso: python3 -I scripts/clean_white_fringe.py <png> [<png> ...]

Um pixel da borda (vizinho de um transparente) sai quando é esbranquiçado e a maioria dos
vizinhos opacos dele é colorida: é sobra do fundo da folha. Se a maioria dos vizinhos também
é clara, é uma área branca de verdade (asas da abelha, lã, brilho) e fica. Repete até 3
camadas, porque a franja às vezes tem 2 ou 3 pixels. O arquivo é regravado no lugar.
"""
import sys
from PIL import Image


def whitish(p, floor=196):
    r, g, b, a = p
    return a > 0 and min(r, g, b) >= floor and max(r, g, b) - min(r, g, b) <= 48


def clear_holes(im, minimum=120):
    """Apaga o fundo branco preso dentro do desenho: áreas quase brancas (sem cor) com pelo menos
    `minimum` pixels. Partes claras de verdade (pano, papel) têm cor e ficam."""
    from collections import deque
    w, h = im.size
    px = im.load()
    pure = lambda q: q[3] > 0 and min(q[:3]) >= 236 and max(q[:3]) - min(q[:3]) <= 12
    seen = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if seen[y * w + x] or not pure(px[x, y]):
                continue
            group, queue = [], deque([(x, y)])
            seen[y * w + x] = 1
            while queue:
                cx, cy = queue.popleft()
                group.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and pure(px[nx, ny]):
                        seen[ny * w + nx] = 1
                        queue.append((nx, ny))
            if len(group) >= minimum:
                for gx, gy in group:
                    px[gx, gy] = (0, 0, 0, 0)
    return im


def clean(path, passes=3, floor=196, holes=False, hole_minimum=120):
    im = Image.open(path).convert('RGBA')
    if holes:
        clear_holes(im, hole_minimum)
    w, h = im.size
    removed = 0
    for _ in range(passes):
        px = im.load()
        kill = []
        for y in range(h):
            for x in range(w):
                p = px[x, y]
                if not whitish(p, floor):
                    continue
                border = False
                opaque = light = 0
                for dy in (-2, -1, 0, 1, 2):
                    for dx in (-2, -1, 0, 1, 2):
                        if dx == 0 and dy == 0:
                            continue
                        nx, ny = x + dx, y + dy
                        if not (0 <= nx < w and 0 <= ny < h):
                            if abs(dx) <= 1 and abs(dy) <= 1:
                                border = True
                            continue
                        q = px[nx, ny]
                        if q[3] == 0:
                            if abs(dx) <= 1 and abs(dy) <= 1:
                                border = True
                            continue
                        opaque += 1
                        light += whitish(q, floor)
                if border and opaque and light / opaque < 0.5:
                    kill.append((x, y))
        if not kill:
            break
        for x, y in kill:
            px[x, y] = (0, 0, 0, 0)
        removed += len(kill)
    im.save(path, optimize=True)
    return removed


if __name__ == '__main__':
    for f in sys.argv[1:]:
        print(f'{f}: {clean(f)} pixels de franja removidos')
