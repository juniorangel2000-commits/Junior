import type {EditorObjectKind,MapEditData} from '../systems/map-editor';
export const CAMP_ENTRY={x:48,y:67},CAMP_EXIT={x:48,y:70};
export const CAMP_OFFSET={x:736,y:512};
export const CAMP_CENTER={x:1546,y:1202};
export const CAMP_FRAMES={beige:[80,5,760,575],olive:[855,95,630,505],fire:[275,582,445,425],supplies:[875,630,555,365],fence:[1100,135,850,480]} as const;
export const CAMP_PROP_KINDS=['camp-tent-beige','camp-tent-olive','camp-fire','camp-supplies','camp-fence'] as const;
export const CAMP_PROP_NAMES={'camp-tent-beige':'Barraca bege','camp-tent-olive':'Barraca oliva','camp-fire':'Fogueira de cozinha','camp-supplies':'Suprimentos do acampamento','camp-fence':'Cerca rústica'} as const;
export const campHash=(x:number,y:number)=>{let n=(Math.imul(x+39,73856093)^Math.imul(y+17,19349663))>>>0;n=Math.imul(n^(n>>>16),2246822507);n=Math.imul(n^(n>>>13),3266489909);return((n^(n>>>16))>>>0)/4294967296;};
const CAMP_PATH_SEGMENTS=[[800,1800,790,860],[790,860,815,620],[815,620,565,470],[815,620,1110,500],[790,860,395,805],[790,860,1170,855]];
export function campPathDistance(x:number,y:number):number {
 x-=CAMP_OFFSET.x;y-=CAMP_OFFSET.y;let best=Infinity;
 for(const[a,b,c,d]of CAMP_PATH_SEGMENTS){const dx=c-a,dy=d-b,t=Math.max(0,Math.min(1,((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-a-t*dx,y-b-t*dy));}return best;
}
export interface CampObject {id:string;kind:EditorObjectKind;x:number;y:number;width:number;height:number;texture:string;frame?:string;pivot:number;flip:boolean;solid:boolean}
export const CAMP_OBJECTS:CampObject[]=[];
function add(kind:EditorObjectKind,x:number,y:number,width:number,height:number,texture:string,solid=false,pivot=1,frame?:string,flip=false){CAMP_OBJECTS.push({id:`editor-${kind}-camp${CAMP_OBJECTS.length}`,kind,x:x+CAMP_OFFSET.x,y:y+CAMP_OFFSET.y,width,height,texture,solid,pivot,frame,flip});}
for(const[kind,x,y,width,flip]of[['beige',565,470,230,false],['olive',1110,500,215,false],['olive',395,805,205,true],['beige',1170,855,225,true]] as const){const f=CAMP_FRAMES[kind];add(`camp-tent-${kind}`,x,y,width,width*f[3]/f[2],'camp-props',true,.94,kind,flip);}
add('camp-fire',810,690,95,95*425/445,'camp-props',true,.94,'fire');
for(const[x,y,w]of[[1005,665,105],[520,865,90],[1160,530,78]])add('camp-supplies',x,y,w,w*365/555,'camp-props',true,.94,'supplies');
for(const[i,x]of[425,575,725,875,1025,1175].entries())add('camp-fence',x,322+(i%3)*3,151,58,'camp-fences',true,.95,'fence',i%2===1);
for(const[i,x]of[410,560,1040,1190].entries())add('camp-fence',x,1015+(i%2)*5,151,58,'camp-fences',true,.95,'fence',i%2===0);
for(let y=64;y<2250;y+=105)for(let x=60;x<3030;x+=115){const wx=x+campHash(x,y)*48,wy=y+campHash(y,x)*45,localX=wx-CAMP_OFFSET.x,localY=wy-CAMP_OFFSET.y;
 const clearing=((localX-805)/630)**2+((localY-675)/480)**2<1.15;
 if(clearing||campPathDistance(wx,wy)<65)continue;
 const pine=campHash(x,y)>.72,variant=Math.floor(campHash(y,x)*3),w=180+campHash(x+3,y)*65,h=230+campHash(y+3,x)*70;
 add(pine?'pine':'standingTree',wx-CAMP_OFFSET.x,wy-CAMP_OFFSET.y,w,h,`asset-${pine?'pine':'tree'}-${variant}`,true,128/132);
}
for(let i=0;i<150;i++){const x=160+campHash(i,34)*1280,y=290+campHash(i,42)*800;if(campPathDistance(x+CAMP_OFFSET.x,y+CAMP_OFFSET.y)<53)continue;if(((x-805)/540)**2+((y-675)/410)**2<.55&&i%5!==0)continue;const kinds=['fern','whiteFlowers','bush','mushrooms'] as const,key=['fern','flowers','bush','mushrooms'][i%4],w=18+campHash(i,8)*20;add(kinds[i%4],x,y,w,w,'forest-detail-'+key);}
for(const[x,y,v]of[[310,400,0],[1260,350,1],[1380,700,2],[260,1000,0],[1290,1030,1],[1030,310,2]])add('mossBoulder',x,y,58,58,'lake-rock-'+v,true);
for(const[x,y]of[[710,755],[900,750]])add('fallenLog',x,y,80,80,'forest-detail-log',true);
const layouts=new WeakMap<MapEditData,CampObject[]>();
export function campObjects(edits?:MapEditData):CampObject[]{
 if(!edits)return CAMP_OBJECTS;const cached=layouts.get(edits);if(cached)return cached;
 const out=CAMP_OBJECTS.flatMap(o=>{const e=edits.objects[o.id];if(e?.removed)return[];return[{...o,...(e?{x:(e.x+.5)*32,y:(e.y+.5)*32}:{})}];});
 for(const[id,e]of Object.entries(edits.objects))if(!e.removed&&e.kind&&!CAMP_OBJECTS.some(o=>o.id===id)){
  const template=CAMP_OBJECTS.find(o=>o.kind===e.kind);if(template)out.push({...template,id,x:(e.x+.5)*32,y:(e.y+.5)*32});
 }
 layouts.set(edits,out);return out;
}
export function campObjectBlocked(o:CampObject,x:number,y:number):boolean {
 if(!o.solid)return false;const dx=x-o.x,dy=y-o.y;
 if(o.kind==='standingTree'||o.kind==='pine')return Math.abs(dx)<13&&Math.abs(dy)<9;
 if(o.kind.startsWith('camp-tent'))return Math.abs(dx)<o.width*.38&&dy<4&&dy>-o.height*.49;
 if(o.kind==='camp-fence')return Math.abs(dx)<o.width*.48&&dy<5&&dy>-18;
 return (dx/(o.width*.36))**2+((dy+o.height*.15)/(o.height*.22))**2<1;
}
export function campBlockedPoint(x:number,y:number,edits?:MapEditData):boolean{return x<24||x>3048||y<24||y>2280||edits?.terrain[`${Math.floor(x/32)},${Math.floor(y/32)}`]==='water'||campObjects(edits).some(o=>campObjectBlocked(o,x,y));}
export const CAMP_VISITOR_SLOTS=[{x:1424,y:1168},{x:1696,y:1248},{x:1352,y:1024}];
export const CAMP_RESIDENT_SLOTS=[{x:1270,y:1008},{x:1816,y:1040},{x:1160,y:1360},{x:1952,y:1456},{x:1400,y:1416},{x:1712,y:1416},{x:1360,y:1552},{x:1744,y:1552}];
