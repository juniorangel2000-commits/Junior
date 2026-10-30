# Menu de expedições e tela de recompensas

## Fluxo

Fim de partida → recompensas salvas → menu de expedições. Vitória, derrota e abandono usam o mesmo fluxo. Voltar ao menu não recria a floresta/estrada nem inicia a viagem pelo asfalto. O mundo normal só é aberto pela opção Sair do menu (também disponível no × do cabeçalho e no Escape do menu).

A tela de recompensas mostra tempo, nível, eliminações e rodadas concluídas quando aplicável; totais de XP/moedas; discriminação do XP por progresso, nível, vitória e apoio inicial; materiais e companheiro resgatado. Itens sem espaço mantêm o aviso de entrega pendente. O resultado é persistido antes de permitir continuar.

Em falha de gravação, o recibo apresenta os ganhos ainda pendentes e permite tentar salvar novamente. Não há botão de retorno ao menu até salvar; o guard da cena também impede a saída pelo callback. A tentativa de gravação não perde nem duplica recompensas.

## Menu

Destinos com prévias, duração/rodadas, objetivo, base das recompensas e vitórias. Resumo de XP disponível e melhorias compradas, seleção de pet, acesso à evolução permanente e saída explícita ao mundo normal. O × permanece visível no cabeçalho em 1280×720 e 390×844; o título recebe foco ao abrir, evitando ativar uma nova partida por acidente.

Ao continuar para o menu, os objetos da partida são destruídos, a câmera para de seguir o jogador e referências/pools são limpos. A próxima tentativa começa com novo identificador, nível 1, XP temporária zerada, espada e os atributos permanentes/pet selecionados. A HUD é reconstruída para que o botão de pausa atue na partida nova. Compras e escolha de pet no menu são salvas sem recriar um checkpoint da partida encerrada.

## Validação

- 1.225 testes em 137 arquivos aprovados e compilação de produção aprovada.
- 47 verificações de vitória/derrota/abandono nos dois modos: retorno primeiro ao menu vazio de atores, saída explícita, recibos, mapa normal e persistência.
- 26 verificações de partidas consecutivas na mesma cena, pausa da nova partida, compra, seleção do pet, falha de gravação/retry, controles sem duplicação e menus estreitos.
- Cinco verificações do recibo/apoio inicial, compra e resultado por rodadas em 390 px.
- 61 verificações de regressão das dungeons, incluindo recarregar a página e continuar o save.
- Três verificações finais da saída no cabeçalho, dimensões e foco.

Total: 142 verificações no Chromium aprovadas, sem erros registrados. As imagens de fluxo foram capturadas antes de acrescentar o × adicional ao cabeçalho; o menu final mantém também a saída do rodapé.

Alterações preparadas para a próxima versão, sem publicação nesta etapa.

[Menu de expedições](menu.png) · [Recompensas](recompensas.png)
