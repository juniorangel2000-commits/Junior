import {writeFileSync} from 'node:fs';
import {CROP_CATALOG} from '../../src/data/crop-catalog';
import {ITEMS} from '../../src/data/items';
import {DISH_RECIPES} from '../../src/data/kitchen';
import {RECIPES} from '../../src/data/recipes';
import {MACHINES,MACHINE_RECIPES} from '../../src/data/machines';
import {FARM_BUILDINGS,FARM_LABOR_COINS} from '../../src/data/farm-buildings';
import {FISH_SPECIES} from '../../src/data/fishing-catches';
import {MERCHANTS} from '../../src/data/village-commerce';
import {AREA_NAMES} from '../../src/data/area-names';
import {PROJECTS} from '../../src/data/projects';
import {WILD_GROUPS} from '../../src/data/wild-animals';
import {listVillageServices} from '../../src/systems/village-services';
import {createNewSave} from '../../src/systems/save';
import {createCharacterProfile} from '../../src/data/characters';
import * as fest from '../../src/systems/festivals';
import {ECONOMY_BALANCE,METAL_NAMES,TOOL_IDS} from '../../src/data/economy-balance';
import {FORAGE_SPOTS} from '../../src/systems/forage';
import {BUILD_COSTS} from '../../src/systems/building';
/** Exporta os dados do jogo para o Almanaque. Uso: npx vite-node scripts/almanaque/exportar.ts -- <saida.json> */
import {CHAPTERS} from '../../src/data/missions';
const outPath=process.argv.at(-1)!.endsWith('.json')?process.argv.at(-1)!:'scripts/almanaque/dados.json';
{
 const s=createNewSave(createCharacterProfile('Wiki'));s.day=200;s.villageEconomy!.coins=999999;
 const npcs=['rosa','augusto','tobias','amelia','nilo','helena','celina','damiao','icaro','bento','lucia','jonas'];
 const services=Object.fromEntries(npcs.map(n=>[n,listVillageServices(n,s).map(o=>({id:o.id,label:o.label,desc:o.description}))]));
 const out={crops:CROP_CATALOG,items:Object.fromEntries(Object.entries(ITEMS).map(([k,v])=>[k,{name:(v as any).name,desc:(v as any).description}])),dishes:DISH_RECIPES,recipes:RECIPES,machines:MACHINES,machineRecipes:MACHINE_RECIPES,farm:FARM_BUILDINGS,labor:FARM_LABOR_COINS,fish:FISH_SPECIES,merchants:Object.fromEntries(Object.entries(MERCHANTS).map(([k,m])=>[k,{name:(m as any).name,owner:(m as any).owner,description:(m as any).description,buy:(m as any).buy,sell:(m as any).sell}])),areas:AREA_NAMES,projects:PROJECTS,wild:WILD_GROUPS,services,festivals:Object.keys(fest).map(k=>[k,typeof (fest as any)[k]==='object'?(fest as any)[k]:typeof (fest as any)[k]]),economy:ECONOMY_BALANCE,metals:METAL_NAMES,tools:TOOL_IDS,forage:FORAGE_SPOTS.map(f=>({area:f.area,item:f.item,regrow:f.regrow,amount:(f as any).amount})),build:BUILD_COSTS,
  chapters:CHAPTERS.map(c=>({id:c.id,title:c.title,achievement:c.achievement,description:c.description,side:c.side===true,missions:c.missions.map(m=>m.text)}))};
 writeFileSync(outPath,JSON.stringify(out,null,1));
}
