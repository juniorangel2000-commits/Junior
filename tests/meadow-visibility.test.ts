import {it,expect} from 'vitest';
import {MEADOW_PATCHES} from '../src/data/open-fields';
import {meadowPatchesInRect} from '../src/systems/meadow-visibility';

it('a seleção por células preserva todas as moitas visíveis ao andar e alterar o zoom',()=>{
 for(const size of [120,400,900,4000])for(const [x,y] of [[-100,-80],[0,0],[1536,600],[2600,1900],[3050,2270]]){
  const rect=[x-90,y-30,x+size+90,y+size+90] as const;
  const expected=MEADOW_PATCHES.filter(p=>p.x>rect[0]&&p.y>rect[1]&&p.x<rect[2]&&p.y<rect[3]);
  expect(meadowPatchesInRect(...rect).map(p=>p.id).sort()).toEqual(expected.map(p=>p.id).sort());
 }
});
it('não duplica moitas nas divisões de células e respeita as bordas exatas',()=>{
 const all=meadowPatchesInRect(0,0,3072,2304);expect(new Set(all.map(p=>p.id)).size).toBe(MEADOW_PATCHES.length);
 const p=MEADOW_PATCHES[0];expect(meadowPatchesInRect(p.x,p.y,p.x+1,p.y+1)).not.toContain(p);
 expect(meadowPatchesInRect(p.x-1,p.y-1,p.x+1,p.y+1)).toContain(p);
});
