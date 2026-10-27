const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),asar=require('@electron/asar');
const version=JSON.parse(fs.readFileSync('package.json')).version,dir='release/amelia-ecology-preview-8',archive=dir+'/win-unpacked/resources/app.asar',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let files=0,assets=0;
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else{assert.equal(sha(asar.extractFile(archive,p)),sha(fs.readFileSync(p)),p);files++;if(p.includes('/visual/'))assets++;}}}
walk('dist');for(const p of ['desktop/main.cjs','desktop/fullscreen.cjs'])assert.equal(sha(asar.extractFile(archive,p)),sha(fs.readFileSync(p)),p);
assert.equal(JSON.parse(asar.extractFile(archive,'package.json')).version,version);
const native=fs.readFileSync(dir+'/win-unpacked/After Rain.exe'),offset=native.readUInt32LE(0x3c);assert.equal(native.readUInt32LE(offset),0x4550);assert.equal(native.readUInt16LE(offset+4),0x8664);assert.ok(native.includes(Buffer.from(sha(asar.getRawHeader(archive).headerString))),'ASAR integrity embedded in PE');
const file=`After-Rain-${version}-Windows-x64.exe`,exe=fs.readFileSync(dir+'/'+file);assert.equal(exe.toString('ascii',0,2),'MZ');assert.ok(exe.length>50000000);
const qa=['ecologia','herbalista-amelia'].map(folder=>JSON.parse(fs.readFileSync('docs/cenarios/'+folder+'/validacao.json')));qa.forEach((report,index)=>{assert.equal(report.errors.length,0);assert.equal(report.checks.length,index===0?14:16);assert.ok(report.checks.every(c=>c.passed));});
const production=JSON.parse(fs.readFileSync('docs/cenarios/ecologia/producao-validacao.json'));assert.equal(production.passed,true);assert.equal(production.errors.length,0);assert.equal(production.checks.length,4);
const report={passed:true,version,file,bytes:exe.length,sha256:sha(exe),filesVerified:files,visualAssetsVerified:assets,machine:'AMD64 (0x8664)',asarIntegrity:true,automatedTests:791,browserChecks:qa.reduce((n,r)=>n+r.checks.length,0)+production.checks.length,nativeWindowsRun:false,published:false};
fs.writeFileSync(dir+'/SHA256SUMS.txt',report.sha256+'  '+file+'\n');fs.writeFileSync('docs/cenarios/ecologia/executavel.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
