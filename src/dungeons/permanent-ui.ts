import {CHARACTER_ATTRIBUTES,PET_ATTRIBUTES,permanentUpgradeCost,type DungeonProgress} from './progression';
import {PETS} from './config';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const number=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:2});
const labels:Record<string,string>={strength:'Força',resistance:'Resistência',agility:'Agilidade',vitality:'Vitalidade',precision:'Precisão',survival:'Sobrevivência',speed:'Velocidade',perception:'Percepção',protection:'Proteção',efficiency:'Eficiência'};
function effect(key:string,rank:number,pet:boolean):string {
 if(pet) switch(key){
 case 'speed':return `+${rank*3}% de velocidade`;
 case 'resistance':return `+${rank*5}% de vida e resistência`;
 case 'perception':return `+${rank*3}% de alcance de coleta`;
 case 'protection':return `+${rank}% de proteção ao personagem`;
 case 'efficiency':return `+${rank*3}% no ataque · +${rank*5}% na habilidade`;
 }
 switch(key){
 case 'strength':return `+${rank*2}% de dano corpo a corpo`;
 case 'resistance':return `+${rank*2}% de redução de dano`;
 case 'agility':return `+${rank*2}% de velocidade`;
 case 'vitality':return `+${rank*3}% de vida máxima`;
 case 'precision':return `+${rank}% de precisão`;
 default:return `+${number(rank*.02)} de vida por segundo`;
 }
}
export function permanentEvolutionHTML(progress:DungeonProgress,target='character',message=''):string {
 const pet=progress.pets.find(p=>p.id===target),isPet=!!pet;
 const attributes=pet?pet.attributes:progress.attributes;
 const keys=pet?PET_ATTRIBUTES:CHARACTER_ATTRIBUTES;
 const xp=pet?pet.xp:progress.xp;
 const total=Object.values(attributes).reduce((a,b)=>a+b,0),max=keys.length*20;
 return `<section class="dungeon-menu permanent-menu"><header class="permanent-header"><div><p class="dungeon-eyebrow">EXPEDIÇÕES À CIDADE</p><h1 tabindex="-1">Evolução permanente</h1><p>Invista a experiência das expedições em melhorias para as próximas partidas.</p></div><div class="permanent-wallet"><small>${pet?'XP deste companheiro':'XP do personagem'}</small><strong>${number(xp)}</strong><span>EXPERIÊNCIA DISPONÍVEL</span></div></header>
 <label class="permanent-target">Evoluir <select data-evolution-target><option value="character" ${!pet?'selected':''}>Personagem</option>${progress.pets.map((p,index)=>`<option value="${escape(p.id)}" ${p.id===pet?.id?'selected':''}>${PETS[p.species].name}${p.rare?' · raro':''} · Companheiro ${index+1}</option>`).join('')}</select></label>
 <div class="permanent-summary"><strong>${pet?PETS[pet.species].name:'Personagem'} · ${total} / ${max} melhorias</strong><meter aria-label="Progresso permanente" min="0" max="${max}" value="${total}"></meter><p>${pet?'Os atributos de combate atuam nas dungeons. Velocidade e percepção também ajudam na floresta de acesso.':'Os efeitos destes atributos são aplicados nas dungeons.'} As compras ficam salvas. Cada atributo tem custo crescente e limite de 20 níveis.</p></div>
 <p class="permanent-feedback" role="status" aria-live="polite">${escape(message)}</p>
 <div class="permanent-grid">${keys.map(key=>{
 const rank=(attributes as Record<string,number>)[key],cost=permanentUpgradeCost(rank,isPet),complete=rank>=20,canBuy=!complete&&xp>=cost;
 const data=pet?`data-pet-id="${escape(pet.id)}" data-pet-attribute="${key}"`:`data-attribute="${key}"`;
 return `<article class="permanent-card ${complete?'complete':canBuy?'available':'locked'}"><div class="permanent-card-heading"><h2>${labels[key]}</h2><span>${rank}<small> / 20</small></span></div><meter aria-label="${labels[key]}" min="0" max="20" value="${rank}"></meter><dl><div><dt>Atual</dt><dd>${effect(key,rank,isPet)}</dd></div><div><dt>${complete?'Concluído':'Próximo nível'}</dt><dd>${complete?'Melhoria máxima atingida':effect(key,rank+1,isPet)}</dd></div></dl><button ${data} ${!canBuy?'disabled':''} aria-label="Evoluir ${labels[key]}${complete?'':` por ${cost} XP`}">${complete?'Nível máximo':`Evoluir · ${number(cost)} XP`}</button><small class="permanent-shortfall">${complete?'Todos os níveis deste atributo foram adquiridos.':canBuy?`Saldo após a compra: ${number(xp-cost)} XP`:`Faltam ${number(cost-xp)} XP`}</small></article>`;
 }).join('')}</div><footer><button data-back>Voltar às expedições</button></footer></section>`;
}
