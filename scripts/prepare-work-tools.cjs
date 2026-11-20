// Recorta a folha original e prepara o perfil atualizado da enxada.
// Os PNGs de origem permanecem na resolução nativa.
const fs = require('node:fs');
const { PNG } = require('pngjs');
const { createHash } = require('node:crypto');

const root = 'public/assets/visual/tools/work';
const bytes = fs.readFileSync(root + '/source.png');
const sheet = PNG.sync.read(bytes);
if (sheet.width !== 2172 || sheet.height !== 724) throw Error('Fonte inesperada');
const hash = source => createHash('sha256').update(source).digest('hex');
const tools = {};

function solidPixels(image) {
  let top = image.height, bottom = -1;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const i = (y * image.width + x) * 4;
    image.data[i + 3] = image.data[i + 3] >= 200 ? 255 : 0;
    if (image.data[i + 3]) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  if (bottom < 0) throw Error('Ferramenta vazia');
  return bottom - top + 1;
}

for (const [index, tool] of ['hoe', 'shovel', 'sickle'].entries()) {
  const cell = new PNG({ width: 724, height: 724 });
  PNG.bitblt(sheet, cell, index * 724, 0, 724, 724, 0, 0);
  const nativeHeight = solidPixels(cell);
  let image = cell, scale = tool === 'sickle' ? .045 : .05;
  let gripY = 590, extra = {};
  if (tool === 'hoe') {
    const source = fs.readFileSync('referencias/personagens/ferramentas-corpo/enxada-impacto.png');
    image = PNG.sync.read(source);
    scale = nativeHeight * .05 / solidPixels(image);
    gripY = 1015;
    extra = { sourceSha256: hash(source), metalBottom: 292, socket: [609, 225], edge: [893, 153] };
  }
  let sum = 0, count = 0;
  for (let y = gripY - 30; y < gripY + 30; y++) for (let x = 0; x < image.width; x++) {
    if (!image.data[(y * image.width + x) * 4 + 3]) continue;
    sum += x;
    count++;
  }
  if (!count) throw Error('Cabo ausente: ' + tool);
  const file = `assets/visual/tools/work/${tool}.png`;
  fs.writeFileSync('public/' + file, PNG.sync.write(image));
  tools[tool] = { file, width: image.width, height: image.height, grip: [Math.round(sum / count), gripY], scale, ...extra };
}
fs.writeFileSync(root + '/art.json', JSON.stringify({ sourceSha256: hash(bytes), tools }, null, 2) + '\n');
