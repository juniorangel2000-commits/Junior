// Run with NODE_PATH pointing to the installed playwright module.
// The built viewer must be served by HTTP. This does not touch game saves.
const {chromium}=require('playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const target=process.env.VILA_LAB_URL||'http://127.0.0.1:5191/vila-assets.html';
const out=process.env.VILA_QA_OUT||'/workspace/after-rain-vila-v31/auditoria/navegador';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});const errors=[],checks=[];
 const check=(name,result,data)=>{assert.ok(result,name+': '+JSON.stringify(data));checks.push({name,passed:true,data});};
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+':'+r.status());});
 try {
 await page.goto(target);await page.waitForFunction(()=>window.__vilaLab?.scene?.fixtures.length===32);
 check('Composição com 32 objetos independentes e sprites preservadas',await page.evaluate(()=>window.__vilaLab.scene.fixtures.every(f=>['new_independent_art','existing_preserved_art'].includes(f.asset.sourceKind) && f.asset.file.endsWith('.png'))));
 await page.locator('#collisions').uncheck();await page.waitForTimeout(200);await page.locator('canvas').screenshot({path:path.join(out,'00-interior-novo-phaser.png')});await page.screenshot({path:path.join(out,'00-novas-sprites-interior.png'),fullPage:true});await page.locator('#gallery').screenshot({path:path.join(out,'00-novas-sprites-prancha.png')});

 const inventory=await page.evaluate(()=>{const s=window.__vilaLab.scene,c=s.fixtures.find(f=>f.asset.id==='mesa_atendimento'),f=s.fixtures.find(f=>f.asset.id==='fornalha_completa'),b=f.asset.visibleBoundsAlpha128;return{counterFile:c.asset.file,forgeTop:f.sprite.y+(b[1]-f.sprite.originY*f.sprite.height)*f.sprite.scaleY,supports:s.fixtures.filter(f=>f.asset.supportId==='mesa_atendimento').map(f=>({id:f.asset.id,x:f.sprite.x,y:f.sprite.y,depth:f.sprite.depth})),counter:{x:c.sprite.x,y:c.sprite.y,depth:c.sprite.depth}};});
 check('Balcão redesenhado e fornalha na altura da parede da referência',inventory.counterFile.endsWith('balcao_referencia.png')&&Math.abs(inventory.forgeTop-39.5)<.01,inventory);

 const threshold=await page.evaluate(()=>{const s=window.__vilaLab.scene,t=s.roomArt.find(o=>o.texture.key==='floor-transition-soleira_pisos');return{visible:t?.visible,depth:t?.depth,blocked:s.blocked(289.5,245),wallOverlay:s.sideWallOverlay.visible};});
 check('Soleira visível no chão, sem bloquear o trajeto ou cobrir os pés',threshold.visible&&threshold.depth<0&&!threshold.blocked&&threshold.wallOverlay,threshold);
 const contact=await page.evaluate(async()=>{const s=window.__vilaLab.scene;const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const pixel=()=>new Promise(resolve=>s.game.renderer.snapshotPixel(58,194,c=>resolve([c.red,c.green,c.blue])));s.sideWallOverlay.setVisible(false);await frame();const behind=await pixel();const visibility=s.fixtures.map(f=>({sprite:f.sprite,visible:f.sprite.visible}));for(const v of visibility)v.sprite.setVisible(false);await frame();const expected=await pixel();for(const v of visibility)v.sprite.setVisible(v.visible);s.sideWallOverlay.setVisible(true);await frame();const front=await pixel();return{behind,front,expected};});
 check('Contorno lateral cobre apenas a faixa de encaixe dos móveis',contact.front.every((v,i)=>Math.abs(v-contact.expected[i])<=1)&&contact.behind.some((v,i)=>Math.abs(v-contact.front[i])>2),contact);
 check('Papel, lampião e flores ficam acima do balcão',inventory.supports.length===3&&inventory.supports.every(f=>f.depth>inventory.counter.depth),inventory.supports);
 await page.locator('canvas').scrollIntoViewIfNeeded();
 const canvasRect=await page.locator('canvas').boundingBox(),xs=canvasRect.width/576,ys=canvasRect.height/352;
 await page.mouse.move(canvasRect.x+inventory.counter.x*xs,canvasRect.y+(inventory.counter.y-13)*ys);await page.mouse.down();await page.mouse.move(canvasRect.x+(inventory.counter.x+12)*xs,canvasRect.y+(inventory.counter.y-5)*ys,{steps:10});await page.mouse.up();
 const movedSupports=await page.evaluate(()=>window.__vilaLab.scene.fixtures.filter(f=>f.asset.supportId==='mesa_atendimento').map(f=>({id:f.asset.id,x:f.sprite.x,y:f.sprite.y})));
 check('Arrastar balcão move os três objetos apoiados sem fundi-los',movedSupports.every(a=>{const b=inventory.supports.find(b=>b.id===a.id);return Math.abs(a.x-b.x-12)<1.5&&Math.abs(a.y-b.y-8)<1.5;}),movedSupports);
 const freshDownload=page.waitForEvent('download');await page.locator('#export').click();await(await freshDownload).saveAs(path.join(out,'layout-fiel-exportado.json'));const freshExport=JSON.parse(fs.readFileSync(path.join(out,'layout-fiel-exportado.json')));check('Layout fiel exporta 32 peças e vínculos de apoio',freshExport.objects.length===32&&freshExport.objects.filter(a=>a.supportId==='mesa_atendimento').length===3&&!freshExport.gameSaveChanged);
 await page.locator('#reset').click();
 const circulation=await page.evaluate(()=>{const s=window.__vilaLab.scene;const fits=(x,y)=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!s.blocked(x+dx,y+dy));const q=[{x:245,y:309}],seen=new Set(['245,309']);for(let i=0;i<q.length&&q.length<20000;i++){const p=q[i];for(const[dx,dy]of [[4,0],[-4,0],[0,4],[0,-4]]){const x=p.x+dx,y=p.y+dy,key=x+','+y;if(!seen.has(key)&&fits(x,y)){seen.add(key);q.push({x,y});}}}return{nodes:q.length,goals:[['balcao',203,200],['fornalha',387,195],['pedra_amolar',499,204],['bancada',505,270]].map(([id,x,y])=>({id,reachable:q.some(p=>Math.hypot(p.x-x,p.y-y)<8)}))};});
 check('Circulação preservada até balcão, fornalha, pedra e bancada',circulation.goals.every(g=>g.reachable),circulation);
 const wall=await page.evaluate(()=>{const s=window.__vilaLab.scene,f=s.fixtures.find(f=>f.asset.id==='meia-divisoria'),b=s.bounds(f);s.actor.setPosition(b.x-25,b.y+b.height/2);return b;});await page.keyboard.down('d');await page.waitForTimeout(500);await page.keyboard.up('d');const blockedDivider=await page.evaluate(()=>window.__vilaLab.scene.actor.x);check('Meia divisória bloqueia travessia lateral',blockedDivider>wall.x-22 && blockedDivider<=wall.x-6.9,{wall,blockedDivider});
 await page.evaluate(b=>window.__vilaLab.scene.actor.setPosition(b.x-25,b.y+b.height+21),wall);await page.keyboard.down('d');await page.waitForTimeout(700);await page.keyboard.up('d');const passedDivider=await page.evaluate(()=>window.__vilaLab.scene.actor.x);check('Abertura frontal da divisória permite circulação',passedDivider>wall.x+wall.width+7,{wall,passedDivider});
 await page.locator('#collection').selectOption('audit');await page.waitForFunction(()=>window.__vilaLab.scene.fixtures.length===3);await page.locator('#collisions').check();await page.waitForTimeout(200);
 check('14 objetos, dez comércios e somente três sprites aprovados na cena padrão',await page.locator('#gallery .asset').count()===14 && await page.locator('#store option').count()===10);
 const texture=await page.evaluate(()=>window.__vilaLab.game.textures.get('approved').getFrameNames());check('Atlas Phaser carregado com três frames',texture.length===3,texture);
 await page.locator('#collisions').uncheck();await page.screenshot({path:path.join(out,'01-laboratorio-aprovados.png'),fullPage:true});await page.locator('#collisions').check();
 // Real pointer drag on the water surface (opaque pixels).
 const before=await page.evaluate(()=>{const f=window.__vilaLab.scene.fixtures.find(f=>f.asset.id==='tanque_resfriamento');return {x:f.sprite.x,y:f.sprite.y,b:window.__vilaLab.scene.bounds(f)};});
 const rect=await page.locator('canvas').boundingBox();const sx=rect.width/576,sy=rect.height/352;
 await page.mouse.move(rect.x+before.x*sx,rect.y+(before.y-28)*sy);await page.mouse.down();await page.mouse.move(rect.x+(before.x+42)*sx,rect.y+(before.y-12)*sy,{steps:12});await page.mouse.up();
 const after=await page.evaluate(()=>{const f=window.__vilaLab.scene.fixtures.find(f=>f.asset.id==='tanque_resfriamento');return {x:f.sprite.x,y:f.sprite.y,b:window.__vilaLab.scene.bounds(f)};});
 check('Arraste real reposiciona sprite e colisão juntos',Math.abs(after.x-before.x-42)<2 && Math.abs(after.y-before.y-16)<2 && Math.abs(after.b.x-before.b.x-42)<2,{before,after});
 const download=page.waitForEvent('download');await page.locator('#export').click();const file=await download;await file.saveAs(path.join(out,'layout-exportado.json'));const exported=JSON.parse(fs.readFileSync(path.join(out,'layout-exportado.json')));check('Exportação preserva posições, pivô e colisão sem alterar partida',exported.objects.length===3 && exported.gameSaveChanged===false && Math.abs(exported.objects.find(f=>f.id==='tanque_resfriamento').x-after.x)<.01);
 await page.locator('#reset').click();check('Restaurar retorna às posições originais',await page.evaluate(x=>window.__vilaLab.scene.fixtures.find(f=>f.asset.id==='tanque_resfriamento').sprite.x===x,before.x));
 // Actual keyboard movement against the movable tank collider.
 const collision=await page.evaluate(()=>{const s=window.__vilaLab.scene,f=s.fixtures.find(f=>f.asset.id==='tanque_resfriamento'),b=s.bounds(f);s.actor.setPosition(f.sprite.x,b.y+b.height+20);return b;});
 await page.keyboard.down('w');await page.waitForTimeout(800);await page.keyboard.up('w');const stopped=await page.evaluate(()=>({x:window.__vilaLab.scene.actor.x,y:window.__vilaLab.scene.actor.y}));
 check('Ator não atravessa colisão do tanque com WASD',stopped.y>=collision.y+collision.height+4.8 && stopped.y<collision.y+collision.height+7,{collision,stopped});
 await page.locator('#stage').screenshot({path:path.join(out,'02-colisao-real.png')});
 for(const [offset,name]of [[-6,'03-depth-atras'],[22,'04-depth-frente']]){
  await page.evaluate(o=>{const s=window.__vilaLab.scene,f=s.fixtures.find(f=>f.asset.id==='tanque_resfriamento');s.actor.setPosition(f.sprite.x,f.sprite.y+o);},offset);await page.waitForTimeout(150);
  const d=await page.evaluate(()=>{const s=window.__vilaLab.scene,f=s.fixtures.find(f=>f.asset.id==='tanque_resfriamento');return{actor:s.actor.depth,object:f.sprite.depth};});check(name,offset<0?d.actor<d.object:d.actor>d.object,d);await page.locator('#stage').screenshot({path:path.join(out,name+'.png')});
 }
 await page.evaluate(()=>{const s=window.__vilaLab.scene,f=s.fixtures.find(f=>f.asset.id==='tanque_resfriamento');s.actor.setPosition(f.sprite.x+55,f.sprite.y);});await page.keyboard.down('e');await page.waitForTimeout(100);await page.keyboard.up('e');await page.waitForTimeout(150);check('E aciona interação sem mutação econômica',(await page.locator('#message').innerText()).includes('resfriar'));
 await page.evaluate(()=>{const s=window.__vilaLab.scene;s.actor.setPosition(245,309);});await page.keyboard.down('w');await page.waitForTimeout(1000);await page.keyboard.up('w');const entered=await page.evaluate(()=>window.__vilaLab.scene.actor.y);check('Circulação real da porta para o interior',entered<275,entered);
 await page.evaluate(()=>window.__vilaLab.scene.actor.setPosition(245,140));await page.keyboard.down('w');await page.waitForTimeout(700);await page.keyboard.up('w');const wallStop=await page.evaluate(()=>window.__vilaLab.scene.actor.y);check('Limite da parede respeitado',wallStop>=124 && wallStop<126,wallStop);
 await page.locator('#review').check();check('Quatro candidatos separados, explicitamente em revisão',await page.evaluate(()=>{const s=window.__vilaLab.scene;return s.fixtures.length===7 && s.fixtures.filter(f=>!f.asset.gameReady).length===4;}));
 await page.locator('[data-asset="bigorna_e_toco"]').click();await page.locator('#background').selectOption('black');await page.locator('#zoom').selectOption('3');await page.waitForTimeout(200);check('Comparação em fundo preto, zoom nearest 3x',await page.evaluate(()=>{const im=document.querySelector('#after');return im.style.width===im.naturalWidth*3+'px' && getComputedStyle(im).imageRendering==='pixelated' && im.parentElement.className==='black';}));
 await page.screenshot({path:path.join(out,'05-candidatos-comparacao.png'),fullPage:true});
 await page.locator('#original-mode').click();await page.waitForFunction(()=>document.querySelector('#reference').naturalWidth===1062);check('Interior original carregado sem modificação',await page.locator('#reference').isVisible());await page.locator('#reference').screenshot({path:path.join(out,'06-interior-original.png')});
 await page.locator('#facade-mode').click();await page.waitForFunction(()=>document.querySelector('#reference').naturalWidth===1091);check('Fachada original preservada',await page.locator('#reference').isVisible());await page.locator('#reference').screenshot({path:path.join(out,'07-fachada-original.png')});
 await page.locator('#review').uncheck();await page.locator('#store').selectOption('augusto');check('Comércio ausente não apresenta objetos de outro NPC',await page.locator('#gallery .asset').count()===0 && await page.evaluate(()=>window.__vilaLab.scene.fixtures.length===0));
 check('Aviso de pacote ausente explícito',(await page.locator('#notice').innerText()).includes('não recebido'));
 await page.locator('#store').selectOption('bento');check('Retorno ao Bento restaura aprovados',await page.evaluate(()=>window.__vilaLab.scene.fixtures.length===3));
 await page.locator('#scene-mode').click();await page.locator('[data-asset="tanque_resfriamento"]').click();await page.locator('#background').selectOption('checker');await page.locator('#zoom').selectOption('1');await page.locator('#collisions').uncheck();await page.waitForTimeout(600);
 const pixel=await page.evaluate(()=>new Promise(resolve=>window.__vilaLab.game.renderer.snapshotPixel(300,200,c=>resolve({alpha:c.alpha,red:c.red,green:c.green}))));check('Canvas volta a renderizar após alternar referência e comércio',pixel.alpha>0,pixel);
 await page.locator('#stage').screenshot({path:path.join(out,'08-interior-parcial-phaser.png')});
 check('Sem erros JavaScript, HTTP ou assets ausentes',errors.length===0,errors);
 fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify({target,renderer:'Phaser 3.90 / Chromium',checks,passed:checks.length,failed:0,errors,scope:'Laboratório de desenvolvimento; não é teste econômico ou aprovação do interior final.'},null,2));console.log('PASS',checks.length,'browser checks');
 }catch(e){console.error(e);await page.screenshot({path:path.join(out,'falha.png'),fullPage:true});fs.writeFileSync(path.join(out,'falha.json'),JSON.stringify({error:String(e),checks,errors},null,2));process.exitCode=1;}finally{await browser.close();}
})();
