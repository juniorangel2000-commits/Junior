import type {CharacterDirection} from '../character-directions';
export type BodyTool='hoe'|'shovel'|'sickle'|'water';
// A mesma lâmina gira em torno da empunhadura. No contato, aponta para o
// chão à frente do jogador: sul para baixo, norte para cima, laterais espelhadas.
const ANGLES=[[-120,-88,-35,170,175,-120],[135,45,-25,-15,-10,135],[130,45,35,135,130,130],[-130,-45,-35,-135,-130,-130]] as const;
export function playerToolMotion(tool:BodyTool,direction:CharacterDirection,frame:number){
 // As novas ações têm somente vistas laterais. A direção lógica da interação
 // continua intacta; norte/sul usam a lateral direita na apresentação.
 const row=direction.includes('left')?3:2,i=Math.max(0,Math.min(8,Number.isFinite(frame)?Math.floor(frame):0));
 const sequence=tool==='hoe'?[0,1,1,2,3,3,4,4,5]:tool==='shovel'?[0,1,1,3,3,4,1,0,5]:tool==='sickle'?[0,0,0,3,3,4,4,0,5]:[0,0,1,1,3,3,4,4,5];
 const pose=sequence[i],left=direction.includes('left');
 let angle:number=ANGLES[row][pose];
 if(tool==='shovel')angle=(left?-1:1)*[130,110,110,155,160,135,115,130,130][i];
 if(tool==='sickle')angle=([170,0,115,-115][row])+(left?-1:1)*[-25,-30,-35,-20,0,15,5,-10,-25][i];
 // A sequência autoral do regador já contém a inclinação e o jato de água.
 if(tool==='water')angle=0;
 return{row,pose,frame:row*6+pose,angle,flipX:left,scale:tool==='water'?.14:.32};
}
