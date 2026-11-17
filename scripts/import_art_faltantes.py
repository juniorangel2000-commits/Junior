"""Importa as artes que faltavam (enviadas pelo Junior em 17/11/2026, preview.41).

Uso: python3 -I scripts/import_art_faltantes.py <pasta do zip extraído>

As imagens vêm em RGB com fundo branco. O fundo é apagado pelas bordas
(import_art_fase02.clear_background) e a franja branca do contorno sai
(clean_white_fringe.py). Originais em docs/arte-recebida/faltantes/.

- Ícones: infusão de cogumelos, tônico de ervas e rede de pesca (items/<id>.png).
- Enxada de pedra: girada 45° e encaixada na mesma posição da antiga (320 × 320, cabo onde a
  mão segura), para a animação de uso continuar igual.
- Luminária: as duas metades viram equipment/lamp-off.png e lamp-on.png.
- Marina e Rui: as 4 vistas (frente, costas, direita, esquerda) viram quadros de 256 × 256
  com os pés na mesma linha dos personagens do jogo (characters/survivors/<id>-<vista>.png).
"""
import importlib.util, os, shutil, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
VIS = os.path.join(ROOT, 'public/assets/visual')
SRC = sys.argv[-1]
NAMES = {
    'caneca_de_chá_com_cogumelos.png': 'infusao-cogumelos.png',
    'poção_verde_com_laço_e_ervas.png': 'tonico-ervas.png',
    'rede_de_pesca_dobrada_com_boias_de_cortiça.png': 'rede-pesca.png',
    'enxada_de_pedra_com_amarrações.png': 'enxada-pedra.png',
    'lanternas_de_jardim_apagada_e_acesa.png': 'luminaria.png',
    'folha_de_sprites_da_marina_em_quatro_vistas.png': 'marina.png',
    'folha_de_sprites_do_rui_em_quatro_vistas.png': 'rui.png',
}
# Na folha, a terceira vista olha para a esquerda e a quarta para a direita.
VIEWS = ['south', 'north', 'west', 'east']
# Personagens do jogo: quadro 256 × 256 com os pés na linha 232 e uns 194 px de altura.
FEET, HEIGHT = 232, 194


def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def columns(im, count):
    """Separa os desenhos lado a lado pelas colunas vazias."""
    alpha = im.getchannel('A')
    w, h = im.size
    filled = [any(alpha.getpixel((x, y)) > 0 for y in range(0, h, 2)) for x in range(w)]
    runs, start = [], None
    for x, f in enumerate(filled + [False]):
        if f and start is None:
            start = x
        if not f and start is not None:
            runs.append((start, x))
            start = None
    runs = sorted(sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:count])
    return [im.crop((a, 0, b, h)).crop(im.crop((a, 0, b, h)).getbbox()) for a, b in runs]


def main():
    fase02, fringe = load('import_art_fase02'), load('clean_white_fringe')
    keep = os.path.join(ROOT, 'docs/arte-recebida/faltantes')
    os.makedirs(keep, exist_ok=True)
    art = {}
    for name, short in NAMES.items():
        shutil.copy(os.path.join(SRC, name), os.path.join(keep, short))
        im = fase02.clear_background(Image.open(os.path.join(SRC, name)))
        art[short] = im.crop(im.getbbox())
    outputs = []

    def save(im, rel):
        out = os.path.join(VIS, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im.save(out, optimize=True)
        outputs.append(out)
        print(rel, im.size)

    for short, item in [('infusao-cogumelos.png', 'fungalInfusion'), ('tonico-ervas.png', 'herbalTonic'), ('rede-pesca.png', 'net')]:
        icon = art[short].copy()
        icon.thumbnail((160, 160), Image.LANCZOS)  # como os outros ícones do jogo
        save(icon, f'items/{item}.png')

    # Enxada: de pé no desenho; no jogo fica na diagonal (cabo embaixo à esquerda).
    hoe = art['enxada-pedra.png'].rotate(-45, resample=Image.BICUBIC, expand=True)
    hoe = hoe.crop(hoe.getbbox())
    hoe.thumbnail((256, 233), Image.LANCZOS)
    canvas = Image.new('RGBA', (320, 320), (0, 0, 0, 0))
    canvas.alpha_composite(hoe, (32 + (256 - hoe.width) // 2, 276 - hoe.height))
    save(canvas, 'tools/hoe/stone.png')

    for half, rel in zip(columns(art['luminaria.png'], 2), ['equipment/lamp-off.png', 'equipment/lamp-on.png']):
        half.thumbnail((160, 160), Image.LANCZOS)
        save(half, rel)

    for who in ('marina', 'rui'):
        for view, body in zip(VIEWS, columns(art[f'{who}.png'], 4)):
            scale = HEIGHT / body.height
            body = body.resize((round(body.width * scale), HEIGHT), Image.LANCZOS)
            frame = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
            frame.alpha_composite(body, ((256 - body.width) // 2, FEET - HEIGHT))
            save(frame, f'characters/survivors/{who}-{view}.png')

    for out in outputs:
        fringe.clean(out)


# Últimos 6 ícones (segundo envio, 17/11/2026): <arquivo do zip> -> id do item.
ICONS_2 = {'01-curativos.png': 'bandage', '02-refeicoes.png': 'meal', '03-lanterna-de-mao.png': 'lantern',
           '04-componentes-eletronicos.png': 'electronicPart', '05-roupas.png': 'clothing', '06-acessorios.png': 'accessory'}


def import_icons_2(src):
    """Uso: python3 -I scripts/import_art_faltantes.py --icones <pasta do zip extraído>"""
    fase02, fringe = load('import_art_fase02'), load('clean_white_fringe')
    keep = os.path.join(ROOT, 'docs/arte-recebida/faltantes/icones-2')
    os.makedirs(keep, exist_ok=True)
    for name, item in ICONS_2.items():
        shutil.copy(os.path.join(src, name), os.path.join(keep, name))
        im = fase02.clear_background(Image.open(os.path.join(src, name)))
        im = im.crop(im.getbbox())
        im.thumbnail((160, 160), Image.LANCZOS)
        out = os.path.join(VIS, f'items/{item}.png')
        im.save(out, optimize=True)
        fringe.clean(out)
        print(f'items/{item}.png', im.size)


if __name__ == '__main__':
    if sys.argv[1] == '--icones':
        import_icons_2(sys.argv[2])
    else:
        main()
