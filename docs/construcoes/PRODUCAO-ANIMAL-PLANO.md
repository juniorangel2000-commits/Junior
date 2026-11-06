# Produção animal — proposta para a próxima implementação

A preview.31 já possui galinheiro, curral, alojamento dos animais, porteiras,
silo e palha. O sistema abaixo é a próxima etapa proposta; ovos, leite, cochos e
ordenha ainda não estão implementados no jogo.

## Ciclo diário

1. O jogador constrói a moradia e conduz cada animal até ela.
2. Retira palha do silo e abastece o cocho da construção com a palha da mochila.
3. Cada animal alojado consome uma palha por dia. O painel mostra quantos animais
   estão alimentados e quanto resta no cocho.
4. Após um ciclo alimentado, a galinha produz um ovo e a vaca fica pronta para
   uma ordenha. Falta de palha pausa a produção; ela retoma no próximo ciclo alimentado.
5. Os produtos podem ser guardados, usados em futuras receitas ou vendidos.

Cada animal é acompanhado individualmente. Ter três galinhas alimentadas produz
três ovos, mesmo que outras galinhas do cercado estejam sem alimento. A quantidade
é calculada a partir dos animais que realmente moram na construção.

## Galinheiro e ovos

- Rendimento inicial: **um ovo por galinha alimentada por dia**.
- O primeiro ovo chega na manhã seguinte ao primeiro ciclo alimentado.
- Ovos aparecem como itens no chão da área acessível do galinheiro, com sprite,
  sombra e pequena animação de surgimento. O jogador recolhe ao se aproximar.
- O local de surgimento deve ficar livre de paredes, cercas, animais e passagem
  da porteira. A abertura da casinha permanece sem porta.
- O ovo usa o sistema de itens no chão e seu prazo de dois dias. Mochila cheia
  mantém o produto no chão para o jogador recolher depois.
- Se não houver um ponto livre para gerar o produto, a produção fica pendente
  até poder aparecer. Falha no salvamento mantém o estado anterior.

## Curral e ordenha

- Rendimento inicial: **uma unidade de leite por vaca alimentada por dia**.
- O jogador fabrica ou compra um **balde de ordenha**, aproxima-se da vaca e usa E.
- Uma ação curta mostra o balde junto à vaca, com animação e som de ordenha.
  A interação funciona com os dois personagens do jogador.
- O balde é uma ferramenta reutilizável. Uma ordenha concluída coloca uma unidade
  de leite na mochila e marca aquela vaca como ordenhada naquele ciclo.
- Mochila sem espaço, distância excessiva ou interrupção preservam a ordenha
  disponível e a ferramenta.
- O painel informa quais vacas estão prontas para ordenhar. Leite não coletado
  permanece disponível até a coleta, com limite de uma produção pendente por vaca.

## Cochos e silo

Os cochos fazem parte das construções prontas. A primeira versão usa abastecimento
manual: retirar palha do silo, levar na mochila e colocar no cocho. Isso dá utilidade
imediata ao silo e cria uma rotina de cuidado.

| Construção | Moradores | Capacidade proposta do cocho | Autonomia cheio |
| --- | --- | --- | --- |
| Galinheiro | Até 6 galinhas | 12 palhas | 2 dias com 6 galinhas |
| Curral | Até 4 vacas | 8 palhas | 2 dias com 4 vacas |
| Silo | Estoque da fazenda | 240 palhas | 24 dias para 6 galinhas e 4 vacas |

O consumo é registrado por animal e por ciclo. Com alimento insuficiente, têm
prioridade os animais há mais tempo sem comer. O painel mostra a quantidade que
falta para alimentar todos. O jogador pode manter palha na mochila e abastecer os
cochos mesmo antes de construir um silo.

## Relógio, persistência e mudanças de moradia

- O processamento usa o relógio geral do jogo. A produção fica pronta pela manhã,
  a partir das 06:00, inclusive quando o jogador dorme até as 08:00.
- A rotina funciona enquanto o jogador explora outras áreas. Pausas param o relógio.
- Cada animal conserva a própria identidade e o registro do último ciclo alimentado,
  produto gerado e coleta/ordenha. Sair e entrar, salvar e carregar ou mudar o animal
  de construção não reiniciam esses registros.
- Entrar na construção ao fim de vários dias não gera uma sequência de recompensas
  atrasadas. A simulação processa os ciclos alimentados com seu estoque real e
  conserva somente a produção pendente permitida para cada tipo de animal.
- Consumo de palha, geração do produto, coleta e registro diário são transações
  salvas juntas. Uma falha de gravação preserva os materiais e o estado anterior.
- Saves antigos recebem o estado inicial da produção sem alterar construções,
  animais já recrutados ou inventário existente.

## Valores iniciais para testar

| Parâmetro | Proposta inicial |
| --- | --- |
| Consumo | 1 palha por animal por dia |
| Ovo | 1 por galinha por ciclo alimentado |
| Leite | 1 por vaca por ciclo alimentado, com ordenha manual |
| Tempo da ordenha | Cerca de 1 segundo |
| Venda do ovo | 8 moedas |
| Venda do leite | 16 moedas |
| Balde de ordenha | 4 tábuas regulares + 2 fragmentos de ferro, na bancada |

Esses números são configuráveis e servem para a primeira rodada de testes. Com
seis galinhas e quatro vacas alimentadas, a produção máxima proposta rende 112
moedas por dia antes de considerar o trabalho e custo do alimento. O preço deve
ser comparado à pesca e à mineração durante o teste de equilíbrio.

## Artes e informações na HUD

Precisaremos das sprites de ovo, leite, balde e cochos vazio/abastecido, seguindo
as madeiras e molduras já usadas na fazenda. O painel de cada construção mostrará
moradores, alimento disponível, ovos produzidos e vacas prontas para ordenha.
Uma indicação discreta acima da vaca pode avisar quando o leite estiver pronto.
As informações do produto ficam nas mesmas molduras claras da HUD atual.

## Ordem de implementação

1. **Alimentação e registro diário:** cochos, consumo por animal, integração ao
   relógio, processamento fora da propriedade e migração dos saves.
2. **Ovos:** arte, geração física no galinheiro, coleta, inventário e venda.
3. **Ordenha:** balde, interação com a vaca, animação, som, leite e venda.
4. **Acabamento e equilíbrio:** informações na HUD, comparação de rendimentos e
   teste do ciclo completo com as capacidades máximas dos cercados.

A primeira etapa terá critérios de aceite para contagem por animal, alimento
parcial, troca de moradia, mudança de cenário, sono, recarregamento, mochila cheia,
interrupção da ordenha e falha de salvamento. Melhorias de produção por amizade,
qualidade de produtos e processamento em queijo podem ser elaboradas após esse
ciclo básico estar validado.
