/** Regras de montaria e corda (docs/construcoes/MONTARIA.md):
 * - montado, não se entra em interiores (casa, lojas, abrigos, mina, masmorras): a porta avisa;
 * - montado ou conduzindo um animal na corda, não se entra na água. */
export const MOUNTED_ENTRY_MESSAGE='Desça do cavalo (V) para entrar.';
let lastWarning=-Infinity;
/** Impede a entrada montado; avisa no máximo a cada 1,5 s (a porta é tentada a cada quadro). */
export function blockMountedEntry(player:{mounted:boolean}|undefined,ui:{toast(message:string):void},now=performance.now()):boolean{
 if(!player?.mounted)return false;
 if(now-lastWarning>1500){lastWarning=now;ui.toast(MOUNTED_ENTRY_MESSAGE);}
 return true;
}
/** Pode pisar em (x, y)? Seco sempre pode; com água, só quem não está montado nem com a corda,
 * ou quem já está na água e vai para um lugar mais raso (para conseguir sair). */
export function dryStepAllowed(keepDry:boolean,depthHere:number,depthThere:number):boolean{
 return !keepDry||depthThere<=.005||depthThere<depthHere;
}
