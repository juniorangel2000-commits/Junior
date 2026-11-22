import {existsSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {createCoastLayout,coastBaseWater,coastRiverEdge,coastShoreDistance,coastWaterDepth,COAST_ORIGINAL_OBJECTS,COAST_RIVER} from '../src/data/coast';
import {FIELDS_COAST_EXIT,FIELDS_COAST_RETURN,FIELDS_RIVER,FIELDS_PROPS,FIELDS_ANIMALS,FIELDS_RETIRED_PATCHES,FIELDS_SIZE,FIELDS_TRAILS,MEADOW_PATCHES,fieldsBlocked,fieldsRiverEdge,fieldsPlayerSafe,fieldsSafe,fieldsSolid,fieldsWater} from '../src/data/open-fields';
import {FIELDS_BRIDGES,mapBridgeAllowsStep} from '../src/data/bridges';
import {riverBanksAt} from '../src/data/property-water';
import {COAST_KINDS} from '../src/data/coast-art';
import {createRailwayLayout} from '../src/data/railway';
import {COAST_ENTRY,COAST_EXIT,tileMidpoint} from '../src/data/ruins-road';
import {defaultMap} from '../src/data/default-maps';
import {createCharacterProfile} from '../src/data/characters';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {validateMapEdits} from '../src/systems/map-editor';
import {DoorwayPassage,MapExitPassage} from '../src/systems/map-transition';

describe('Costa das Marés',()=>{
  it('fica ao sul dos Campos: entra pela saída sul e volta pela borda norte da Costa',()=>{
    const fields={x:FIELDS_COAST_EXIT.x,y:FIELDS_COAST_EXIT.y+10},coast=tileMidpoint(COAST_EXIT);
    expect(new DoorwayPassage().update({x:fields.x,y:fields.y-24},fields,FIELDS_COAST_EXIT)).toBe(true);
    expect(new MapExitPassage().update({x:coast.x,y:coast.y+24},coast,COAST_EXIT,COAST_ENTRY)).toBe(true);
    // A volta cai no mesmo ponto em que a Costa começa, só que nos Campos, fora do gatilho.
    expect(FIELDS_COAST_RETURN.x).toBe(tileMidpoint(COAST_ENTRY).x);
    expect(fieldsSafe(FIELDS_COAST_RETURN)).toBe(true);
    expect(FIELDS_COAST_RETURN.y).toBeLessThan(FIELDS_COAST_EXIT.y);
    // Chegada livre mesmo com água e colisão pintadas por cima no F2.
    const cell=`${COAST_ENTRY.x},${COAST_ENTRY.y}`,pos=tileMidpoint(COAST_ENTRY),map=defaultMap('coast');
    map.terrain[cell]='water';map.collisions={[cell]:'blocked'};
    const layout=createCoastLayout(map);
    expect(layout.water(pos.x,pos.y)).toBe(false);
    expect(layout.blocked(pos.x,pos.y)).toBe(false);
    // Sem estrada e sem trilho: a Estação não tem mais saída para a Costa.
    expect(createRailwayLayout().objects.some(o=>String(o.kind).startsWith('coast-'))).toBe(false);
  });
  it('o rio da Propriedade continua nos Campos na mesma posição e largura',()=>{
    const bank=riverBanksAt(FIELDS_SIZE.height-1),left=bank.left,right=bank.right;
    const enter=(x:number)=>fieldsWater(x,2);
    expect(enter((left+right)/2)).toBe(true);
    expect(enter(left+12)).toBe(true);expect(enter(right-12)).toBe(true);
    expect(enter(left-24)).toBe(false);expect(enter(right+24)).toBe(false);
  });
  it('o rio dos Campos continua na Costa e deságua no mar',()=>{
    const [fx]=FIELDS_RIVER[FIELDS_RIVER.length-1],[cx]=COAST_RIVER[0];
    expect(Math.abs(fx-cx*32)).toBeLessThan(40);
    expect(fieldsWater(fx,2290)).toBe(true);
    expect(coastBaseWater(cx*32,40)).toBe(true);
    // Do norte até a foz há sempre água ao longo do rio, e a foz está no mar.
    for(const [x,y] of COAST_RIVER.slice(1))expect(coastBaseWater(x*32,Math.min(y*32,2290))).toBe(true);
    const mouth=COAST_RIVER[COAST_RIVER.length-2];
    expect(coastShoreDistance(mouth[0]*32,(mouth[1]+3)*32)).toBeGreaterThan(0);
    // O mar ocupa o sul e o leste; o norte é terra.
    expect(coastBaseWater(48*32,70*32)).toBe(true);
    expect(coastBaseWater(90*32,45*32)).toBe(true);
    expect(coastBaseWater(48*32,20*32)).toBe(false);
  });
  it('alarga o rio para a foz sem perder o encaixe com os Campos',()=>{
    const [riverX]=FIELDS_RIVER[FIELDS_RIVER.length-1];
    for(let offset=-90;offset<=90;offset+=4){
      expect(coastBaseWater(riverX+offset,0)).toBe(fieldsWater(riverX+offset,FIELDS_SIZE.height-1));
    }
    const [narrowX,narrowY]=COAST_RIVER[2], [mouthX,mouthY]=COAST_RIVER.at(-2)!;
    expect(-coastRiverEdge(mouthX*32,mouthY*32)).toBeGreaterThan(-coastRiverEdge(narrowX*32,narrowY*32)*2.5);
    for(let y=0;y<FIELDS_SIZE.height;y+=4){
      expect(Array.from({length:27},(_,i)=>440+i*32).some(x=>coastWaterDepth(x,y)>0)).toBe(true);
    }
  });
  it('conecta a praia com o mar e restringe o píer à entrada de terra',()=>{
    const layout=createCoastLayout(),[start]=layout.pierEntries;
    expect(layout.blocked(start.x,start.y)).toBe(false);
    expect(layout.inWater(start.x,start.y)).toBe(false);
    expect(layout.allowsStep(start,{x:start.x+22,y:start.y})).toBe(true);
    const deck={x:start.x+366,y:start.y},above={x:deck.x,y:deck.y-35},below={x:deck.x,y:deck.y+35};
    expect(layout.water(deck.x,deck.y)).toBe(true);
    expect(layout.inWater(deck.x,deck.y)).toBe(false);
    for(const swimmer of [above,below]){
      expect(layout.inWater(swimmer.x,swimmer.y)).toBe(true);
      expect(layout.allowsStep(swimmer,deck)).toBe(false);
      expect(layout.allowsStep(deck,swimmer)).toBe(false);
    }
    // Da areia para o mar a pé, sem degrau: a praia é contínua.
    const x=40*32,y=(57.6)*32;
    expect(coastShoreDistance(x,y)).toBeLessThan(0);
    expect(layout.allowsStep({x,y},{x,y:y+60})).toBe(true);
    expect(layout.inWater(x,y+60)).toBe(true);
  });
  it('mantém as peças separadas e aceita edição e salvamento compatíveis',()=>{
    const ids=COAST_ORIGINAL_OBJECTS.map(o=>o.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(500);
    for(const kind of COAST_KINDS)expect(existsSync(`public/assets/visual/coast/${kind.slice(6)}.png`),kind).toBe(true);
    const save=createNewSave(createCharacterProfile('Costa'));
    save.activeArea='coast';
    save.coastPosition={x:700,y:320,direction:'right'};
    const map=readSceneMap(save,'coast');
    const boat=COAST_ORIGINAL_OBJECTS.find(o=>o.kind==='coast-boat')!;
    map.objects[boat.id]={x:boat.x,y:boat.y+1};
    const tile='40,32';
    map.terrain[tile]='sand';map.collisions={[tile]:'blocked'};
    writeSceneMap(save,'coast',map);
    expect(validateMapEdits(map)).toBe(true);
    expect(validateMapEdits({...map,area:'railway'})).toBe(false);
    expect(createCoastLayout(map).objects.find(o=>o.id===boat.id)?.y).toBe(boat.y+1);
    expect(createCoastLayout(map).blocked(40.5*32,32.5*32)).toBe(true);
    const loaded=migrateSave(JSON.parse(JSON.stringify(save)));
    expect(loaded?.coastMapEdits).toEqual(map);
    expect(loaded?.coastPosition).toEqual(save.coastPosition);
    expect(validateSave({...save,coastPosition:{x:-1,y:450}})).toBe(false);
  });
});

describe('Rio dos Campos Abertos',()=>{
  it('corta os Campos de norte a sul sem engolir árvores, tufos nem a trilha',()=>{
    expect(fieldsWater(FIELDS_RIVER[0][0],40)).toBe(true);
    expect(FIELDS_PROPS.every(p=>!fieldsWater(p.x,p.y))).toBe(true);
    expect(MEADOW_PATCHES.every(p=>!fieldsWater(p.x,p.y))).toBe(true);
    expect(new Set(MEADOW_PATCHES.map(p=>p.id)).size).toBe(MEADOW_PATCHES.length);
    for(const a of FIELDS_ANIMALS)expect(fieldsWater(a.x,a.y),a.id).toBe(false);
    // As trilhas nunca entram na água: o rio só é cruzado pelas pontes.
    for(const trail of FIELDS_TRAILS)for(let i=1;i<trail.length;i++)for(let t=0;t<=1;t+=.05){
      const x=trail[i-1][0]+(trail[i][0]-trail[i-1][0])*t,y=trail[i-1][1]+(trail[i][1]-trail[i-1][1])*t;
      expect(fieldsRiverEdge(x,y),`${Math.round(x)},${Math.round(y)}`).toBeGreaterThan(20);
    }
  });
  it('animais desviam da água; o jogador nada ou cruza pelas pontes, entrando pelas cabeceiras',()=>{
    const p={x:FIELDS_RIVER[2][0],y:FIELDS_RIVER[2][1]};
    expect(fieldsBlocked(p.x,p.y)).toBe(true);
    expect(fieldsSolid(p.x,p.y)).toBe(false);
    expect(FIELDS_BRIDGES).toHaveLength(2);
    for(const b of FIELDS_BRIDGES){
      const y=(b.y+1)*32,left=b.x*32,right=(b.x+b.width)*32,mid=(left+right)/2;
      // O rio passa por baixo da ponte, e as duas cabeceiras ficam em terra.
      expect(fieldsRiverEdge(mid,y)).toBeLessThan(0);
      expect(fieldsWater(mid,y)).toBe(false);
      expect(fieldsWater(left-6,y)).toBe(false);
      expect(fieldsWater(right+6,y)).toBe(false);
      expect(fieldsSolid(mid,b.y*32+2)).toBe(true);
      expect(mapBridgeAllowsStep(FIELDS_BRIDGES,left-6,y,left+6,y,fieldsWater)).toBe(true);
      // Subir na ponte pela água do lado não vale.
      const below={x:mid,y:(b.y+b.height)*32+6};
      if(fieldsWater(below.x,below.y))expect(mapBridgeAllowsStep(FIELDS_BRIDGES,below.x,below.y,mid,y,fieldsWater)).toBe(false);
    }
  });
});

describe('Saves antigos dos Campos com o rio novo',()=>{
  it('apaga só os cortes das moitas cobertas pelo rio e aceita o jogador salvo nadando',()=>{
    const save=createNewSave(createCharacterProfile('Rio'));
    save.day=9;
    const kept=MEADOW_PATCHES[0].id,gone=[...FIELDS_RETIRED_PATCHES][0];
    expect(gone).toBeDefined();
    const old={...save,openFields:{version:1,cut:{[kept]:3,[gone]:4}}};
    // O save como estava antes do rio não passa direto na validação nova...
    expect(validateSave(old)).toBe(false);
    // ...mas a migração recupera, mantendo o corte da moita que continua lá.
    const loaded=migrateSave(JSON.parse(JSON.stringify(old)))!;
    expect(loaded).not.toBeNull();
    expect(loaded.openFields!.cut).toEqual({[kept]:3});
    expect(migrateSave(JSON.parse(JSON.stringify(loaded)))!.openFields!.cut).toEqual({[kept]:3});
    const swim={x:FIELDS_RIVER[3][0],y:FIELDS_RIVER[3][1]};
    expect(fieldsSafe(swim)).toBe(false);
    expect(fieldsPlayerSafe(swim)).toBe(true);
  });
});
