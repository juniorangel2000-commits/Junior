import {windowLight} from './solar-light';
export function fixtureStrength(time:number,elapsed:number,always:boolean,intensity:number):number{
 return Math.max(0,Math.min(1,intensity))*(always?.32+.68*windowLight(time):windowLight(time))*(.94+Math.sin(elapsed*.008)*.04+Math.sin(elapsed*.017)*.02);
}
