// As células são copiadas em resolução nativa. O mesmo deslocamento é aplicado
// a toda a linha para preservar o balanço da cabeça e o movimento dos pés.
const fs = require('node:fs');
const { PNG } = require('pngjs');
const { createHash } = require('node:crypto');

const root = 'public/assets/visual/characters/survivors/';
const cell = 256;
const foot = 232;
const alphaCutoff = 200;
const rows = ['south', 'north', 'east', 'west', 'south-east', 'south-west', 'north-east', 'north-west'];
const manifest = { cell, rows, alphaCutoff, characters: {} };

function bounds(image, startX, startY, endX, endY) {
  let left = endX, top = endY, right = startX - 1, bottom = startY - 1;
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (image.data[(y * image.width + x) * 4 + 3] < alphaCutoff) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw Error('Quadro vazio');
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length / 2;
  return (sorted[Math.ceil(middle) - 1] + sorted[Math.floor(middle)]) / 2;
}

function packSheet(bytes, atlas, columns, firstRow, idleHeight) {
  const source = PNG.sync.read(bytes);
  const cellWidth = source.width / columns;
  const cellHeight = source.height / 4;
  if (cellWidth > cell || cellHeight > cell) throw Error('Célula da fonte maior que 256 px');

  const placements = [];
  const heights = [];
  for (let row = 0; row < 4; row++) {
    const y = Math.floor(row * cellHeight);
    const bottom = Math.floor((row + 1) * cellHeight);
    const frames = Array.from({ length: columns }, (_, column) => {
      const x = Math.floor(column * cellWidth);
      return bounds(source, x, y, Math.floor((column + 1) * cellWidth), bottom);
    });
    const shiftX = Math.round(cell / 2 - median(frames.map((frame, column) =>
      frame.x - Math.floor(column * cellWidth) + frame.width / 2)));
    const shiftY = foot - Math.max(...frames.map(frame => frame.y - y + frame.height));

    for (const [column, frame] of frames.entries()) {
      heights.push(frame.height);
      const destX = frame.x - Math.floor(column * cellWidth) + shiftX;
      const destY = frame.y - y + shiftY;
      if (destX < 0 || destY < 0 || destX + frame.width > cell || destY + frame.height > cell) {
        throw Error('O recorte cortaria o personagem');
      }
      for (let fy = 0; fy < frame.height; fy++) {
        for (let fx = 0; fx < frame.width; fx++) {
          const pixel = ((frame.y + fy) * source.width + frame.x + fx) * 4;
          if (source.data[pixel + 3] < alphaCutoff) continue;
          const d = (((firstRow + row) * cell + destY + fy) * atlas.width + column * cell + destX + fx) * 4;
          source.data.copy(atlas.data, d, pixel, pixel + 3);
          atlas.data[d + 3] = 255;
        }
      }
    }
    placements.push({ shiftX, shiftY, bounds: frames });
  }
  return { placements, scale: idleHeight * .25 / median(heights), sha: createHash('sha256').update(bytes).digest('hex') };
}

for (const [id, columns] of [['marina', 6], ['rui', 8]]) {
  const atlas = new PNG({ width: columns * cell, height: rows.length * cell });
  const idle = PNG.sync.read(fs.readFileSync(root + id + '-south.png'));
  const idleHeight = bounds(idle, 0, 0, idle.width, idle.height).height;
  const cardinal = packSheet(fs.readFileSync(root + id + '-walk-source.png'), atlas, columns, 0, idleHeight);
  const diagonal = packSheet(fs.readFileSync(root + id + '-diagonal-source.png'), atlas, columns, 4, idleHeight);
  fs.writeFileSync(root + id + '-walk.png', PNG.sync.write(atlas));
  manifest.characters[id] = {
    columns,
    file: `assets/visual/characters/survivors/${id}-walk.png`,
    sourceSha256: cardinal.sha,
    diagonalSourceSha256: diagonal.sha,
    scale: cardinal.scale,
    diagonalScale: diagonal.scale,
    rows: [...cardinal.placements, ...diagonal.placements]
  };
}
fs.writeFileSync(root + 'walk.json', JSON.stringify(manifest, null, 2) + '\n');
