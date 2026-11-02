# Alto da Serra — exterior da mina

Primeira versão jogável do novo cenário acima da montanha do Lago entre as Serras. A composição segue a prévia aprovada: chegada pela escadaria sudoeste, rio vindo do norte até a borda da queda, ponte elevada central e mina a nordeste. A correção solicitada mantém a entrada no nível do chão, com área frontal aberta e vagonete e equipamentos nas laterais.

## Arte e escala

O cenário utiliza 1536 × 1024 pixels do mundo, na resolução nativa da arte, em vez de esticar a imagem para o tamanho dos outros mapas. Terreno, ponte e mina são arquivos separados em `public/assets/visual/highland`. As imagens geradas originais são preservadas no workspace; o renderizador limpa apenas transparências muito baixas nas texturas de uso, sem reescrever as fontes. As árvores usam sprites do jogo, com vento e transparência de copa.

A ponte tem uma segunda camada para a grade dianteira. As paredes da montanha, os pilares, as árvores e os equipamentos laterais têm colisão. A travessia só acontece pelas cabeceiras terrestres; nadar por baixo não permite subir pelas laterais. A água reutiliza o material animado do lago, com máscara que preserva pedras e margens, transição suave na borda da queda e fios de água móveis na descida.

## Acesso e continuidade

Suba a escadaria existente no lago e continue ao norte do patamar. A troca acontece ao caminhar. A escadaria sudoeste do Alto da Serra faz o caminho de volta ao mesmo patamar do lago. Posição, orientação e alterações desse cenário são salvas separadamente. Continuar uma partida no Alto da Serra restaura a posição diretamente na nova área, mantendo o encadeamento de retorno ao lago e à propriedade.

HUD, mochila, fabricação manual, pesca comum no rio, diário, controles, zoom e companheiro animal continuam disponíveis. O mapa M usa as dimensões próprias do cenário para posicionar o marcador. O editor F2 inclui a nova área, árvores e sprites da mina e da ponte; seu armazenamento mantém o formato compatível dos mapas existentes, com colocação limitada ao tamanho nativo.

## Entrada acessível e próximo sistema

`highlandMineApproach()` expõe o ponto de aproximação à entrada. O corredor central e a área frontal foram reservados para o minigame de mineração. Não há minigame ou interior de mina implementado nesta etapa. E permite examinar a entrada; a descrição informa o estado do túnel. Essa interação é o ponto de integração para o sistema de mineração que o usuário planeja adicionar.

## Verificação

- 1.560 testes em 181 arquivos na suíte completa.
- Testes dedicados percorrem, com a folga dos pés do jogador, da escadaria à ponte e à mina, verificam a entrada livre, os limites, o bloqueio das laterais e a persistência.
- Após o acabamento da água: build, TypeScript e 15 testes de serra/lago/água aprovados.
- `scripts/qa-highland.cjs`: entrada caminhando a partir do lago, HUD, inventário, marcador no mapa nativo, interação na mina acessível, bloqueio da ponte a partir do rio, editor, retomada do save e volta ao lago. Nenhum erro JavaScript.
- `scripts/qa-highland-art.cjs`: imagens do cenário real e comprovação de que a superfície da água muda durante a renderização.

Esta etapa é de desenvolvimento, posterior à preview.27 publicada. Não altera o instalador dessa versão.

## Passeio em movimento

`scripts/preview-highland-walk.cjs` grava o canvas do jogo durante um trajeto contínuo: escadaria, trilhas e clareiras do lado oeste, rio, travessia da ponte, mirante leste, pátio e entrada da mina, retorno à ponte e à escadaria. O roteiro encontra caminhos com a mesma folga dos pés e conduz as teclas do `Player`, sem transferir a posição entre pontos do passeio. A câmera mostra o mapa inteiro no começo e no final e acompanha o personagem durante a caminhada. A gravação é uma prévia visual do estado de desenvolvimento; não inclui um minigame de mineração.
