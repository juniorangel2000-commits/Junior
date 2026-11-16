"""Cavaleiro masculino a partir da personagem montada (docs/construcoes/MONTARIA.md).

Uso: python3 -I scripts/swap_rider_head.py [<de> <para>]  (padrão: farmer-female farmer-male)

Os dois personagens usam a mesma roupa; muda a cabeça. Para cada direção, apaga a cabeça da
folha montada de <de> e põe a cabeça de <para>, tirada do desenho parado do jogo, na mesma
escala (a altura da cabeça de <de> no jogo e na montaria dá a escala) e com o queixo no mesmo
lugar. Grava public/assets/animals/horse-rider/<para>.png."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RIDER = ROOT / 'public/assets/animals/horse-rider'
CHARS = ROOT / 'public/assets/visual/characters'
ORDER = ['south', 'north', 'west', 'east', 'south-west', 'south-east', 'north-west', 'north-east']
CELL = 192


def blue_rows(a):
    alpha = a[..., 3] > 128
    blue = (a[..., 2] > a[..., 0] + 20) & (a[..., 2] > 90) & alpha
    return blue, alpha


def head_box(a):
    """Topo da cabeça, linha onde começa o macacão (primeira linha com 3+ px azuis) e centro dela.
    A camisa não serve de referência: o branco dos olhos tem a mesma cor."""
    a = a.astype(int)
    blue, alpha = blue_rows(a)
    top = int(np.nonzero(alpha.any(1))[0].min())
    rows = blue.sum(1) >= 3
    # Quatro linhas seguidas: um olho azulado não conta como macacão.
    neck = int([y for y in range(top + 8, len(rows) - 4) if rows[y:y + 4].all()][0])
    xs = np.nonzero(blue[neck:neck + 3].any(0))[0]
    return top, neck, float(xs.mean())


# Altura (px da montaria) da faixa dos ombros, logo acima do macacão.
SHOULDER = 6
# A cabeça dele desce sobre a gola, para o queixo encostar na camisa sem fresta.
OVERLAP = 2
# De costas o cabelo cobre a nuca: a cabeça desce mais.
BACK_OVERLAP = {'north': 4, 'north-west': 4, 'north-east': 4}


def cloth(a):
    """Camisa clara (creme), sem confundir com pele."""
    a = a.astype(int)
    return (a[..., 3] > 0) & (a[..., 0] > 205) & (a[..., 1] > 190) & (a[..., 2] > 160) & (np.abs(a[..., 0] - a[..., 1]) < 30)


def outline_px(a):
    return (a[..., 3] > 0) & (a[..., :3].astype(int).sum(-1) < 150)


def grow(mask):
    out = mask.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            out |= np.roll(np.roll(mask, dy, 0), dx, 1)
    return out


def head_center(a, top, neck):
    xs = np.nonzero((a[top:neck, :, 3] > 128).any(0))[0]
    return (xs.min() + xs.max() + 1) / 2


def main(source='farmer-female', target='farmer-male'):
    sheet = np.array(Image.open(RIDER / f'{source}.png').convert('RGBA'))
    out = sheet.copy()
    game = lambda c, d: np.array(Image.open(CHARS / c / 'Idle/rotations' / f'{d}.png').convert('RGBA'))
    # Escala única: largura da cabeça na montaria / no jogo (mediana das 8 direções).
    def width(a, t, n):
        xs = np.nonzero((a[t:n, :, 3] > 128).any(0))[0]; return xs.max() - xs.min() + 1
    ratios = []
    for i, d in enumerate(ORDER):
        c = sheet[:, i * CELL:(i + 1) * CELL]; rt, rn, _ = head_box(c); f = game(source, d); ft, fn, _ = head_box(f)
        ratios.append(width(c, rt, rn) / width(f, ft, fn))
    scale = float(np.median(ratios))
    for i, d in enumerate(ORDER):
        cell = out[:, i * CELL:(i + 1) * CELL]
        f = game(source, d); m = game(target, d)
        ft, fn, _ = head_box(f); mt, mn, _ = head_box(m)
        top, collar, _ = head_box(cell)
        center = head_center(cell, top, collar) + (head_center(m, mt, mn) - head_center(f, ft, fn)) * scale
        old_head = cell[:collar]
        oh = old_head.astype(int)
        is_hair = (oh[..., 3] > 0) & (oh[..., 0] > oh[..., 1] + 25) & (oh[..., 1] > oh[..., 2]) & (oh[..., 0] < 200)
        hair = np.unique(oh[is_hair][:, :3], axis=0)
        # Apaga só a cabeça: a camisa e os ombros logo acima do macacão ficam (com o contorno).
        shoulders = np.zeros(cell.shape[:2], bool); shoulders[max(0, collar - SHOULDER):collar] = True
        clothes = shoulders & (cloth(cell) | blue_rows(cell.astype(int))[0])
        outline = shoulders & outline_px(cell) & grow(clothes)
        erase = np.zeros_like(shoulders); erase[:collar] = True
        cell[erase & ~clothes & ~outline] = 0
        # Mechas e coque que caem abaixo da gola: cores do cabelo antigo, menos pele e roupa.
        band = cell[collar:collar + 16].astype(int); rgb = band[..., :3]
        near_hair = np.sqrt(((rgb[..., None, :] - hair[None, None]) ** 2).sum(-1)).min(-1) < 10
        brownish = (rgb[..., 0] > rgb[..., 1] + 25) & (rgb[..., 1] > rgb[..., 2]) & (rgb[..., 0] < 200)
        hit = (band[..., 3] > 0) & near_hair & brownish
        if d in BACK_OVERLAP:
            hit |= (band[..., 3] > 0) & (np.sqrt(((rgb[..., None, :] - hair[None, None]) ** 2).sum(-1)).min(-1) < 14)
        wear = cloth(band) | blue_rows(band)[0]
        for y, x in zip(*np.nonzero(hit)):
            left = np.nonzero(wear[y, :x])[0]; right = np.nonzero(wear[y, x + 1:])[0]
            # Cabelo caído sobre a camisa (de costas): pinta com a roupa ao lado; fora dela, apaga.
            band[y, x] = band[y, left[-1]] if d in BACK_OVERLAP and len(left) and len(right) else 0
        alpha = band[..., 3] > 0; dark = alpha & (rgb.sum(-1) < 150); solid = alpha & ~dark
        near_solid = np.zeros_like(solid)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                near_solid |= np.roll(np.roll(solid, dy, 0), dx, 1)
        band[dark & ~near_solid] = 0
        cell[collar:collar + 16] = band
        # Da cabeça dele vêm cabelo, rosto, pescoço e gola; o macacão fica o dela.
        m = m.copy(); low = np.zeros(m.shape[:2], bool); low[mn - round(SHOULDER / scale):mn] = True
        m[low & blue_rows(m.astype(int))[0]] = 0
        m[low & outline_px(m) & ~grow((m[..., 3] > 0) & ~outline_px(m))] = 0
        head = Image.fromarray(m).crop((0, mt, m.shape[1], mn))
        w, h = round(head.width * scale), round(head.height * scale)
        small = np.array(head.resize((w, h), Image.LANCZOS))
        small[..., 3] = np.where(small[..., 3] > 110, 255, 0)
        x0 = round(center - head_center(m, mt, mn) * scale); y0 = collar - h + BACK_OVERLAP.get(d, OVERLAP)
        region = cell[y0:y0 + h, x0:x0 + w]
        keep = small[:region.shape[0], :region.shape[1], 3] > 0
        region[keep] = small[:region.shape[0], :region.shape[1]][keep]
        # Fresta entre a cabeça e a gola: fecha com a cor de baixo (camisa ou macacão).
        for y in range(collar + 6, max(0, collar - 6), -1):
            row = cell[y, :, 3] > 0
            xs = np.nonzero(row)[0]
            if not len(xs): continue
            for x in range(xs.min(), xs.max() + 1):
                if cell[y, x, 3] == 0 and cell[y + 1, x, 3] > 0 and (cell[max(0, y - 4):y, x, 3] > 0).any():
                    cell[y, x] = cell[y + 1, x]
    # Frestas de 1 px entre a cabeça nova e o corpo: fecha com o vizinho mais escuro.
    for _ in range(2):
        opaque = out[..., 3] > 0
        between = np.zeros_like(opaque)
        between[1:-1] |= opaque[:-2] & opaque[2:]; between[:, 1:-1] |= opaque[:, :-2] & opaque[:, 2:]
        for y, x in zip(*np.nonzero(~opaque & between)):
            around = [out[y + dy, x + dx] for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)) if out[y + dy, x + dx, 3] > 0]
            out[y, x] = min(around, key=lambda c: int(c[0]) + int(c[1]) + int(c[2]))
    Image.fromarray(out).save(RIDER / f'{target}.png', optimize=True)
    print(RIDER / f'{target}.png', 'escala', round(scale, 3))


if __name__ == '__main__':
    main(*sys.argv[1:3])
