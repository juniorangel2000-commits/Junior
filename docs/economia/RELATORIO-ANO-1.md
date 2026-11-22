# Um ano de After Rain — análise e balanço (22/11/2026)

Pedido do Junior: "jogue durante 1 ano, aproveite tudo que tem, precisamos balancear o jogo, a economia, tudo".

## Como foi feito

1. **Simulação dos números** (`scripts/economia/ano.test.ts`, gera `SIMULACAO-ANO.md`).
   - Calcula, com as tabelas reais do jogo, quanto cada atividade rende por minuto de jogo: plantas, animais, máquinas, cozinha, coleta, pesca, contratos e festivais.
   - Também percorre os 112 dias do calendário procurando conflitos.
2. **Jogador simulado** (`scripts/economia/jogador.test.ts`, gera `JOGADOR-UM-ANO.md`).
   - Um ano inteiro jogado com o código real da horta, da mochila e das lojas.
   - O jogador trabalha 15 minutos reais por dia, escolhe a melhor planta para os dias que faltam e vende tudo.
   - Rodam três estratégias: só horta, horta e coleta, e horta pequena.
3. **O jogo de verdade no navegador.**
   - 113 noites dormidas, com horta plantada, rega e colheita.
   - O jogo foi salvo e recarregado em cada virada de estação, até o Ano 2.
   - Nenhum erro. As plantas fora de estação murcham na virada, como previsto, e os quatro festivais aparecem no relógio.

Para rodar as simulações de novo: `ECONOMIA=1 npx vitest run scripts/economia`.

## O que estava desequilibrado

| Problema | Números antes | O que mudou |
| --- | --- | --- |
| Plantas com rebrota rendiam o dobro das outras | Feijão 143 C/min, tomate 155 C/min, hortelã 131 C/min; nabo e alface 42–53 C/min | Rebrota de 3 → 4 dias (feijão, tomate, hortelã); sementes de feijão, tomate e milho 30, morango 40; alface 22, cenoura 30 |
| As colheitas "grandes" não compensavam | Melancia 124 C/min, abóbora 114 C/min | Melancia 95 C, abóbora 75 C, batata-doce 42, girassol 44, algodão 62 |
| Animais quase não davam lucro | Galinha: 8 C/dia, 31 dias para pagar 250 C | Ovo 20, ovo de pata 30, leite 30, leite de cabra 36, lã 60 (galinha paga em ~13 dias) |
| Máquinas não pagavam a montagem | Moinho: +8 C por carga; queijo 40 com leite a 16 | Queijo 70, queijo de cabra 85, manteiga 90, novelo 90, tecido de lã 240, farinha/aveia 40, fubá 46, geleia de melancia 430 |
| Pratos | Seguiam a regra da preview.36 com os preços antigos | Recalculados pela mesma regra (1,35× fogão, 1,45× forno): omelete 90, pão 195, café reforçado 335, broa 300, torta de morango 380, pão com queijo e mel 415, entre outros |
| Pesca rendia mais que a horta no começo, sem investir nada | Peixe 18 C; o jogador simulado com horta pequena ganhava 37 mil C/ano pescando | Peixe 12 C, peixe raro 70 C |
| Pomar: 27 frutas o ano todo, de graça | 76 C/min, a melhor atividade do jogo | Cada fruta na sua época: laranja inverno/primavera, pera verão, maçã outono |
| Concurso da Feira das Sementes impossível | Pedia girassol ou camomila, que não crescem na primavera | 3 margaridas ou íris azuis |
| Concurso da Festa da Colheita trivial | Aceitava 5 nabos guardados (40 C) por 400 C de prêmio | Só colheitas de outono |

## Resultado (jogador simulado, fim de cada estação)

| Estratégia | Primavera | Verão | Outono | Inverno |
| --- | --- | --- | --- | --- |
| Antes — só horta | 3.464 | 29.020 | 42.880 | 55.684 |
| Depois — só horta | 2.260 | 18.286 | 35.116 | 47.920 |
| Antes — horta + coleta + pesca | 22.051 | 55.155 | 74.874 | 93.312 |
| Depois — horta + coleta + pesca | 16.007 | 43.352 | 64.416 | 81.185 |

- O ritmo ficou mais suave no começo: a coleta deixou de valer seis vezes mais que a horta na primavera.
- No fim do ano, o jogo continua generoso: 50 a 80 mil coroas.

## O que ainda precisa de decisão do Junior

1. **O vigor quase não é gasto.** Só a pesca (3) e o combate gastam vigor. Enxada, rega, machado e picareta não gastam nada. Por isso a horta pode crescer sem limite (o jogador simulado chegou a 165 canteiros), e a comida vale só pela venda e pelos efeitos. Sugestão: 1 de vigor por golpe de ferramenta e 0,5 por canteiro regado, para a comida ganhar função e o dia ter um limite natural.
2. **A chuva não rega a horta.** É uma pendência antiga e mexe no balanço: com a chuva regando, o trabalho diário cai em cerca de 25% dos dias.
3. **Para onde vai o dinheiro.** Com 50 a 80 mil por ano, os gastos grandes são:
   - os metais das ferramentas: lingote de ouro 750 e de metal negro 5.000; o nível 3 de uma ferramenta pede 9 lingotes;
   - os animais e as construções.

   Faltam gastos no meio do caminho, como decoração da casa, ampliação da casa e terrenos novos para a horta.
4. **Vaca, cabra e ovelha** não se compram em loja. Vale conferir se o caminho para consegui-las está claro para o jogador.
5. **O peixe comum (12 C) depende do tamanho?** Se a qualidade ou o peso aumentarem o preço, o valor médio real é maior.
