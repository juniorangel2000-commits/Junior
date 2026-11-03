/** Existing residents only. Social state never changes their trade or timetable. */
export const SOCIAL_NPCS=['augusto','bento','rosa','tobias','amelia','nilo','celina','damiao','helena','icaro']as const;
export type SocialNpc=typeof SOCIAL_NPCS[number];
export const SOCIAL_MEMORY_KINDS=['first-trip','gallery','fled-zombies','request-interrupted','request-completed','rescue','productive-trip']as const;
export type SocialMemoryKind=typeof SOCIAL_MEMORY_KINDS[number];
export const NPC_SOCIAL={min:-100,max:100,memoryCooldownDays:3,maxMemories:200,maxPairs:45,maxCount:1e9}as const;
export const SOCIAL_DISAGREEMENTS:Readonly<Record<string,readonly[string,string]>>={
 'augusto:bento':['Você é sério até na hora da pausa, Bento.','Gosto de um pouco de silêncio também, Augusto.'],
 'amelia:rosa':['Prefiro deixar o jardim crescer mais livre.','Eu gosto de organizar cada canteiro. Nisso pensamos diferente.'],
 'celina:nilo':['Nem toda peça precisa de tanto enfeite, Nilo.','Eu gosto dos detalhes. Mas entendo seu gosto pelas coisas simples.'],
 'icaro:tobias':['Eu prefiro experimentar um jeito novo de fazer as coisas.','Eu confio mais no que já conheço. Vamos com calma.'],
 'damiao:helena':['Para mim, uma pausa silenciosa junto à água já basta.','Eu prefiro uma mesa cheia de conversa. Cada um descansa de um jeito.'],
};
