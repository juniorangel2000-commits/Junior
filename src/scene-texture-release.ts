import Phaser from 'phaser';
/** Libera as imagens de um cenário quando ele termina (docs/planejamento/DESEMPENHO.md).
 *
 * Nenhum cenário apagava o que carregou: a memória de vídeo crescia a cada viagem e passava
 * de 2 GB depois de visitar o mundo. Agora, ao iniciar um cenário, guardamos as chaves de
 * imagem que já existiam; ao encerrá-lo, apagamos as que ele criou, menos as que algum
 * cenário ainda aberto (a Propriedade fica dormindo em segundo plano) está mostrando.
 * As animações que usam uma imagem apagada também saem. Os módulos de arte conferem
 * `textures.exists` antes de carregar, então a próxima visita carrega tudo de novo. */
const PROTECTED=new Set(['__DEFAULT','__MISSING','__WHITE','__NORMAL']);
/** Chaves de imagem usadas pelos objetos de um cenário (inclusive dentro de containers). */
export function sceneTextureKeys(scene:Phaser.Scene):Set<string>{
 type Node={texture?:{key?:string};list?:unknown[];mask?:{bitmapMask?:unknown;geometryMask?:unknown}};
 const keys=new Set<string>(),seen=new Set<unknown>(),visit=(o:unknown)=>{
  if(!o||seen.has(o))return;seen.add(o);const obj=o as Node;
  if(obj.texture?.key)keys.add(obj.texture.key);
  // A imagem da máscara não fica na lista do cenário: só aparece pelo objeto mascarado.
  visit(obj.mask?.bitmapMask);
  if(Array.isArray(obj.list))for(const c of obj.list)visit(c);
 };
 for(const o of scene.children?.list??[])visit(o);
 for(const cam of scene.cameras?.cameras??[])visit((cam as unknown as {mask?:unknown}).mask&&{mask:(cam as unknown as {mask?:unknown}).mask});
 return keys;
}
/** Apaga as chaves `created` que nenhum cenário em `others` está usando. Devolve as apagadas. */
export function releaseTextures(game:Phaser.Game,created:Iterable<string>,others:readonly Phaser.Scene[]):string[]{
 const used=new Set<string>();for(const s of others)for(const k of sceneTextureKeys(s))used.add(k);
 const removed:string[]=[];
 for(const key of created){if(PROTECTED.has(key)||used.has(key)||!game.textures.exists(key))continue;game.textures.remove(key);removed.push(key);}
 if(removed.length){const gone=new Set(removed);
  for(const anim of [...(game.anims as unknown as {anims:Phaser.Structs.Map<string,Phaser.Animations.Animation>}).anims.values()])
   if(anim.frames.some(f=>gone.has(f.textureKey)))game.anims.remove(anim.key);
 }
 return removed;
}
/** Liga a liberação nos cenários que são encerrados ao sair. `keep`: cenários que nunca
 * liberam (a Propriedade dorme em segundo plano e o editor de mapa volta para o cenário). */
export function installSceneTextureRelease(game:Phaser.Game,keep:readonly string[]=['Vale','Editor']):void{
 const before=new Map<string,Set<string>>();
 // Os cenários só existem depois que o jogo termina de iniciar.
 if(!game.scene.scenes.length){game.events.once(Phaser.Core.Events.READY,()=>installSceneTextureRelease(game,keep));return;}
 // Liberações pendentes. Rodam quando o próximo cenário começa, ANTES do carregamento dele
 // (preview.43): antes rodavam um instante depois, quando o cenário seguinte já tinha
 // conferido que a imagem existia e não carregava de novo. Assim o Damião, que a Vila monta
 // e a Estrada e o Lago também usam, virava um quadradinho vazio.
 const pending:(()=>void)[]=[];
 const flush=()=>{while(pending.length)pending.shift()!();};
 for(const scene of game.scene.scenes){
  const key=scene.scene.key;
  scene.events.on(Phaser.Scenes.Events.START,flush);
  if(keep.includes(key))continue;
  scene.events.on(Phaser.Scenes.Events.START,()=>before.set(key,new Set(game.textures.getTextureKeys())));
  scene.events.on(Phaser.Scenes.Events.SHUTDOWN,()=>{
   const start=before.get(key);if(!start)return;before.delete(key);
   // Depois do encerramento (os textos do cenário apagam as próprias imagens): no começo do
   // próximo cenário ou, se nenhum começar, logo depois.
   pending.push(()=>{
    const open=game.scene.scenes.filter(s=>s!==scene&&(s.sys.isActive()||s.sys.isSleeping()||s.sys.isPaused()));
    releaseTextures(game,game.textures.getTextureKeys().filter(k=>!start.has(k)),open);
   });
   window.setTimeout(flush,0);
  });
 }
}
