const fs = require('node:fs');
const { PNG } = require(require.resolve('pngjs', { paths: [process.cwd()] }));

const root = 'public/assets/animals/horse-rider/';
const read = file => PNG.sync.read(fs.readFileSync(file));
const front = read('referencias/personagens/montaria/masculino-frente.png');
const seated = read(root + 'farmer-male-seated.png');
const frontScale = 50 / 547;
const lateralPlacement = [
  [.197, 57, 21], [.20, 65, 24], [.20, 50, 24], [.19, 65, 27],
  [.19, 55, 28], [.19, 69, 30], [.19, 52, 30],
];

function trim(image, x, y, width, height, cutoff) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < width; dx++) {
    if (image.data[((y + dy) * image.width + x + dx) * 4 + 3] < cutoff) continue;
    left = Math.min(left, dx);
    top = Math.min(top, dy);
    right = Math.max(right, dx);
    bottom = Math.max(bottom, dy);
  }
  if (right < 0) throw new Error('Pose vazia');
  return { left, top, x: x + left, y: y + top, w: right - left + 1, h: bottom - top + 1 };
}

const frontal = trim(front, 0, 0, front.width, front.height, 200);
const poses = [{ image: front, cut: frontal, scale: frontScale, x: 71, y: 94 - frontal.h * frontScale, cutoff: 200 }];
for (const [i, [scale, x, y]] of lateralPlacement.entries()) {
  const index = i + 1;
  const cut = trim(seated, (index % 4) * 384, Math.floor(index / 4) * 512, 384, 512, 1);
  poses.push({ image: seated, cut, scale, x: x + cut.left * scale, y: y + cut.top * scale, cutoff: 1 });
}

const sideWidth = Math.max(...poses.slice(1).map(p => p.cut.w)) + 2;
const sideHeight = Math.max(...poses.slice(1).map(p => p.cut.h)) + 2;
const png = new PNG({ width: frontal.w + 2 + sideWidth * 4, height: Math.max(frontal.h, sideHeight * 2) });
const frames = {};
const placement = {};
poses.forEach(({ image, cut, scale, x, y, cutoff }, index) => {
  const dstX = index === 0 ? 0 : frontal.w + 2 + ((index - 1) % 4) * sideWidth;
  const dstY = index === 0 ? 0 : Math.floor((index - 1) / 4) * sideHeight;
  PNG.bitblt(image, png, cut.x, cut.y, cut.w, cut.h, dstX, dstY);
  if (cutoff > 1) for (let dy = 0; dy < cut.h; dy++) for (let dx = 0; dx < cut.w; dx++) {
    const i = ((dstY + dy) * png.width + dstX + dx) * 4;
    if (png.data[i + 3] < cutoff) png.data.fill(0, i, i + 4);
    else png.data[i + 3] = 255;
  }

  frames[index] = { frame: { x: dstX, y: dstY, w: cut.w, h: cut.h }, rotated: false, trimmed: false };
  placement[index] = { scale, x, y };
});
const data = { frames, meta: { size: { w: png.width, h: png.height }, placement } };
fs.writeFileSync(root + 'farmer-male-mounted.png', PNG.sync.write(png));
fs.writeFileSync(root + 'farmer-male-mounted.json', JSON.stringify(data, null, 2) + '\n');

// Recorte contínuo das orelhas e da crina, copiando os pixels do próprio cavalo.
const horseRoot = 'public/assets/animals/horse/';
const horse = read(horseRoot + 'atlas-packed.png');
const horseFrames = JSON.parse(fs.readFileSync(horseRoot + 'atlas-packed.json', 'utf8')).frames;
const outlines = JSON.parse(fs.readFileSync('referencias/personagens/montaria/contorno-frontal.json', 'utf8'));
const head = { x: 76, y: 48, width: 48, height: 56, columns: 5, frames: Object.keys(outlines).map(Number) };
const headSheet = new PNG({ width: head.width * head.columns, height: head.height * Math.ceil(head.frames.length / head.columns) });

function insideOutline(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [a, b] = points[i], [c, d] = points[j];
    if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) inside = !inside;
  }
  return inside;
}

head.frames.forEach((id, index) => {
  const { frame, spriteSourceSize } = horseFrames[id];
  if (!outlines[id].every(([x, y]) => x >= head.x && x <= head.x + head.width && y >= head.y && y <= head.y + head.height))
    throw new Error('Contorno fora do recorte frontal: ' + id);
  const slotX = (index % head.columns) * head.width;
  const slotY = Math.floor(index / head.columns) * head.height;
  for (let y = 0; y < head.height; y++) for (let x = 0; x < head.width; x++) {
    const px = head.x + x, py = head.y + y;
    const ax = px - spriteSourceSize.x, ay = py - spriteSourceSize.y;
    if (ax < 0 || ay < 0 || ax >= frame.w || ay >= frame.h || !insideOutline(px + .5, py + .5, outlines[id])) continue;
    const source = ((frame.y + ay) * horse.width + frame.x + ax) * 4;
    horse.data.copy(headSheet.data, ((slotY + y) * headSheet.width + slotX + x) * 4, source, source + 4);
  }
});
fs.writeFileSync(root + 'horse-head-male.png', PNG.sync.write(headSheet));
fs.writeFileSync(root + 'horse-head-male.json', JSON.stringify(head, null, 2) + '\n');
