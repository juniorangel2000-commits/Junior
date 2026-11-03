import type Phaser from 'phaser';
/** Shared readable telegraph for dungeon ground attacks and underground cave-ins. */
export function drawGroundWarning(ink:Phaser.GameObjects.Graphics,x:number,y:number,radius:number,warning:boolean,progress:number,color:number):void{
 ink.lineStyle(warning?3:4,warning?0xffdfad:color,.95).fillStyle(color,warning?.12:.25).fillCircle(x,y,radius).strokeCircle(x,y,radius);
 if(warning)ink.strokeCircle(x,y,radius*Math.max(.04,progress));
}
