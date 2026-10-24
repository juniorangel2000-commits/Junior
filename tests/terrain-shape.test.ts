import {PROPERTY_BRIDGES} from '../src/data/bridges';
import {PROPERTY_RIVER_WIDTH,riverBanksAt,shoreSandAt} from '../src/data/property-water';
import { describe, expect, it } from 'vitest';
import { isBridgeTile, isPathTile, isWaterTile, TILE, WORLD_HEIGHT, WORLD_WIDTH } from '../src/data/regions';
import { isWaterPoint, roadDistanceAt, waterDistanceAt } from '../src/data/terrain-shape';

describe('contornos contínuos do terreno', () => {
  it('alarga o rio em 25% e ajusta os tabuleiros à largura real nas travessias',()=>{
    expect(PROPERTY_RIVER_WIDTH).toBe(160);
    for(let y=0;y<72*TILE;y+=19){const b=riverBanksAt(y);expect(b.right-b.left).toBeCloseTo(160,6);}
    for(const b of PROPERTY_BRIDGES){
      for(let y=b.y*TILE;y<(b.y+b.height)*TILE;y+=3){
        const banks=riverBanksAt(y);expect(banks.left).toBeGreaterThanOrEqual(b.x*TILE);
        expect(banks.right).toBeLessThanOrEqual((b.x+b.width)*TILE);
      }
      expect(b.width*TILE).toBeLessThanOrEqual(PROPERTY_RIVER_WIDTH+64);
    }
  });

  it('cria areia irregular apenas em terra, úmida na beira e suave ao encontrar a grama',()=>{
    const widths=[];
    for(const y of [300,700,1100,1500,1900]){
      const banks=riverBanksAt(y),x=banks.right;
      expect(shoreSandAt(x+3,y).weight).toBeGreaterThan(.9);
      expect(shoreSandAt(x+3,y).moisture).toBeLessThan(shoreSandAt(x+25,y).moisture);
      expect(shoreSandAt(x+50,y).weight).toBe(0);
      widths.push(shoreSandAt(x+25,y).weight);
    }
    expect(new Set(widths.map(w=>w.toFixed(2))).size).toBeGreaterThan(2);
    expect(shoreSandAt(36.5*TILE,30.5*TILE).weight).toBe(0);
    expect(shoreSandAt(25*TILE,20*TILE).weight).toBe(0);
  });
  it('preserva todos os centros de água e terra do mapa e as 45 parcelas', () => {
    for (let y = 0; y < WORLD_HEIGHT; y++) for (let x = 0; x < WORLD_WIDTH; x++) {
      expect(isWaterPoint((x + 0.5) * TILE, (y + 0.5) * TILE), `${x},${y}`).toBe(isWaterTile(x, y));
    }
    for (let y = 20; y <= 24; y++) for (let x = 21; x <= 29; x++) expect(waterDistanceAt((x + 0.5) * TILE, (y + 0.5) * TILE)).toBeGreaterThan(0);
  });

  it('arredonda uma quina convexa sem mover seu centro nem criar um degrau de 32px', () => {
    let corner: { x: number; y: number } | undefined;
    // Pick a lake corner, apart from the river's moving left/right banks.
    for (let y = 24; y < 36 && !corner; y++) for (let x = 29; x < 42; x++) {
      if (isWaterTile(x, y) && !isWaterTile(x - 1, y) && !isWaterTile(x, y - 1) && !isWaterTile(x - 1, y - 1)) {
        corner = { x: x * TILE, y: y * TILE }; break;
      }
    }
    expect(corner).toBeDefined();
    const { x, y } = corner!;
    expect(isWaterPoint(x + 1, y + 1)).toBe(false);
    expect(isWaterPoint(x + 12, y + 12)).toBe(true);
    expect(isWaterPoint(x + 16, y + 16)).toBe(true);
  });

  it('mantém a margem contínua ao atravessar bordas de amostragem e células', () => {
    for (let y = 20; y < WORLD_HEIGHT * TILE - 20; y += 13) for (let x = 20; x < WORLD_WIDTH * TILE - 20; x += 29) {
      expect(Math.abs(waterDistanceAt(x + 0.1, y) - waterDistanceAt(x - 0.1, y))).toBeLessThan(0.3);
      expect(Math.abs(waterDistanceAt(x, y + 0.1) - waterDistanceAt(x, y - 0.1))).toBeLessThan(0.3);
    }
  });

  it('desenha arco no lago onde a antiga primeira fileira tinha uma borda reta', () => {
    expect(isWaterPoint(36.5 * TILE, 27 * TILE)).toBe(true);
    expect(isWaterPoint(33.5 * TILE, 27 * TILE)).toBe(false);
    expect(isWaterPoint(33.5 * TILE, 27.5 * TILE)).toBe(true);
  });

  it('preserva água sob ambas as pontes para o deck usar override separado', () => {
    for (const [x, y] of [[44, 18], [44, 52]]) {
      expect(isBridgeTile(x, y)).toBe(true);
      expect(isWaterPoint((x + 0.5) * TILE, (y + 0.5) * TILE)).toBe(true);
    }
  });

  it('mantém os apoios secos, sem faixa de água entre o caminho e a ponte', () => {
    for (const bridge of PROPERTY_BRIDGES) {
      const left=bridge.x,right=bridge.x+bridge.width,top=bridge.y;
      for (let y = top * TILE; y < (top + 2) * TILE; y += 3) {
        expect(isWaterPoint(left * TILE - 1, y)).toBe(false);
        expect(isWaterPoint(right * TILE + 1, y)).toBe(false);
      }
    }
    for (const [ox, oy] of [[-7, -5], [7, -5], [-7, 3], [7, 3]]) {
      expect(isWaterPoint(40.5 * TILE + ox, 18.5 * TILE + oy)).toBe(false);
    }
  });

  it('oferece distância assinada de terra/margem/água e recusa coordenadas inválidas', () => {
    expect(waterDistanceAt(36.5 * TILE, 30.5 * TILE)).toBeLessThan(-16);
    expect(waterDistanceAt(25.5 * TILE, 18.5 * TILE)).toBeGreaterThan(16);
    expect(waterDistanceAt(Number.NaN, 20)).toBe(Infinity);
    expect(isWaterPoint(Infinity, 20)).toBe(false);
  });

  it('mantém as rotas da propriedade, bosque e campos ligadas', () => {
    for (const [x, y] of [[24.5, 17], [40, 18.5], [55, 18.5], [31.5, 25], [19.5, 40], [40, 53.5], [68.5, 55]]) {
      expect(roadDistanceAt(x * TILE, y * TILE), `${x},${y}`).toBeLessThan(0);
    }
  });

  it('pinta pontas arredondadas sem cortar no início do tile de caminho', () => {
    expect(isPathTile(71, 7)).toBe(false);
    expect(roadDistanceAt(71.5 * TILE, 7.95 * TILE)).toBeLessThan(0);
    expect(roadDistanceAt(71.5 * TILE, 6.5 * TILE)).toBeGreaterThan(0);
    expect(roadDistanceAt(5 * TILE, 5 * TILE)).toBe(Infinity);
  });
});
