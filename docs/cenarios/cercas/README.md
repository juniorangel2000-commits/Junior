# Cercas conectadas — prévia local

Cercas de madeira com postes baixos (28 pixels no mundo), comparadas à horta, ao personagem e às sprites atuais de vaca e galinha. Madeira, encaixes, pregos e musgo usam a paleta quente do cenário. A composição mantém quatro pixels de arte por pixel do mundo para preservar detalhes ao aproximar a câmera.

A base dos postes está alinhada exatamente ao centro dos tiles (x16, y16). O jogo e o editor usam a mesma origem da arte (y65/96) e profundidade relativa à base; a colisão e as coordenadas salvas não mudam.

Conexões automáticas nas quatro direções, incluindo pontas, cantos, T e cruzamentos. As travessas verticais são centralizadas no eixo dos postes e alinhadas à altura dos pregos medida na arte original. Nos estágios 1 e 2, a vista de cima mostra apenas uma madeira de ligação centralizada, usando a mesma madeira da cerca horizontal projetada para o eixo norte/sul. A conexão norte passa atrás do poste e a sul sai à frente dele; a madeira frontal cobre os pregos apenas quando há outra cerca conectada ao sul. Na ponta final, a ligação que chega do norte termina atrás do poste, sem desenhar madeira na sua frente. O chapéu do poste fica livre. Não há as antigas pequenas abraçadeiras. No terceiro estágio, as travessas quebradas ficam deitadas junto à base, com sombra de contato e sem pedaços suspensos; a última revisão acrescenta somente musgo aos postes e às tábuas, preservando a disposição aprovada; no último, restam apenas os postes degradados, sem encaixes. As duas metades de uma mesma travessa encontram-se na borda entre os tiles; retirar uma peça atualiza as vizinhas. O editor de desenvolvimento renderiza as cercas salvas com as mesmas texturas.

## Desgaste automático

- Nova: de 0 a 29 dias desde a construção.
- Desgastada: de 30 a 59 dias.
- Danificada: de 60 a 89 dias.
- Arruinada: a partir de 90 dias; permanece até ser recolhida.

A data de construção acompanha cada cerca no salvamento. O calendário considera o sono e o tempo em outros cenários. As cercas de saves antigos começam novas quando a propriedade é carregada nesta versão. Materiais, reembolso e colisão seguem o comportamento existente. Não há relógio de tempo real nem desgaste ao deixar o jogo fechado.

## Revisão visual e validação

- `cercas-centralizadas-no-jogo.png`: captura do jogo com HUD, horta, trecho horizontal/vertical, personagem, vaca e galinha.
- `cercas-centralizadas-grade.png`: a mesma disposição com uma grade temporária e centros dos tiles para conferir o alinhamento; a grade existe apenas na sessão de captura.

- `vertical-estagios-1-e-2.png` e `travessa-unica-pregos-cobertos.png`: ampliação das cercas verticais, com uma única madeira, pregos cobertos nas ligações, pontas sem sobra e encontro em T, composta com as texturas reais do jogo.
- `vertical-sem-sobra-nas-pontas.png`: prévia atualizada com o término natural no último poste.
- `cercas-finalizadas.png`: conjunto dos quatro estágios após a última revisão vertical.

- `cercas-no-jogo.png`: comparação no jogo com horta, personagem, vaca e galinha. Arranjo demonstrativo criado apenas na sessão de teste; não altera os mapas do jogador.
- `detalhes-conexoes.png`: trechos completos com conexões horizontais, verticais, cantos e cruzamentos nos quatro estágios.
- `construcao.png`: quatro estágios explicados no menu B.
- `validacao.json`: construção por interação real, remoção de vizinha, mudança de estágio e salvamento/recarregamento; verifica também uma única travessa contínua e pregos cobertos nas ligações frontais; compara também a face de pontas e cantos sem vizinho ao sul para garantir a ausência de prolongamento. O campo `alignment` verifica a posição mundial da base de cada poste e sua profundidade em relação ao centro do tile.
- `scripts/qa-fences.cjs`: teste no Chromium, sem erros de console ou carregamento.
- `tests/fences.test.ts`: seis testes de conectividade, construção, calendário e validação de saves.

Arte fonte: `public/assets/visual/architecture/fence-components.png`, gerada para o projeto; `fence-moss.png` acrescenta o musgo do terceiro estágio. Os painéis dos estágios 3 e 4 foram comparados pixel a pixel à prévia aprovada e permaneceram idênticos; suas artes estão finalizadas. Texturas conectadas são compostas em tempo de execução, sem modificar o arquivo fonte.

Alterações locais ainda não publicadas.
