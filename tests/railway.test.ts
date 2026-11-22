import {describe,expect,it} from 'vitest';
import {
  createRailwayLayout, onPlatform, PLATFORM, PLATFORM_RAMP, PLATFORM_STAIRS, RAILWAY_CROSSINGS, RAILWAY_LANDMARKS, RAILWAY_LINES,
  RAILWAY_ORIGINAL_OBJECTS, RAILWAY_ROAD_HALF_WIDTH, railwayGravelDistance, railwayRoadDistance, STATION_DOOR,
} from '../src/data/railway';
import {RAILWAY_ART, RAILWAY_KINDS} from '../src/data/railway-art';
import {
  RAILWAY_ENTRY, RAILWAY_EXIT, RAILWAY_ROAD_Y, RUINS_RAILWAY_EXIT, RUINS_RAILWAY_RETURN, railwayRoadProtected, ruinsRailwayRoadProtected, tileMidpoint,
} from '../src/data/ruins-road';
import {createRuinsLayout, ruinsRoadDistance, RUINS_ROAD_HALF_WIDTH} from '../src/data/ruins';
import {createRailwayHallLayout, HALL_COUNTER, RAILWAY_HALL_ENTRY, RAILWAY_HALL_EXIT, HALL_DOOR, HALL_FRONT, HALL_TEXTURES} from '../src/data/railway-hall';
import {defaultMap} from '../src/data/default-maps';
import {AREA_NAMES} from '../src/data/area-names';
import {createCharacterProfile} from '../src/data/characters';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {MapExitPassage} from '../src/systems/map-transition';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';
import {validateMapEdits} from '../src/systems/map-editor';
import {natureArt} from '../src/data/nature-catalog';
import {validWorldPetState, worldPetLocation, type WorldPetState} from '../src/dungeons/world-pet-state';
import fs from 'node:fs';

const free=(blocked:(x:number,y:number)=>boolean,p:{x:number;y:number})=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!blocked(p.x+dx,p.y+dy));

describe('Estação Ferroviária',()=>{
  it('continua a estrada das Ruínas com a mesma largura e atravessa nos dois sentidos',()=>{
    expect(RAILWAY_ROAD_HALF_WIDTH).toBe(RUINS_ROAD_HALF_WIDTH);
    for(const offset of [-3,0,2])expect(railwayRoadDistance(RAILWAY_ROAD_Y+offset)).toBe(ruinsRoadDistance(RAILWAY_ROAD_Y+offset));
    const ruins=tileMidpoint(RUINS_RAILWAY_EXIT),station=tileMidpoint(RAILWAY_EXIT);
    const forward=new MapExitPassage(),back=new MapExitPassage();
    expect(forward.update(ruins,ruins,RUINS_RAILWAY_EXIT,RUINS_RAILWAY_RETURN)).toBe(false);
    expect(forward.update({...ruins,x:ruins.x-24},ruins,RUINS_RAILWAY_EXIT,RUINS_RAILWAY_RETURN)).toBe(true);
    expect(back.update({...station,x:station.x+24},station,RAILWAY_EXIT,RAILWAY_ENTRY)).toBe(true);
    // Chegadas livres e fora dos gatilhos, nos dois mapas, mesmo com colisão pintada por cima.
    const painted=(area:'ruins'|'railway',p:{x:number;y:number})=>({...defaultMap(area),collisions:{[`${p.x},${p.y}`]:'blocked' as const}});
    expect(free(createRuinsLayout(painted('ruins',RUINS_RAILWAY_RETURN)).blocked,tileMidpoint(RUINS_RAILWAY_RETURN))).toBe(true);
    expect(free(createRailwayLayout(painted('railway',RAILWAY_ENTRY)).blocked,tileMidpoint(RAILWAY_ENTRY))).toBe(true);
    expect(ruinsRailwayRoadProtected(RUINS_RAILWAY_RETURN.x,RUINS_RAILWAY_RETURN.y)).toBe(true);
    expect(railwayRoadProtected(RAILWAY_ENTRY.x,RAILWAY_ENTRY.y)).toBe(true);
    expect(railwayRoadProtected(40,30)).toBe(false);
    expect(AREA_NAMES.railway).toBe('Estação Ferroviária');
  });
  it('usa peças do kit com arquivo, ids estáveis e únicos e cadastro no editor',()=>{
    for(const kind of RAILWAY_KINDS){
      expect(fs.existsSync(`public/assets/visual/railway/${RAILWAY_ART[kind].file}.png`),kind).toBe(true);
      expect(natureArt(kind)?.label).toBe(RAILWAY_ART[kind].label);
    }
    const ids=RAILWAY_ORIGINAL_OBJECTS.map(o=>o.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('rail-station-52-31');
    for(const id of Object.keys(RAILWAY_LANDMARKS))expect(ids).toContain(id);
  });
  it('a face sul da plataforma bloqueia, com passagem pela escada e pela rampa',()=>{
    const {blocked}=createRailwayLayout(),edge=PLATFORM.bottom*32-6;
    for(let x=PLATFORM_STAIRS.right+20;x<PLATFORM_RAMP.left-8;x+=37)expect(blocked(x,edge),`x=${x}`).toBe(true);
    for(const x of [PLATFORM_STAIRS.left+48,PLATFORM_RAMP.left+40])expect(blocked(x,edge),`passagem ${x}`).toBe(false);
    expect(onPlatform(50,35)).toBe(true);expect(onPlatform(50,39)).toBe(false);
    // O vão entre as linhas e as travessias são caminháveis.
    for(const c of RAILWAY_CROSSINGS)expect(blocked(c.left+48,RAILWAY_LINES[c.line]*32)).toBe(false);
    expect(blocked(20*32,44*32)).toBe(false);
  });
  it('a porta do prédio leva à sala de espera e os pontos de examinar respondem',()=>{
    const layout=createRailwayLayout();
    expect(layout.door).toEqual({x:STATION_DOOR.x,y:Math.round(STATION_DOOR.y)});
    const front={x:layout.door!.x,y:layout.door!.y+22};
    expect(free(layout.blocked,front)).toBe(true);
    expect(layout.inspectNear(front.x,front.y)?.hall).toBe(true);
    const sign=RAILWAY_ORIGINAL_OBJECTS.find(o=>o.id==='rail-sign-44-33')!;
    expect(layout.inspectNear((sign.x+.5)*32+(sign.ox??0),(sign.y+.5)*32+(sign.oy??0)+20)?.name).toBe('Placa da estação');
  });
  it('a sala de espera tem chegada livre, saída ao sul e a bilheteria',()=>{
    const hall=createRailwayHallLayout();
    expect(free(hall.blocked,tileMidpoint(RAILWAY_HALL_ENTRY))).toBe(true);
    const exit=tileMidpoint(RAILWAY_HALL_EXIT);
    expect(exit.x>HALL_DOOR.left&&exit.x<HALL_DOOR.right).toBe(true);
    expect(hall.blocked(exit.x,exit.y)).toBe(false);
    expect(hall.blocked(HALL_DOOR.left-30,HALL_FRONT+12)).toBe(true);
    expect(new MapExitPassage().update({...exit,y:exit.y-24},exit,RAILWAY_HALL_EXIT,RAILWAY_HALL_ENTRY)).toBe(true);
    expect(hall.inspectNear(HALL_COUNTER.x,HALL_COUNTER.y+24)?.name).toBe('Bilheteria');
  });
  it('usa a arte frontal e preserva o corredor entre a entrada e a bilheteria',()=>{
    const hall=createRailwayHallLayout();
    for(const file of HALL_TEXTURES)expect(fs.existsSync(`public/assets/visual/railway/interior-frontal/${file}.png`),file).toBe(true);
    for(let y=302;y<=533;y+=4)expect(free(hall.blocked,{x:432,y}),`corredor em ${y}`).toBe(true);
    for(let x=236;x<=432;x+=4)expect(free(hall.blocked,{x,y:296}),`acesso à bilheteria em ${x}`).toBe(true);
    expect(hall.blocked(236,249)).toBe(true);
    expect(hall.blocked(673,240)).toBe(true);
    expect(hall.blocked(301,421)).toBe(false);
  });
  it('mantém as trilhas irregulares caminháveis no encontro com a estrada e a plataforma',()=>{
    const exterior=createRailwayLayout();
    for(const [x,y] of [[38.8,6.8],[40.9,16.4],[47,32.5],[66,6.8],[63.1,16.2],[57,32.5],[67.5,50]]){
      expect(railwayGravelDistance(x,y)).toBeCloseTo(0);
      expect(free(exterior.blocked,{x:x*32,y:y*32})).toBe(true);
    }
  });
  it('espalha manchas de capim alto pelo terreno e respeita os acessos e a edição no F2',()=>{
    const layout=createRailwayLayout(),grass=layout.objects.filter(o=>o.overgrown);
    expect(grass.length).toBeGreaterThan(1200);
    for(const [minX,maxX,minY,maxY] of [[0,48,9,34],[48,96,9,34],[0,48,45,72],[48,96,45,72]]){
      expect(grass.filter(o=>o.x>=minX&&o.x<maxX&&o.y>=minY&&o.y<maxY).length).toBeGreaterThan(130);
    }
    for(const tuft of grass){
      expect(railwayRoadDistance(tuft.y+.5)).toBeGreaterThan(4.5);
      expect(onPlatform(tuft.x,tuft.y)).toBe(false);
      const p=layout.pivot(tuft);
      expect(layout.blocked(p.x,p.y),tuft.id).toBe(false);
    }
    const [paved,moved,removed]=grass;
    const edits=defaultMap('railway');
    edits.terrain[`${paved.x},${paved.y}`]='paving';
    edits.objects[moved.id]={x:moved.x+1,y:moved.y};
    edits.objects[removed.id]={x:removed.x,y:removed.y,removed:true};
    const updated=createRailwayLayout(edits).objects;
    expect(updated.some(o=>o.id===paved.id||o.id===removed.id)).toBe(false);
    expect(updated.find(o=>o.id===moved.id)).toMatchObject({x:moved.x+1,y:moved.y});
  });
  it('permite ao companheiro esperar na sala com sua posição identificada',()=>{
    const pet:WorldPetState={mode:'stay',area:'railway',space:'railway-hall',x:423,y:388,direction:'south'};
    expect(validWorldPetState(pet)).toBe(true);
    expect(worldPetLocation(pet)).toBe('Estação Ferroviária · Sala de espera');
    expect(worldPetLocation({...pet,space:'outdoors'})).toBe('Estação Ferroviária');
  });
  it('salva posição, sala e edições do mapa, e recusa valores fora dos limites',()=>{
    const save=createNewSave(createCharacterProfile('Amiga'));
    save.activeArea='railway';save.railwayPosition={x:300,y:200,direction:'left'};
    const map=readSceneMap(save,'railway');map.objects['rail-bench-37-34']={x:30,y:35};
    writeSceneMap(save,'railway',map);
    expect(validateMapEdits(save.railwayMapEdits)).toBe(true);
    expect(createRailwayLayout(save.railwayMapEdits).objects.find(o=>o.id==='rail-bench-37-34')).toMatchObject({x:30,y:35});
    save.railwayHallPosition={...tileMidpoint(RAILWAY_HALL_ENTRY),direction:'up'};
    const loaded=migrateSave(JSON.parse(JSON.stringify(save)))!;
    expect(validateSave(loaded)).toBe(true);
    expect(loaded.railwayHallPosition).toEqual(save.railwayHallPosition);
    expect(validateSave({...loaded,railwayPosition:{x:-5,y:200}})).toBe(false);
    expect(validateSave({...loaded,activeArea:'ruins'})).toBe(false);
    expect(validateSave({...loaded,railwayMapEdits:{...save.railwayMapEdits!,area:'ruins'}})).toBe(false);
    // Peças da Estação não valem em outro mapa.
    const ruinsMap={...defaultMap('ruins'),objects:{'rail-bench-37-34':{x:30,y:35}}};
    expect(validateMapEdits(ruinsMap)).toBe(false);
  });
});
