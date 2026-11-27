#!/usr/bin/env python3
"""Copia para godot-teste/cenarios/<área>/ os cenários exportados por
ferramentas/extrair_cenarios/extrair.cjs (o jogo publicado rodando no navegador).

  python3 -I godot-teste/ferramentas/importar_cenarios.py <pasta-exportada> [área ...]

- O chão (blocos PNG de até 1024 px) vira WebP com perdas leves (q 90): a pintura do chão
  não tem transparência e fica ~10× menor no repositório.
- As artes dos objetos ficam em PNG (têm transparência), reduzidas para no máximo 2,5× o maior
  tamanho em que aparecem no cenário (nítidas até o zoom máximo, 3×, sem pesar o projeto).
- cenario.json é regravado apontando para os .webp.
"""
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

BASE = Path(__file__).resolve().parent.parent / "cenarios"
# Cenários cujo chão tem clareiras em "escada" (pintadas bloco a bloco na V51).
SMOOTH = {"forest"}


def smooth_clearings(img: Image.Image, seed: int = 51) -> Image.Image:
    """Troca a borda em escada entre clareira (verde claro) e chão da mata por uma curva
    orgânica, com as duas texturas continuadas por reflexo na borda e um esmaecimento curto.
    Trilhas (tons de terra) e água (azul) não mudam."""
    import numpy as np
    from scipy import ndimage as nd

    a = np.asarray(img.convert("RGB")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    soft = nd.gaussian_filter(a, sigma=(3, 3, 0))
    sr, sg, sb = soft[..., 0], soft[..., 1], soft[..., 2]
    protect = (sr > sg * 0.92) | (sb > sg * 0.95)  # terra, areia e água
    # Três tons de verde: chão da mata (escuro), clareira (claro) e trilha (oliva, entre os dois).
    feats = np.stack([sr, sg, sb], -1)[~protect][::97]
    centers = np.array([np.percentile(feats, q, axis=0) for q in (10, 50, 90)])
    for _ in range(12):
        lab = np.argmin(((feats[:, None, :] - centers[None]) ** 2).sum(-1), 1)
        centers = np.array([feats[lab == k].mean(0) if (lab == k).any() else centers[k] for k in range(3)])
    order = np.argsort(centers[:, 1] + centers[:, 0] * 0.5)
    lab_all = np.argmin(((soft[..., None, :] - centers[None, None]) ** 2).sum(-1), -1)
    rank = np.empty(3, int)
    rank[order] = np.arange(3)
    tone = rank[lab_all]
    trail_like = tone == 1
    # A "trilha" é o tom do meio só onde forma faixa contínua (não a transição de uma borda).
    trail = nd.binary_opening(trail_like, iterations=4)
    protect |= nd.binary_dilation(trail, iterations=2)
    green = ~protect
    clear = green & (tone == 2)
    # Nas trilhas, a classe vem do vizinho mais próximo (só para o desfoque não "comer" a trilha).
    idx = nd.distance_transform_edt(protect, return_distances=False, return_indices=True)
    filled = clear[idx[0], idx[1]].astype(np.float32)
    rng = np.random.default_rng(seed)
    noise = nd.gaussian_filter(rng.standard_normal(clear.shape).astype(np.float32), 22)
    noise = noise / (np.abs(noise).max() + 1e-6) * 0.16
    target = (nd.gaussian_filter(filled, 20) + noise) > 0.5
    out = a.copy()
    h, w = clear.shape
    yy, xx = np.mgrid[0:h, 0:w]
    for want in (True, False):
        src = clear if want else (green & ~clear)
        need = (target == want) & (src == False) & ~protect
        if not need.any():
            continue
        dist, (qy, qx) = nd.distance_transform_edt(~src, return_indices=True)
        ry = np.clip(2 * qy - yy, 0, h - 1)
        rx = np.clip(2 * qx - xx, 0, w - 1)
        ok = src[ry, rx]
        fy = np.where(ok, ry, qy)
        fx = np.where(ok, rx, qx)
        out[need] = a[fy[need], fx[need]]
    # Esmaecimento curto na nova borda.
    alpha = nd.gaussian_filter(target.astype(np.float32), 2.5)
    edge = (alpha > 0.04) & (alpha < 0.96) & ~protect
    blurred = nd.gaussian_filter(out, sigma=(2, 2, 0))
    out[edge] = out[edge] * 0.55 + blurred[edge] * 0.45
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def import_area(src: Path) -> None:
    data = json.loads((src / "cenario.json").read_text())
    dst = BASE / data["area"]
    if dst.exists():
        shutil.rmtree(dst)
    (dst / "arte").mkdir(parents=True)
    ground = Image.new("RGB", (data["width"], data["height"]))
    for t in data["ground"]:
        ground.paste(Image.open(src / t["file"]).convert("RGB"), (t["x"], t["y"]))
    if data["area"] in SMOOTH:
        ground = smooth_clearings(ground)
    for t in data["ground"]:
        name = Path(t["file"]).with_suffix(".webp").name
        tile = ground.crop((t["x"], t["y"], min(data["width"], t["x"] + 1024), min(data["height"], t["y"] + 1024)))
        tile.save(dst / name, "WEBP", quality=90, method=6)
        t["file"] = name
    shown = {}
    for o in data["objs"]:
        shown[o["arte"]] = max(shown.get(o["arte"], 0), abs(o["w"]), abs(o["h"]))
    used = set(shown)
    for art in used:
        im = Image.open(src / "arte" / art)
        limit = max(8, round(shown[art] * 2.5))
        if max(im.size) > limit:
            k = limit / max(im.size)
            im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        im.save(dst / "arte" / art, optimize=True)
    (dst / "cenario.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    size = sum(f.stat().st_size for f in dst.rglob("*") if f.is_file())
    print(f"{data['area']}: {len(data['objs'])} objetos, {len(used)} artes, {size / 1e6:.1f} MB")


def main() -> None:
    root = Path(sys.argv[1])
    areas = sys.argv[2:] or sorted(p.name for p in root.iterdir() if (p / "cenario.json").exists())
    for area in areas:
        import_area(root / area)


if __name__ == "__main__":
    main()
