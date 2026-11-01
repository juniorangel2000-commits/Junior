interface TextureStore { exists(key:string):boolean; remove(key:string):unknown }
const signatures = new WeakMap<TextureStore, Map<string,string>>();
/** Keep one texture per map namespace, rebuilding only when its terrain input changes. */
export function reusableTerrainTexture(store: TextureStore, key: string, terrain: unknown): boolean {
  let cached=signatures.get(store);
  if(!cached){cached=new Map();signatures.set(store,cached);}
  const signature=JSON.stringify(terrain ?? {});
  if(store.exists(key)&&cached.get(key)===signature)return true;
  if(store.exists(key))store.remove(key);
  cached.set(key,signature);
  return false;
}
