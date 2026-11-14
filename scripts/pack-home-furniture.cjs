// Recorta a fonte original sem redimensionar. A exibição é dimensionada pelo Phaser.
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { PNG } = require('pngjs');
const root = 'public/assets/visual/home-furniture/';
const bytes = fs.readFileSync(root + 'source.png');
const source = PNG.sync.read(bytes);
const cuts = {};
for (const [index, kind] of ['bed', 'table', 'chair', 'shelf', 'rug', 'plant'].entries()) {
  const x0 = index % 3 * 512, y0 = Math.floor(index / 3) * 512;
  let left = x0 + 512, top = y0 + 512, right = x0, bottom = y0;
  for (let y = y0; y < y0 + 512; y++) for (let x = x0; x < x0 + 512; x++) {
    if (source.data[(y * source.width + x) * 4 + 3] < 200) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  const width = right - left + 1, height = bottom - top + 1;
  const target = new PNG({ width, height });
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const s = ((top + y) * source.width + left + x) * 4, d = (y * width + x) * 4;
    if (source.data[s + 3] < 200) continue;
    source.data.copy(target.data, d, s, s + 3); target.data[d + 3] = 255;
  }
  fs.writeFileSync(root + kind + '.png', PNG.sync.write(target));
  cuts[kind] = { x: left, y: top, width, height };
}
fs.writeFileSync(root + 'art.json', JSON.stringify({ sourceSha256: createHash('sha256').update(bytes).digest('hex'), alphaCutoff: 200, cuts }, null, 2) + '\n');
// O fogão tem fonte própria; mesma regra de transparência e pixels preservados.
const stoveBytes = fs.readFileSync(root + 'stove-source.png');
const stove = PNG.sync.read(stoveBytes);
let left = stove.width, top = stove.height, right = 0, bottom = 0;
for (let y = 0; y < stove.height; y++) for (let x = 0; x < stove.width; x++) {
  if (stove.data[(y * stove.width + x) * 4 + 3] < 200) continue;
  left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
}
const stoveCrop = new PNG({ width: right - left + 1, height: bottom - top + 1 });
for (let y = 0; y < stoveCrop.height; y++) for (let x = 0; x < stoveCrop.width; x++) {
  const s = ((top + y) * stove.width + left + x) * 4, d = (y * stoveCrop.width + x) * 4;
  if (stove.data[s + 3] < 200) continue;
  stove.data.copy(stoveCrop.data, d, s, s + 3); stoveCrop.data[d + 3] = 255;
}
fs.writeFileSync(root + 'wood-stove.png', PNG.sync.write(stoveCrop));
const manifest = JSON.parse(fs.readFileSync(root + 'art.json'));
manifest.stove = { sourceSha256: createHash('sha256').update(stoveBytes).digest('hex'), x: left, y: top, width: stoveCrop.width, height: stoveCrop.height };
fs.writeFileSync(root + 'art.json', JSON.stringify(manifest, null, 2) + '\n');
