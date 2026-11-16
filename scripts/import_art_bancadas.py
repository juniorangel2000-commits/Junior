"""Importa as bancadas de 2 blocos (enviadas pelo Junior em 16/11/2026).

Uso: python3 -I scripts/import_art_bancadas.py <pasta do zip extraído>

As imagens vêm em RGB com fundo branco. O fundo é apagado pelas bordas (mesma função da
fase 02), o desenho é recortado justo, e a franja branca do contorno sai
(scripts/clean_white_fringe.py). Resolução original: o jogo só reduz na tela.
Originais em docs/arte-recebida/bancadas/.
"""
import importlib.util, os, shutil, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = sys.argv[1]
FILES = {
    'bancada_de_trabalho.png': 'public/assets/visual/world/workbench-wide.png',
    'bancada_de_construcao.png': 'public/assets/visual/world/construction-bench.png',
}


def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    fase02, fringe = load('import_art_fase02'), load('clean_white_fringe')
    keep = os.path.join(ROOT, 'docs/arte-recebida/bancadas')
    os.makedirs(keep, exist_ok=True)
    for name, dst in FILES.items():
        shutil.copy(os.path.join(SRC, name), os.path.join(keep, name))
        im = fase02.clear_background(Image.open(os.path.join(SRC, name)))
        im = im.crop(im.getbbox())
        out = os.path.join(ROOT, dst)
        im.save(out, optimize=True)
        # Fundo preso dentro do desenho (prateleira, caixa) e contorno claro mais largo.
        removed = fringe.clean(out, passes=5, floor=170, holes=True, hole_minimum=25)
        print(f'{name} -> {dst}: {Image.open(out).size}, franja {removed} px')


if __name__ == '__main__':
    main()
