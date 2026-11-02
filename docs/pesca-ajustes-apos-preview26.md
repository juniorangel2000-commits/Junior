# Ajustes de pesca após a prévia 26

## Equipamento e artes

- Regras dos dois reforços centralizadas: 100 C + 4 tábuas + 2 cordas; depois 240 C + 6 tábuas + 2 peças metálicas. As faixas ganham 12,5% e 25% em relação à vara inicial. O reforço não modifica a rede nem a espera de 10–20 segundos.
- Serviços e diário mostram o próximo estágio, custo, benefício e melhoria máxima. O preparo selecionado tem sprite e descrição próprios; falta de isca informa se o lançamento precisa de uma ou duas unidades.
- Ícones originais de rede dobrada, massa e inseto no atlas supplies.png. Visualizações SVG isolam cada quadro; a rede deixa de usar o ícone de corda. Sprites geradas com ImageGen; originais preservados e quadros extraídos no renderizador, sem alterar as imagens.
- cast-net.png representa a rede aberta na água. No arremesso, ela parte da mão, abre progressivamente, assenta com transparência e ondulações discretas. O destino exige espaço para a borda inteira na água; cancelar ou sair remove o efeito. Um destino sem espaço para abrir a rede recusa o lançamento antes de gastar isca ou vigor.

## Recompensas

A avaliação de cada captura usa o valor genérico real da loja, acrescido de bônus por espécie e comprimento. A raridade é refletida pelo estoque e pelo bônus próprios de cada espécie. O resultado exibe o valor por peixe, o diário o total na mochila e Damião confirma a estimativa do lote antes de vendê-lo. As encomendas diárias pagam 25% acima do valor máximo do lote, mais 20 C; a entrega continua limitada a uma por dia. Vendas e entregas consomem os peixes e seus detalhes uma única vez, preservando os recordes. Falhas de gravação, incluindo exceções, não aplicam a transação.

## Ambiente

Horário, chuva e preparo favorecem espécies sem garantir uma captura. O clima diário é estável e compartilhado pelo sorteio, HUD, diário e uma chuva leve no mundo. Não chove dentro de casa; o efeito não entra nas imagens do mapa e respeita movimento reduzido. Carpas e bagres são favorecidos pela chuva, bagres à noite, lambaris e trutas de manhã, dourados no fim da tarde. Truta e dourado permanecem exclusivos do Lago entre as Serras, mesmo com melhorias e iscas especiais.

Não há estações, mudanças no cultivo nem eventos climáticos severos nesta alteração; o calendário sazonal segue guardado para depois dos cenários.

## Validação

Testes cobrem preço comparado ao comércio real, bônus das encomendas, pagamento e consumo, falha de salvamento, iscas, melhorias, distribuição de espécies e exclusividade de raros. A suíte completa passou com 1.529 testes antes da integração da rede aberta; os testes focados de pesca passaram novamente após sua integração. QA em Chromium cobre compra dos reforços, liberação dos preparos, estimativas, venda sem repetição, progresso da encomenda, HUD e chuva/interior, sprites e layout estreito. Scripts: qa-fishing-refinements.cjs e qa-fishing-net.cjs.
