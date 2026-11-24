const{chromium}=require('playwright');const fs=require('fs');const PASSOS=require('./passos.js');
const ORDER='primeira-colheita maos-a-obra vizinhos raizes primeiro-anzol a-corda fogao vida-na-vila curral explorador coletor cavalo estacoes bichos-felizes oficina oficio diario-cheio rede luz-no-escuro agua colmeia amizades casinha primeira-expedicao lar ferro artesao receitas longe ruinas sobreviventes hordas horta-farta ouro escondidas fazenda-cheia historias estufa vale novos-vizinhos metal-negro veterano festas economias anos'.split(' ');
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:720},recordVideo:{dir:__dirname+'/video',size:{width:1280,height:720}}});
const page=await ctx.newPage();page.setDefaultTimeout(400000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
const wait=ms=>page.waitForTimeout(ms);
await page.goto('http://127.0.0.1:5190');await wait(1500);
await page.locator('#new-game').click();await page.locator('#character-name').fill('Junior');await page.getByRole('button',{name:'Começar minha história'}).click();
await page.waitForFunction(()=>{document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area==='property';});await wait(3000);
await page.evaluate(async src=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.SM=await import('/src/systems/save.ts');window.P=(await import('/src/data/projects.ts')).PROJECTS;window.DISHES=(await import('/src/data/kitchen.ts')).DISH_IDS;window.__ach=[];
 window.addEventListener('after-rain-achievement',e=>e.detail.forEach(a=>window.__ach.push(a.name)));window.__src=src;},PASSOS);
await page.evaluate(async xs=>{window.X=await (eval('('+xs+')'))();},require('./x.js').toString());
const log=[];
const CROPS_NEEDED={raizes:30,estacoes:50,'horta-farta':100};
const plant=async n=>page.evaluate(n=>{const v=game.scene.getScene('Vale'),f=v.farming;const ground={area:'property',terrainAt:()=>'grass',occupied:()=>false,reserved:()=>false};
 v.inventory.data.hoe=Math.max(1,v.inventory.data.hoe);v.inventory.data.tomatoSeeds=(v.inventory.data.tomatoSeeds??0)+n;
 let x=30,y=24;while(f.soilTiles.length<n+5&&y<60){f.prepare(x,y,v.inventory,ground);x++;if(x>70){x=30;y++;}}
 for(const t of f.soilTiles){if(f.crops.length>=n)break;if(!f.cropAt(t.x,t.y))f.plant(t.x,t.y,v.inventory,v.state.day,'tomato');}
 return f.crops.length;},n);
const apply=async(id)=>page.evaluate(id=>{const v=game.scene.getScene('Vale');const s=structuredClone(v.snapshotState());if(s.day<40)s.day=40;
 s.missions=SM.currentMissionLog(s);const inv=(i,n)=>X.addItem(s,i,n);const area=a=>{if(!s.missions.areas.includes(a))s.missions.areas.push(a);};const ev=e=>{(s.missions.events??=[]).push(e);};
 const steps=new Function('s','inv','area','ev','P','DISHES','X',window.__src)(s,inv,area,ev,P,DISHES,window.X);steps[id]();
 if(!SM.validateSave(s)){const prev=v.snapshotState();const bad=[];for(const k of Object.keys(s)){if(JSON.stringify(s[k])===JSON.stringify(prev[k]))continue;const t=structuredClone(prev);t[k]=s[k];if(!SM.validateSave(t))bad.push(k);}return 'INVÁLIDO: '+bad.join(',');}v.loadState(s);v.running=true;v.paused=false;return 'ok';},id);
for(const id of (process.env.ATE?ORDER.slice(0,+process.env.ATE):ORDER)){
 const before=await page.evaluate(()=>window.__ach.length);
 if(CROPS_NEEDED[id])log.push('  plantas na horta: '+await plant(CROPS_NEEDED[id]));
 const r=await apply(id);await wait(900);
 if(id==='estufa')log.push('  estufa: '+await page.evaluate(async()=>{const v=game.scene.getScene('Vale');for(let i=0;i<20&&!v.state.greenhouse;i++){v.ensureGreenhouse?.();await new Promise(r=>setTimeout(r,300));}if(!v.state.greenhouse)return 'não montou';v.state.greenhouse=X.greenhouse(v.state,2);return 'montada em '+v.state.greenhouse.x+','+v.state.greenhouse.y+' com '+v.state.greenhouse.crops.length+' plantas';}));
 const saved=await page.evaluate(()=>{const v=game.scene.getScene('Vale');v.updateHUD();return v.persist();});await wait(2600);
 const after=await page.evaluate(b=>({novas:window.__ach.slice(b),painel:document.querySelector('#mission-journal .mission-chapter-head strong')?.textContent,total:document.querySelector('[data-journal-tab="achievements"] span')?.textContent}),before);
 log.push(`${id}: ${r}${saved?'':' NÃO SALVOU'} → conquistas ${JSON.stringify(after.novas)} · painel agora "${after.painel}" · ${after.total}`);console.log(log.at(-1));
 if(['primeira-colheita','curral','casinha','lar','vale','metal-negro','anos'].includes(id))await page.screenshot({path:__dirname+`/c-${id}.png`});
}
await wait(2000);await page.screenshot({path:__dirname+'/c-final.png'});
await page.click('[data-journal-tab="achievements"]');await wait(800);await page.screenshot({path:__dirname+'/c-medalhas.png'});
await page.evaluate(()=>{document.querySelector('#journal-content').scrollTop=99999;});await wait(500);await page.screenshot({path:__dirname+'/c-medalhas-fim.png'});
// recarrega e confere que tudo ficou salvo
await page.reload();await wait(2000);await page.locator('#continue-game').click();
await page.waitForFunction(()=>{const a=document.querySelector('#ui')?.dataset.area;return a&&a!=='loading';});await wait(3000);
console.log('depois de recarregar:',await page.evaluate(()=>document.querySelector('[data-journal-tab="achievements"] span')?.textContent+' · '+document.querySelector('#mission-journal')?.textContent.slice(0,120)));
await page.screenshot({path:__dirname+'/c-recarregou.png'});
console.log(errs.slice(0,8).join('\n')||'sem erros');await ctx.close();await b.close();})().catch(e=>{console.error(e.message);process.exit(1);});
