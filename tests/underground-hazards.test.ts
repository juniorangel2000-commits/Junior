import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {ensureUnderground,undergroundFits,undergroundBlocked,excavateMineBlock,mineBlockNode,mineTargetVisible} from '../src/systems/underground';
import {ensureMineHazards,UndergroundHazards,registerMineNoise,mineGasRegions,mineContaminated} from '../src/systems/underground-hazards';
import {MINE_HAZARDS as B} from '../src/data/underground-hazards';
import {mineDepth,mineZone,mineCellIndex,UNDERGROUND} from '../src/data/underground-layout';
import {validMineHazards,type MineHazardState} from '../src/systems/underground-hazard-state';
import {mineDarkness,mineLightPolygon} from '../src/systems/underground-light';
import {recoverMineDefeat} from '../src/systems/underground-recovery';
import {consumeInField} from '../src/systems/field-inventory';
import {Home} from '../src/systems/home';
import {mineProtectedActors} from '../src/systems/underground-renewal';
import {DUNGEON_BALANCE,WEAPONS} from '../src/dungeons/config';
const fresh=()=>{const s=createNewSave(createCharacterProfile('Perigos QA'));s.activeArea='highland';const mine=ensureUnderground(s),h=ensureMineHazards(mine);return{s,mine,h,run:new UndergroundHazards(()=>s.underground!)};};
const empty=()=>{const f=fresh();f.h.zombies=[];f.h.bats=[];return f;};
const point={x:79*32+16,y:165*32+16};
describe('persistent underground hazards',()=>{
 it('initializes once, increases zombie density by depth, uses native stats and keeps actors on walkable floor',()=>{
  const {s,mine,h}=fresh(),again=fresh();expect(h).toEqual(again.h);expect(ensureMineHazards(mine)).toBe(h);
  for(const band of ['surface','middle','deep','extreme'] as const)expect(h.zombies.filter(z=>mineDepth(Math.floor(z.y/32))===band)).toHaveLength(B.zombies[band]);
  expect(h.zombies.every(z=>z.hp===DUNGEON_BALANCE.enemyHealth&&undergroundFits(mine,z.x,z.y))).toBe(true);expect(new Set(h.bats.map(b=>b.mood)).size).toBe(3);
  expect(h.bats.every(b=>undergroundFits(mine,b.x,b.y))).toBe(true);expect(validateSave(s)).toBe(true);
 });
 it.each([10,30,60,144])('drains exactly 2%% max HP/s at %i FPS and stops on exit',fps=>{
  const {mine,h,run}=empty(),p=mineGasRegions(mine)[0];expect(mineContaminated(mine,p)).toBe(true);let warnings=0;
  for(let i=0;i<fps*4;i++)warnings+=run.advance(1/fps,p).filter(e=>e==='gas-enter').length;
  expect(h.hp).toBeCloseTo(B.maxHealth*.92,7);expect(warnings).toBe(1);const hp=h.hp;expect(run.advance(.1,point)).toContain('gas-leave');run.advance(2,point);expect(h.hp).toBeCloseTo(hp,7);
 });
 it('does not turn contact grace into immunity to gas and preserves health on reload',()=>{
  const {s,mine,h,run}=empty();h.invulnerable=.65;run.advance(.5,mineGasRegions(mine)[1]);expect(h.hp).toBeCloseTo(99);const saved=JSON.parse(JSON.stringify(s)),loaded=migrateSave(saved)!;expect(validateSave(loaded)).toBe(true);ensureMineHazards(loaded.underground!);expect(loaded.underground!.hazards!.hp).toBeCloseTo(99);
 });
 it('telegraphs the full escape window, hits once for the configured high damage and never blocks a route',()=>{
  const {mine,h,run}=empty();h.cave.active={...point,stage:'warning',remaining:B.caveIn.warningSeconds};h.invulnerable=.6;
  run.advance(2.7,point);expect(h.hp).toBe(100);expect(h.cave.active?.stage).toBe('warning');const events=run.advance(.11,point);expect(events.filter(e=>e==='collapse-impact')).toHaveLength(1);expect(h.hp).toBe(55);
  const copy=structuredClone(mine),resumed=new UndergroundHazards(()=>copy);resumed.advance(1,point);expect(copy.hazards!.hp).toBe(55);expect(copy.hazards!.cave.active).toBeUndefined();expect(copy.changes).toEqual({});expect(undergroundFits(copy,point.x,point.y)).toBe(true);
 });
 it('allows escaping the marked cave-in before impact',()=>{const {h,run}=empty();h.cave.active={...point,stage:'warning',remaining:2.8};run.advance(3,{x:point.x+90,y:point.y});expect(h.hp).toBe(100);});
 it('keeps sleeping zombies dormant behind walls, but mining noise wakes them without teleporting',()=>{
  const {mine,h,run}=empty(),z={id:1,x:point.x+260,y:point.y,hp:20,mode:'dormant' as const,alert:0};h.zombies=[z];run.advance(.1,point);expect(z.mode).toBe('dormant');const old={x:z.x,y:z.y};registerMineNoise(mine,point);expect(z.mode).toBe('alert');expect(z).toMatchObject(old);expect(h.zombies[0].goal).toEqual(point);
 });
 it('uses dungeon contact damage and grace rather than one hit per frame',()=>{
  const {h,run}=empty();h.zombies=[{id:1,...point,hp:20,mode:'dormant',alert:0}];run.advance(.5,point);expect(h.hp).toBe(100-DUNGEON_BALANCE.enemyDamage);run.advance(.21,point);expect(h.hp).toBe(100-DUNGEON_BALANCE.enemyDamage*2);
 });
 it('uses existing equipped-sword stats, effect, arc, collision and persistent cooldown with no kill loot',()=>{
  const {s,h,run}=empty();s.inventory.sword=1;s.worldWeapon='unarmed';h.zombies=[{id:1,x:point.x+40,y:point.y,hp:20,mode:'dormant',alert:0},{id:2,x:point.x-40,y:point.y,hp:20,mode:'dormant',alert:0}];
  expect(run.attack(s,point,0).effect).toBeUndefined();s.worldWeapon='sword';const inventory=structuredClone(s.inventory),a=run.attack(s,point,0);expect(a.hits).toBe(1);expect(a.effect).toMatchObject({weapon:'sword',radius:WEAPONS.sword.range,ttl:.22});expect(h.zombies[0].hp).toBe(0);expect(h.zombies[1].hp).toBe(20);expect(run.attack(s,point,Math.PI).hits).toBe(0);expect(h.swordCooldown).toBe(WEAPONS.sword.cooldown);expect(s.inventory).toEqual(inventory);
 });
 it('rolls back noise, cave-in sequence, wear and inventory when the mining save fails',()=>{
  const {s,mine,h}=empty();s.inventory.pickaxe=1;let face:undefined|{x:number;y:number;origin:{x:number;y:number}};
  for(let y=150;y<169&&!face;y++)for(let x=30;x<140&&!face;x++)if(mineBlockNode(mine,x,y))for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const origin={x:(x+dx)*32+16,y:(y+dy)*32+16};if(undergroundFits(mine,origin.x,origin.y)&&mineTargetVisible(mine,origin,{x,y})){face={x,y,origin};break;}}
  expect(face).toBeDefined();const before=structuredClone(s);expect(excavateMineBlock(s,face!.origin,face!,'pickaxe',draft=>{registerMineNoise(draft.underground!,face!.origin);return false;}).ok).toBe(false);expect(s).toEqual(before);expect(h.cave.sequence).toBe(0);
 });
 it('replans through newly excavated cells and never crosses intact walls',()=>{
  const {mine,h,run}=empty();let base:undefined|{x:number;y:number};
  for(let y=135;y<160&&!base;y++)for(let x=10;x<140&&!base;x++){let yes=true;for(let dy=0;dy<8;dy++)for(let dx=0;dx<10;dx++)if(mineZone(mine.seed,x+dx,y+dy)==='protected'||!undergroundBlocked(mine,(x+dx)*32+16,(y+dy)*32+16))yes=false;if(yes)base={x,y};}
  expect(base).toBeDefined();const b=base!,dig=(x:number,y:number)=>{mine.changes[mineCellIndex(b.x+x,b.y+y)]={dug:true,dugDay:1,mineral:'stone'};};
  for(let x=1;x<=7;x++){dig(x,1);dig(x,5);}for(let y=1;y<=5;y++)dig(1,y);mine.revision++;
  const p={x:(b.x+7)*32+16,y:(b.y+5)*32+16},z={id:1,x:p.x,y:(b.y+1)*32+16,hp:20,mode:'alert' as const,alert:14,goal:p};h.zombies=[z];
  run.advance(.5,p);expect(z.x).toBeLessThan(p.x);expect(undergroundFits(mine,z.x,z.y)).toBe(true);
  for(let y=2;y<5;y++)dig(7,y);mine.revision++;
  for(let i=0;i<110;i++){run.advance(.05,p);expect(undergroundFits(mine,z.x,z.y)).toBe(true);}expect(Math.hypot(z.x-p.x,z.y-p.y)).toBeLessThan(25);
 });
 it('keeps peaceful bats harmless, reactive bats defensive and an aggressive dive limited to one light hit',()=>{
  const {mine,h,run}=empty();const bat=(mood:'peaceful'|'reactive'|'aggressive')=>({id:100,hp:6,x:point.x+20,y:point.y,home:{x:point.x+20,y:point.y},state:'roost' as const,mood,remaining:0});
  h.bats=[bat('peaceful')];run.advance(.05,point);expect(h.bats[0].state).toBe('flee');run.advance(2,point);expect(h.hp).toBe(100);
  h.bats=[bat('reactive')];run.advance(.05,point);expect(h.bats[0].state).toBe('warning');
  h.bats=[bat('aggressive')];run.advance(1.4,point);expect(h.hp).toBe(100-B.bats.damage);expect(h.bats[0].state).toBe('flee');expect(undergroundFits(mine,h.bats[0].x,h.bats[0].y)).toBe(true);
 });
 it('rejects corrupted hazard states and retains legacy saves with no hazards',()=>{
  const {s,h}=fresh();expect(validMineHazards(h)).toBe(true);for(const edit of[(h:MineHazardState)=>{h!.hp=NaN;},(h:MineHazardState)=>{h!.cave.active={x:20,y:20,stage:'warning',remaining:-1};},(h:MineHazardState)=>{h!.zombies.push({...h!.zombies[0]});}]){const copy=structuredClone(s);edit(copy.underground!.hazards!);expect(validateSave(copy)).toBe(false);}delete s.underground!.hazards;expect(validateSave(s)).toBe(true);
 });
 it('protects live enemies and bat roosts from resource regeneration',()=>{const {s,h}=fresh(),actors=mineProtectedActors(s);expect(actors).toContain(h.zombies[0]);expect(actors).toContain(h.bats[0].home);});
 it('a bat trapped in a closed pocket stores a plain position rather than nesting previous flight states',()=>{
  const {mine,h}=empty();let p:undefined|{x:number;y:number};for(let y=138;y<160&&!p;y++)for(let x=12;x<140&&!p;x++)if(mineZone(mine.seed,x,y)!=='protected'&&[[-3,0],[3,0],[0,-3],[0,3],[0,0]].every(([dx,dy])=>undergroundBlocked(mine,(x+dx)*32+16,(y+dy)*32+16)))p={x,y};
  expect(p).toBeDefined();mine.changes[mineCellIndex(p!.x,p!.y)]={dug:true,dugDay:1,mineral:'stone'};const at={x:p!.x*32+16,y:p!.y*32+16};h.bats=[{id:100,...at,hp:6,home:{...at},mood:'peaceful',state:'roost',remaining:0}];
  for(let i=0;i<5;i++)registerMineNoise(mine,{x:at.x-1,y:at.y});expect(Object.keys(h.bats[0].goal!).sort()).toEqual(['x','y']);expect(validMineHazards(h)).toBe(true);
 });
});
describe('mine lighting and recovery',()=>{
 it('dims by depth, reuses the carried lantern and bounds light against intact walls',()=>{
  const {mine}=empty();const bands=[165,110,65,22].map(y=>mineDarkness(y*32));expect(bands.map(b=>b.alpha)).toEqual([...bands.map(b=>b.alpha)].sort());expect(bands[0].radius).toBeGreaterThan(bands[3].radius);expect(mineDarkness(22*32,true).radius).toBeGreaterThan(bands[3].radius);expect(mineDarkness(UNDERGROUND.entryY+342).alpha).toBe(0);
  const polygon=mineLightPolygon(mine,point,190);expect(polygon).toHaveLength(96);expect(polygon.every(p=>Math.hypot(p.x-point.x,p.y-point.y)<=190.001)).toBe(true);expect(polygon.some(p=>Math.hypot(p.x-point.x,p.y-point.y)<190)).toBe(true);
 });
 it('reuses existing healing items atomically even at full vigor, without adding items',()=>{
  const {s,h}=empty();h.hp=50;s.villageProgress!.vigor=100;s.inventory.bandage=1;const before=structuredClone(s);expect(consumeInField(s,'bandage',()=>false).ok).toBe(false);expect(s).toEqual(before);expect(consumeInField(s,'bandage',validateSave).ok).toBe(true);expect(s.underground!.hazards!.hp).toBe(80);expect(s.inventory.bandage).toBe(0);
 });
 it('has a durable zero-health fallback by the own bed, loses preexisting carried resources and preserves tools, tiers and tunnels',()=>{
  const {s,h}=empty();h.hp=0;s.inventory.wood=99;s.inventory.ironOre=7;s.inventory.pickaxe=1;s.inventory.sword=1;s.inventory.lantern=1;s.inventory.bandage=2;const before=structuredClone(s);
  expect(recoverMineDefeat(s,()=>false)).toBe(false);expect(s).toEqual(before);expect(recoverMineDefeat(s,validateSave)).toBe(true);expect(s.inventory.wood).toBe(0);expect(s.inventory.ironOre).toBe(0);expect(s.inventory.bandage).toBe(0);expect(s.inventory.pickaxe).toBe(1);expect(s.inventory.sword).toBe(1);expect(s.inventory.lantern).toBe(1);expect(s.mineInterior).toBeUndefined();expect(s.activeArea).toBe('property');expect(s.underground!.changes).toEqual(before.underground!.changes);expect(s.economy6).toEqual(before.economy6);expect(s.underground!.hazards!.hp).toBe(100);const home=new Home(s.home);expect(home.bedNear({x:s.homePosition!.x/32,y:s.homePosition!.y/32},2)).toBeDefined();expect(home.isBlocked(Math.floor(s.homePosition!.x/32),Math.floor(s.homePosition!.y/32))).toBe(false);expect(validateSave(s)).toBe(true);
 });
});
