// Runtime atlas views preserve the original generated PNG and isolate all three icons.
const fs=require('node:fs'),base='public/assets/visual/fishing/',png=fs.readFileSync(base+'supplies.png');
const frames=[['net',18,80,720,568],['dough',785,209,645,405],['insect',1523,219,629,407]];
const clips=frames.map(([id,x,y,w,h])=>`<clipPath id="${id}-clip"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`).join('');
const groups=frames.map(([id,x,y,w,h])=>`<g class="supply" id="${id}"><svg width="128" height="128" viewBox="${x} ${y} ${w} ${h}"><g clip-path="url(#${id}-clip)"><use href="#atlas"/></g></svg></g>`).join('');
fs.writeFileSync(base+'supplies.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><style>.supply{display:none}.supply:target{display:inline}</style><defs><image id="atlas" width="2172" height="724" href="data:image/png;base64,${png.toString('base64')}"/>${clips}</defs>${groups}</svg>\n`);
