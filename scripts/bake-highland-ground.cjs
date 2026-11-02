// Compose the authored high-resolution sections once; no runtime pixel processing.
const fs=require('node:fs'),crypto=require('node:crypto'),ts=require('typescript'),{PNG}=require('pngjs');
const root='public/assets/visual/highland/',baseBytes=fs.readFileSync(root+'terrain.png');
const source=fs.readFileSync('src/highland-ground-detail.ts','utf8'),compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exported={};new Function('exports',compiled)(exported);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),sections={},sectionHashes={};
for(const name of exported.GROUND_SECTIONS){const bytes=fs.readFileSync(root+'terrain-sections/'+name+'.png');sections[name]=PNG.sync.read(bytes);sectionHashes[name]=hash(bytes);}
const shore=JSON.parse(fs.readFileSync('src/data/highland-river-contour.json','utf8'));
const ground=exported.bakeHighlandGround(PNG.sync.read(baseBytes),sections,shore.rows);
const png=PNG.sync.write({width:ground.width,height:ground.height,data:Buffer.from(ground.data)},{colorType:6});
fs.writeFileSync(root+'ground-detailed.png',png);
fs.writeFileSync(root+'ground-detailed.json',JSON.stringify({scale:2,width:ground.width,height:ground.height,baseSha256:hash(baseBytes),sectionsSha256:sectionHashes,shoreSha256:hash(fs.readFileSync('src/data/highland-river-contour.json')),recipeSha256:hash(Buffer.from(source)),sha256:hash(png)},null,2)+'\n');
console.log({width:ground.width,height:ground.height,bytes:png.length});
