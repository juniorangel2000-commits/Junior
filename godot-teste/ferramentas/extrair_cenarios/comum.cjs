const {chromium}=require('playwright');
async function start(){const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await b.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(240000);
const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.goto('http://127.0.0.1:5190');await page.waitForTimeout(1500);await page.locator('#new-game').click();await page.locator('#character-name').fill('Atlas');await page.getByRole('button',{name:'Começar minha história'}).click();
await page.waitForFunction(()=>{document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area==='property';});await page.waitForTimeout(2500);
return {b,page,errs};}
async function goArea(page,area){
 await page.reload();await page.waitForTimeout(1500);
 const ok=await page.evaluate(area=>{const key=Object.keys(localStorage).find(x=>/^after-rain-save-slot-[0-9a-f-]+$/.test(x));const s=JSON.parse(localStorage.getItem(key));s.activeArea=area;s.damiaoIntroduction=true;s.communityCenter={stage:3};localStorage.setItem(key,JSON.stringify(s));return key;},area);
 await page.locator('#continue-game').click();
 try{await page.waitForFunction(a=>{document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area===a;},area,{timeout:90000});}
 catch(e){console.log('area agora:',await page.evaluate(()=>document.querySelector('#ui')?.dataset.area),ok);throw e;}
 await page.waitForTimeout(4000);
 await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;});
}
module.exports={start,goArea};
