import {it,expect} from 'vitest';
import {DungeonRun, type Enemy} from '../src/dungeons/run';
import {createDungeonProgress} from '../src/dungeons/progression';
import {UPGRADES} from '../src/dungeons/upgrades';
import {validDungeonSnapshot} from '../src/dungeons/snapshot';
const make=()=>{const r=new DungeonRun('drops','mall-parking',createDungeonProgress());r.state.spawnClock=20;r.state.waveRemaining=1;return r;};
it.each([['walker',false,3,'normal'],['brute',true,4.5,'elite'],['boss',true,6,'boss']] as const)('rewards %s with its XP tier',(kind,special,amount,tier)=>{
 const r=make();const e:Enemy={id:1,x:1600,y:1800,hp:1,maxHp:1,speed:1,damage:0,kind,special,streak:0,lastHit:0};
 // Exercise the shared kill reward path independently of weapon targeting.
 (r as any).hit(e,10);const xp=r.state.pickups.find(p=>p.kind==='xp')!;
 expect(xp.amount).toBe(amount);expect(xp.xpTier).toBe(tier);
 expect(r.state.pickups.filter(p=>p.kind==='level')).toHaveLength(kind==='boss'?1:0);
 expect(validDungeonSnapshot(r.snapshot())).toBe(true);
});
it('level token grants exactly one level despite XP bonuses and preserves queued choices',()=>{
 const r=make();r.state.levels.xp=5;r.state.levels['advanced-xp']=4;
 r.state.pickups=[{id:1,x:r.state.player.x,y:r.state.player.y,kind:'level',amount:1},{id:2,x:r.state.player.x,y:r.state.player.y,kind:'level',amount:1}];
 r.step(1/30);expect(r.state.level).toBe(2);expect(r.state.phase).toBe('choice');expect(r.state.pickups).toHaveLength(1);
 r.choose(r.state.cards[0].id);r.step(1/30);expect(r.state.level).toBe(3);
});
it('collects final-wave level tokens before victory',()=>{
 const r=make();r.state.round=50;r.state.bossRound=50;r.state.waveRemaining=0;
 r.state.weapons=['sword','bow','spear','hammer'];
 for(const u of UPGRADES)if(!u.pet&&(!u.weapon||r.state.weapons.includes(u.weapon)))r.state.levels[u.id]=u.max;
 r.state.level=200;r.state.pickups=[{id:1,x:r.state.player.x+400,y:r.state.player.y,kind:'level',amount:1}];
 r.step(1/30);expect(r.state.phase).toBe('fighting');
 for(let i=0;i<90;i++)r.step(1/30);
 expect(r.state.level).toBe(201);expect(r.state.phase).toBe('victory');
});
it('offers ten ranks of collection range at fifteen percent each',()=>{
 const u=UPGRADES.find(u=>u.id==='pickup')!;expect(u.max).toBe(10);expect(u.perLevel).toBe(.15);
});
