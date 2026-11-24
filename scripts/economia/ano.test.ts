import {it} from 'vitest';
import {FARM_BUILDINGS,farmLaborCoins} from '../../src/data/farm-buildings';
/** Simulação de economia (docs/economia). Roda só quando pedida:
 * ECONOMIA=1 npx vitest run scripts/economia */
const run=it.runIf(!!process.env.ECONOMIA);
import {writeFileSync} from 'node:fs';
import {CROP_CATALOG} from '../../src/data/crop-catalog';
import {DISH_RECIPES,dishStation} from '../../src/data/kitchen';
import {MACHINE_RECIPES,MACHINES} from '../../src/data/machines';
import {MERCHANTS} from '../../src/data/village-commerce';
import {ECONOMY_BALANCE as B} from '../../src/data/economy-balance';
import {FESTIVALS,festivalOn} from '../../src/systems/festivals';
import {NPC_OUTINGS,outingToday} from '../../src/systems/npc-outings';
import {calendarDate,SEASONS} from '../../src/systems/calendar';
import {weatherForDay} from '../../src/weather-model';
import {restDay,REST_WEEKDAY} from '../../src/data/village-schedule';
import {propertyVisitor} from '../../src/systems/property-visits';
import {FORAGE_SPOTS} from '../../src/systems/forage';
import {createOrchardLayout,ORCHARD_REGROW_DAYS,orchardFruitInSeason} from '../../src/data/orchard';
import {bentoTravelling} from '../../src/systems/bento-schedule';
import type {RoutineId} from '../../src/systems/merchant-routine';

/** Melhor preço que algum morador paga pelo item (lado "sell" = o jogador vende). */
const sale=(item:string)=>Math.max(0,...Object.values(MERCHANTS).map(m=>(m.sell as Record<string,number>)[item]??0));
const buy=(item:string)=>{const p=Object.values(MERCHANTS).map(m=>(m.buy as Record<string,number>)[item]).filter((n):n is number=>!!n);return p.length?Math.min(...p):Infinity;};
const out:string[]=[];const log=(s='')=>out.push(s);
const r0=(n:number)=>Math.round(n),r1=(n:number)=>Math.round(n*10)/10;

run('simula um ano',()=>{
 // ── Tempo: 1 minuto de jogo = 1 segundo real. Estimativas de trabalho (segundos reais por ação).
 const T={till:2,plant:1.5,water:1.6,harvest:1.5,sellTrip:90,coastTrip:150,orchardTrip:120,swampTrip:140,lakeTrip:80,fieldsTrip:60,cast:22,cook:6,collect:3,pet:2};
 log('# Simulação de um ano — After Rain');
 log();
 log('Base: 1 minuto do relógio = 1 segundo real. Um dia (06:00–24:00) = 18 min reais. Um ano = 112 dias ≈ 34 h de jogo.');
 log('Tempos de trabalho estimados (segundos reais): '+Object.entries(T).map(([k,v])=>`${k} ${v}`).join(', ')+'.');
 log();

 // ── 1. Plantações: lucro por canteiro na estação e por minuto de trabalho.
 log('## 1. Plantações (por canteiro, numa estação inteira de 28 dias)');
 log();
 log('| Planta | Estações | Semente | Venda | Dias | Rebrota | Colheitas | Lucro/canteiro | Trabalho (min) | Coroas por minuto |');
 log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
 const crops=CROP_CATALOG.map(c=>{
  const regrow=(c as {regrow?:number}).regrow;let harvests=0,daysLeft=28-1,plantings=0;
  if(regrow){if(daysLeft>=c.days){harvests=1+Math.floor((daysLeft-c.days)/regrow);}plantings=1;}
  else{while(daysLeft>=c.days){harvests++;plantings++;daysLeft-=c.days;}}
  const y=c.yieldCount??1,seedBack=(c as {seedReturn?:number}).seedReturn??0;
  const revenue=harvests*y*c.salePrice,cost=plantings*c.seedPrice-Math.min(plantings,harvests)*seedBack*c.seedPrice;
  const daysWatered=Math.min(27,regrow?27:plantings*c.days);
  const labor=(plantings*(T.till+T.plant)+harvests*T.harvest+daysWatered*T.water)/60;
  const profit=revenue-cost,perMin=profit/labor;
  log(`| ${c.name} | ${c.seasons.join(', ')} | ${c.seedPrice} | ${c.salePrice}${y>1?` ×${y}`:''} | ${c.days} | ${regrow??'—'} | ${harvests} | ${r0(profit)} | ${r1(labor)} | **${r1(perMin)}** |`);
  return{c,profit,labor,perMin,harvests};
 });
 log();
 for(const s of SEASONS){
  const best=crops.filter(x=>(x.c.seasons as readonly string[]).includes(s)).sort((a,b)=>b.perMin-a.perMin);
  log(`- ${s}: melhor ${best[0]?.c.name} (${r1(best[0]?.perMin)} C/min), pior ${best.at(-1)?.c.name} (${r1(best.at(-1)!.perMin)} C/min).`);
 }
 log();

 // ── 2. Animais.
 log('## 2. Animais');
 log();
 // preview.48: nenhum animal é comprado; vêm com a corda dos cenários (sorteio diário) e moram numa construção.
 const animals=[
  {name:'Galinha',where:'Bosque, Costa, Pomar, Ruínas, Estação',home:'coop',daily:sale('egg'),feed:1},
  {name:'Pato',where:'Campos, Pântano, Costa',home:'coop',daily:sale('duckEgg')/2+sale('feather')/8,feed:1},
  {name:'Vaca',where:'Campos',home:'barn',daily:sale('milk'),feed:1},
  {name:'Cabra',where:'Bosque, Costa, Ruínas, Estação',home:'aprisco',daily:sale('goatMilk'),feed:1},
  {name:'Ovelha',where:'Campos',home:'aprisco',daily:sale('wool')/3,feed:1},
  {name:'Porco',where:'Bosque, Pântano, Pomar',home:'pigsty',daily:0,feed:1,note:'só esterco (adubo)'},
 ] as const;
 const hay=sale('fiber')*3;
 const buildValue=(kind:keyof typeof FARM_BUILDINGS)=>farmLaborCoins(kind)+Object.entries(FARM_BUILDINGS[kind].cost).reduce((n,[i,q])=>n+(sale(i)||0)*(q as number),0);
 log(`Palha: de graça com capim dos Campos (cortar ~3 s) ou 3 fibras (${hay} C de venda perdida). Corda: 3 fibras.`);
 log();
 log('| Animal | Onde aparece (corda) | Mora em | Construção (mão de obra + valor de venda dos materiais) | Vagas | Rende por dia | Lucro/dia | Dias para pagar a construção cheia |');
 log('| --- | --- | --- | --- | --- | --- | --- | --- |');
 for(const a of animals){const b=FARM_BUILDINGS[a.home],net=a.daily-hay*a.feed/3,value=buildValue(a.home);
  log(`| ${a.name} | ${a.where} | ${b.name} | ${r0(value)} C | ${b.capacity} | ${r1(a.daily)} | ${r1(net)} | ${net>0?r0(value/(net*b.capacity)):('note' in a?a.note:'—')} |`);}
 log();

 // ── 3. Máquinas.
 log('## 3. Máquinas (valor acrescentado)');
 log();
 log('| Máquina | Entrada | Saída | Horas | Valor entra | Valor sai | Ganho por carga | Ganho por dia |');
 log('| --- | --- | --- | --- | --- | --- | --- | --- |');
 for(const r of MACHINE_RECIPES.filter(r=>!r.id.startsWith('oven-'))){
  const inV=r.ingredients?Object.entries(r.ingredients).reduce((n,[i,q])=>n+sale(i)*q,0):sale(r.input)*r.amount+Object.entries(r.extra??{}).reduce((n,[i,q])=>n+sale(i)*q,0);
  const outV=sale(r.output)*r.quantity,gain=outV-inV,perDay=gain*1440/r.minutes;
  log(`| ${MACHINES[r.machine].name} | ${r.amount} ${r.input} | ${r.quantity} ${r.output} | ${r.minutes/60} | ${inV} | ${outV} | ${gain} | ${r0(perDay)} |`);
 }
 log();

 // ── 4. Cozinha.
 log('## 4. Cozinha (vender o prato × vender os ingredientes)');
 log();
 log('| Prato | Onde | Ingredientes valem | Prato vale | Ganho | Prato do dia (2×) | Vigor |');
 log('| --- | --- | --- | --- | --- | --- | --- |');
 const dishes=DISH_RECIPES.map(r=>{const v=Object.entries(r.ingredients).reduce((n,[i,q])=>n+sale(i)*q,0)+sale('wood');return{r,v,gain:r.price-v};}).sort((a,b)=>b.gain-a.gain);
 for(const d of dishes)log(`| ${d.r.name} | ${dishStation(d.r)} | ${d.v} | ${d.r.price} | ${d.gain} | ${d.r.price*2-d.v} | ${d.r.vigor} |`);
 log();

 // ── 5. Coleta e outras fontes.
 log('## 5. Coleta, pesca e serviços');
 log();
 const shells=FORAGE_SPOTS.filter(s=>s.item==='shell').length,irises=FORAGE_SPOTS.filter(s=>s.item==='blueIris').length;
 const fruits=createOrchardLayout().fruit.filter(f=>orchardFruitInSeason(f.item,100));
 const fruitValue=fruits.reduce((n,f)=>n+sale(f.item),0);
 const rows:[string,number,number,string][]=[
  ['Conchas (Costa)',shells*sale('shell'),T.coastTrip+shells*8,`${shells} pontos, voltam em 2 dias`],
  ['Caranguejo com rede (5 por visita)',5*sale('crab'),T.coastTrip+5*15,'rede custa '+buy('net')],
  ['Frutas do Pomar',fruitValue,T.orchardTrip+fruits.length*6,`${fruits.length} frutas, voltam em ${ORCHARD_REGROW_DAYS} dias`],
  ['Íris azul',irises*sale('blueIris'),T.swampTrip+irises*20,`${irises} plantas, voltam em 7 dias`],
  ['Pesca no lago (10 lançamentos)',10*(.9*sale('fish')+.05*sale('rareFish'))-10*buy('bait'),T.lakeTrip+10*T.cast,'~5% raro'],
  ['Lenha (20 madeiras)',20*sale('wood'),20*6,'machadinha'],
  ['Pedra (20)',20*sale('stone'),20*6,'picareta'],
  ['Sucata (10)',10*sale('scrap'),10*10,''],
 ];
 log('| Atividade | Coroas por visita | Minutos | Coroas por minuto | Observação |');
 log('| --- | --- | --- | --- | --- |');
 for(const [n,v,s,o] of rows)log(`| ${n} | ${r0(v)} | ${r1(s/60)} | **${r1(v/(s/60))}** | ${o} |`);
 log();
 log('Contratos: '+B.contracts.map(c=>`${c.npc} ${c.quantity} ${c.item} → ${c.reward} C (vale ${c.quantity*sale(c.item)} na loja)`).join('; ')+'.');
 log();

 // ── 6. Calendário do ano: festivais, chuva, folgas, saídas e conflitos.
 log('## 6. O ano dia a dia');
 log();
 const conflicts:string[]=[];let rain=0;const seasonRain=[0,0,0,0];
 for(let day=1;day<=112;day++){
  const c=calendarDate(day),wet=weatherForDay(day)==='rain';if(wet){rain++;seasonRain[c.seasonIndex]++;}
  const f=festivalOn(day);
  if(f){
   if(wet)conflicts.push(`Dia ${day} (${f.name}): chove no dia da festa${f.place==='coast'?' — e a festa é na praia':''}.`);
   const visitor=propertyVisitor({day} as never);
   if(visitor)conflicts.push(`Dia ${day} (${f.name}): ${visitor} visita a Propriedade de manhã e a festa começa às ${f.start/60}h.`);
   if(bentoTravelling({day,time:f.start+60}))conflicts.push(`Dia ${day} (${f.name}): o Bento está viajando para a mina durante a festa.`);
   // Concurso possível nesta estação?
   const possible=f.contest.options.filter(i=>{const crop=CROP_CATALOG.find(x=>x.harvest===i);if(!crop)return true;return (crop.seasons as readonly string[]).includes(SEASONS[c.seasonIndex])&&crop.days<f.dayOfSeason;});
   if(!possible.length)conflicts.push(`Dia ${day} (${f.name}): nenhum item do concurso dá para colher nesta estação.`);
   else if(possible.length<f.contest.options.length)conflicts.push(`Dia ${day} (${f.name}): do concurso, só ${possible.join(', ')} dá para conseguir nesta estação (de ${f.contest.options.length} opções).`);
  }
 }
 log(`Dias de chuva no ano 1: ${rain} (primavera ${seasonRain[0]}, verão ${seasonRain[1]}, outono ${seasonRain[2]}, inverno ${seasonRain[3]}). A chuva ainda não rega a horta.`);
 log();
 const outingDays=Object.fromEntries(NPC_OUTINGS.map(o=>[o.id,0]));
 for(let day=1;day<=112;day++)for(const o of NPC_OUTINGS)if(outingToday(o.id,day)===o)outingDays[o.id]++;
 log('Saídas aos cenários no ano: '+Object.entries(outingDays).map(([id,n])=>`${id} ${n}`).join(', ')+'.');
 const rest=Object.keys(REST_WEEKDAY).map(id=>`${id} ${Array.from({length:112},(_,i)=>i+1).filter(d=>restDay(id as RoutineId,d)).length}`);
 log('Folgas no ano: '+rest.join(', ')+'.');
 log();
 log('### Conflitos e furos encontrados');
 log();
 for(const c of conflicts)log('- '+c);
 if(!conflicts.length)log('- Nenhum.');
 log();
 log('### Festivais: valor do prêmio × custo da entrega');
 log();
 for(const f of FESTIVALS){
  const cheapest=Math.min(...f.contest.options.map(i=>sale(i)*f.contest.amount).filter(n=>n>0));
  const prize=f.reward.coins+Object.entries(f.reward.items??{}).reduce((n,[i,q])=>n+(sale(i)||buy(i)===Infinity?sale(i):buy(i))*q,0);
  log(`- ${f.name}: entrega mais barata vale ${cheapest} C; prêmio ≈ ${r0(prize)} C.`);
 }
 writeFileSync(new URL('../../docs/economia/SIMULACAO-ANO.md',import.meta.url),out.join('\n'));
});
