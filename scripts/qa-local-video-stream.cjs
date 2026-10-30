const { chromium } = require('playwright');
const http = require('node:http');
const path = require('node:path');
const { Readable } = require('node:stream');
const assert = require('node:assert/strict');
const { videoResponse } = require('../desktop/video-response.cjs');
(async()=>{
 const ranges=[];
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/') {res.end('<html><body><video muted playsinline></video></body></html>');return;}
  if(!['/road-male.mp4','/road-female.mp4'].includes(req.url)){res.writeHead(404).end();return;}
  try {
   const response=await videoResponse(path.join(__dirname,'../public/assets/video/expedition',req.url.slice(1)),req.headers.range);
   ranges.push({range:req.headers.range,status:response.status});
   res.writeHead(response.status,Object.fromEntries(response.headers));
   const stream=Readable.fromWeb(response.body); stream.on('error',()=>res.destroy()); res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch(error){res.writeHead(500).end(String(error));}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
  const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  for(const sex of ['male','female']) {
   const start=Date.now();
   const result=await page.evaluate(async sex=>{
    const video=document.querySelector('video');video.src=`/road-${sex}.mp4`; video.playbackRate=1;
    const done=new Promise((resolve,reject)=>{video.onended=()=>resolve({time:video.currentTime,duration:video.duration});video.onerror=()=>reject(Error('Media error '+video.error?.code));});
    await video.play();return await done;
   },sex);
   assert.ok(result.duration>=9);assert.ok(result.time>=result.duration-.2);
   assert.ok(Date.now()-start>=(result.duration-.8)*1000);
   console.log('PASS full natural playback through desktop byte-range handler',sex,result);
  }
  assert.ok(ranges.some(r=>r.status===206)); console.log('PASS partial-content streaming',ranges);
 }finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exit(1)});
