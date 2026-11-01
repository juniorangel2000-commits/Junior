# Edição dos cenários

Nos builds de autoria/preview, o botão Editar cenário na pausa da dungeon e a tecla F2 abrem o editor no cenário atual. O seletor inclui propriedade, Floresta Antiga, vila, acesso à cidade, praça abandonada e estacionamento. Cada mapa tem pisos, objetos, histórico de desfazer/refazer, rascunho e exportação JSON próprios. Importar um arquivo de outro cenário é recusado. Aplicar grava os seis históricos em uma única operação; cancelar preserva o save anterior.

Na vila, bancos da praça e das ruas, postes, barris, caixotes, sacos, cestos, pilhas de lenha, lixeiras e canteiros decorativos são selecionáveis pela base. IDs estáveis mantêm a orientação e a arte; a colisão e a luz acompanham as posições. Decorações já encostadas em construções podem ser retiradas ou movidas para chão livre, sem liberar a colocação de novos objetos sobre fachadas ou entradas.

No acesso à cidade, árvores e obstáculos deixam de ser posições fixas. A pintura de terreno e os objetos editados participam da colisão usada pelo jogador e pelos companheiros. Nas dungeons, veículos, bancos, postes e demais objetos urbanos podem ser movidos, removidos ou adicionados. Colisão, rotas de inimigos, projéteis, pets e ataques dos bosses usam o mapa da partida, sem modificar o layout de outra história. Luzes e sombras acompanham os postes. Uma expedição ativa retorna do editor pausada, preservando tempo, vida, cartas e combate; posições que ficaram ocupadas são recuperadas em chão livre.

Nos interiores, F2/H abre a personalização da casa ou o editor de qualquer comércio, incluindo armazém, loja de sementes e ferraria. Entradas e atendimento precisam continuar conectados; alterações sobre os atores são recusadas e falhas de gravação revertem o rascunho aplicado.

As saídas entre mapas têm três blocos de largura. Ainda exigem um passo na direção da saída e não disparam quando o jogador apenas chega, fica parado ou anda de lado.

O formato do save passa a 4, para incluir os novos mapas e as quatro vistas do banco. Saves 1–3 são migrados em memória. A primeira gravação preserva os bytes anteriores na cópia de migração. Aplicativos antigos reconhecem o novo formato como futuro e não devem substituí-lo.

Verificações: `tests/scene-map-editing.test.ts`, `tests/map-transition.test.ts`, `scripts/qa-all-map-editors.cjs`, `scripts/qa-interior-editors.cjs` e a suíte completa. O teste no navegador pinta e exporta os seis mapas, move banco/poste/barril com o mouse, desfaz/refaz, salva e reabre os editores de cidade e dungeon.
