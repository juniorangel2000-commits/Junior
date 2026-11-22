import {WORLD_WIDTH} from './world-size';

export const VILLAGE_ORCHARD_Y=62;
export const ORCHARD_NORTH_OFFSET=6;
export const ORCHARD_GATE_Y=VILLAGE_ORCHARD_Y-ORCHARD_NORTH_OFFSET;
export const VILLAGE_ORCHARD_EXIT={x:WORLD_WIDTH-2,y:VILLAGE_ORCHARD_Y};
export const VILLAGE_ORCHARD_RETURN={x:WORLD_WIDTH-4,y:VILLAGE_ORCHARD_Y};
export const ORCHARD_ENTRY={x:4,y:ORCHARD_GATE_Y};
export const ORCHARD_EXIT={x:1,y:ORCHARD_GATE_Y};

export const VILLAGE_ORCHARD_PATH=[[77,63],[79,64.35],[83,64.25],[87,63.15],[92,VILLAGE_ORCHARD_Y],[WORLD_WIDTH,VILLAGE_ORCHARD_Y]] as const;
export const villageOrchardGate=(x:number,y:number)=>x>=VILLAGE_ORCHARD_RETURN.x-2&&Math.abs(y-VILLAGE_ORCHARD_Y)<=2;
export const orchardGate=(x:number,y:number)=>x<=ORCHARD_ENTRY.x+2&&Math.abs(y-ORCHARD_GATE_Y)<=2;
