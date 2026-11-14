import type { FloorStyle, WallStyle } from './systems/home';

type Paint = CanvasRenderingContext2D;

/** Recortes do original, encaixados nos limites de circulação existentes.
 * Parede norte termina em y=64; piso livre x=32..352, y=64..288;
 * saída sul x=160..224. O desenho não altera a geometria do Home. */
export function paintHomeRoom(ctx: Paint, source: CanvasImageSource, floor: FloorStyle, wall: WallStyle, stone?: CanvasImageSource): void {
  ctx.fillStyle = '#28251f'; ctx.fillRect(9, 5, 366, 310);
  const part = (sx: number, sy: number, sw: number, sh: number, x: number, y: number, w: number, h: number): void => {
    ctx.drawImage(source, sx, sy, sw, sh, x, y, w, h);
  };
  // Os quatro lados são recortados separadamente: a entrada mantém sua largura.
  part(86, 30, 1205, 275, 20, 5, 344, 59);
  part(108, 305, 1160, 775, 32, 64, 320, 224);
  if (floor === 'dark') {
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#8f786e'; ctx.fillRect(32, 64, 320, 224); ctx.restore();
  } else if (floor === 'stone' && stone) {
    ctx.save(); ctx.beginPath(); ctx.rect(32, 64, 320, 224); ctx.clip();
    for (let y = 64; y < 288; y += 160) for (let x = 32; x < 352; x += 160) {
      ctx.drawImage(stone, 887, 0, 887, 887, x, y, 160, 160);
    }
    ctx.restore();
  }
  if (wall !== 'cream') {
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = wall === 'sage' ? '#b6c6a9' : '#d2a48c';
    for (const [x, w] of [[32, 100], [144, 94], [250, 102]]) ctx.fillRect(x, 16, w, 40);
    ctx.restore();
    // Vidros, cortiça e luminária conservam as cores e a luz em qualquer reboco.
    for (const [x, y, w, h] of [[206, 84, 200, 175], [969, 84, 200, 175], [590, 145, 196, 115], [655, 52, 70, 80]]) {
      part(x, y, w, h, 20 + (x - 86) * 344 / 1205, 5 + (y - 30) * 59 / 275, w * 344 / 1205, h * 59 / 275);
    }
  }
  // Janelas centradas sobre a grade do piso (x=96 e x=288): a cama em x=2 e a estante
  // em x=8 ficam no meio delas. Cada painel de reboco entre as vigas é deslocado 13 px
  // para dentro; a faixa que sobra repete o reboco liso que já estava naquela borda.
  shiftWallPanel(ctx, 33, 131, 13);
  shiftWallPanel(ctx, 251, 351, -13);
  part(86, 305, 22, 775, 20, 64, 12, 224);
  part(1268, 305, 23, 775, 352, 64, 12, 224);
  // Soleira aberta: continua o piso, sem desenhar uma parede sobre a saída.
  ctx.fillStyle = '#32261d'; ctx.fillRect(160, 288, 64, 30);
  part(601, 1005, 172, 76, 162, 288, 60, 26);
  part(86, 1080, 514, 36, 20, 288, 140, 16);
  part(773, 1080, 518, 36, 224, 288, 140, 16);
  ctx.fillStyle = '#34291f24'; ctx.fillRect(32, 64, 320, 3);
}

/** Desloca na horizontal o painel de parede [x0,x1) (faixa y=5..64). A faixa descoberta
 * mantém os pixels originais daquela borda, que são reboco liso. */
export function shiftWallPanel(ctx: Paint, x0: number, x1: number, dx: number): void {
  const w = x1 - x0, h = 59, src = ctx.getImageData(x0, 5, w, h), out = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const keep = dx > 0 ? x < dx : x >= w + dx, sx = keep ? x : x - dx, i = (y * w + x) * 4, j = (y * w + sx) * 4;
    out.data.set(src.data.subarray(j, j + 4), i);
  }
  ctx.putImageData(out, x0, 5);
}
