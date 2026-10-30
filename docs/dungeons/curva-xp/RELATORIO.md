# Curva crescente de XP após preview.17

O custo deixa de ficar limitado a 89 XP. Os níveis iniciais mantêm a fórmula anterior até o nível 15; a partir do nível 16, cada nível acrescenta 1 XP ao custo do próximo. O nível atual, a XP guardada, os bônus de experiência e as melhorias permanentes não são apagados ou recalculados.

| Nível atual | XP para avançar |
| --- | --- |
| 1 | 12 |
| 10 | 51 |
| 16 | 89 |
| 30 | 103 |
| 50 | 123 |
| 100 | 173 |
| 200 | 273 |

A mesma curva vale nos dois modos. Continua aumentando após concluir todas as cartas. O processamento de múltiplos níveis soma os custos reais de uma progressão aritmética, preserva o excedente e evita laços por nível em concessões grandes de XP. O limite já existente do formato de checkpoint (nível 1 bilhão) é respeitado. As ofertas de armas continuam nos níveis 10, 30 e 50.

## Calibração com melhorias permanentes e pets

As comparações principais usaram cinco e dez níveis em cada atributo do personagem e do pet, quatro variações (cão, cão ✦, gato, gato ✦), duas combinações de armas e uma semente reproduzível. Foram 16 cenários: 12 vitórias e quatro derrotas. O motor foi simulado em passos de 1/30 s, sem XP extra concedida, armas pré-equipadas ou invulnerabilidade. Bônus normais das cartas e da espécie do pet permaneceram ativos.

Das 12 partidas que chegaram aos 900 s, 11 completaram as cartas antes do fim, entre 10min48s e 14min31s. Um cenário com cão comum e dez níveis por atributo venceu com 22 melhorias ainda faltando. A curva mantém a conclusão viável na maior parte dessa pequena amostra; não garante conclusão para toda escolha de cartas ou trajetória de coleta. Os resultados são de bot e não representam uma taxa de vitória humana.

Outros dez cenários compararam personagens com cinco/dez níveis, com e sem cão. Cinco cenários adicionais verificaram o estacionamento, incluindo um com cão e cinco níveis em todos os atributos. Nenhum gerou save inválido; a comparação de checkpoints continuou ativa.

## Verificação

- 1.211 testes em 136 arquivos aprovados.
- Compilação de produção aprovada.
- Testes da curva verificam crescimento estrito até nível 10.000, custos nos dois modos, múltiplos níveis cobrados corretamente, ausência de cura/diálogos extras após completar cartas, grandes concessões e restauração do save.
- Chromium: HUD com pet e melhorias permanentes; custos nos níveis 10/30/50/100; avanço ao nível 101 cobrando 174 XP; XP excedente preservada. Três verificações aprovadas, sem erros JavaScript.

Alterações locais preparadas para a próxima versão. A preview.17 publicada permanece inalterada.


Na primeira matriz do estacionamento, o detector do simulador marcou um cenário como parado porque não havia eliminações havia 120 s, embora o chefe final continuasse perdendo vida. O detector foi corrigido para considerar também impactos com dano. Repetido o mesmo cenário sem alterar o combate, o bot venceu a rodada 50. Os cinco cenários de rodadas terminaram em vitória; a correção afeta apenas o diagnóstico do simulador.
