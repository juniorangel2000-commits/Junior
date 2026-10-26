import {hasMapSeam} from './map-seam';
import type {MapEditData} from '../systems/map-editor';

/** The existing western passage remains the forest connection. */
export const PROPERTY_VILLAGE_EXIT={x:94,y:52} as const;
export const PROPERTY_VILLAGE_ENTRY={x:93,y:52} as const;

/** Sparse legacy drafts keep their own layout until the authored map upgrade. */
export const propertyVillageGateActive=(edits:MapEditData|undefined):boolean=>hasMapSeam(edits);

/** Keep a generous walking approach, while the transition itself uses one tile. */
export function isPropertyVillagePassage(x:number,y:number):boolean {
 return x>=84&&x<=94&&y>=50&&y<=54;
}

/** Foreground canopies must not hide the sign or arrival square. */
export function isPropertyVillageCanopyClearance(x:number,y:number):boolean {
 return x>=88&&x<=94&&y>=55&&y<=59;
}

