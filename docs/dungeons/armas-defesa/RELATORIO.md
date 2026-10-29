# Quatro armas restantes e Escudo de Choque

Etapa local, sem publicação. Completa a revisão de identidade das armas iniciada com espada, arco e bumerangue. O desenho de escudo arremessado em círculo foi descartado após a revisão do usuário; a implementação final usa bloqueio e onda de repulsão.

## Escudo de Choque

O item continua ocupando um espaço do Arsenal, com o ID interno antigo `orbiting-shield` para preservar saves e cartas já obtidas. Absorve automaticamente um golpe de contato quando possui carga, sem causar dano ao inimigo. O bloqueio libera uma onda de 90 pixels que empurra os inimigos próximos. A recarga base é de seis segundos ativos e começa com a primeira carga gasta; ao terminar, restaura a capacidade inteira. A breve proteção de contato existente impede consumir duas cargas no mesmo instante.

A evolução **Barreira de Impacto** mantém o ID `shield-double`, permite duas cargas e amplia a onda em 25%. Melhorias aumentam a força da repulsão, o alcance da onda e a velocidade de recarga. Se a segunda carga ainda estiver disponível, pode ser usada durante a recarga. Sem cargas, contatos voltam a causar dano normalmente, respeitando as demais defesas.

A interface mostra cargas e segundos restantes. Os pequenos escudos junto ao personagem perdem opacidade quando a carga correspondente é consumida. Não há escudos girando ou causando dano orbital. O bloqueio emite uma onda visível e som procedural próprio. Cargas e recarga são salvas, respeitam pausa e retomada. Saves antigos sem esses campos recebem o estado inicial na primeira atualização ativa.

## Outras armas

- **Lança:** perfura uma linha, respeitando limites de alvos e obstáculos. A Estocada em Leque desenha três linhas; um inimigo pode receber apenas um acerto por execução. Alcance da estocada e comprimento do efeito usam o mesmo valor.
- **Martelo:** atinge grupos e empurra os sobreviventes. A Martelada Dupla mantém o segundo impacto após 0,2 segundo, no ponto original; inimigos podem sair da área entre os golpes. A onda visual mostra o raio efetivo, incluindo a melhoria de área.
- **Lâmina giratória:** controla a área próxima com contato e intervalo de dano por alvo. Melhorias de rotação aceleram a órbita, além da frequência de dano. O ângulo avança continuamente, sem salto ao melhorar, é salvo e fica congelado em pausa. Lâminas Duplas mantém duas lâminas opostas. Efeitos de impacto só são emitidos quando há contato, removendo cópias visuais repetidas sem acerto.

As quatro evoluções possuem nomes, funções e indicação dourada no Arsenal. Lança e martelo receberam sons próprios. Não foram substituídas artes PNG oficiais, alterados mapas ou modificadas rotinas de NPCs. Limites de quatro espaços e o espaço separado do pet continuam ativos.

## Validação

105 testes aprovados em sete arquivos, incluindo 14 novos testes direcionados para perfuração, leque, área, recuo, rotação, save, bloqueios, recarga, pausa e compatibilidade dos campos opcionais. O teste genérico que exigia dano automático do escudo foi substituído por testes da nova função defensiva.

TypeScript e build de produção aprovados, com o aviso conhecido de tamanho do bundle do Vite. A avaliação automatizada não substitui partidas completas para balanceamento nem avaliação humana dos sons.

A execução final concluiu **25 verificações integradas no Chromium**, sem erros JavaScript, HTTP ou WebGL registrados. A preparação isola o escudo sem pet para confirmar os dois bloqueios e o dano após esgotar cargas. Também foi verificada a limpeza da imagem do pet ao restaurar um estado sem companheiro. As outras verificações incluem as sete identidades/evoluções em configurações de até quatro armas, pausa, save, retorno e carga controlada de 240 inimigos. Essas configurações usam estados preparados e não representam uma partida completa de balanceamento.

[Escudo de Choque](escudo-choque.png) · [Lança, martelo e lâminas](lanca-martelo-laminas.png) · [Resultados integrados](validacao.json)
