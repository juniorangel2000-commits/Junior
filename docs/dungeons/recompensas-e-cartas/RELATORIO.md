# Recompensas, coleta e cartas de armas

Revisão local posterior à preview.13, sem publicação. Esta etapa reúne também níveis contínuos, dificuldade por nível, limite de cura e chefes por minuto, descritos nos relatórios anteriores.

## Experiência e item de nível

Zumbi comum deixa o XP base, mini-chefe (o zumbi especial existente) deixa 1,5 vez esse valor, e chefe deixa duas vezes. Na praça, a base começa em 4 e cresce até 5 conforme a partida avança; no estacionamento, a base é 3. Os bônus das cartas de XP continuam sendo aplicados na coleta.

Cristais comuns são verdes, os de mini-chefes são azuis e os de chefes são dourados, com tamanhos distintos. Chefes também deixam um item dourado de um nível. Esse item concede exatamente um nível, sem multiplicação por bônus de experiência, e funciona após todas as cartas serem concluídas. Havendo cartas elegíveis, abre a escolha normal. Se já houver uma escolha pendente, outro item de nível aguarda no chão, sem sobrescrevê-la.

Ao limpar a rodada 50, a experiência e os itens de nível restantes são atraídos e coletados antes do resultado final. Escolhas de cartas pendentes continuam disponíveis. O modo de quinze minutos mantém o encerramento aos 15 minutos.

## Coleta e descrições

Coleta Ampliada passou de cinco níveis de +10% para dez níveis de +15%, totalizando +150%. O alcance básico de 70 pixels chega a 175 pixels; percepção do pet pode ampliar esse valor. O ímã continua atraindo todos os cristais já existentes, sem atrair outros itens. Os níveis de melhoria já adquiridos permanecem válidos.

As sete armas apresentam descrições próprias de funcionamento nas cartas de escolha, inclusive ao retomar uma escolha salva. A descrição do Escudo de Choque esclarece que ele absorve um golpe, repele inimigos e recarrega, sem causar dano.

Com as cinco melhorias adicionais de coleta, completar todas as cartas exige níveis 149–157 sem pet ou 165–173 com pet, conforme as armas escolhidas. Depois disso os níveis continuam aumentando, sem cura automática ou escolhas vazias.

## Sistemas mantidos nesta revisão

- Dificuldade dos novos inimigos cresce por nível, além de tempo/rodada: +0,2% de vida e +0,06% de dano por nível acima do primeiro; velocidade +0,02%, limitada a +20%.
- Novas curas: até três no chão e intervalo compartilhado de 12 segundos; recuperam 10–25 pontos e permanecem no chão quando a vida está cheia.
- Chefes na praça aos minutos 3/6/9/12/14, com identidade própria e checkpoints salvos; o limite de inimigos pode atrasar a aparição até liberar uma vaga.

## Validação

1.120 testes passaram em 121 arquivos. TypeScript e build aprovados; permanece o aviso conhecido do Vite sobre tamanho do bundle.

Dez partidas simuladas com o motor real e escolhas legais: três de cinco partidas da praça sobreviveram, todas com cartas completas, chegando aos níveis 525–705. As cinco partidas do estacionamento terminaram a rodada 50, com cartas ainda faltando nesta amostra. Esta revisão implementa a relação de XP solicitada; a experiência total do estacionamento ainda merece avaliação humana. Os resultados de bot não representam taxa de vitória ou desempenho no Windows.

[Simulações](simulacoes.json)

58 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL registrados. Incluem descrições nas cartas de armas, drops por categoria, chefes nos cinco horários, níveis acima de 500 após todas as cartas, HUD, salvamento e retorno. [Validação](validacao.json).

[Cartas de armas](armas-nivel-10.png) · [HUD](hud-ampla.png)
