import {it} from 'vitest';
/** Simulação de economia (docs/economia). Roda só quando pedida:
 * ECONOMIA=1 npx vitest run scripts/economia */
const run=it.runIf(!!process.env.ECONOMIA);
import {writeFileSync} from 'node:fs';
import {Farming} from '../../src/systems/farming';
import {GreenhouseFarm} from '../../src/systems/greenhouse';
import {PROJECTS,type ProjectDef} from '../../src/data/projects';
import {Inventory} from '../../src/systems/inventory';
import {trade} from '../../src/systems/commerce';
import {createVillageEconomy,MERCHANTS} from '../../src/data/village-commerce';
import {CROP_CATALOG} from '../../src/data/crop-catalog';
import {type CropId} from '../../src/data/crops';
import {calendarDate,daysLeftInSeason} from '../../src/systems/calendar';
import {createOrchardLayout,orchardFruitInSeason} from '../../src/data/orchard';
import {FORAGE_SPOTS} from '../../src/systems/forage';
import {festivalOn} from '../../src/systems/festivals';
import type {ItemId} from '../../src/types';

/** Um jogador "esforçado" joga 3 anos (336 dias) usando o código real da horta, da mochila e do comércio.
 * Tempo: segundos reais (= minutos do relógio). Orçamento: 15 min reais por dia.
 * Vigor (preview.48): 100 por dia (a cama recupera); enxada 1 por canteiro, regador 1 a cada 2 regas,
 * pesca 3 por arremesso. A chuva rega a horta sozinha (código real da horta). */
const DAYS=336,VIGOR={till:1,water:.5,cast:3},MEAL={price:28,vigor:50};
const BUDGET=900,T={rope:180,care:5,till:2,plant:1.5,water:3,harvest:1.5,sellTrip:90,orchard:120,coast:150,cast:22};
const buyerOf=(item:string)=>{let best='',price=0;for(const m of Object.values(MERCHANTS)){const p=(m.sell as Record<string,number>)[item]??0;if(p>price){price=p;best=m.id;}}return{merchant:best,price};};

/** Preço de compra de um material (loja mais barata; vidro e madeira de lei estimados). */
const EST:Partial<Record<string,number>>={hardwood:40,woolCloth:240,glass:5};
const materialPrice=(item:string)=>{const p=Object.values(MERCHANTS).map(m=>(m.buy as Record<string,number>)[item]).filter((n):n is number=>!!n);return p.length?Math.min(...p):EST[item]??100;};
const projectCost=(d:ProjectDef)=>d.coins+Object.entries(d.items).reduce((n,[i,q])=>n+materialPrice(i)*(q as number),0);
/** [tipo, a partir do dia, construção (C: mão de obra do Tobias + materiais), rende por dia] — SIMULACAO-ANO.md, seção 2. */
const RANCH:readonly [string,number,number,number][]=[['chicken',8,3222,20],['goat',20,4298,36],['cow',35,3830,30]];
const ORDER=['home-1','home-2','home-3','greenhouse','greenhouse-2','vale-moinho','vale-ponte','vale-farol','vale-estacao','casa-leste','casa-sul'];
function playYear(opts:{label:string;orchard:boolean;coast:boolean;fishing:boolean;maxTiles:number;meals:number;projects?:boolean;animals?:boolean}){
 const funded=new Map<string,number>(),done=(id:string,day:number)=>{const f=funded.get(id),d=PROJECTS.find(p=>p.id===id)!;return f!==undefined&&day>=f+d.days;};
 const finished:string[]=[];const herd:Record<string,number>={};let gh:GreenhouseFarm|undefined,ghLevel=0;
 const inv=new Inventory();inv.data.hoe=1;
 const economy=createVillageEconomy(),farm=new Farming([],[],undefined,[]);
 const ground={area:'property',terrainAt:()=>'grass',occupied:()=>false,reserved:()=>false} as never;
 const income:Record<string,number>={};const add=(k:string,n:number)=>{income[k]=(income[k]??0)+n;};
 const seasonCoins:number[]=[];let tiles=farm.soilTiles.length;let nextX=30,nextY=20;
 const log:string[]=[];const yearCoins:number[]=[];let tiredDays=0,meals=0,rainDays=0;let vigor=100,mealsToday=0,tired=false;
 /** Gasta vigor; sem vigor, compra uma refeição (até `opts.meals` por dia) ou para. */
 const spend=(n:number,day:number):boolean=>{if(vigor>=n){vigor-=n;return true;}
  if(mealsToday<opts.meals&&economy.coins>=MEAL.price+20){economy.coins-=MEAL.price;add('refeições',-MEAL.price);meals++;mealsToday++;vigor+=MEAL.vigor;vigor-=n;return true;}
  if(!tired){tired=true;tiredDays++;}void day;return false;};
 const sellAll=(day:number)=>{
  for(const [item,n] of Object.entries(inv.data)){
   if(!n||item==='hoe')continue;
   const crop=CROP_CATALOG.find(c=>c.harvest===item);const kind=crop?'colheita':['apple','pear','orange'].includes(item)?'pomar':item==='shell'?'conchas':item==='fish'||item==='rareFish'?'pesca':'';
   if(!kind)continue;
   const {merchant}=buyerOf(item);let left=n as number;
   while(left>0){const q=Math.min(99,left);const before=economy.coins;const r=trade(merchant,'sell',item as ItemId,q,inv,economy,day);if(!r.ok)break;add(kind,economy.coins-before);left-=q;}
  }
 };
 for(let day=1;day<=DAYS;day++){
  let time=BUDGET;vigor=opts.projects&&done('home-2',day)?120:100;mealsToday=0;tired=false;
  // Estufa pronta: horta extra que não liga para a estação.
  const lv=done('greenhouse-2',day)?2:done('greenhouse',day)?1:0;if(lv>ghLevel){gh=new GreenhouseFarm(gh?.crops??[],lv);ghLevel=lv;}gh?.update(0,day);
  farm.update(0,day);if(farm.crops.length&&farm.crops.every(c=>c.watered))rainDays++;
  // Colher tudo que estiver pronto.
  for(const c of [...farm.crops])if(c.growth>=1&&time>T.harvest){farm.harvest(c.x,c.y,inv);time-=T.harvest;}
  // Escolher a planta: maior lucro por dia que ainda dá tempo de colher nesta estação.
  const left=daysLeftInSeason(day),season=calendarDate(day).season;
  const options=CROP_CATALOG.filter(c=>c.seasons.includes(season)&&c.days<=left-1).map(c=>{
   const regrow=(c as {regrow?:number}).regrow;const harvests=regrow?1+Math.floor((left-1-c.days)/regrow):Math.floor((left-1)/c.days);
   return{c,score:(harvests*c.yieldCount*c.salePrice-(regrow?1:harvests)*c.seedPrice)/Math.max(1,left)};
  }).sort((a,b)=>b.score-a.score);
  const pick=options[0]?.c;
  // Plantar nos canteiros vazios e ampliar a horta enquanto der tempo para regar tudo amanhã.
  if(pick){
   const empty=farm.soilTiles.filter(t=>!farm.cropAt(t.x,t.y));
   const want=Math.max(0,Math.min(opts.maxTiles,Math.floor((BUDGET*.55)/T.water))-tiles);
   const canBuy=Math.floor((economy.coins-20)/pick.seedPrice);
   const newTiles=Math.max(0,Math.min(want,canBuy-empty.length,Math.floor(time*.3/(T.till+T.plant))));
   for(let i=0;i<newTiles;i++){if(!spend(VIGOR.till,day))break;farm.prepare(nextX,nextY,inv,ground);nextX++;if(nextX>80){nextX=30;nextY++;}tiles++;time-=T.till;}
   const slots=farm.soilTiles.filter(t=>!farm.cropAt(t.x,t.y));
   const n=Math.min(slots.length,Math.max(0,Math.floor((economy.coins-20)/pick.seedPrice)));
   if(n>0){const seed=pick.seed as ItemId;const have=inv.data[seed]??0;if(n>have){const before=economy.coins;const r=trade('seeds','buy',seed,Math.min(99,n-have),inv,economy,day);if(r.ok)add('sementes',economy.coins-before);}
    for(const s of slots.slice(0,n)){if(time<T.plant)break;if(farm.plant(s.x,s.y,inv,day,pick.id as CropId).ok)time-=T.plant;}}
  }
  for(const c of farm.crops){if(time<T.water)break;if(c.watered)continue;if(!spend(VIGOR.water,day))break;if(farm.water(c.x,c.y).ok)time-=T.water;}
  if(gh){
   for(const c of [...gh.crops])if(c.growth>=1&&time>T.harvest){gh.harvest(c.x,c.y,inv);time-=T.harvest;}
   // Na estufa vale a planta que mais rende por dia, de qualquer estação.
   const best=[...CROP_CATALOG].sort((a,b)=>{const r=(c:typeof a)=>c.yieldCount*c.salePrice/((c as {regrow?:number}).regrow??c.days);return r(b)-r(a);})[0];
   const free=gh.soilTiles.filter(t=>!gh!.cropAt(t.x,t.y));const seed=best.seed as ItemId;
   if(free.length){const need=free.length-(inv.data[seed]??0);if(need>0&&economy.coins>need*best.seedPrice+50){const before=economy.coins;const r=trade('seeds','buy',seed,Math.min(99,need),inv,economy,day);if(r.ok)add('sementes',economy.coins-before);}
    for(const s of free){if(time<T.plant)break;if(gh.plant(s.x,s.y,inv,day,best.id as CropId).ok)time-=T.plant;}}
   for(const c of gh.crops){if(time<T.water)break;if(c.watered)continue;if(!spend(VIGOR.water,day))break;if(gh.water(c.x,c.y).ok)time-=T.water;}
  }
  // Animais (valores da tabela de SIMULACAO-ANO.md): cada construção é paga em coroas e os animais
  // vêm com a corda, um por saída (3 min). Cuidar (coletar e afagar) custa 5 s por animal por dia.
  if(opts.animals){
   for(const [kind,from,build,daily] of RANCH){
    if(day<from)continue;
    if(herd[kind]===undefined){if(economy.coins<build+200)continue;economy.coins-=build;add('construções',-build);herd[kind]=0;}
    if(herd[kind]<4+(kind==='chicken'?2:0)&&time>T.rope+200&&day%2===0){herd[kind]++;time-=T.rope;}
    const n=herd[kind];if(n){const care=Math.min(n,Math.floor(time/T.care));time-=care*T.care;economy.coins+=care*daily;add('animais',care*daily);}
   }
  }
  // Pomar a cada 3 dias, conchas a cada 2, depois pesca com o que sobrar.
  if(opts.orchard&&day>=3&&day%3===0&&time>T.orchard+200){const fruits=createOrchardLayout().fruit.filter(f=>orchardFruitInSeason(f.item,day));for(const f of fruits)inv.transact({},{[f.item]:1});time-=T.orchard+fruits.length*6;}
  if(opts.coast&&day>=5&&day%2===0&&time>T.coast+100){const shells=FORAGE_SPOTS.filter(s=>s.item==='shell').length;inv.transact({},{shell:shells});time-=T.coast+shells*8;}
  if(opts.fishing&&day>=4){const casts=Math.floor(Math.max(0,time-T.sellTrip-80)/T.cast);for(let i=0;i<casts;i++){if(!spend(VIGOR.cast,day))break;inv.transact({},{[i%20===0?'rareFish':'fish']:1});time-=T.cast;}}
  sellAll(day);
  // Obras: paga a próxima da lista quando sobra dinheiro além de uma reserva de 3 mil.
  if(opts.projects){const next=ORDER.find(id=>!funded.has(id)),d=next&&PROJECTS.find(p=>p.id===next)!;
   if(d&&(!d.requires||done(d.requires,day))){const cost=Math.round(projectCost(d));if(economy.coins-cost>=3000){economy.coins-=cost;add('obras',-cost);funded.set(d.id,day);finished.push(`${d.name}: paga no dia ${day} (${cost.toLocaleString('pt-BR')} C)`);}}}
  // Plantar de novo depois de vender (a primeira compra do dia já foi feita).
  if(festivalOn(day))log.push(`dia ${day}: ${festivalOn(day)!.name}`);
  if(calendarDate(day).dayOfSeason===28)seasonCoins.push(economy.coins);
  if(day%112===0)yearCoins.push(economy.coins);
 }
 return{label:opts.label,income,seasonCoins,yearCoins,tiles,coins:economy.coins,log,tiredDays,meals,rainDays,finished};
}

run('joga três anos',()=>{
 const runs=[
  playYear({label:'Só horta, sem comprar comida',orchard:false,coast:false,fishing:false,maxTiles:999,meals:0}),
  playYear({label:'Só horta, compra até 2 refeições por dia',orchard:false,coast:false,fishing:false,maxTiles:999,meals:2}),
  playYear({label:'Horta + Pomar + Costa + pesca, sem comprar comida',orchard:true,coast:true,fishing:true,maxTiles:999,meals:0}),
  playYear({label:'Horta + Pomar + Costa + pesca, até 2 refeições',orchard:true,coast:true,fishing:true,maxTiles:999,meals:2}),
  playYear({label:'Só os 45 canteiros iniciais + coleta e pesca, sem comida',orchard:true,coast:true,fishing:true,maxTiles:45,meals:0}),
  playYear({label:'Só horta, pagando as obras',orchard:false,coast:false,fishing:false,maxTiles:999,meals:0,projects:true}),
  playYear({label:'Horta + Pomar + Costa + pesca, pagando as obras, até 2 refeições',orchard:true,coast:true,fishing:true,maxTiles:999,meals:2,projects:true}),
  playYear({label:'Tudo + animais (galinhas, cabras, vacas), sem obras, até 2 refeições',orchard:true,coast:true,fishing:true,maxTiles:999,meals:2,animals:true}),
  playYear({label:'Tudo + animais, pagando as obras, até 2 refeições',orchard:true,coast:true,fishing:true,maxTiles:999,meals:2,projects:true,animals:true}),
 ];
 const fmt=(n:number)=>Math.round(n).toLocaleString('pt-BR');
 const out:string[]=['## Três anos jogados pelo código real (horta, mochila e lojas)','',
  'Orçamento: 15 min reais de trabalho por dia; regar = 3 s por canteiro (com idas ao poço). O jogador escolhe a planta que mais rende para os dias que faltam na estação.',
  'Vigor: 100 por dia; enxada 1 por canteiro, regador 1 a cada 2 regas, pesca 3 por arremesso. Refeição da pousada: 28 C por 50 de vigor. A chuva rega a horta sozinha.',''];
 out.push('| Estratégia | Fim do ano 1 | Fim do ano 2 | Fim do ano 3 | Canteiros | Dias sem vigor | Refeições compradas | Dias de chuva com horta |');
 out.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
 for(const r of runs)out.push(`| ${r.label} | ${r.yearCoins.map(fmt).join(' | ')} | ${r.tiles} | ${r.tiredDays} | ${r.meals} | ${r.rainDays} |`);
 out.push('','### Fim de cada estação (coroas)','','| Estratégia | '+['Prim. 1','Ver. 1','Out. 1','Inv. 1','Prim. 2','Ver. 2','Out. 2','Inv. 2','Prim. 3','Ver. 3','Out. 3','Inv. 3'].join(' | ')+' |','| --- |'+' --- |'.repeat(12));
 for(const r of runs)out.push(`| ${r.label} | ${r.seasonCoins.map(fmt).join(' | ')} |`);
 out.push('','### Renda por fonte nos 3 anos','','| Estratégia | Renda por fonte |','| --- | --- |');
 for(const r of runs)out.push(`| ${r.label} | ${Object.entries(r.income).map(([k,v])=>`${k} ${fmt(v)}`).join(', ')} |`);
 for(const r of runs)if(r.finished.length)out.push('',`### Obras — ${r.label}`,'',...r.finished.map(f=>`- ${f}`));
 writeFileSync(new URL('../../docs/economia/JOGADOR-TRES-ANOS.md',import.meta.url),out.join('\n'));
 console.log(out.join('\n'));
},300000);
