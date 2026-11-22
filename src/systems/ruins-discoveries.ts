import type {SaveData} from '../types';
import {RUINS_CLUES, type RuinsClue, type RuinLandmark} from '../data/ruins-story';
import {Inventory} from './inventory';

export function inspectRuins(state:SaveData,landmark:RuinLandmark,save:(data:SaveData)=>boolean):string[] {
  const lines=[landmark.text];
  if(landmark.clue&&!state.ruinsClues?.includes(landmark.clue)){
    const clues=[...(state.ruinsClues??[]),landmark.clue];
    if(save({...state,ruinsClues:clues}))state.ruinsClues=clues;
    else lines.push('Não foi possível guardar esta pista. Examine o local novamente.');
  }
  if(landmark.map)lines.push(...recoverRuinsMap(state,save));
  if(landmark.seal)lines.push(recoverBronzeSeal(state,save));
  return lines;
}

function recoverRuinsMap(state:SaveData,save:(data:SaveData)=>boolean):string[] {
  if(state.ruinsMapFound)return ['O nicho onde você encontrou o mapa está vazio.'];
  const missing=(Object.keys(RUINS_CLUES) as RuinsClue[]).filter(clue=>!state.ruinsClues?.includes(clue));
  if(missing.length){
    const places=missing.map(clue=>RUINS_CLUES[clue]);
    const hint=new Intl.ListFormat('pt-BR').format(places);
    return [`As figuras parecem apontar para lugares do posto. Ainda falta examinar ${hint}.`];
  }
  const inventory=new Inventory(state.inventory);
  if(!inventory.transact({},{oldMap:1}))return ['Há um mapa dobrado no nicho. Libere espaço na mochila para levá-lo.'];
  const next:SaveData={...state,inventory:inventory.data,ruinsMapFound:true};
  if(!save(next))return ['O mapa continua no nicho. Não foi possível salvar a descoberta.'];
  state.inventory=inventory.data;
  state.ruinsMapFound=true;
  return [
    'O último registro conta que a carroça levou os remédios à cidade pelo desvio. Depois da cheia, o posto ficou vazio, mas os viajantes continuaram usando a estrada.',
    'Você encontrou um Mapa antigo. Além do desvio, ele mostra como abrir a grade do porão, perto da cisterna.',
  ];
}

function recoverBronzeSeal(state:SaveData,save:(data:SaveData)=>boolean):string {
  if(state.ruinsSealFound)return 'A marca do selo continua gravada na cera.';
  const inventory=new Inventory(state.inventory);
  if(!inventory.transact({},{ruinSeal:1}))return 'O selo ainda está na mesa. Libere espaço na mochila para levá-lo.';
  const next:SaveData={...state,inventory:inventory.data,ruinsSealFound:true};
  if(!save(next))return 'O selo ficou na mesa. Não foi possível salvar a descoberta.';
  state.inventory=inventory.data;
  state.ruinsSealFound=true;
  return 'Você encontrou um Selo de bronze. O Nilo pode dizer quem usava essa marca.';
}
