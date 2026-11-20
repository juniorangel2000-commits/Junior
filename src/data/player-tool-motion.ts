import type {CharacterDirection} from '../character-directions';
export type BodyTool='hoe'|'shovel'|'sickle'|'water';
// No contato a mão fica baixa, com a lâmina à frente do encaixe e voltada ao chão.
const HOE_ANGLES = [116, 48, 35, 104, 98, 116] as const;
export function playerToolMotion(tool:BodyTool,direction:CharacterDirection,frame:number){
 // As novas ações têm somente vistas laterais. A direção lógica da interação
 // continua intacta; norte/sul usam a lateral direita na apresentação.
 const row=direction.includes('left')?3:2,i=Math.max(0,Math.min(8,Number.isFinite(frame)?Math.floor(frame):0));
 const sequence=tool==='hoe'?[0,1,1,2,4,4,3,3,5]:tool==='shovel'?[0,1,1,1,3,4,1,0,5]:tool==='sickle'?[0,0,0,3,3,4,4,0,5]:[0,0,1,1,3,3,4,4,5];
 const pose=sequence[i],left=direction.includes('left');
 let angle=(left?-1:1)*HOE_ANGLES[pose];
 if(tool==='shovel')angle=(left?-1:1)*[130,110,110,140,160,135,115,130,130][i];
 if(tool==='sickle')angle=([170,0,115,-115][row])+(left?-1:1)*[-25,-30,-35,-20,0,15,5,-10,-25][i];
 // A sequência autoral do regador já contém a inclinação e o jato de água.
 if(tool==='water')angle=0;
 return{row,pose,frame:row*6+pose,angle,flipX:left,scale:tool==='water'?.14:.32};
}
