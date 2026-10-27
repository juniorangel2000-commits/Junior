import {describe,it,expect,vi,afterEach} from 'vitest';
import {createSmithLayout,createLegacySmithLayout,resolveSmithLayout,validSmithLayout,smithAsset,smithBlocked,smithConnected,smithFits,smithSpawn,smithDoor,smithNavigation,smithPieceVisible,moveSmithPiece,upgradeSmithFinish,smithFloorSeam,smithPieceDepth} from '../src/systems/smith-layout';
import {createNewSave,saveGame,loadSave,validateSave,SAVE_KEY} from '../src/systems/save';
import {BentoRoutine,validBentoRoutine} from '../src/systems/bento-routine';
import {finishSmithPixel,finishSmithWindow} from '../src/smith-finish';
import {cottageSolidPoint,wellFootprint} from '../src/data/architecture-collision';
import {PROPERTY_WELL,wellSolidPoint} from '../src/data/property-well';
afterEach(()=>vi.unstubAllGlobals());
describe('editable faithful smith room',()=>{
 it('keeps independent floors, structure, window, divider, props and floor transition',()=>{
  const d=createSmithLayout();expect(validSmithLayout(d)).toBe(true);expect(smithConnected(d)).toBe(true);
  for(const id of ['floor-left','floor-right','floor-door','structure','window','soleira_pisos'])expect(d.pieces.some(p=>p.id===id)).toBe(true);
  expect(d.pieces.filter(p=>p.id.startsWith('wall-panel')&&p.visible).length).toBe(7);
  expect(d.pieces.every(p=>!!smithAsset(p.asset))).toBe(true);
  expect(smithFits(d,smithSpawn(d).x,smithSpawn(d).y)).toBe(true);
  expect(smithDoor(d)).toMatchObject({x:245,y:321,direction:'down'});
 });
 it('replaces the stone strip with a discreet seam, and wraps the wall moulding',()=>{
  const d=createSmithLayout();expect(d.pieces.find(p=>p.asset==='soleira_pisos')!.visible).toBe(false);
  expect(d.pieces.filter(p=>p.id.startsWith('wall-edge-'))).toHaveLength(4);expect(smithFloorSeam(d)).toEqual({x:289.5,top:119,bottom:275});
  d.pieces.find(p=>p.id==='floor-right')!.asset='floor-left';expect(smithFloorSeam(d)).toBeNull();
 });
 it('upgrades the old trim once without resetting object positions',()=>{
  const d=createSmithLayout();delete d.finishRevision;d.pieces=d.pieces.filter(p=>!p.id.startsWith('wall-edge-'));d.pieces.find(p=>p.asset==='soleira_pisos')!.visible=true;d.pieces.find(p=>p.id==='window')!.x=127;
  const upgraded=upgradeSmithFinish(d);expect(upgraded.pieces.find(p=>p.id==='window')!.x).toBe(127);expect(upgraded.pieces.find(p=>p.asset==='soleira_pisos')!.visible).toBe(false);expect(upgradeSmithFinish(upgraded)).toEqual(upgraded);expect(validSmithLayout(upgraded)).toBe(true);
 });
 it('matches window and side plaster to the wall while preserving timber and stone',()=>{
  expect(finishSmithPixel(221,176,122,255,60,200,1)).toEqual([38,48,44,255]);
  expect(finishSmithPixel(134,70,31,255,44,200,1)).toEqual([134,70,31,255]);expect(finishSmithPixel(190,161,132,255,1030,540,1)).toEqual([190,161,132,255]);expect(finishSmithPixel(2,1,2,255,1055,580,1)[3]).toBe(0);
 });
 it('recolors the window halo without changing enclosed wood',()=>{const data=new Uint8ClampedArray(5*5*4);for(let p=0;p<25;p++)data.set([240,208,151,255],p*4);for(const p of [6,7,8,11,13,16,17,18])data.set([30,20,10,255],p*4);data.set([170,110,60,255],12*4);const out=finishSmithWindow(data,5,5,1);expect([...out.slice(0,4)]).toEqual([38,48,44,255]);expect([...out.slice(48,52)]).toEqual([170,110,60,255]);});
 it('keeps objects mounted on any wall in front of its wooden moulding',()=>{const d=createSmithLayout(),lamp=d.pieces.find(p=>p.id==='lamparina')!;for(const id of ['lamparina','suporte_ferramentas_longas','armario_pecas_loja','painel_ferro_direita','painel_ferro_fornalha'])expect(smithAsset(id)!.layer).toBe('object');for(const wall of ['structure','wall-panel-1','wall-edge-left']){lamp.parent=wall;expect(smithPieceDepth(d,lamp)).toBeGreaterThan(smithPieceDepth(d,d.pieces.find(p=>p.id==='wall-edge-left')!));}});
 it('adopts the author layout for untouched rooms without mutating the prior save',()=>{const old=createLegacySmithLayout(),before=structuredClone(old);expect(resolveSmithLayout(old)).toEqual(createSmithLayout());expect(old).toEqual(before);expect(resolveSmithLayout()).toEqual(createSmithLayout());});
 it('preserves customized rooms and their individual animation/collision choices',()=>{const customized=createLegacySmithLayout();customized.pieces.find(p=>p.id==='window')!.x+=1;customized.pieces.find(p=>p.id==='lamparina')!.effects=false;expect(resolveSmithLayout(customized)).toEqual(customized);const room=createSmithLayout();expect(resolveSmithLayout(room)).toEqual(room);});
 it('moves supported objects together and hides their contents with the support',()=>{
  const d=createSmithLayout(),child=d.pieces.find(p=>p.parent)!;expect(child).toBeDefined();const p=d.pieces.find(p=>p.id===child.parent)!,x=child.x,y=child.y;
  moveSmithPiece(d,p.id,p.x+12,p.y+5);expect(child.x).toBe(x+12);expect(child.y).toBe(y+5);
  p.visible=false;expect(smithPieceVisible(d,child)).toBe(false);p.visible=true;expect(smithPieceVisible(d,child)).toBe(true);
 });
 it('rejects malformed imports, cycles and oversized textures before rendering',()=>{
  const changes:Array<(d:ReturnType<typeof createSmithLayout>)=>unknown>=[d=>d.pieces.push({...d.pieces[0]}),d=>d.pieces[0].asset='unknown',d=>d.pieces[0].sx=NaN,d=>d.pieces[0].effects='yes' as unknown as boolean,d=>d.pieces[0].sx=650,d=>d.pieces[0].parent=d.pieces[0].id,d=>d.pieces[0].parent='missing',d=>d.pieces.find(p=>p.id==='structure')!.x=200];for(const change of changes){const d=createSmithLayout();change(d);expect(validSmithLayout(d)).toBe(false);}
 });
 it('protects the doorway and honors individually disabled collisions',()=>{
  const d=createSmithLayout(),p=d.pieces.find(p=>p.asset==='tanque_resfriamento')!;const a=smithAsset(p.asset)!;
  const c=a.collision!;const x=p.x+(c.x+c.width/2-a.ox*a.w)*p.sx,y=p.y+(c.y+c.height/2-a.oy*a.h)*p.sy;
  expect(smithBlocked(d,x,y)).toBe(true);p.solid=false;expect(smithBlocked(d,x,y)).toBe(false);
  d.pieces.push({id:'door-block',asset:'floor-left',x:205,y:230,sx:80,sy:70,visible:true,solid:true});expect(smithConnected(d)).toBe(false);
 });
 it('saves edited scene and animations alongside the existing economy, maps, inventory and old room',()=>{
  const disk=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>disk.get(k)??null,setItem:(k:string,v:string)=>disk.set(k,v)});
  const s=createNewSave({name:'Bento',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});
  s.activeArea='village';s.blacksmithScene=createSmithLayout();s.blacksmithLayoutRevision=3;s.blacksmithInterior={...smithSpawn(s.blacksmithScene),direction:'up'};
  const light=s.blacksmithScene.pieces.find(p=>p.asset==='lamparina')!;light.effects=false;light.x+=3;
  expect(validateSave(s)).toBe(true);expect(saveGame(s)).toBe(true);expect(loadSave()).toEqual(s);
  const original=disk.get(SAVE_KEY);s.blacksmithScene.pieces[0].asset='corrupt';expect(saveGame(s)).toBe(false);expect(disk.get(SAVE_KEY)).toBe(original);
 });
 it('routes Bento through the real narrow passages and doorway with an 8px navigation grid',()=>{
  const d=createSmithLayout(),nav=smithNavigation(d),b=new BentoRoutine(undefined,nav),seen=new Set<number>();let interior=0;
  for(let i=0;i<14000;i++){const s=b.step(.1);seen.add(s.stop);expect(validBentoRoutine(s,nav)).toBe(true);if(s.area==='blacksmith-home'){interior++;expect(smithFits(d,s.x,s.y)).toBe(true);}}
  expect(interior).toBeGreaterThan(100);expect([...seen].sort()).toEqual([0,1,2,3,4,5,6,7]);
 });
});
describe('architecture footprints follow ground geometry',()=>{
 it('blocks the entire well bowl, opening and front post, leaving the roof passable',()=>{
  const p=(sx:number,sy:number)=>({x:PROPERTY_WELL.x+(sx-128)*.42,y:PROPERTY_WELL.y+(sy-256)*.42});
  for(const[sx,sy]of [[128,150],[128,188],[128,225],[65,188],[190,188],[186,239]]){const a=p(sx,sy);expect(wellSolidPoint(a.x,a.y)).toBe(true);}
  for(const[sx,sy]of [[128,75],[30,188],[128,249]]){const a=p(sx,sy);expect(wellSolidPoint(a.x,a.y)).toBe(false);}
  expect(wellFootprint(0,-30,{x:0,y:0},.49)).toBe(true);
 });
 it('lets the player approach the cottage facade without passing inside the wall',()=>{
  const a={x:784,y:516};expect(cottageSolidPoint(a.x,a.y-10,a)).toBe(false);expect(cottageSolidPoint(a.x,a.y-40,a)).toBe(true);
  expect(cottageSolidPoint(a.x+80,a.y-50,a)).toBe(false);expect(cottageSolidPoint(a.x+70,a.y-50,a)).toBe(true);
 });
});
