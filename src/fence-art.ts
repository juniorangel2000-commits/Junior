import { gateTexture, gateLayout, gateLayerDepths } from './data/gates';
import Phaser from 'phaser';
import type { BuildingData } from './types';
import { FENCE_STAGES, fenceConnections, fenceStage, fenceTexture, type FenceStage } from './data/fences';

const gatePreviews=new Map<string,string>();
export const gatePreview=():string|undefined=>gatePreviews.get('gate-0-closed');
const previews = new Map<FenceStage, string>();
export const fencePreview = (stage: FenceStage = 'new'): string | undefined => previews.get(stage);

/** Compose connected rails from the original art, keeping upright posts upright. */
export function setupFenceArt(scene: Phaser.Scene): void {
  if (!scene.textures.exists('fence-components-source')) return;
  const source = scene.textures.get('fence-components-source').getSourceImage() as HTMLImageElement;
  const sheet = document.createElement('canvas');
  sheet.width=source.width;sheet.height=source.height;
  const sheetContext=sheet.getContext('2d')!;sheetContext.drawImage(source,0,0);
  const pixels=sheetContext.getImageData(0,0,sheet.width,sheet.height).data;
  // Art is arranged in four bands. Independent baselines keep the shorter ruined
  // posts planted in the soil instead of floating or being stretched to full height.
  const bands=[[.03,.265],[.28,.50],[.515,.735],[.75,.95]];
  const regions=[[.08,.23],[.29,.72],[.79,.91]];
  const bounds=bands.map(([top,bottom])=>regions.map(([left,right])=>{
    let minX=sheet.width,minY=sheet.height,maxX=0,maxY=0;
    for(let y=Math.floor(top*sheet.height);y<bottom*sheet.height;y++)for(let x=Math.floor(left*sheet.width);x<right*sheet.width;x++) {
      if(pixels[(y*sheet.width+x)*4+3]<80)continue;
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    }
    return {x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
  }));
  const mossSource=scene.textures.get('fence-moss-source').getSourceImage() as HTMLImageElement;
  const mossCanvas=document.createElement('canvas');mossCanvas.width=mossSource.width;mossCanvas.height=mossSource.height;
  const mossContext=mossCanvas.getContext('2d')!;mossContext.drawImage(mossSource,0,0);
  const mossPixels=mossContext.getImageData(0,0,mossCanvas.width,mossCanvas.height).data;
  let mx=mossCanvas.width,my=mossCanvas.height,mr=0,mb=0;
  for(let y=0;y<mossCanvas.height;y++)for(let x=0;x<mossCanvas.width;x++)if(mossPixels[(y*mossCanvas.width+x)*4+3]>80){
    mx=Math.min(mx,x);my=Math.min(my,y);mr=Math.max(mr,x);mb=Math.max(mb,y);
  }
  for(const [row,stage] of FENCE_STAGES.entries())for(let mask=0;mask<16;mask++) {
    const key=fenceTexture(stage,mask);
    if(scene.textures.exists(key))continue;
    // Four art pixels per world pixel retain wood grain when zooming in.
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=384;
    const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.scale(4,4);
    const part=(column:number,x:number,y:number,w:number,h:number)=>{
      const b=bounds[row][column];ctx.drawImage(source,b.x,b.y,b.w,b.h,x,y,w,h);
    };
    const moss=(x:number,y:number,w:number,h:number)=>ctx.drawImage(mossSource,mx,my,mr-mx+1,mb-my+1,x,y,w,h);
    const post=bounds[row][0],original=bounds[0][0];
    const width=Math.round(11*post.w/original.w),height=Math.round(28*post.h/original.h);
    // Nail centres measured in the original source art; derive their world heights
    // from the same post transform rather than guessing two unrelated rail heights.
    const nailSources=row===0?[204,267]:[549.5,610.5];
    const nailLevels=nailSources.map(y=>65-height+(y-post.y)*height/post.h);
    // Each arm uses one half of the SAME full rail. Breaks stay halfway between
    // neighboring posts, so ruined fragments remain attached instead of floating.
    const horizontal=(level:number,east:boolean)=>{
      ctx.save();ctx.beginPath();ctx.rect(east?32:16,level,16,4);ctx.clip();
      part(1,east?32:0,level,32,4);ctx.restore();
    };
    const verticalPlane=nailLevels[0]-2;
    const vertical=(south:boolean)=>{
      // From above, the lower rail is occluded: one continuous central board is
      // visible. Its material is the horizontal timber rotated into the Y axis.
      const x=29,start=south?verticalPlane:verticalPlane-32;
      ctx.save();ctx.beginPath();ctx.rect(x,south?verticalPlane:verticalPlane-16,6,16);ctx.clip();
      ctx.translate(x+6,start);ctx.rotate(Math.PI/2);
      part(1,0,0,32,6);ctx.restore();
    };
    if(stage === 'new' || stage === 'worn') {
      if(mask&1)vertical(false);
      for(const nail of nailLevels) {
        if(mask&8)horizontal(nail-2,false);
        if(mask&2)horizontal(nail-2,true);
      }
    } else if(stage === 'damaged') {
      // The same broken plank lies on the ground between the two posts. Each
      // tile owns half, sharing the transform so the fragments never float.
      const fallenHorizontal=(east:boolean,level:number,angle:number)=>{
        ctx.save();ctx.translate(east?32:0,level);ctx.rotate(angle);
        ctx.beginPath();ctx.rect(east?0:16,-4,16,8);ctx.clip();
        ctx.fillStyle='rgba(25,32,17,.25)';ctx.fillRect(0,1,32,3);
        part(1,0,-2,32,4);moss(2,-3,5,4);moss(25,-2,4,3);ctx.restore();
      };
      const fallenVertical=()=>{
        // One complete board per north/south link, owned by its northern post.
        // It has collapsed across the ground at the foot, not diagonally upright.
        ctx.save();ctx.translate(21,69);ctx.rotate(.22);
        ctx.fillStyle='rgba(25,32,17,.25)';ctx.fillRect(0,1,30,3);
        part(1,0,-2,30,4);moss(2,-3,5,4);moss(24,-2,4,3);ctx.restore();
      };
      if(mask&8){fallenHorizontal(false,67,-.06);fallenHorizontal(false,71,.08);}
      if(mask&2){fallenHorizontal(true,67,-.06);fallenHorizontal(true,71,.08);}
      if(mask&4)fallenVertical();
    }
    // Ruined fences retain only their broken post, with no connection fragments.
    part(0,32-width/2,65-height,width,height);
    if(stage === 'damaged') {
      moss(32-width/2,59,5,6);
      moss(32+width/2-3,49,3,4);
    }
    if((stage === 'new' || stage === 'worn') && (mask&4)) {
      // Only an actual southern neighbour gets a foreground continuation.
      // A terminal incoming north connection ends behind the post, with no stub.
      vertical(true);
    }
    scene.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    if(mask===10)previews.set(stage,canvas.toDataURL('image/png'));
  }
  // Complete framed gate leaf. Keep the approved timber palette; the new art
  // supplies detailed iron hinge straps and a latch, cropped without its backdrop.
  const hardware=scene.textures.get('finished-gate-source').getSourceImage() as HTMLImageElement;
  const leaf=document.createElement('canvas');leaf.width=112;leaf.height=56;
  const lc=leaf.getContext('2d')!;lc.imageSmoothingEnabled=false;lc.scale(4,4);
  const rail=bounds[0][1];
  const board=(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number)=>c.drawImage(source,rail.x,rail.y,rail.w,rail.h,x,y,w,h);
  lc.save();lc.beginPath();lc.rect(2,2,24,10);lc.clip();lc.translate(2,11);lc.rotate(-Math.atan2(9,24));board(lc,0,0,25.65,3);lc.restore();
  board(lc,0,0,28,4);board(lc,0,10,28,4);
  for(const x of [0,25]){lc.save();lc.translate(x+3,0);lc.rotate(Math.PI/2);board(lc,0,0,14,3);lc.restore();}
  const metal=(c:CanvasRenderingContext2D,sx:number,sy:number,sw:number,sh:number,x:number,y:number,w:number,h:number,mirror:boolean)=>{
    c.save();c.translate(x+(mirror?w:0),y);c.scale(mirror?-1:1,1);c.drawImage(hardware,sx,sy,sw,sh,0,0,w,h);c.restore();
  };
  const iron=(c:CanvasRenderingContext2D,x:number,y:number,mirror=false)=>metal(c,298,203,64,30,x,y,7,3.25,mirror);
  const latch=(c:CanvasRenderingContext2D,x:number,y:number,mirror=false)=>metal(c,605,207,40,65,x,y,3.5,5.75,mirror);
  for(const rotation of [0,1,2,3] as const)for(const gateFlip of [false,true])for(const open of [false,true]) {
    const settings={rotation,gateFlip,open},key=gateTexture(settings),pose=gateLayout(settings);
    if(scene.textures.exists(key))continue;
    const layers=['back','panel','front'].map(()=>{const c=document.createElement('canvas');c.width=256;c.height=384;return c});
    const draw=(canvas:HTMLCanvasElement,paint:(ctx:CanvasRenderingContext2D)=>void)=>{const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;c.save();c.scale(4,4);paint(c);c.restore();};
    const part=(c:CanvasRenderingContext2D,column:number,x:number,y:number,w:number,h:number)=>{
      const b=bounds[0][column];c.drawImage(source,b.x,b.y,b.w,b.h,x,y,w,h);
    };
    const post=(c:CanvasRenderingContext2D,x:number,foot:number)=>part(c,0,x-3.5,foot-28,7,28);
    const hinge=(c:CanvasRenderingContext2D,x:number,foot:number)=>{const mirror=pose.vertical?pose.openX<0:pose.endHinge;iron(c,x-3.5,foot-18,mirror);iron(c,x-3.5,foot-9,mirror)};
    draw(layers[0],c=>{
      if(!pose.vertical){post(c,18,65);post(c,46,65);hinge(c,pose.hingeX,65);latch(c,pose.latchX-2.5,50,pose.endHinge)}
      else {post(c,32,51);if(!pose.endHinge)hinge(c,32,51);else latch(c,30.25,33,pose.openX<0)}
    });
    draw(layers[2],c=>{if(pose.vertical){post(c,32,79);if(pose.endHinge)hinge(c,32,79);else latch(c,30.25,61,pose.openX<0)}});
    draw(layers[1],c=>{
      if(!pose.vertical&&!open){
        c.save();c.translate(pose.hingeX,47);c.scale(pose.endHinge?-1:1,1);c.drawImage(leaf,0,0,28,14);c.restore();
      }else if(!pose.vertical){
        // Match the closed leaf's 28px span instead of stretching its profile.
        // Both swings retain the hinge band y47..61; a half-pixel overlap at the
        // inner post face keeps the two straps connected without an alpha seam.
        const length=28,thickness=3,overlap=.5;
        const pin=pose.hingeX+(pose.endHinge?-3.5:3.5);
        const edge=pose.endHinge?pin-thickness+overlap:pin-overlap;
        const start=pose.openY<0?47+14-length:47;
        // Use continuous rail grain: rotating the framed leaf's top strip also
        // rotated its end stiles into unwanted crosswise caps at the tips.
        c.save();c.translate(edge+thickness,start);c.rotate(Math.PI/2);board(c,0,0,length,thickness);c.restore();
      }else if(open){
        // The leaf swings east/west at 90 degrees, from either upright hinge.
        c.save();c.transform(pose.openX,0,0,1,32,pose.hingeFoot-18);c.drawImage(leaf,0,0,28,14);c.restore();
      }else {
        // Viewed edge-on, the same top timber connects the north/south posts.
        c.save();c.translate(pose.endHinge?29:35,pose.hingeFoot-18);c.rotate(pose.endHinge?-Math.PI/2:Math.PI/2);c.drawImage(leaf,0,0,112,16,0,0,28,6);c.restore();
      }
    });
    const combined=document.createElement('canvas');combined.width=256;combined.height=384;
    const c=combined.getContext('2d')!,depths=gateLayerDepths(settings,0);
    for(const index of [0,1,2].sort((a,b)=>depths[a]-depths[b]))c.drawImage(layers[index],0,0);
    const keys=[key,...(!gateFlip&&rotation<2?[`gate-${rotation}-${open?'open':'closed'}`]:[])];
    for(const texture of keys){
      scene.textures.addCanvas(texture,combined)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      for(const [i,layer]of layers.entries())scene.textures.addCanvas(`${texture}-${i}`,layer)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      gatePreviews.set(texture,combined.toDataURL());
    }
  }

}

export function drawConnectedFence(scene: Phaser.Scene, piece: BuildingData, buildings: readonly BuildingData[], day: number): Phaser.GameObjects.Sprite {
  const stage=fenceStage(piece,day),mask=fenceConnections(buildings,piece.x,piece.y);
  // The artwork's post baseline is y65: pin it to the tile centre, not its edge.
  return scene.add.sprite(piece.x*32+16,piece.y*32+16,fenceTexture(stage,mask))
    .setOrigin(.5,65/96).setScale(.25).setDepth(piece.y*32+18)
    .setData({fence:true,fenceStage:stage,fenceConnections:mask});
}

/** Separate gate layers sort correctly around a character crossing an open gate. */
export function drawGate(scene:Phaser.Scene,gate:BuildingData):Phaser.GameObjects.Sprite[] {
  const key=gateTexture(gate),x=gate.x*32+16,y=gate.y*32+16;
  const depths=gateLayerDepths(gate,y);
  return depths.map((depth,i)=>scene.add.sprite(x,y,`${key}-${i}`).setOrigin(.5,65/96).setScale(.25).setDepth(depth).setData({gate:true,gateLayer:i}));
}
