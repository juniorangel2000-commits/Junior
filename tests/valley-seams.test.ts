import {describe,expect,it} from 'vitest';
import {VALLEY_LAYOUT,VALLEY_SEAMS,VALLEY_SEAM_BAND,valleySeamWeight,valleySeamsOf,type ValleyArea} from '../src/data/valley-seams';
import {riverBanksAt} from '../src/data/property-water';
import {fieldsWater,PROPERTY_FIELDS_EXIT,FIELDS_ENTRY,FIELDS_COAST_EXIT} from '../src/data/open-fields';
import {swampBaseWater} from '../src/data/swamp';

const edge=(area:ValleyArea)=>VALLEY_LAYOUT[area];

describe('divisas do vale',()=>{
  it('cada divisa fica exatamente na borda comum dos dois mapas',()=>{
    for(const s of VALLEY_SEAMS){
      const a=edge(s.first),b=edge(s.second);
      if(s.axis==='y'){
        expect(a.y+a.height,`${s.first}→${s.second}`).toBe(s.at);
        expect(b.y).toBe(s.at);
        expect(s.from).toBeGreaterThanOrEqual(Math.max(a.x,b.x));
        expect(s.to).toBeLessThanOrEqual(Math.min(a.x+a.width,b.x+b.width));
      }else{
        expect(a.x+a.width,`${s.first}→${s.second}`).toBe(s.at);
        expect(b.x).toBe(s.at);
        expect(s.from).toBeGreaterThanOrEqual(Math.max(a.y,b.y));
        expect(s.to).toBeLessThanOrEqual(Math.min(a.y+a.height,b.y+b.height));
      }
    }
  });
  it('liga todos os mapas externos, menos a divisa Floresta–Propriedade, que já tem a sua',()=>{
    for(const area of Object.keys(VALLEY_LAYOUT) as ValleyArea[])expect(valleySeamsOf(area).length,area).toBeGreaterThan(0);
    expect(VALLEY_SEAMS.some(s=>[s.first,s.second].includes('forest')&&[s.first,s.second].includes('property'))).toBe(false);
  });
  it('mistura por inteiro junto à linha, some no fim da faixa e abre onde trilhas e rios passam',()=>{
    const fields=VALLEY_SEAMS.find(s=>s.first==='property'&&s.second==='openFields')!;
    expect(valleySeamWeight(fields,200,0)).toBe(1);
    expect(valleySeamWeight(fields,200,VALLEY_SEAM_BAND)).toBe(0);
    // A trilha da Propriedade para os Campos e o rio passam sem chão por cima.
    expect(valleySeamWeight(fields,PROPERTY_FIELDS_EXIT.x,0)).toBe(0);
    expect(FIELDS_ENTRY.x).toBe(PROPERTY_FIELDS_EXIT.x);
    const bank=riverBanksAt(2303);
    expect(valleySeamWeight(fields,(bank.left+bank.right)/2,0)).toBe(0);
    expect(valleySeamWeight(fields,bank.left+12,0)).toBe(0);expect(valleySeamWeight(fields,bank.right-12,0)).toBe(0);
    const coast=VALLEY_SEAMS.find(s=>s.first==='openFields'&&s.second==='coast')!;
    expect(valleySeamWeight(coast,FIELDS_COAST_EXIT.x,0)).toBe(0);
    for(let x=0;x<3072;x+=16)if(fieldsWater(x,2290))expect(valleySeamWeight(coast,x,0),`rio em ${x}`).toBe(0);
  });
  it('o Pântano só tem lagos: nenhuma água encosta nas bordas',()=>{
    for(let i=0;i<3072;i+=16){
      for(const y of [8,2296])expect(swampBaseWater(i,y),`${i},${y}`).toBe(false);
      if(i<2304)for(const x of [8,3064])expect(swampBaseWater(x,i),`${x},${i}`).toBe(false);
    }
  });
});
