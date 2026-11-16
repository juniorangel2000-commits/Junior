// Medidor de desempenho dos Campos Abertos (Vite em 127.0.0.1:5190): persegue os animais por
// 360 quadros e mostra o tempo médio por quadro de cada parte (rota de fuga, sombras, salvamento)
// e os picos acima de 40 ms. Uso: node scripts/perf-fields.cjs
const{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await b.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(180000);page.on('pageerror',e=>console.log('ERRO',e.message));
await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Perfil');await page.getByRole('button',{name:'Começar minha história'}).click();
await page.waitForFunction(()=>{document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area==='property';});
await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;const v=game.scene.getScene('Vale');const s=v.snapshotState();s.time=9*60;v.scene.sleep();v.scene.launch('Campos',{save:s,ui:v.ui,onReturn:()=>{}});});
await page.waitForFunction(()=>game.scene.isActive('Campos')&&game.scene.getScene('Campos').world);await page.waitForTimeout(4000);
const r=await page.evaluate(async()=>{const c=game.scene.getScene('Campos'),w=c.world;const AnimalBrain={prototype:Object.getPrototypeOf(w.animals[0].brain)};
 const t={},mx={};const wrap=(obj,name,label)=>{const f=obj[name];obj[name]=function(...a){const s=performance.now();try{return f.apply(this,a);}finally{const d=performance.now()-s;t[label]=(t[label]??0)+d;mx[label]=Math.max(mx[label]??0,d);if(d>40)(window.spikes??=[]).push(label+':'+d.toFixed(0)+'@'+Math.round(performance.now()-t0));}};};const t0=performance.now();
 wrap(AnimalBrain.prototype,'update','brain.update');wrap(AnimalBrain.prototype,'plan','brain.plan');wrap(AnimalBrain.prototype,'lineClear','lineClear');wrap(AnimalBrain.prototype,'canSee','canSee');wrap(AnimalBrain.prototype,'canStand','canStand');
 wrap(w,'update','world.update');wrap(c,'persist','persist');wrap(c,'snapshotState','snapshotState');wrap(c.daylight,'update','daylight');{const sh=c.daylight.shadows,f=sh.texture;sh.texture=function(src){const t=performance.now();const r=f.call(this,src);const d=performance.now()-t;if(d>20)(window.spikes??=[]).push('SOMBRA '+src.texture.key+' frame '+src.frame.name+' '+src.frame.realWidth+'x'+src.frame.realHeight+' '+d.toFixed(0)+'ms');return r;};}wrap(c.daylight.shadows,'update','sombras');wrap(c.daylight.fixtures,'update','luzes');wrap(c.daylight.rain,'update','chuva');wrap(c.farming,'update','farming');wrap(c,'updateHUD','updateHUD');wrap(c.player,'update','player.update');
 const sm=c.sys;wrap(game.renderer,'render','render');
 const frames=[];let last=performance.now();
 // Persegue o animal mais próximo, que foge: cada quadro o jogador fica a 60 px dele.
 const names=w.animals.map(a=>a.brain.kind);
 await new Promise(res=>{let n=0;const step=()=>{const now=performance.now();frames.push(now-last);last=now;const a=w.animals[n%240<120?0:1]??w.animals[0];c.player.x=a.brain.x-50;c.player.y=a.brain.y-20;if(++n<360)requestAnimationFrame(step);else res();};requestAnimationFrame(step);});
 frames.sort((a,b)=>a-b);const total=frames.reduce((a,b)=>a+b,0);
 return {picos:window.spikes,animais:names,quadros:frames.length,media:(total/frames.length).toFixed(1),p95:frames[Math.floor(frames.length*.95)].toFixed(1),pior:frames.at(-1).toFixed(1),porQuadro:Object.fromEntries(Object.entries(t).map(([k,v])=>[k,(v/frames.length).toFixed(2)+' ms (máx '+mx[k].toFixed(0)+')']))};});
console.log(JSON.stringify(r,null,1));await b.close();})();
