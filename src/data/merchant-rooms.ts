import {compileRoomNavigation,type NavigationRect} from '../systems/room-navigation';
import catalog from '../../public/dev/augusto/manifest.json';
import authoredAugusto from './augusto-layout.json';
import type {ResidentId} from '../systems/merchant-visit';
import type {SmithAsset,SmithLayout} from '../systems/smith-layout';
export const MERCHANT_ROOM_SIZE={width:576,height:384};
export const MERCHANT_ROOM_ENTRY={x:288,y:335};
export const MERCHANT_ROOM_OWNER={x:288,y:151};
export const MERCHANT_ROOM_EXIT={x:288,y:357,halfWidth:24,depth:10,direction:'down' as const};
export const merchantAssets=catalog.objects;
const sets:Partial<Record<ResidentId,string[]>>={
 amelia:['estante_potes','armario_fundos','sacos_graos','ervas_penduradas','placa_botanica','enfeite_floral','vaso_ervas','mesa_embalagem'],
 tobias:['armario_fundos','comoda_estoque','mesa_expositora','mesa_embalagem','banquinho','banco_espera','cadeira_augusto','escada_estoque','caixote_vazio'],
 rosa:['estante_sementes','frutas_hortalicas','mesa_expositora','caixas_frutas','cesta_macas','sacos_graos','vaso_ervas','comoda_estoque'],
 nilo:['armario_fundos','estante_potes','comoda_estoque','placa_botanica','mesa_embalagem','barril_canto'],
 celina:['expositor_suprimentos','comoda_estoque','armario_fundos','mesa_embalagem','cadeira_augusto','banquinho','banco_espera'],
 damiao:['barril_canto','expositor_suprimentos','mesa_expositora','sacos_lateral_direita','caixote_vazio','banco_espera'],
 helena:['estante_potes','mesa_expositora','mesa_embalagem','cadeira_augusto','banco_espera','enfeite_floral','comoda_estoque'],
 icaro:['armario_fundos','expositor_suprimentos','comoda_estoque','mesa_embalagem','barril_canto','caixote_vazio','escada_estoque'],
};
const common=['balcao_central','balanca_balcoes','livro_caixa','caixa_registro','lamparina_parede','tapete_central','capacho_entrada','toalha_balcao'];
export const merchantRoomPieces=(id:ResidentId)=>id==='augusto'?merchantAssets:merchantAssets.filter(a=>common.includes(a.id)||sets[id]?.includes(a.id));
export const MERCHANT_ROOM_ASSETS:readonly SmithAsset[]=[...merchantAssets.map(a=>({id:a.id,name:a.name,file:a.file,w:a.width,h:a.height,ox:a.origin.x,oy:a.origin.y,bounds:a.visibleBoundsAlpha128,collision:a.collision,layer:a.depth.previewLayer==='floor'?'floor' as const:a.depth.previewLayer==='wall'?'wall' as const:'object' as const})),
 {id:'structure',name:'Paredes e estrutura',file:'',w:576,h:384,ox:0,oy:0,bounds:[0,0,576,384],collision:null,layer:'wall'},
 {id:'floor-wood',name:'Piso de madeira',file:'materiais/piso-madeira.png',w:1,h:1,ox:0,oy:0,bounds:[0,0,1,1],collision:null,layer:'floor',tile:true},
 {id:'floor-stone',name:'Piso de pedra',file:'../vila-v31/bento/interior-novo/piso-lajes.png',w:1,h:1,ox:0,oy:0,bounds:[0,0,1,1],collision:null,layer:'floor',tile:true},
];
const cached=new Map<ResidentId,SmithLayout>();
function previousRoomDefault(id:ResidentId):SmithLayout{let data=cached.get(id);if(!data){data={version:1,pieces:[{id:'structure',asset:'structure',x:0,y:0,sx:1,sy:1,visible:true,wallShade:1},{id:'floor',asset:'floor-wood',x:33,y:116,sx:510,sy:234,visible:true},...merchantRoomPieces(id).map(a=>({id:a.id,asset:a.id,x:a.recommendedPosition.x*.6,y:a.recommendedPosition.y*.6,sx:a.scale*.6,sy:a.scale*.6,visible:true,...a.supportId?{parent:a.supportId}:{}}))]};cached.set(id,data);}return data;}
const roomDefault=(id:ResidentId):SmithLayout=>id==='augusto'?authoredAugusto as SmithLayout:previousRoomDefault(id);
export const createMerchantLayout=(id:ResidentId)=>structuredClone(roomDefault(id));
/** Upgrade only the untouched original room; preserve any player-authored edits. */
export function resolveMerchantLayout(id:ResidentId,saved?:SmithLayout):SmithLayout{
 return structuredClone(!saved||id==='augusto'&&JSON.stringify(saved)===JSON.stringify(previousRoomDefault(id))?roomDefault(id):saved);
}
export function validMerchantLayout(value:unknown):value is SmithLayout{
 if(!value||typeof value!=='object')return false;const d=value as SmithLayout;if(d.version!==1||!Array.isArray(d.pieces)||d.pieces.length>140)return false;const ids=new Set<string>();
 for(const p of d.pieces){const a=MERCHANT_ROOM_ASSETS.find(a=>a.id===p?.asset);if(!p||!a||typeof p.id!=='string'||!/^[-\w]{1,90}$/.test(p.id)||ids.has(p.id)||![p.x,p.y,p.sx,p.sy].every(Number.isFinite)||p.x< -100||p.y< -100||p.x>700||p.y>450||p.sx<=0||p.sy<=0||(a.bounds[2]-a.bounds[0])*p.sx>700||(a.bounds[3]-a.bounds[1])*p.sy>450||typeof p.visible!=='boolean'||p.solid!==undefined&&typeof p.solid!=='boolean'||p.effects!==undefined&&typeof p.effects!=='boolean'||p.wallShade!==undefined&&(!Number.isFinite(p.wallShade)||p.wallShade<0||p.wallShade>1))return false;ids.add(p.id);}
 const frame=d.pieces.filter(p=>p.id==='structure'&&p.asset==='structure');if(frame.length!==1||frame[0].x!==0||frame[0].y!==0||frame[0].sx!==1||frame[0].sy!==1)return false;
 for(const p of d.pieces){if(p.parent!==undefined&&typeof p.parent!=='string')return false;const seen=new Set([p.id]);let parent=p.parent;while(parent){if(seen.has(parent))return false;seen.add(parent);const next=d.pieces.find(p=>p.id===parent);if(!next)return false;parent=next.parent;}}
 return true;
}
export function merchantPieceVisible(data:SmithLayout,id:string):boolean{const p=data.pieces.find(p=>p.id===id);return !!p&&p.visible&&(!p.parent||merchantPieceVisible(data,p.parent));}
export function merchantRoomBlocked(id:ResidentId,x:number,y:number,layout?:SmithLayout):boolean{
 if(!(x>=36&&x<=540&&y>=118&&y<=350||x>=263&&x<=313&&y>=350&&y<=368))return true;
 const data=layout??roomDefault(id);return data.pieces.some(p=>{const a=MERCHANT_ROOM_ASSETS.find(a=>a.id===p.asset)!,b=a.bounds,c=a.collision??(p.solid?{x:b[0]+(b[2]-b[0])*.12,y:b[1]+(b[3]-b[1])*.78,width:(b[2]-b[0])*.76,height:(b[3]-b[1])*.2}:null);if(!c||p.solid===false||!merchantPieceVisible(data,p.id))return false;const left=p.x+(c.x-a.ox*a.w)*p.sx,top=p.y+(c.y-a.oy*a.h)*p.sy;return x>=left&&x<=left+c.width*p.sx&&y>=top&&y<=top+c.height*p.sy;});
}
export const merchantRoomFits=(id:ResidentId,x:number,y:number,layout?:SmithLayout)=>Number.isFinite(x)&&Number.isFinite(y)&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!merchantRoomBlocked(id,x+dx,y+dy,layout));
export function merchantRoomConnected(id:ResidentId,data:SmithLayout):boolean{if(!merchantRoomFits(id,288,335,data)||!merchantRoomFits(id,288,151,data))return false;const queue=[{x:288,y:335}],seen=new Set(['288,335']);for(let i=0;i<queue.length&&queue.length<20000;i++){const p=queue[i];if(Math.hypot(p.x-288,p.y-225)<8)return true;for(const[dx,dy]of[[4,0],[-4,0],[0,4],[0,-4]]){const next={x:p.x+dx,y:p.y+dy},key=`${next.x},${next.y}`;if(!seen.has(key)&&merchantRoomFits(id,next.x,next.y,data)){seen.add(key);queue.push(next);}}}return false;}

/** The same fine navigation grid used by the blacksmith, with movable furniture. */
export function merchantRoomNavigation(id:ResidentId,layout?:SmithLayout):import('../systems/bento-routine').BentoRoomNavigation{
 const data=layout??roomDefault(id),rects:NavigationRect[]=[];
 for(const p of data.pieces){const a=MERCHANT_ROOM_ASSETS.find(a=>a.id===p.asset)!,b=a.bounds,c=a.collision??(p.solid?{x:b[0]+(b[2]-b[0])*.12,y:b[1]+(b[3]-b[1])*.78,width:(b[2]-b[0])*.76,height:(b[3]-b[1])*.2}:null);
  if(!c||p.solid===false||!merchantPieceVisible(data,p.id))continue;const left=p.x+(c.x-a.ox*a.w)*p.sx,top=p.y+(c.y-a.oy*a.h)*p.sy;rects.push({left,top,right:left+c.width*p.sx,bottom:top+c.height*p.sy});
 }
 return compileRoomNavigation((x,y)=>x>=36&&x<=540&&y>=118&&y<=350||x>=263&&x<=313&&y>=350&&y<=368,rects,
  {entry:MERCHANT_ROOM_ENTRY,exit:MERCHANT_ROOM_EXIT,width:72,height:48,tileSize:8,stops:[{x:36,y:18},{x:49,y:18},{x:17,y:30},{x:36,y:38}]});
}
