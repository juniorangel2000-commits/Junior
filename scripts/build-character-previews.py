"""Build review PNGs/GIFs from the game frames captured by qa-character.cjs.

Requires Pillow. This only arranges rendered frames; original art is unchanged.
"""
import base64
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / 'docs' / 'personagens'
VIEWS = [
    ('down', 'Frente'), ('down-right', 'Frente / direita'),
    ('right', 'Direita'), ('up-right', 'Costas / direita'),
    ('up', 'Costas'), ('up-left', 'Costas / esquerda'),
    ('left', 'Esquerda'), ('down-left', 'Frente / esquerda'),
]
try:
    FONT = ImageFont.truetype('DejaVuSans.ttf', 13)
except OSError:
    FONT = ImageFont.load_default()


def build(folder: str) -> None:
    target = ROOT / folder
    views = {view['direction']: view for view in json.loads((target / 'quadros-renderizados.json').read_text())}
    walk_frames = len(views['down']['frames']) - 1
    assert all(len(view['frames']) == walk_frames + 1 for view in views.values())

    def sheet(phase: int) -> Image.Image:
        result = Image.new('RGB', (896, 608), '#f4e6c5')
        draw = ImageDraw.Draw(result)
        for index, (direction, label) in enumerate(VIEWS):
            x, y = (index % 4) * 224, (index // 4) * 304
            draw.rectangle((x + 5, y + 5, x + 218, y + 298), fill='#dce3ba', outline='#8b9d62')
            draw.text((x + 112, y + 17), label, font=FONT, anchor='mt', fill='#3d5030')
            raw = base64.b64decode(views[direction]['frames'][phase].split(',')[1])
            frame = Image.open(io.BytesIO(raw)).convert('RGBA')
            assert frame.size == (192, 256), 'Regenerate captures with native-resolution character rendering first'
            result.paste(frame, (x + 16, y + 36), frame)
        return result

    sheet(0).save(target / 'oito-direcoes.png')
    frames = [sheet(phase) for phase in range(1, walk_frames + 1)]
    # GIF supports centiseconds. Round cumulative timing to preserve cycle duration.
    frame_ms = 1000 / (walk_frames * 84 / 48)
    # APNG preserves the full PNG color range as well as the native texture detail.
    png_durations = [round((i + 1) * frame_ms) - round(i * frame_ms) for i in range(walk_frames)]
    frames[0].save(target / 'caminhada.png', save_all=True, append_images=frames[1:],
                   duration=png_durations, loop=0)
    durations = [10 * (round((i + 1) * frame_ms / 10) - round(i * frame_ms / 10)) for i in range(walk_frames)]
    frames[0].save(target / 'caminhada.gif', save_all=True, append_images=frames[1:],
                   duration=durations, loop=0, disposal=2)
    print(f'{folder}: eight directions, {walk_frames} walk frames, {sum(durations)} ms/cycle')


if __name__ == '__main__':
    for character in ('fazendeira', 'fazendeiro'):
        build(character)
