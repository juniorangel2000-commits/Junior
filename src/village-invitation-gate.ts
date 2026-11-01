import type Phaser from 'phaser';
import type {SaveData,BuildingData,TilePoint} from './types';
import {drawConnectedFence} from './fence-art';
import {invitationGate,villageAccessUnlocked} from './systems/village-introduction';
/** Temporary gate artwork is not a player building and cannot consume materials. */
export function drawVillageInvitationGate(scene:Phaser.Scene,save:SaveData,area:'property'|'cityForest',exit?:TilePoint):void{
 if(villageAccessUnlocked(save))return;const gate=invitationGate(area,exit);
 const pieces:BuildingData[]=[-1,0,1].map(offset=>({kind:'fence',x:gate.x/32-.5+(gate.vertical?0:offset),y:gate.y/32-.5+(gate.vertical?offset:0)}));
 for(const p of pieces)drawConnectedFence(scene,p,pieces,save.day).setData('village-invitation-gate',true);
 scene.add.text(gate.x-(gate.vertical?55:0),gate.y-25,'PASSAGEM FECHADA',{fontFamily:'Georgia',fontSize:'9px',color:'#f7e6c3',backgroundColor:'#473a26',padding:{x:5,y:4}}).setOrigin(.5,1).setDepth(gate.y+60).setData('village-invitation-gate',true);
}
