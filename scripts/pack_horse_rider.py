"""Cavaleiro sobre o cavalo animado (docs/construcoes/MONTARIA.md).

Uso: python3 -I scripts/pack_horse_rider.py <pasta exportada> <personagem>

A pasta exportada tem Idle/rotations/<direção>.png (128×128): o personagem montado no
cavalo, parado, nas 8 direções. O script separa só o personagem (o cavalo do jogo continua
animado por baixo) e grava:
- public/assets/animals/horse-rider/<personagem>.png: 8 células de 192×192, no mesmo
  sistema de coordenadas das células do atlas do cavalo, na ordem de ORDER;
- src/data/horse-rider-lift.json: para cada quadro do atlas do cavalo, quantos px o lombo
  subiu (positivo) ou desceu em relação ao cavalo parado da mesma direção. O cavaleiro
  acompanha esse movimento no passo e na corrida.

Como separar: o que tem cor que não existe no cavalo (jeans, camisa, pele) é personagem com
certeza; o que fica fora do contorno do cavalo também. As botas e o cabelo, de cor parecida com
a do cavalo, entram por estarem grudados nessas partes."""
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ORDER = ['south', 'north', 'west', 'east', 'south-west', 'south-east', 'north-west', 'north-east']
ROOT = Path(__file__).resolve().parent.parent
HORSE_DIR = ROOT / 'public/assets/animals/horse'
CELL, OFFSET = 192, 32
# A cabeça do nosso cavalo de frente é mais alta que a do desenho montado (orelhas 6 px acima):
# o personagem sobe junto para as mãos e o peito ficarem acima da cabeça, como no desenho.
RAISE = {'south': 6}
# Faixa (linhas y0:y1, colunas x0:x1 do desenho 128×128) copiada inteira em cada vista de frente.
CHEST = {'south': (30, 47, 44, 85)}


def dil(a, it=1):
    for _ in range(it):
        b = a.copy()
        b[1:] |= a[:-1]; b[:-1] |= a[1:]; b[:, 1:] |= a[:, :-1]; b[:, :-1] |= a[:, 1:]
        a = b
    return a


def ero(a, it=1):
    return ~dil(~a, it)


def label(a):
    lab = np.zeros(a.shape, int); k = 0; h, w = a.shape
    for y in range(h):
        for x in range(w):
            if a[y, x] and not lab[y, x]:
                k += 1; q = deque([(y, x)]); lab[y, x] = k
                while q:
                    cy, cx = q.popleft()
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and a[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = k; q.append((ny, nx))
    return lab, k


def fill_holes(a):
    bg = ~a; lab, _ = label(bg)
    border = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1]); border.discard(0)
    return a | (bg & ~np.isin(lab, list(border)))


def shifted(mask, lift):
    out = np.zeros_like(mask)
    if lift >= 0: out[lift:] = mask[:mask.shape[0] - lift]
    else: out[:lift] = mask[-lift:]
    return out


def color_distance(pixels, palette):
    return np.sqrt(((pixels[..., None, :3] - palette[None, None]) ** 2).sum(-1)).min(-1)


def best_shift(mounted, horse):
    """Deslocamento que mais encaixa o cavalo do jogo no cavalo do desenho montado."""
    best = (-1, 0, 0)
    for dy in range(-10, 11):
        for dx in range(-4, 5):
            hs = np.roll(np.roll(horse, dy, 0), dx, 1)
            same = ((np.abs(mounted[..., :3] - hs[..., :3]).sum(-1) < 20) & (mounted[..., 3] > 128) & (hs[..., 3] > 128)).sum()
            if same > best[0]: best = (same, dy, dx)
    return best[1], best[2]


def rider_mask(mounted, horse, lift, back_view=False):
    m_alpha = mounted[..., 3] > 128; h_alpha = horse[..., 3] > 128
    dy, dx = best_shift(mounted, horse); aligned = np.roll(np.roll(horse, dy, 0), dx, 1)
    # Pontos que não batem com o cavalo do jogo (mesmo lugar, cor diferente ou cavalo vazio).
    differs = m_alpha & ((aligned[..., 3] <= 128) | (np.abs(mounted[..., :3] - aligned[..., :3]).sum(-1) >= 36))
    palette = np.unique(horse[h_alpha][:, :3], axis=0)
    dist = color_distance(mounted, palette)
    core = (dil(ero(m_alpha & (dist > 18))) & m_alpha & (dist > 18)) | (m_alpha & (dist > 40))
    outside = m_alpha & ~dil(shifted(h_alpha, lift), 2)
    candidates = ero(dil(core | outside, 2), 2) & m_alpha
    lab, k = label(candidates); keep = np.zeros_like(core)
    for j in range(1, k + 1):
        comp = lab == j
        if (comp & core).sum() >= 6 or (comp & outside).sum() >= 30: keep |= comp
    # Botas e cabelo sobre o cavalo: cor mais perto da do personagem que da do cavalo, grudados nele.
    rider_palette = np.unique(mounted[keep & (dist > 18)][:, :3], axis=0)
    for _ in range(6):
        near = dil(keep) & m_alpha & ~keep
        closer = color_distance(mounted, rider_palette) + 6 < dist
        add = near & closer & (np.arange(128)[:, None] > np.argwhere(keep)[:, 0].mean())
        if not add.any(): break
        keep |= add
    keep |= differs & dil(keep, 4)
    keep = ero(dil(keep, 1), 1) & m_alpha
    keep = fill_holes(keep) & m_alpha
    keep |= m_alpha & (mounted[..., :3].sum(-1) < 150) & dil(keep)
    # De costas, a cabeça do cavalo fica atrás da nuca: liga o cabelo aos ombros por coluna.
    for x in range(keep.shape[1] if back_view else 0):
        ys = np.nonzero(keep[:, x])[0]
        if len(ys) > 1:
            gaps = np.nonzero(np.diff(ys) > 1)[0]
            for g in gaps:
                if ys[g + 1] - ys[g] <= 14: keep[ys[g]:ys[g + 1], x] |= m_alpha[ys[g]:ys[g + 1], x]
    # Só o corpo do personagem: descarta pedaços soltos (sobras de rédea e de crina).
    lab, k = label(keep)
    if k > 1:
        sizes = [(lab == j).sum() for j in range(1, k + 1)]
        keep = lab == (int(np.argmax(sizes)) + 1)
    return keep


OUTLINE = (42, 17, 23, 255)


def neighbours(mask):
    n = np.zeros(mask.shape, int)
    n[1:] += mask[:-1]; n[:-1] += mask[1:]; n[:, 1:] += mask[:, :-1]; n[:, :-1] += mask[:, 1:]
    return n


def polish(image, mask, horse_palette):
    """Acabamento: tira restos do cavalo nas bordas, pontas soltas de rédea e refaz o contorno."""
    rgb = image[..., :3].astype(int)
    ys = np.nonzero(mask)[0]; top, bottom = ys.min(), ys.max()
    rows = np.arange(mask.shape[0])[:, None]
    hair = rows < top + (bottom - top) * .3
    # Do pescoço até acima das botas não há cabelo nem couro: o marrom que sobra é orelha,
    # pescoço ou rédea do cavalo. Crina (cinza neutro) também sai, em qualquer altura.
    blue = (rgb[..., 2] > rgb[..., 0] + 20) & (rgb[..., 2] > 90) & mask
    neck = np.nonzero(blue.any(1))[0].min() if blue.any() else top
    body = (rows >= neck) & (rows < bottom - 13)
    skin = (rgb[..., 0] > 180) & (rgb[..., 1] > rgb[..., 0] * .62)
    horse_like = (color_distance(rgb, horse_palette) < 16) & (rgb.sum(-1) > 150) & ~skin
    grey = (np.abs(rgb[..., 0] - rgb[..., 1]) < 10) & (np.abs(rgb[..., 1] - rgb[..., 2]) < 12) & (rgb[..., 0] > 25) & (rgb[..., 0] < 110)
    mask = mask & ~(body & horse_like) & ~grey
    # Pelo do cavalo (laranja claro) grudado na borda: o cabelo, mais escuro, fica.
    coat = (color_distance(rgb, horse_palette) < 14) & (rgb[..., 0] > 125) & ~hair
    for _ in range(4):
        edge = mask & (neighbours(mask) < 4)
        cut = edge & coat
        if not cut.any(): break
        mask = mask & ~cut
    # Pontas finas (rédeas, crina): pixels com um só vizinho, de fora para dentro.
    for _ in range(8):
        tip = mask & (neighbours(mask) <= 1)
        if not tip.any(): break
        mask = mask & ~tip
    # De frente, a crina entre as pernas separa braço e perna do corpo: ficam as partes grandes.
    lab, k = label(mask)
    for j in range(1, k + 1):
        if (lab == j).sum() < 8: mask = mask & (lab != j)
    mask = fill_holes(mask)
    out = image.copy(); out[~mask] = 0
    # Contorno escuro de 1 px onde a borda ficou sem ele (o personagem se destaca do cavalo).
    dark = rgb.sum(-1) < 150
    ring = ~mask & (neighbours(mask & ~dark) > 0)
    out[ring] = OUTLINE
    return out


def back_line(alpha, cols):
    tops = [np.argmax(alpha[:, c]) for c in cols if alpha[:, c].any()]
    return float(np.mean(tops)) if tops else 0.0


def main(src, character):
    atlas = json.loads((HORSE_DIR / 'atlas.json').read_text())
    sheet = Image.new('RGBA', (CELL * len(ORDER), CELL), (0, 0, 0, 0))
    seat = {}
    for i, d in enumerate(ORDER):
        mounted_img = Image.open(Path(src) / 'Idle/rotations' / f'{d}.png').convert('RGBA')
        horse_img = Image.open(HORSE_DIR / 'Idle/rotations' / f'{d}.png').convert('RGBA')
        lift = mounted_img.getbbox()[3] - horse_img.getbbox()[3]
        mounted = np.array(mounted_img).astype(int); horse = np.array(horse_img).astype(int)
        mask = rider_mask(mounted, horse, lift, d == 'north')
        rider = polish(np.array(mounted_img), mask, np.unique(horse[horse[..., 3] > 128][:, :3], axis=0))
        if d in CHEST:
            # De frente, as mãos seguram as rédeas por cima da cabeça do cavalo: a faixa do peito
            # e das mãos vem inteira do desenho (com o topete, que cai sobre o do nosso cavalo).
            y0, y1, x0, x1 = CHEST[d]; band = np.array(mounted_img)[y0:y1, x0:x1]
            keep = band[..., 3] > 128; rider[y0:y1, x0:x1][keep] = band[keep]
        mask = rider[..., 3] > 0
        sheet.alpha_composite(Image.fromarray(rider), (i * CELL + OFFSET, OFFSET - lift - RAISE.get(d, 0)))
        # Colunas do quadril: a parte de baixo do personagem.
        ys, xs = np.nonzero(mask); low = xs[ys > ys.min() + (ys.max() - ys.min()) * .5]
        seat[d] = [int(c) + OFFSET for c in range(low.min(), low.max() + 1)]
    out = ROOT / 'public/assets/animals/horse-rider' / f'{character}.png'
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, optimize=True)

    def cell_alpha(frame):
        img = Image.open(HORSE_DIR / frame['file']).convert('RGBA')
        canvas = np.zeros((CELL, CELL), bool)
        a = np.array(img)[..., 3] > 128
        canvas[frame['y']:frame['y'] + a.shape[0], frame['x']:frame['x'] + a.shape[1]] = a
        return canvas

    frames = atlas['frames']
    idle = {f['direction']: back_line(cell_alpha(f), seat[f['direction']]) for f in frames if f['action'] == 'Idle'}
    lifts = [round(idle[f['direction']] - back_line(cell_alpha(f), seat[f['direction']])) for f in frames]
    (ROOT / 'src/data/horse-rider-lift.json').write_text(json.dumps(lifts) + '\n')
    print(out, sheet.size, 'quadros:', len(lifts), 'faixa:', min(lifts), max(lifts))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
