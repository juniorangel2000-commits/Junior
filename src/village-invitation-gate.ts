import type Phaser from 'phaser';
import type {SaveData,TilePoint} from './types';
import {invitationGate,villageAccessUnlocked} from './systems/village-introduction';
/** Passagem fechada até o convite da vila: só a placa. O bloqueio é invisível
 * (invitationGateBlocked), sem cercas na estrada (pedido do Junior, preview.50). */
export function drawVillageInvitationGate(scene:Phaser.Scene,save:SaveData,area:'property'|'cityForest',exit?:TilePoint):void{
 if(villageAccessUnlocked(save))return;const gate=invitationGate(area,exit);
 scene.add.text(gate.x-(gate.vertical?55:0),gate.y-25,'PASSAGEM FECHADA',{fontFamily:'Georgia',fontSize:'9px',color:'#f7e6c3',backgroundColor:'#473a26',padding:{x:5,y:4}}).setOrigin(.5,1).setDepth(gate.y+60).setData('village-invitation-gate',true);
}
