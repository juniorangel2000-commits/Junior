# After Rain 0.10.0-preview.29 — Mineração, Bento e centro comunitário

A passagem central da Mina Antiga agora abre as Galerias da Mina: um cenário
próprio para explorar, escavar, encontrar minérios e enfrentar perigos. Esta
versão reúne as fases 1 a 9 da mineração e a reforma do centro comunitário.

## Exploração e recursos

- Menu de entrada pela passagem central da Mina Antiga, com retorno pela mesma conexão.
- Paredes naturais com bordas locais e minérios brutos próprios, visíveis somente nas camadas expostas.
- Pedra, ferro, ouro e metal negro conforme a profundidade, usando as ferramentas, os itens e as regras existentes.
- Túneis e golpes parciais persistentes; regeneração limitada de formações secundárias após intervalos em dias do jogo, preservando rotas e atores.
- Zumbis, ruído de mineração, morcegos, desabamentos com aviso, contaminação e iluminação das galerias.
- Colisões e camadas dianteiras da recepção revisadas para paredes, pilares, equipamentos, carrinho e vigas.

## Bento e missões

- O mesmo Bento caminha entre ferraria, vila, estrada, lago, platô e mina; a oficina respeita suas ausências.
- Mineração real do NPC, picareta e bolsa próprias, armazenamento nos depósitos existentes e tarefas de oficina.
- Convite opcional para expedições; comandos para acompanhar, guiar, esperar e voltar, com reação a perigos e defesa pelo martelo.
- Pedidos renováveis, descobertas únicas, objetos físicos e Diário da mina pela tecla L e pela HUD.
- Entregas parciais e recompensas persistentes, sem duplicação por recarregar a partida.

## Derrota e resgate

- Ao perder toda a vida, a cena escurece e Bento leva o jogador para a própria cama.
- Avanço de duas horas de jogo, poses de repouso e despertar para os dois personagens e variações de diálogo.
- Perda dos recursos carregados, inclusive os adquiridos antes da expedição; preservação de ferramentas, equipamentos permanentes, dinheiro, bens guardados, túneis e progresso.
- Objetos únicos de missão retornam à origem. O resgate não oferece recuperação dos recursos comuns perdidos.
- Controle devolvido após o salvamento; Bento sai pela porta e retorna fisicamente à ferraria.
- Reload e falhas de armazenamento não reaplicam as consequências. O resgate funciona fora dos dias regulares de mineração.

## Centro comunitário

- Reforma em três etapas, com entregas parciais e fontes de materiais indicadas na interface.
- Interior com oito camas após concluir o alojamento.
- Reforma necessária para liberar a área de sobreviventes e o recrutamento.
- Moradores, tarefas e partidas antigas preservados; jogadores que já haviam recrutado recebem o centro pronto.

## Instalação e validação

O instalador e o portátil são para Windows 10/11 x64. As partidas continuam na
mesma pasta de dados. Os arquivos `LEIA.md` e `SHA256SUMS.txt` acompanham a versão.

A validação dirigida passou em 249 testes de mineração, missões, rotinas,
salvamentos, relógio, inventário e resgate. O build de produção e os roteiros no
navegador também passaram, incluindo os dois personagens, cama reposicionada,
recarregamento durante o resgate e falha de armazenamento.

O workflow Windows verifica TypeScript e executa novamente a suíte completa de
testes antes de gerar e publicar o instalador e o portátil. Os hashes SHA-256
acompanham os executáveis.

Os cenários e controles das versões anteriores permanecem disponíveis. O
calendário sazonal e o launcher continuam adiados; a fase social posterior ainda
não foi implementada.
