import {WORLD_WIDTH} from './world-size';

export const ORCHARD_GATE_Y=62;
export const VILLAGE_ORCHARD_EXIT={x:WORLD_WIDTH-2,y:ORCHARD_GATE_Y};
export const VILLAGE_ORCHARD_RETURN={x:WORLD_WIDTH-4,y:ORCHARD_GATE_Y};
export const ORCHARD_ENTRY={x:4,y:ORCHARD_GATE_Y};
export const ORCHARD_EXIT={x:1,y:ORCHARD_GATE_Y};

export const VILLAGE_ORCHARD_PATH=[[77,63],[79,64.35],[83,64.25],[87,63.15],[92,ORCHARD_GATE_Y],[WORLD_WIDTH,ORCHARD_GATE_Y]] as const;
export const villageOrchardGate=(x:number,y:number)=>x>=VILLAGE_ORCHARD_RETURN.x-2&&Math.abs(y-ORCHARD_GATE_Y)<=2;
export const orchardGate=(x:number,y:number)=>x<=ORCHARD_ENTRY.x+2&&Math.abs(y-ORCHARD_GATE_Y)<=2;
