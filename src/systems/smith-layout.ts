import catalog from '../../public/dev/vila-v31/bento/novas-sprites.json';
import authoredLayout from '../data/blacksmith-layout.json';

export interface SmithPiece {id:string;asset:string;x:number;y:number;sx:number;sy:number;visible:boolean;parent?:string;solid?:boolean;effects?:boolean;wallShade?:number}
export interface SmithLayout {version:1;finishRevision?:1;pieces:SmithPiece[]}
export interface SmithAsset {id:string;name:string;file:string;frame?:string;crop?:{x:number;y:number;width:number;height:number};w:number;h:number;ox:number;oy:number;bounds:number[];collision:{x:number;y:number;width:number;height:number}|null;layer:'floor'|'wall'|'object'|'front';tile?:boolean}
const assets:SmithAsset[]=[];const defaults:SmithPiece[]=[];
const add=(a:SmithAsset,x:number,y:number,sx:number,sy=sx,visible=true,parent?:string)=>{assets.push(a);defaults.push({id:a.id,asset:a.id,x,y,sx,sy,visible,...parent?{parent}:{}});};
for(const a of [...catalog.objects,...catalog.fidelityObjects])add({id:a.id,name:a.name,file:a.file,w:a.width,h:a.height,ox:a.origin.x,oy:a.origin.y,bounds:a.visibleBoundsAlpha128,collision:a.collision,layer:a.id==='tapete_ferraria'?'floor':'object'},a.recommendedPosition.x,a.recommendedPosition.y,'scaleX'in a&&a.scaleX?a.scaleX:a.scale,a.scale,!('sceneVisible'in a)||a.sceneVisible!==false,'supportId'in a&&a.supportId?a.supportId:undefined);
const mat=(id:string)=>catalog.roomMaterials.find(a=>a.id===id)!;
for(const [id,name,x,y,w,h,material]of [
 ['floor-left','Piso do atendimento',60,119,229.5,156,'piso-madeira'],['floor-right','Piso da oficina',289.5,119,238,156,'piso-lajes'],['floor-door','Piso da entrada',214,275,62,54,'piso-madeira'],
] as const){const m=mat(material);add({id,name,file:m.file,w:1,h:1,ox:0,oy:0,bounds:[0,0,1,1],collision:null,layer:'floor',tile:true},x,y,w,h);}
const structure=catalog.layers.structure.file;
add({id:'structure',name:'Estrutura e paredes',file:structure,w:1062,h:617,ox:0,oy:0,bounds:[0,0,1062,617],collision:null,layer:'wall'},24,24,.5);
defaults.find(p=>p.id==='structure')!.wallShade=.98;
add({id:'window',name:'Janela com floreira',file:structure,frame:'window',w:108,h:124,ox:4/108,oy:4/124,bounds:[4,4,104,120],collision:null,layer:'wall'},119,56,.5);
const panel=mat('lambril-madeira'),b=panel.visibleBoundsAlpha128;
let n=0;for(const [left,right,count]of [[60,118,1],[170,289.5,2],[289.5,527,4]]){const width=(right-left)/count;for(let i=0;i<count;i++)add({id:'wall-panel-'+(++n),name:'Lambril '+n,file:panel.file,w:panel.width,h:panel.height,ox:panel.origin.x,oy:panel.origin.y,bounds:b,collision:null,layer:'wall'},left+width*(i+.5),119,width/(b[2]-b[0]),28/(b[3]-b[1]));}
for(const a of catalog.floorTransitions)add({id:a.id,name:a.name,file:a.file,w:a.width,h:a.height,ox:a.origin.x,oy:a.origin.y,bounds:a.visibleBoundsAlpha128,collision:null,layer:'floor'},a.position.x,a.position.y,a.scaleX,a.scale,false);
// The same timber moulding wraps around all walls, always below furniture.
for(const [id,name,crop,placements]of [
 ['wall-edge-vertical','Acabamento lateral de madeira',{x:36,y:110,width:12,height:350},[['wall-edge-left',54,119,6,156],['wall-edge-right',527,119,6,156]]],
 ['wall-edge-horizontal','Acabamento frontal de madeira',{x:200,y:28,width:100,height:16},[['wall-edge-front-left',60,275,154,6],['wall-edge-front-right',276,275,251,6]]]
] as const){assets.push({id,name,file:structure,frame:id,crop,w:crop.width,h:crop.height,ox:0,oy:0,bounds:[0,0,crop.width,crop.height],collision:null,layer:'wall'});for(const [id,x,y,w,h]of placements)defaults.push({id,asset:assets.at(-1)!.id,x,y,sx:w/crop.width,sy:h/crop.height,visible:true,parent:'structure'});}
// Previously authored furniture remains available in the palette, without changing the new layout.
for(const [id,name,w,h,bounds]of [
 ['armor-stand','Mostruário de armadura',96,144,[6,2,90,142]],['weapon-rack','Mostruário de armas',128,128,[2,13,126,126]],
 ['bellows','Fole de ferraria',80,72,[2,25,78,70]],['iron-stock','Estoque de ferro',128,80,[2,13,126,78]],
 ['counter-left','Balcão modular · esquerda',64,96,[0,11,64,94]],['counter-middle','Balcão modular · centro',64,96,[0,11,64,91]],['counter-right','Balcão modular · direita',64,96,[0,11,64,94]],
 ['counter','Balcão anterior',128,96,[2,16,126,94]],['counter-long','Balcão comprido anterior',256,96,[0,11,256,94]],
 ['grindstone','Rebolo anterior',88,104,[2,41,86,102]],['coal-bin','Carvão anterior',64,64,[2,6,62,62]],['tool-rack','Ferramentas anteriores',160,104,[6,2,153,102]],['parts-shelf','Prateleira anterior',128,112,[2,17,126,110]]
] as const)assets.push({id:'preserved-'+id,name,file:'preservados-jogo/village/blacksmith-'+id+'.png',w,h,ox:.5,oy:1,bounds:[...bounds],layer:'object',collision:{x:bounds[0]+4,y:bounds[1]+(bounds[3]-bounds[1])*.76,width:bounds[2]-bounds[0]-8,height:(bounds[3]-bounds[1])*.2}});
export const SMITH_ASSETS:readonly SmithAsset[]=assets;
export const smithAsset=(id:string)=>assets.find(a=>a.id===id);
export const createLegacySmithLayout=():SmithLayout=>({version:1,finishRevision:1,pieces:structuredClone(defaults)});
export const createSmithLayout=():SmithLayout=>structuredClone(authoredLayout) as SmithLayout;
export function validSmithLayout(v:unknown):v is SmithLayout{
 if(!v||typeof v!=='object')return false;const d=v as SmithLayout;
 if(d.version!==1||d.finishRevision!==undefined&&d.finishRevision!==1||!Array.isArray(d.pieces)||d.pieces.length>140)return false;
 const ids=new Set<string>();
 for(const p of d.pieces){if(!p||typeof p.id!=='string'||!/^[-\w]{1,90}$/.test(p.id)||ids.has(p.id)||!smithAsset(p.asset)||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x< -100||p.x>700||p.y< -100||p.y>450||!Number.isFinite(p.sx)||!Number.isFinite(p.sy)||p.sx<.001||p.sx>650||p.sy<.001||p.sy>650||typeof p.visible!=='boolean'||p.solid!==undefined&&typeof p.solid!=='boolean'||p.effects!==undefined&&typeof p.effects!=='boolean'||p.parent!==undefined&&typeof p.parent!=='string')return false;const a=smithAsset(p.asset)!;if((a.bounds[2]-a.bounds[0])*p.sx>650||(a.bounds[3]-a.bounds[1])*p.sy>450)return false;ids.add(p.id);}
 if(d.pieces.filter(p=>p.id==='structure'&&p.asset==='structure').length!==1||d.pieces.some(p=>p.wallShade!==undefined&&(!Number.isFinite(p.wallShade)||p.wallShade<0||p.wallShade>1)))return false;
 for(const p of d.pieces){const seen=new Set([p.id]);let parent=p.parent;while(parent){if(seen.has(parent))return false;seen.add(parent);const a=d.pieces.find(a=>a.id===parent);if(!a)return false;parent=a.parent;}}
 const f=d.pieces.find(p=>p.id==='structure')!;return f.sx>=.4&&f.sx<=.6&&f.sy>=.4&&f.sy<=.6&&f.x>=0&&f.y>=0&&f.x+1062*f.sx<=576&&f.y+617*f.sy<=352;
}
export function smithPieceVisible(d:SmithLayout,p:SmithPiece):boolean{return p.visible&&(!p.parent||smithPieceVisible(d,d.pieces.find(a=>a.id===p.parent)!));}
export function smithProject(d:SmithLayout,x:number,y:number){const f=d.pieces.find(p=>p.id==='structure')!;return{x:f.x+(x-24)*f.sx/.5,y:f.y+(y-24)*f.sy/.5};}
export const smithSpawn=(d:SmithLayout)=>smithProject(d,245,309);
export const smithDoor=(d:SmithLayout)=>({...smithProject(d,245,321),halfWidth:24,depth:10,direction:'down' as const});
export function smithBlocked(d:SmithLayout,x:number,y:number):boolean{
 const f=d.pieces.find(p=>p.id==='structure')!,wx=(x-f.x)*.5/f.sx+24,wy=(y-f.y)*.5/f.sy+24;
 if(!(wx>=60&&wx<=527&&wy>=119&&wy<=275||wx>=214&&wx<=276&&wy>=275&&wy<=329))return true;
 return d.pieces.some(p=>{const a=smithAsset(p.asset)!,b=a.bounds,c=a.collision??(p.solid?{x:b[0]+(b[2]-b[0])*.16,y:b[1]+(b[3]-b[1])*.77,width:(b[2]-b[0])*.68,height:(b[3]-b[1])*.19}:null);if(!smithPieceVisible(d,p)||p.solid===false||!c)return false;const left=p.x+(c.x-a.ox*a.w)*p.sx,top=p.y+(c.y-a.oy*a.h)*p.sy;return x>=left&&x<=left+c.width*p.sx&&y>=top&&y<=top+c.height*p.sy;});
}
export const smithFits=(d:SmithLayout,x:number,y:number)=>Number.isFinite(x)&&Number.isFinite(y)&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!smithBlocked(d,x+dx,y+dy));
export function smithConnected(d:SmithLayout):boolean{
 const start=smithSpawn(d),goal=smithProject(d,245,260);if(!smithFits(d,start.x,start.y))return false;
 const q=[start],seen=new Set([`${start.x},${start.y}`]);for(let i=0;i<q.length&&q.length<16000;i++){const p=q[i];if(Math.hypot(p.x-goal.x,p.y-goal.y)<9)return true;for(const[dx,dy]of[[4,0],[-4,0],[0,4],[0,-4]]){const x=p.x+dx,y=p.y+dy,k=`${x},${y}`;if(!seen.has(k)&&smithFits(d,x,y)){seen.add(k);q.push({x,y});}}}return false;
}
export function moveSmithPiece(d:SmithLayout,id:string,x:number,y:number):void{const p=d.pieces.find(a=>a.id===id);if(!p)return;const dx=x-p.x,dy=y-p.y;const move=(p:SmithPiece)=>{p.x+=dx;p.y+=dy;for(const c of d.pieces)if(c.parent===p.id)move(c);};move(p);}
export function smithNavigation(d:SmithLayout){return{isBlocked:(x:number,y:number)=>!smithFits(d,x*8+4,y*8+4),validPosition:(x:number,y:number)=>smithFits(d,x,y),entry:smithSpawn(d),exit:{...smithDoor(d),y:smithDoor(d).y+4},width:72,height:44,tileSize:8,stops:[{x:30,y:29},{x:30,y:18},{x:48,y:24},{x:30,y:34}]};}

/** One-time visual upgrade, preserving every authored furniture position and material. */
export function upgradeSmithFinish(layout:SmithLayout):SmithLayout{
 const d=structuredClone(layout);if(d.finishRevision===1)return d;
 for(const p of d.pieces)if(p.asset==='soleira_pisos')p.visible=false;
 const f=d.pieces.find(p=>p.id==='structure')!;
 for(const p of defaults.filter(p=>p.id.startsWith('wall-edge-'))){if(d.pieces.some(a=>a.id===p.id))continue;const point=smithProject(d,p.x,p.y);d.pieces.push({...p,...point,sx:p.sx*f.sx/.5,sy:p.sy*f.sy/.5});}
 d.finishRevision=1;return d;
}
export function smithFloorSeam(d:SmithLayout){const a=d.pieces.find(p=>p.id==='floor-left'),b=d.pieces.find(p=>p.id==='floor-right');if(!a||!b||!a.visible||!b.visible||a.asset===b.asset||Math.abs(a.x+a.sx-b.x)>.1)return null;return{x:b.x,top:Math.max(a.y,b.y),bottom:Math.min(a.y+a.sy,b.y+b.sy)};}

/** Wall-mounted objects remain in front of the wall's timber, even when parented. */
export function smithPieceDepth(d:SmithLayout,p:SmithPiece):number{
 const a=smithAsset(p.asset)!;
 if(p.parent){const parent=d.pieces.find(a=>a.id===p.parent);if(parent){if(a.layer==='object'&&smithAsset(parent.asset)!.layer==='wall')return p.y;return smithPieceDepth(d,parent)+.1;}}
 return a.tile?-1000:a.layer==='floor'?-810:a.layer==='wall'?-500:a.layer==='front'?10000:p.y;
}

/** Adopt the author's new default only when the saved room was never customized. */
export function resolveSmithLayout(saved?:SmithLayout):SmithLayout{
 if(!saved)return createSmithLayout();
 const d=upgradeSmithFinish(saved);
 const comparable=(layout:SmithLayout)=>JSON.stringify([...layout.pieces].sort((a,b)=>a.id.localeCompare(b.id)).map(p=>({id:p.id,asset:p.asset,x:p.x,y:p.y,sx:p.sx,sy:p.sy,visible:p.visible,parent:p.parent??null,solid:p.solid??!!smithAsset(p.asset)?.collision,effects:p.effects!==false,wallShade:p.wallShade??(p.id==='structure'?.98:0)})));
 return comparable(d)===comparable(createLegacySmithLayout())?createSmithLayout():d;
}
