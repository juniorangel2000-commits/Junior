/** Coordenadas no atlas do Pântano. Cada recorte termina antes das patas. */
const SIDE_HEAD_Y = [
  [147,124,121,122],
  [111,121,127,122],
] as const;
const FRONT_HEAD_CENTER = [173,160,156,159] as const;

export function caimanHeadCrop(frame:number,side:number):{x:number;y:number;width:number;height:number}{
  const phase=frame%4;
  switch(Math.floor(frame/4)){
    case 0:return {x:side-91,y:SIDE_HEAD_Y[0][phase],width:79,height:68};
    case 1:return {x:FRONT_HEAD_CENTER[phase]-34,y:side-82,width:68,height:70};
    case 2:return {x:12,y:SIDE_HEAD_Y[1][phase],width:78,height:68};
    default:return {x:124,y:12,width:68,height:72};
  }
}
