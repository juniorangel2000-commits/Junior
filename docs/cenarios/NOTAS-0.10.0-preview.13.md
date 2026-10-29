# After Rain 0.10.0-preview.13 — hordas, chefes, mapas e HUD

As expedições à cidade ganham combate mais variado, novas cartas e chefes, além de arenas abertas e uma HUD reorganizada.

## Combate e progressão

- Hordas com ritmo e padrões de chegada variados; vida, dano e velocidade dos zumbis aumentam gradativamente.
- Escolha de uma entre três armas aleatórias ainda não equipadas nos níveis 10, 30 e 50. O Arsenal continua com quatro espaços, e o pet permanece separado.
- Identidades e evoluções distintas para espada, arco, bumerangue, lança, martelo e lâmina giratória.
- Escudo de Choque: absorve um impacto e repele inimigos próximos, com cargas, recarga e evolução Barreira de Impacto.
- Curva de experiência ajustada para permitir completar as melhorias da combinação escolhida dentro dos 15 minutos; alcançar essa meta depende da coleta e da sobrevivência.
- Cartas super-raras de +15% de experiência, +15% de ataque e +20% de dano contra chefes por melhoria, cada uma com quatro níveis.
- Bônus de crítico no mapa: 20% de chance de causar +50% de dano durante 12 segundos. O ímã atrai os cristais de experiência já presentes no cenário.
- Chefes nas rodadas 10, 20, 30, 40 e 50 do estacionamento, com crescimento de vida e dano e um salto maior no chefe final. A rodada só termina após derrotar todos os inimigos.

## Mapas e interface

- Praça com circuito arredondado, fonte central, passagens largas e canteiros.
- Estacionamento com vagas e veículos nas laterais e centro livre para conduzir hordas.
- Árvores e prédios removidos das duas arenas, incluindo suas colisões e as prévias do menu.
- Nova arte vertical do banco, aplicada nas laterais da fonte.
- Experiência e nível ao lado da vida, no canto inferior esquerdo. Relógio no topo, Arsenal embaixo, estado do pet à direita e barra própria para chefes.
- Layout adaptado a telas menores, com indicação de bônus ativos, evoluções e próximas ofertas de armas.

## Salvamento e estabilidade

- Retomada de partidas preserva efeitos temporários, cargas do escudo, projéteis e estado dos chefes.
- Posições salvas que ficaram dentro de um obstáculo novo são ajustadas para um ponto livre próximo, preservando o progresso.
- Navegação de inimigos ao redor de obstáculos e busca de colisões otimizadas.
- Correções na validação de partidas longas e nos limites de objetos de combate.

## Validação

A revisão visual final passou em 58 testes direcionados e 39 verificações integradas no Chromium, incluindo telas de 1600, 680, 521 e 390 pixels, retomada, combate e recompensas. TypeScript e build de produção aprovados.

Nas simulações completas da etapa anterior dos mapas, duas de cinco partidas da praça e cinco de cinco partidas do estacionamento chegaram ao fim. A remoção final das árvores e prédios foi validada em testes e no navegador, sem repetir essas simulações completas. Os resultados de um bot não substituem a avaliação manual da dificuldade. Desempenho e execução manual em diferentes computadores Windows ainda precisam ser avaliados.

A suíte completa passou localmente: 1.051 testes em 116 arquivos. O workflow Windows repete essa suíte antes de gerar o executável portátil x64. Saves anteriores continuam compatíveis.
