import {describe,expect,it,vi} from 'vitest';
import {createRuinsLayout, ruinsRoadDistance, RUINS_ROAD_HALF_WIDTH} from '../src/data/ruins';
import {CITY_ROAD_Y,CITY_RUINS_EXIT,CITY_RUINS_RETURN,RUINS_ENTRY,RUINS_EXIT,RUINS_ROAD_Y,tileMidpoint} from '../src/data/ruins-road';
import {cityForestBlockedPoint,cityRoadDistance,cityForestTerrain} from '../src/data/city-forest';
import {defaultMap} from '../src/data/default-maps';
import {createCharacterProfile} from '../src/data/characters';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {MapExitPassage} from '../src/systems/map-transition';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';
import {validateMapEdits} from '../src/systems/map-editor';
import {inspectRuins} from '../src/systems/ruins-discoveries';
import {RUIN_KINDS} from '../src/data/ruins-art';
import {RUINS_LANDMARKS} from '../src/data/ruins-story';

describe('Ruínas na Estrada da Cidade',()=>{
  it('continua o mesmo asfalto a leste e só atravessa andando para fora',()=>{
    expect(RUINS_ROAD_HALF_WIDTH).toBe(3.16);
    for(const offset of [-3,-1,0,1,3])expect(ruinsRoadDistance(RUINS_ROAD_Y+offset)).toBe(cityRoadDistance(96,CITY_ROAD_Y+offset));
    expect(CITY_RUINS_EXIT.y-CITY_ROAD_Y).toBe(RUINS_EXIT.y-RUINS_ROAD_Y);
    const city=tileMidpoint(CITY_RUINS_EXIT),ruins=tileMidpoint(RUINS_EXIT);
    const forward=new MapExitPassage(),back=new MapExitPassage();
    expect(forward.update(city,city,CITY_RUINS_EXIT,CITY_RUINS_RETURN)).toBe(false);
    expect(forward.update({...city,x:city.x-24},city,CITY_RUINS_EXIT,CITY_RUINS_RETURN)).toBe(true);
    expect(back.update({...ruins,x:ruins.x+24},ruins,RUINS_EXIT,RUINS_ENTRY)).toBe(true);
    for(const dy of [-24,0,24])expect(cityForestBlockedPoint(city.x,city.y+dy)).toBe(false);
    expect(createRuinsLayout().blocked(ruins.x,ruins.y)).toBe(false);
  });

  it('mantém aberta a saída mesmo com pintura ou objetos antigos e preserva suas edições no save',()=>{
    const map=defaultMap('cityForest');
    map.objects['editor-pine-crossing']={...CITY_RUINS_RETURN,kind:'pine'};
    map.terrain['94,10']='water';
    expect(validateMapEdits(map)).toBe(true);
    for(const p of [CITY_RUINS_RETURN,CITY_RUINS_EXIT]){
      const {x,y}=tileMidpoint(p);
      expect(cityForestBlockedPoint(x,y,map)).toBe(false);
    }
    expect(cityForestTerrain(map)?.['94,10']).toBeUndefined();
    expect(map.terrain['94,10']).toBe('water');
  });

  it('mantém livre o centro do arco e bloqueia só as bases das peças',()=>{
    const layout=createRuinsLayout();
    const arch=tileMidpoint(layout.objects.find(o=>o.kind==='ruin-arch')!);
    for(const dx of [-60,60])expect(layout.blocked(arch.x+dx,arch.y)).toBe(true);
    expect(layout.blocked(arch.x,arch.y)).toBe(false);
    const steps=tileMidpoint(layout.objects.find(o=>o.kind==='ruin-steps')!);
    expect(layout.blocked(steps.x,steps.y)).toBe(false);
    for(let y=12*32;y<22*32;y+=8){
      expect(layout.blocked(arch.x-7,y)).toBe(false);
      expect(layout.blocked(arch.x+7,y)).toBe(false);
    }
  });

  it('salva as posições, a colisão e os marcos editados',()=>{
    const data=createNewSave(createCharacterProfile('Visitante'));
    data.activeArea='ruins';data.ruinsPosition={...tileMidpoint(RUINS_ENTRY),direction:'right'};
    const map=defaultMap('ruins'),point={x:14,y:14};
    map.objects['ruin-waystone-18-8']=point;
    map.collisions={'11,19':'blocked'};
    map.terrain['23,20']='paving';
    writeSceneMap(data,'ruins',map);
    expect(validateSave(data)).toBe(true);
    const restored=migrateSave(JSON.parse(JSON.stringify(data)))!;
    const layout=createRuinsLayout(readSceneMap(restored,'ruins'));
    const {x,y}=tileMidpoint(point);
    expect(layout.inspectNear(x,y)?.name).toBe('Marco da estrada');
    const block=tileMidpoint({x:11,y:19});
    expect(layout.blocked(block.x,block.y)).toBe(true);
    expect(restored.ruinsPosition).toEqual(data.ruinsPosition);
    expect(validateMapEdits({...map,area:'forest'})).toBe(false);
  });

  it('inclui as 32 peças e mantém livres o asfalto e as inspeções do posto',()=>{
    const layout=createRuinsLayout();
    const kinds=new Set(layout.objects.map(o=>o.kind));
    expect(RUIN_KINDS).toHaveLength(32);
    expect(RUIN_KINDS.every(kind=>kinds.has(kind))).toBe(true);
    const center=tileMidpoint(RUINS_ENTRY);
    for(let x=40;x<3032;x+=16)expect(layout.blocked(x,center.y)).toBe(false);

    const clear=(x:number,y:number)=>[[-7,-5],[7,-5],[-7,3],[7,3]]
      .every(([dx,dy])=>!layout.blocked(x+dx,y+dy));
    const queue=[center],visited=new Set<string>([`${center.x},${center.y}`]),landmarks=new Set<string>();
    for(let i=0;i<queue.length&&landmarks.size<Object.keys(RUINS_LANDMARKS).length;i++){
      const {x,y}=queue[i],mark=layout.inspectNear(x,y);
      if(mark)landmarks.add(mark.name);
      for(const [dx,dy] of [[16,0],[-16,0],[0,16],[0,-16]]){
        const next={x:x+dx,y:y+dy},key=`${next.x},${next.y}`;
        if(visited.has(key)||!clear(next.x,next.y))continue;
        visited.add(key);queue.push(next);
      }
    }
    expect([...landmarks].sort()).toEqual(Object.values(RUINS_LANDMARKS).map(o=>o.name).sort());
  });

  it('guarda pistas em qualquer ordem e entrega o mapa uma vez, depois de salvar',()=>{
    const data=createNewSave(createCharacterProfile('Visitante'));
    const pedestal=RUINS_LANDMARKS['ruin-plinth-52-51'];
    const persist=vi.fn((next)=>validateSave(next));
    expect(inspectRuins(data,pedestal,persist).join(' ')).toMatch(/Ainda falta examinar/);
    expect(persist).not.toHaveBeenCalled();
    const failed=vi.fn(()=>false);
    const wagon=RUINS_LANDMARKS['ruin-cart-16-15'];
    expect(inspectRuins(data,wagon,failed).join(' ')).toMatch(/guardar esta pista/);
    expect(data.ruinsClues).toBeUndefined();
    inspectRuins(data,wagon,persist);
    inspectRuins(data,wagon,persist);
    inspectRuins(data,RUINS_LANDMARKS['ruin-facade-46-40'],persist);
    inspectRuins(data,RUINS_LANDMARKS['ruin-waystone-18-8'],persist);
    expect(data.ruinsClues).toEqual(['wagon','workshop','milestone']);
    expect(persist).toHaveBeenCalledTimes(3);
    const restored=migrateSave(JSON.parse(JSON.stringify(data)))!;
    expect(inspectRuins(restored,pedestal,failed).join(' ')).toMatch(/salvar/);
    expect(restored.inventory.oldMap).toBe(0);
    expect(restored.ruinsMapFound).toBeUndefined();
    expect(inspectRuins(restored,pedestal,persist).join(' ')).toMatch(/Você encontrou/);
    expect(restored.inventory.oldMap).toBe(1);
    expect(restored.ruinsMapFound).toBe(true);
    const finished=migrateSave(JSON.parse(JSON.stringify(restored)))!;
    expect(inspectRuins(finished,pedestal,persist).join(' ')).toMatch(/vazio/);
    expect(persist).toHaveBeenCalledTimes(4);
    expect(finished.inventory.oldMap).toBe(1);
  });
});
