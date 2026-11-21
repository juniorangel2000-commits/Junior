const fs = require('node:fs');
const { PNG } = require('pngjs');

const read = name => PNG.sync.read(fs.readFileSync(`referencias/cenarios/ruinas/${name}.png`));
const masonry = read('alvenaria');
const outpost = read('posto');
const width = masonry.width / 3;
const height = masonry.height / 2;

const pieces = [
  ...['wall', 'corner', 'arch', 'rubble', 'pillar', 'plinth'].map((name, i) => {
    const x = (i % 3) * width;
    const y = Math.floor(i / 3) * height;
    return [name, masonry, x, y, x + width, y + height];
  }),
  ['well', outpost, 0, 0, 570, 640],
  ['facade', outpost, 580, 0, outpost.width, 650],
  ['waystone', outpost, 0, 650, 560, outpost.height],
  ['steps', outpost, 560, 650, outpost.width, outpost.height],
];

for (const [name, source, left, top, right, bottom] of pieces) {
  let x0 = right, y0 = bottom, x1 = left, y1 = top;
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
    if (source.data[(y * source.width + x) * 4 + 3] < 96) continue;
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
    if (alpha < 46 || matte) sprite.data.fill(0, i, i + 4);
  }
  fs.writeFileSync(`public/assets/visual/ruins/${name}.png`, PNG.sync.write(sprite));
  console.log(`${name}: ${sprite.width} × ${sprite.height}`);
}
