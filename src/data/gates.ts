import type {BuildingData} from '../types';

type GateSettings=Pick<BuildingData,'rotation'|'gateFlip'|'open'>;
export function gateTexture(gate:GateSettings):string {
  return `gate-${gate.rotation??0}-${gate.gateFlip?'flipped':'normal'}-${gate.open?'open':'closed'}`;
}

/** Rotate on the ground plane; upright timber posts are never turned upside down. */
export function gateLayout(gate:GateSettings) {
  const rotation=gate.rotation??0,vertical=rotation%2===1,endHinge=rotation>=2;
  const directions=[[0,-1],[1,0],[0,1],[-1,0]] as const;
  const sign=gate.gateFlip?-1:1,[dx,dy]=directions[rotation];
  return {vertical,endHinge,openX:dx*sign,openY:dy*sign,
    hingeX:vertical?32:endHinge?46:18,hingeFoot:vertical?(endHinge?79:51):65,
    latchX:vertical?32:endHinge?18:46,latchFoot:vertical?(endHinge?51:79):65};
}

export function gatePlacementLabel(gate:GateSettings):string {
  const names=['Horizontal · dobradiça à esquerda','Vertical · dobradiça acima','Horizontal · dobradiça à direita','Vertical · dobradiça abaixo'];
  const {openX,openY}=gateLayout(gate);
  return `${names[gate.rotation??0]} · abre para ${openX>0?'direita':openX<0?'esquerda':openY>0?'baixo':'cima'}`;
}

export function gateLayerDepths(gate:GateSettings,y:number):number[] {
  const pose=gateLayout(gate);
  const panel=gate.open?(pose.vertical?(pose.endHinge?y+15:y-13):(pose.openY>0?y+15:y-13)):y+1;
  return pose.vertical?[y-12,panel,y+16]:[y+2,panel,y+2];
}
