# After Rain 0.10.0-preview.23 — abertura, propriedade e reparos

O menu inicial passa a abrir antes de preparar os mapas e suas artes. A casinha aceita entregas parciais por material nas três etapas, e os zumbis comuns passam a perseguir a 80% da velocidade base do jogador.

## Mudanças

- Carregamento do mundo sob demanda, com progresso, tentativa após falha e proteção do save. Moradores e interiores são preparados na primeira visita à vila; atlas finalizados substituem texturas de origem redundantes.
- Instalador Windows por usuário, além do executável portátil. A versão instalada evita extrair o pacote completo a cada abertura; ambas usam o mesmo diretório de partidas.
- Formação rochosa modular nas duas margens do rio, mantendo água e pontes livres. Contorno derivado da arte, bloqueio das pontas de rocha para animais e desenho atrás do personagem para não ocultar sua cabeça.
- Pássaros em pares mais espalhados, com limites por mapa e distância inicial do jogador. Os grupos procuram pousos seguros ao fugir.
- Balanço suave das árvores também na vila, Floresta Antiga e acesso à cidade, preservando posição e escala e limitando a atualização à região da câmera.
- Mapa do acesso à cidade com captura alinhada às coordenadas reais e tecla M disponível durante a pausa do mapa.
- Botão Entregar e escolha de quantidade para cada material da base, estrutura/telhado e camas/potes. Entregas são salvas, o saldo fica visível e a conclusão desconta apenas o restante da mochila.
- Aviso explícito sobre martelo e materiais em falta. O martelo não é consumido; entregas podem ser feitas sem ele. Falha ao gravar não retira materiais do inventário.
- Zumbis comuns a 67,2 unidades por segundo, contra 84 do jogador sem bônus. Velocidade de perseguição de todas as variantes limitada a 80% da velocidade base do jogador, inclusive em dungeons antigas retomadas. Variantes pesadas ainda podem ser mais lentas; vida, dano, quantidade e habilidades especiais mantêm sua progressão.
- Verificado o aparecimento, resgate e entrega das quatro espécies de pets, comuns e especiais, nos dois modos. Continua exigindo casinha concluída e menos de três pets adquiridos; chance de 2% por evento elegível de 45 segundos e 1% de versão especial no resgate.
- Exclusão de 21,17 MiB de referências e prévias substituídas do pacote distribuído, preservando originais no repositório e conteúdo usado nas migrações.

## Validação

1.315 testes automatizados, TypeScript e build de produção aprovados localmente. Testes no Chromium cobriram abertura sob demanda e recuperação de falhas, entrega parcial nas três etapas, falha de gravação sem perda de materiais, moradores, colisão em 252 pontos do contorno das montanhas e tela de reparos estreita sem transbordamento horizontal. A captura do mapa foi conferida com pontos de referência; abrir e fechar pela tecla M e o posicionamento do marcador passaram na conferência no navegador.

O balanço das árvores foi verificado no Chromium nos quatro mapas externos, preservando posição, pivô e escala. As medições locais de abertura não representam tempo garantido no Windows. O workflow Windows repete testes e build antes de publicar os binários e seus hashes.
