import {it,expect} from 'vitest';
import {createRequire} from 'node:module';
import {mkdtempSync,mkdirSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SMITH_ASSETS} from '../src/systems/smith-layout';
import {MERCHANT_ROOM_ASSETS} from '../src/data/merchant-rooms';
import cliff from '../src/data/homestead-mountain-contour.json';
import plaza from '../public/assets/visual/village/plaza/manifest.json';
const {excludedAsset,pruneDistribution}=createRequire(import.meta.url)('../scripts/prune-distribution.cjs');
it('retains all runtime merchant and smith assets, current floors and the map editor reference',()=>{
 const assets=[...SMITH_ASSETS.map(a=>'dev/vila-v31/'+a.file),...MERCHANT_ROOM_ASSETS.filter(a=>a.file).map(a=>a.file.startsWith('assets/')?a.file:'dev/augusto/'+a.file),...cliff.panels.map(p=>p.file),plaza.file,plaza.floor.file,plaza.path.file,'assets/references/mapa_expandido.webp'];
 for(const file of assets)expect(excludedAsset(file),file).toBe(false);
});
it('removes only named build extras and leaves runtime files intact',()=>{
 const root=mkdtempSync(join(tmpdir(),'after-rain-package-'));
 try{
  for(const file of ['dev/augusto/previas/old.png','dev/augusto/sprites/tapete_central.png','assets/visual/village/plaza/piso-quadrado.png','assets/visual/village/plaza/piso-intertravado-refinado.png']){mkdirSync(join(root,file,'..'),{recursive:true});writeFileSync(join(root,file),'original');}
  const report=pruneDistribution(root);expect(report.bytes).toBe(16);expect(existsSync(join(root,'dev/augusto/previas/old.png'))).toBe(false);expect(existsSync(join(root,'dev/augusto/sprites/tapete_central.png'))).toBe(true);expect(existsSync(join(root,'assets/visual/village/plaza/piso-intertravado-refinado.png'))).toBe(true);
 }finally{rmSync(root,{recursive:true,force:true});}
});
