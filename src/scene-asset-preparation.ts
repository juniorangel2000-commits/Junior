import type Phaser from 'phaser';
const preparations=new WeakMap<Phaser.Scene,Promise<void>>();
/** Deduplicate lazy loading; failed attempts can be retried without marking assets ready. */
export function prepareSceneAssets(scene:Phaser.Scene,queue:()=>void,finish:()=>void):Promise<void>{
 const existing=preparations.get(scene);if(existing)return existing;
 const preparation=new Promise<void>((resolve,reject)=>{
  let failure:Error|undefined;
  const failed=(file:{key:string})=>{failure??=Error(`Não foi possível carregar: ${file.key}`);};
  const cleanup=()=>{scene.load.off('loaderror',failed);scene.load.off('complete',complete);};
  const complete=()=>{
   cleanup();
   if(failure){reject(failure);return;}
   try{finish();resolve();}catch(error){reject(error);}
  };
  scene.load.on('loaderror',failed);scene.load.once('complete',complete);
  try{queue();scene.load.start();}catch(error){cleanup();reject(error);}
 });
 preparations.set(scene,preparation);
 void preparation.catch(()=>{if(preparations.get(scene)===preparation)preparations.delete(scene);});
 return preparation;
}
