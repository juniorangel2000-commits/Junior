import { describe, expect, it } from 'vitest';
import forest from '../src/data/maps/forest.json';
import property from '../src/data/maps/property.json';
import previousForest from '../src/data/maps/previous-forest-v2.json';
import previousProperty from '../src/data/maps/previous-property-v2.json';
import { exitSignLayout } from '../src/data/exit-signs';
import { natureArt } from '../src/data/nature-catalog';
import { MAP_SEAM_ROW, seamBand, seamPassage, seamGlobalX, seamGrassKind, seamTreePlan, type SeamArea } from '../src/data/map-seam';
import { cloneMapEdits,validateMapEdits, type MapEditData } from '../src/systems/map-editor';
import {hasMapSeam} from '../src/data/map-seam';
import {isPropertyVillagePassage,isPropertyVillageCanopyClearance} from '../src/data/property-village-gate';

const current = { forest, property };
const previous = { forest: previousForest, property: previousProperty };

describe('continuidade editável entre floresta e propriedade', () => {
  it('mantém o piso e não recria árvores procedurais ao apagar os objetos da faixa',()=>{
    const edited=cloneMapEdits(property as MapEditData);edited.objects={};
    expect(edited.continuation).toBe(1);expect(hasMapSeam(cloneMapEdits(edited))).toBe(true);
    expect(validateMapEdits({...edited,continuation:2})).toBe(false);
    expect(hasMapSeam({version:1,width:96,height:72,terrain:{},objects:{}})).toBe(false);
  });
  it('alinha as placas e mantém as setas apontando para a área vizinha', () => {
    expect(forest.points).toEqual({ entry: { x: 93, y: MAP_SEAM_ROW }, exit: { x: 94, y: MAP_SEAM_ROW } });
    expect(property.points).toEqual(previousProperty.points);
    const west = exitSignLayout(property.points.exit, property.points.entry);
    const east = exitSignLayout(forest.points.exit, forest.points.entry);
    expect(west.direction).toBe('left'); expect(east.direction).toBe('right');
    expect(west.y).toBe(east.y);
  });

  it.each(['forest', 'property'] as const)('mantém %s válido e conserva os dados anteriores fora da faixa de transição', area => {
    const map = current[area] as MapEditData, before = previous[area] as MapEditData;
    expect(validateMapEdits(map)).toBe(true);
    for (const [key, value] of Object.entries(before.terrain)) {
      const [x, y] = key.split(',').map(Number);
      if (!seamBand(x, y, area) && !seamPassage(x, y, area) && !(area==='property'&&isPropertyVillagePassage(x,y))) expect(map.terrain[key]).toBe(value);
    }
    for (const [id, object] of Object.entries(before.objects)) {
      if (!seamBand(object.x, object.y, area) && !seamPassage(object.x, object.y, area) && !(area==='property'&&(isPropertyVillagePassage(object.x,object.y)||isPropertyVillageCanopyClearance(object.x,object.y)))) expect(map.objects[id]).toEqual(object);
    }
  });

  it.each(['forest', 'property'] as const)('deixa a aproximação marcada de %s sem objetos e registra a composição no editor', area => {
    const map = current[area] as MapEditData;
    const visible = Object.entries(map.objects).filter(([, object]) => !object.removed);
    expect(visible.some(([, object]) => seamPassage(object.x, object.y, area))).toBe(false);
    const plan = seamTreePlan(area);
    expect(plan.length).toBeGreaterThan(10);
    expect(plan.some(tree => tree.kind.startsWith('oak'))).toBe(true);
    expect(plan.some(tree => tree.kind.startsWith('pine'))).toBe(true);
    for (const tree of plan) {
      expect(map.objects[tree.id]).toEqual({ x: tree.x, y: tree.y, kind: tree.kind });
      const art = natureArt(tree.kind)!;
      const center = (seamGlobalX(tree.x, area) + .5) * 32;
      expect(area === 'forest' ? center + art.width / 2 <= 0 : center - art.width / 2 >= 0).toBe(true);
      // Foreground foliage cannot hide either arrival cell or the sign lane.
      const portal = area === 'forest' ? forest.points : property.points;
      for (const point of [portal.entry, portal.exit]) {
        const px = (point.x + .5) * 32, py = (point.y + .5) * 32;
        const cx = tree.x * 32 + 16, foot = tree.y * 32 + 25;
        const overlaps = px >= cx - art.width / 2 && px <= cx + art.width / 2
          && py >= foot - art.height * art.pivot && py <= foot + art.height * (1 - art.pivot);
        expect(overlaps).toBe(false);
      }
    }
  });

  it('usa um único campo de materiais e coordenadas através da emenda', () => {
    for (let y = 1; y < 71; y++) for (const area of ['forest', 'property'] as SeamArea[]) {
      const map = current[area] as MapEditData;
      const range = area === 'forest' ? [88, 94] : [1, 7];
      for (let x = range[0]; x <= range[1]; x++) expect(map.terrain[`${x},${y}`]).toBe(seamGrassKind(seamGlobalX(x, area), y));
      expect(seamGlobalX(96, 'forest')).toBe(seamGlobalX(0, 'property'));
    }
    expect(new Set([...seamTreePlan('forest'), ...seamTreePlan('property')].map(tree => tree.kind)).size).toBe(6);
  });
});
