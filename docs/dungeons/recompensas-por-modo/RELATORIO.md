# Recompensas por progresso e nível — após preview.17

## Fórmulas

As eliminações deixam de ser a base da recompensa permanente. Continuam concedendo XP dentro da dungeon e comprovam atividade de combate. O nível inicial não concede bônus de nível: contam os níveis ganhos acima de 1.

| Modo | XP de progresso | XP por nível ganho | Vitória |
| --- | --- | --- | --- |
| 15 minutos | 40 por minuto, proporcional aos segundos, até 900 s | 6 | +150 XP |
| 50 rodadas | 40 por rodada efetivamente concluída | 6 | +150 XP |

A rodada em andamento não é paga como concluída. O resultado do motor informa nível, rodada atual e rodadas concluídas; o cálculo lida com intervalos entre rodadas e com a rodada 50. No modo de rodadas, esperar mais tempo não aumenta a recompensa.

As moedas usam 1 por minuto ou 0,6 por rodada concluída, mais 0,15 por nível ganho e 5 pela vitória, arredondando o total para baixo e respeitando o teto de 60 por expedição.

Materiais usam pontos de progresso: minutos sobrevividos, ou rodadas concluídas × 0,3, mais níveis ganhos ÷ 20. Cada 3 pontos rendem sucata (máximo 3), cada 5 pontos tecido (máximo 2); a vitória acrescenta uma peça metálica. Materiais sem espaço ficam pendentes e são entregues depois.

Abandonar preserva XP de progresso e nível e os pets resgatados, sem moedas, materiais, bônus de vitória ou apoio inicial. Vitória e derrota aplicam recompensas uma única vez. O pet equipado continua recebendo a XP permanente do resultado.

O apoio inicial de até 100 XP continua, limitado à janela dos primeiros 600 XP de progressão. Exige 2 minutos e 20 eliminações no modo de tempo, ou duas rodadas concluídas e 20 eliminações no modo de rodadas. Gastar XP não reinicia a janela.

Sessões sem eliminações não recebem recompensas de progresso. O bônus de nível é limitado ao dobro das eliminações, evitando crédito por níveis artificialmente incompatíveis com a atividade. Nos cenários normais analisados isso não reduziu o bônus de nível.

## Exemplos sem apoio inicial

| Resultado | Progresso | Nível | Vitória | Total de XP | Moedas |
| --- | --- | --- | --- | --- | --- |
| Derrota aos 10 min, nível 100 | 400 | 594 | 0 | 994 | 24 |
| Derrota após 20 rodadas concluídas, nível 50 | 800 | 294 | 0 | 1.094 | 19 |
| Vitória aos 15 min, nível 200 | 600 | 1.194 | 150 | 1.944 | 49 |
| Vitória na rodada 50, nível 100 | 2.000 | 594 | 150 | 2.744 | 49 |

## Análise das partidas anteriores

As recompensas foram recalculadas a partir de 21 cenários já simulados com a curva crescente de XP: 16 na praça (pets comuns/especiais e cinco/dez níveis permanentes) e cinco no estacionamento. Não foi necessário repetir combates porque a alteração age no encerramento. A análise usa uma conta fora da janela de apoio inicial; não estima taxa de vitória humana.

Nas 12 vitórias da praça, o novo pagamento ficou entre 1.626 e 2.508 XP e 41–60 moedas. Nas cinco vitórias do estacionamento, entre 2.732 e 2.756 XP e 49–50 moedas. Concluir o estacionamento costuma levar mais tempo; o pagamento por rodada respeita o avanço, sem incentivar espera artificial.

O cenário anterior com 22 melhorias faltando foi revisado: cão comum, combinação de controle, dez níveis por atributo, nível final 147 e 3.705 eliminações. O bot só escolheu duas cartas raras de XP aos 871/872 s. O cenário equivalente com cão especial terminou no nível 240, com 5.806 eliminações e todas as cartas de XP. Há influência de ofertas e trajetórias; isso não prova que a variante seja a causa única. Não foi encontrado travamento da curva. Uma parte fixa por sobrevivência agora preserva progresso permanente mesmo quando a combinação rende menos níveis.

## Validação

- 1.225 testes em 137 arquivos e compilação de produção aprovados.
- Testes cobrem os dois modos, aumento por progresso/nível, ausência de pagamento por espera nas rodadas, independência de eliminações excedentes, bônus de vitória, abandono, materiais, dados inválidos, apoio inicial e idempotência.
- 41 verificações no Chromium: vitória, derrota e abandono em ambos os modos; fórmula com nível real; retorno ao mapa, HUD e leitura do save. Sem erros JavaScript/HTTP.
- Cinco verificações adicionais: apoio inicial, compra após duas tentativas, orientações e recibo de rodadas em 390 px. Sem erros JavaScript.
- A tela de resultado discrimina XP por tempo/rodadas, nível, vitória e apoio inicial.

Alterações preparadas para a próxima versão, sem nova publicação. Saves e compras permanentes anteriores são preservados.

[Recibo do modo de rodadas](recibo-rodadas.png)
