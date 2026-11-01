"""Read unchanged PNG alpha and regenerate collision metadata for the cliff modules."""
from pathlib import Path
import hashlib
import json
from PIL import Image
root = Path(__file__).resolve().parents[1]
panels = []
for name in ('left', 'right'):
    file = f'assets/visual/property/homestead-cliff-{name}.png'
    source = root / 'public' / file
    alpha = Image.open(source).getchannel('A')
    bounds = alpha.point(lambda value: 255 if value >= 160 else 0).getbbox()
    crop = {'x': max(0, bounds[0] - 2), 'y': max(0, bounds[1] - 2),
            'width': min(alpha.width, bounds[2] + 2) - max(0, bounds[0] - 2),
            'height': min(alpha.height, bounds[3] + 2) - max(0, bounds[1] - 2)}
    front = []
    for left in range(0, crop['width'], 8):
        bottom = -1
        for x in range(max(0, left - 2), min(crop['width'], left + 10)):
            for y in range(crop['height'] - 1, -1, -1):
                if alpha.getpixel((crop['x'] + x, crop['y'] + y)) >= 160:
                    bottom = max(bottom, y)
                    break
        front.append(bottom + 1)
    panels.append({'id': name, 'file': file, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                   'crop': crop, 'columnWidth': 8, 'front': front})
(root / 'src/data/homestead-mountain-contour.json').write_text(json.dumps({'panels': panels}, indent=2) + '\n')
print('Contornos dos dois módulos gerados; PNGs originais preservados.')
