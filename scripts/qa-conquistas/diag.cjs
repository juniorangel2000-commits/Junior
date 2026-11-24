const{chromium}=require('playwright');const PASSOS=require('./passos.js');
const ORDER=require('fs').readFileSync(__dirname+'/jornada.cjs','utf8').match(/const ORDER='([^']+)'/)[1].split(' ');
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const page=await b.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(300000);
await page.goto('http://127.0.0.1:5190');await page.waitForTimeout(1500);await page.locator('#new-game').click();await page.locator('#character-name').fill('Junior');await page.getByRole('button',{name:'Começar minha história'}).click();
await page.waitForFunction(()=>{document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area==='property';});await page.waitForTimeout(2000);
const XS=require('./x.js').toString();await page.evaluate(async xs=>{window.X=await (eval('('+xs+')'))();},XS);
console.log(await page.evaluate(async([src,order])=>{const game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;const SM=await import('/src/systems/save.ts');const P=(await import('/src/data/projects.ts')).PROJECTS;const DISHES=(await import('/src/data/kitchen.ts')).DISH_IDS;
 const v=game.scene.getScene('Vale');let s=structuredClone(v.snapshotState());s.day=40;s.missions=SM.currentMissionLog(s);const out=[];
 for(const id of order){const prev=structuredClone(s);const inv=(i,n)=>X.addItem(s,i,n);const area=a=>{if(!s.missions.areas.includes(a))s.missions.areas.push(a);};const ev=e=>{(s.missions.events??=[]).push(e);};
  try{new Function('s','inv','area','ev','P','DISHES','X',src)(s,inv,area,ev,P,DISHES,window.X)[id]();}catch(e){out.push(id+': ERRO '+e.message);s=prev;continue;}
  if(!SM.validateSave(s)){const bad=[];for(const k of Object.keys(s)){if(JSON.stringify(s[k])===JSON.stringify(prev[k]))continue;const t=structuredClone(prev);t[k]=s[k];if(!SM.validateSave(t))bad.push(k);}out.push(id+': '+bad.join(','));s=prev;}}
 return out.join('\n')||'tudo válido';},[PASSOS,ORDER]));await b.close();})();
