"""Folha do aspersor em loop (pedido do Junior, preview.41).

Uso: python3 -I scripts/pack_sprinkler.py
Lê docs/arte-recebida/aspersor/irrigation-sprinkler-animated.png (16 quadros de 96×72, 4×4) e
grava public/assets/visual/equipment/irrigation-sprinkler-loop.png com os quadros 1 a 14
(7×2). Os quadros 15 e 0 repetem a posição do 14 (os braços em "Y") e faziam o giro parecer
parar; sem eles, o 14 emenda no 1 com o mesmo passo dos outros."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/arte-recebida/aspersor/irrigation-sprinkler-animated.png'
OUT = ROOT / 'public/assets/visual/equipment/irrigation-sprinkler-loop.png'
W, H, KEEP, COLS = 96, 72, list(range(1, 15)), 7

im = Image.open(SRC).convert('RGBA')
sheet = Image.new('RGBA', (W * COLS, H * ((len(KEEP) + COLS - 1) // COLS)), (0, 0, 0, 0))
for k, i in enumerate(KEEP):
    frame = im.crop(((i % 4) * W, (i // 4) * H, (i % 4) * W + W, (i // 4) * H + H))
    sheet.alpha_composite(frame, ((k % COLS) * W, (k // COLS) * H))
sheet.save(OUT, optimize=True)
print(OUT, sheet.size, len(KEEP), 'quadros')
