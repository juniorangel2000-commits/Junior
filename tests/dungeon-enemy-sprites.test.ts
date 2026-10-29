import {it,expect} from 'vitest';
import {enemySpritePose} from '../src/dungeons/enemy-sprites';
import courier from '../public/assets/visual/dungeons/zombie-courier.json';
import resident from '../public/assets/visual/dungeons/zombie-resident.json';
import type {BossDirection} from '../src/dungeons/boss-sprites';
it('keeps the original zombie and mixes both supplied appearances deterministically',()=>{
 expect(enemySpritePose(3,'south',0,false).texture).toBe('dungeon-zombie');
 expect(enemySpritePose(1,'south',0,false).texture).toBe('dungeon-zombie-courier');
 expect(enemySpritePose(2,'south',0,false).texture).toBe('dungeon-zombie-resident');
 expect(enemySpritePose(1,'south',0,false)).toEqual(enemySpritePose(1,'south',0,false));
});
it.each(['south','west','east','north'] as BossDirection[])('retains four walk frames, scale and anchor facing %s',direction=>{
 for(const [id,manifest] of [[1,courier],[2,resident]] as const){
 const poses=[0,.2,.4,.6].map(t=>enemySpritePose(id,direction,t,false));
 expect(new Set(poses.map(p=>p.frame)).size).toBe(4);
 expect(new Set(poses.map(p=>p.originY)).size).toBe(1);
 for(const pose of poses){expect(manifest.frames).toHaveProperty(pose.frame);expect(pose.referenceHeight).toBe(184);}
 expect(Object.keys(manifest.frames)).toHaveLength(20);
 }
});
it('animates runners faster without changing their sprite scale',()=>{
 const walker=enemySpritePose(1,'south',.4,false),runner=enemySpritePose(1,'south',.4,true);
 expect(walker.frame).not.toBe(runner.frame);expect(walker.referenceHeight).toBe(runner.referenceHeight);
});
