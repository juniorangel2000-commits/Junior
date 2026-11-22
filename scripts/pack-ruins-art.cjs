const fs = require('node:fs');
const { PNG } = require('pngjs');

const read = name => PNG.sync.read(fs.readFileSync(`referencias/cenarios/ruinas/${name}.png`));
const masonry = read('alvenaria');
const outpost = read('posto');
const outbuildings = read('entreposto');
const foundations = read('fundacoes');
const landmarks = read('marcos');

const grid = (source, names, columns) => names.map((name, index) => {
  const col = index % columns;
  const row = Math.floor(index / columns);
  const x = c => Math.floor(c * source.width / columns);
  const y = r => Math.floor(r * source.height / 2);
  return [name, source, x(col), y(row), x(col + 1), y(row + 1)];
});

const pieces = [
  ...grid(masonry, ['wall','corner','arch','rubble','pillar','plinth'], 3),
  ['storehouse', outbuildings, 0, 0, 531, 512],
  ['relief', outbuildings, 531, 0, 1032, 512],
  ['cart', outbuildings, 1032, 0, 1536, 512],
  ['flagstones', outbuildings, 0, 512, 520, 1024],
  ['urns', outbuildings, 520, 512, 1032, 1024],
  ['sundial', outbuildings, 1032, 512, 1536, 1024],
  ...grid(foundations, ['window','hearth','trough','ring','wall-break','gateposts','cistern','toll'], 4),
  ...grid(landmarks, ['planter','bell','bench','column-bases','marker','cargo','amphora','lintel'], 4),
  ['well', outpost, 0, 0, 570, 640],
  ['facade', outpost, 580, 0, outpost.width, 650],
  ['waystone', outpost, 0, 650, 560, outpost.height],
  ['steps', outpost, 560, 650, outpost.width, outpost.height],
];

for (const [name, source, left, top, right, bottom] of pieces) {
  const alphaThreshold = source === outbuildings ? 166 : 46;
  let x0 = right, y0 = bottom, x1 = left, y1 = top;
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
    if (source.data[(y * source.width + x) * 4 + 3] < Math.max(96, alphaThreshold)) continue;
    x0 = Math.min(x, x0);
    x1 = Math.max(x, x1);
    y0 = Math.min(y, y0);
    y1 = Math.max(y, y1);
  }
  const sprite = new PNG({ width: x1 - x0 + 1, height: y1 - y0 + 1 });
  PNG.bitblt(source, sprite, x0, y0, sprite.width, sprite.height, 0, 0);
  for (let i = 0; i < sprite.data.length; i += 4) {
    const [r, g, b, alpha] = sprite.data.subarray(i, i + 4);
    const matte = r > 150 && r > g * 1.8 && r > b * 1.8;
    if (alpha < alphaThreshold || matte) sprite.data.fill(0, i, i + 4);
    else if (source === outbuildings) sprite.data[i + 3] = Math.min(255, Math.round((alpha - alphaThreshold) * 255 / 66));
  }
  fs.writeFileSync(`public/assets/visual/ruins/${name}.png`, PNG.sync.write(sprite));
  console.log(`${name}: ${sprite.width} × ${sprite.height}`);
}
