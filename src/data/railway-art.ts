/** Peças da Estação Ferroviária (kit do Codex em referencias/cenarios/estacao-ferroviaria/,
 * copiadas para public/assets/visual/railway/ na resolução original). Medidas em pixels do
 * mundo: largura e altura exibidas, ponto de apoio (fração da altura) e bases de colisão
 * [esquerda, direita, topo, base] relativas ao ponto de apoio. */
type Base = readonly [number,number,number,number];
type Def = {label:string;file:string;width:number;height:number;pivot:number;bases:readonly Base[];floor?:true;canopy?:true};
const def=(label:string,file:string,width:number,height:number,bases:readonly Base[]=[],extra:Partial<Def>={}):Def=>({label,file,width,height,pivot:.99,bases,...extra});
const body=(w:number,depth=20):Base[]=>[[-w/2+8,w/2-8,-depth,3]];
export const RAILWAY_ART = {
  'rail-station':def('Prédio da estação','predio-principal',280,137,[[-132,132,-42,2]]),
  'rail-locomotive':def('Locomotiva','locomotiva',168,92,body(168)),
  'rail-tender':def('Tender','tender',140,68,body(140)),
  'rail-passenger-car':def('Vagão de passageiros','vagao-passageiros',160,82,body(160)),
  'rail-freight-car':def('Vagão de carga','vagao-carga',150,83,body(150)),
  'rail-flatcar':def('Vagão plataforma','vagao-plataforma',150,50,body(150,16)),
  'rail-draisine':def('Dresina','dresina',96,56,body(96,14)),
  'rail-signal-cabin':def('Cabine de sinais','cabine-de-sinais',104,102,[[-47,47,-30,2]]),
  'rail-cargo-shed':def('Galpão de carga','galpao-de-carga',200,136,[[-94,94,-52,2]]),
  'rail-canopy':def('Cobertura da plataforma','cobertura-de-plataforma',150,97,[[-62,-50,-6,2],[50,62,-6,2]],{canopy:true}),
  'rail-stairs':def('Escada da plataforma','escada-da-plataforma',96,47),
  'rail-ramp':def('Rampa de carga','rampa-de-carga',110,67),
  'rail-platform-wall':def('Mureta da plataforma','mureta-da-plataforma',96,43,[[-49,49,-14,3]]),
  'rail-semaphore':def('Semáforo ferroviário','semaforo-ferroviario',52,91,[[-8,8,-6,2]]),
  'rail-buffer':def('Batente de fim de via','batente-fim-de-via',88,37,[[-40,40,-12,2]]),
  'rail-lever':def('Alavanca de desvio','alavanca-de-desvio',58,45,[[-24,24,-12,2]]),
  'rail-lamp':def('Poste de luz','poste-de-luz',48,77,[[-6,6,-5,2]]),
  'rail-water-column':def('Coluna d\'água','coluna-dagua',64,77,[[-14,14,-8,2]]),
  'rail-bench':def('Banco da plataforma','banco-externo',64,39,[[-28,28,-10,2]]),
  'rail-sign':def('Placa da estação','placa-da-estacao',84,71,[[-40,-32,-5,2],[32,40,-5,2]]),
  'rail-railing':def('Grade de proteção','grade-de-protecao',72,45,[[-34,34,-6,2]]),
  'rail-grass-green':def('Capim ferroviário','capim-verde',54,53),
  'rail-grass-plume':def('Capim com plumas','capim-com-plumas',54,53),
  'rail-grass-dry':def('Capim seco','capim-seco',54,52),
  'rail-vine':def('Trepadeira','trepadeira',60,59),
  'rail-brambles':def('Silvas','silvas',64,44),
  'rail-fern':def('Samambaia com flores','samambaia-com-flores',60,42),
  'rail-young-tree':def('Árvore jovem','arvore-jovem',84,81,[[-8,8,-6,2]]),
  'rail-mossy-rocks':def('Pedras com musgo','pedras-com-musgo',70,40,[[-28,28,-12,2]]),
  'rail-luggage':def('Malas','malas',46,40,[[-19,19,-12,2]]),
  'rail-milk-cans':def('Latões de leite','latoes-de-leite',48,42,[[-20,20,-12,2]]),
  'rail-crates':def('Caixotes','caixotes',62,56,[[-27,27,-16,2]]),
  'rail-baggage-cart':def('Carrinho de bagagem','carrinho-de-bagagem',62,52,[[-26,26,-14,2]]),
  'rail-fallen-tiles':def('Telhas caídas','telhas-caidas',56,40),
  'rail-fallen-fence':def('Cerca caída','cerca-caida',72,33),
  'rail-barrel':def('Barril e caixa','barril-e-caixa',58,42,[[-25,25,-14,2]]),
  'rail-notice-board':def('Quadro de avisos','quadro-de-avisos-externo',62,65,[[-28,-22,-5,2],[22,28,-5,2]]),
  'rail-sleeper':def('Dormente solto','dormente',20,55,[],{floor:true}),
  'rail-axles':def('Eixos e rodas','eixos-e-rodas',58,51,[[-24,24,-14,2]]),
  'rail-ballast-pile':def('Lastro solto','lastro-solto',64,30),
  'rail-sleeper-stack':def('Pilha de dormentes','pilha-de-dormentes',70,50,[[-30,30,-14,2]]),
  'rail-switch-box':def('Caixa de desvio','caixa-de-desvio',38,42,[[-12,12,-8,2]]),
  'rail-crossing':def('Travessia de madeira','travessia-de-madeira',70,61,[],{floor:true}),
  'rail-old-track':def('Trilho envelhecido','trecho-envelhecido',96,64,[],{floor:true}),
  'rail-broken-track':def('Trilho quebrado','trecho-quebrado',80,65,[],{floor:true}),
} as const satisfies Record<string,Def>;

export type RailwayKind = keyof typeof RAILWAY_ART;
export const RAILWAY_KINDS = Object.keys(RAILWAY_ART) as RailwayKind[];
export function isRailwayKind(kind:string|undefined):kind is RailwayKind {
  return !!kind&&Object.hasOwn(RAILWAY_ART,kind);
}
/** Pisos (256 × 256, repetíveis) e módulos de trilho (128 × 128, exibidos a 64 × 64). */
export const RAILWAY_FLOORS = ['terra-com-musgo','cascalho','lastro','lajes-da-plataforma','tabuas-internas','ladrilho-antigo'] as const;
export const RAILWAY_TRACKS = ['reta-horizontal','travessia-modular'] as const;
export const railwayTexture=(file:string)=>`railway-${file}`;
