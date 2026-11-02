import type {BaitStyle} from '../systems/fishing-progress';
export const fishingSupplyIcon=(id:BaitStyle|'net'):string=>id==='worm'?'assets/visual/fishing/basic-worm.png':`assets/visual/fishing/supplies.svg#${id}`;
