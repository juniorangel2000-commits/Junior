/** Small outdoor work areas. Coordinates share the village's foot anchors;
 * only the lowest strip is solid, so players can pass behind the artwork. */
export const VILLAGE_DRESSING = [
 {id:'entregas-augusto',frame:'delivery',owner:'augusto',x:31.25,y:37,width:74,height:66},
 {id:'ferramentas-bento',frame:'iron',owner:'bento',x:64.25,y:34.5,width:73,height:73},
 {id:'ervas-amelia',frame:'herbs',owner:'amelia',x:23,y:24.25,width:78,height:55},
 {id:'tabuas-tobias',frame:'timber',owner:'tobias',x:32,y:47,width:88,height:62},
 {id:'sementes-rosa',frame:'seeds',owner:'rosa',x:34,y:57.25,width:72,height:53},
 {id:'baus-nilo',frame:'trunks',owner:'nilo',x:20,y:59,width:68,height:56},
 {id:'varal-celina',frame:'laundry',owner:'celina',x:70.25,y:26,width:77,height:68},
 {id:'tina-damiao',frame:'tub',owner:'damiao',x:72,y:42.5,width:70,height:47},
 {id:'mesa-helena',frame:'table',owner:'helena',x:49,y:24.5,width:86,height:60},
 {id:'pecas-icaro',frame:'gears',owner:'icaro',x:66.5,y:56.75,width:80,height:62},
 {id:'avisos-comunitarios',frame:'notice',owner:'community',x:52,y:18.75,width:64,height:62},
 {id:'lenha-casa-sul',frame:'firewood',owner:'cottage',x:81,y:62,width:76,height:49},
] as const;
export type VillageDressing=typeof VILLAGE_DRESSING[number];
export function villageDressingBounds(p:VillageDressing){
 const x=(p.x+.5)*32,y=p.y*32+25;
 return {left:x-p.width/2,right:x+p.width/2,top:y-p.height,bottom:y};
}
export function villageDressingBlockedPoint(x:number,y:number):boolean{
 return VILLAGE_DRESSING.some(p=>{const b=villageDressingBounds(p);return x>b.left+5&&x<b.right-5&&y>b.bottom-17&&y<b.bottom+1;});
}
