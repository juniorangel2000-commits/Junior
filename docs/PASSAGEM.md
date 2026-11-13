# Passagem de trabalho

- **Atualizado em:** 2026-11-13
- **Por:** Codex
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, HEAD do branch; cultivos em `ddc384c`, alinhamento e estágio 0 em `58ab83d`, cesta da Helena em `b95ea2b`.
- **Última versão publicada:** `v0.10.0-preview.33`.
- **Estado:** etapas 1, 2, 3 e 4 de cultivos implementadas. Calendário, crescimento diário e 19 plantas com arte e comércio. Cesta implementada; a doma do cavalo continua pendente. Sem nova publicação nesta rodada.

## Feito nesta rodada

- **Etapa 4, cesta da Helena:** o Junior pediu somente a cesta nesta rodada, sem avançar a doma. Mudou a receita para dificultar o acesso: **cada cesta exige 1 cenoura + 1 morango (Primavera) + 1 milho (Verão) + 20 C**. Não aceita outras combinações. Guardar as colheitas da primeira estação e chegar à segunda faz parte da progressão.
- Serviço `create-harvest-basket`, exclusivo da Helena. Mostra a receita, estações e quantidades na mochila; prepara uma unidade por solicitação. Item `harvestBasket`, empilhável, com arte própria em `public/assets/visual/crops/harvest-basket.png`. Disponível na mochila e no chão pelas rotinas gerais de itens.
- Custos em `src/data/harvest-basket.ts`. A transação de ingredientes e entrega é única; só desconta moedas após confirmar espaço. Serviço usa o draft e a persistência existentes da Vila: recusas não perdem materiais/moedas. Saves antigos recebem `harvestBasket: 0` pela migração. Nenhuma loja vende a cesta pronta ou suas colheitas.
- Nesta rodada a cesta fica guardada; **não implementar consumo automático, cocho, estábulo ou doma até a etapa 5**. O Junior vai continuar no Claude.

- Correção após observação do Junior: a prévia do jardim deve mostrar todas as plantas em terra arada. O jogo já recusa plantar fora de canteiros preparados; a fixture visual anterior inseria plantas diretamente na grama. O script agora prepara os 95 canteiros e verifica também a recusa sem gastar sementes fora da terra arada.

- 19 plantas do catálogo em `src/data/crop-catalog.ts` e `CROPS`: Nabo, Alface, Cenoura, Feijão, Tomate, Milho, Trigo, Melancia, Batata-doce, Abóbora, Aveia, Camomila, Couve, Repolho, Morango, Margarida, Girassol, Hortelã e Algodão.
- 114 sprites das espécies + 1 sprite comum de semeadura: semente, quatro fases (incluindo madura) e colheita por espécie. Nabo refeito no mesmo padrão. Originais em `referencias/cultivos/`, recortes em `public/assets/visual/crops/`. Preparação reproduzível: `node scripts/prepare-crops.cjs`.
- `src/crop-art.ts` carrega as fases. Propriedade e editor desenham a espécie correta usando o mesmo alinhamento por limites visíveis (`src/crop-layout.ts` e `src/data/crop-sprite-layout.json`). Rasteiras se centralizam na terra arada; caules se apoiam pela raiz. Maduras limitadas a 26 px de largura e margem lateral mínima de 2 px. A opção de ocultar recursos do editor reconhece os novos cultivos.
- Sementes equipáveis pela mochila e barra rápida; plantio consome a semente escolhida. Prompt e custo exibem a espécie equipada; `selectedCrop` é opcional no save, validado e preservado. Ids antigos `seeds` e `turnip` mantidos.
- Todas as sementes vendidas pela Rosa. **Nenhum comerciante vende colheitas.** Rosa e Helena compram colheitas comestíveis; Rosa compra flores, Amélia ervas, Celina algodão. Compradores anteriores de nabo preservados.
- Descrições das sementes mostram estação, dias regados e rebrota. O nabo agora cresce só na Primavera. Estações, dias e rebrota seguem o plano.
- Saves antigos recebem os 36 itens novos zerados pela migração existente; não mudou a versão do formato.
- Tabela de preços iniciais, compradores e instruções da arte: `docs/planejamento/ARTE-DOS-CULTIVOS.md`. Preços novos são ponto inicial de equilíbrio; nabo conserva os valores anteriores do código.

- Novo estágio 0 padrão para todas as espécies: `public/assets/visual/crops/planted-seed.png`, pequenas sementes parcialmente cobertas, sem broto. Em seguida aparecem broto, jovem, desenvolvimento e madura (fases 1..4). Os arquivos das quatro fases vegetativas mantêm `stage-0..3.png` no disco; as chaves de runtime são `crop-<id>-1..4`.
- `scripts/measure-crop-layout.cjs` mede os PNGs; `prepare-crops.cjs` chama essa medição após preparar os recortes. Reexecutar a medição se a arte mudar.

## Em andamento e próximo passo exato

- **Etapa 5: domesticação do cavalo**, quando o Junior pedir. A etapa 4 está pronta: usar o item `harvestBasket` da receita fixa da Helena; não voltar à regra anterior de quaisquer três colheitas.
- Cavalo dependente da cesta e do estábulo pronto; sete dias alimentados. A corda só pode ser usada após a doma completa, nunca como método de aproximação.
- O cavalo já foge rapidamente nos Campos Abertos e tem animação de alimentação. Preservar os intervalos das animações idle.

## Pendências e ideias para depois

- Doma: sete dias alimentados; padrão proposto conta cada virada com comida no cocho, que guarda três porções. Estábulo para um cavalo, com madeira nobre e arte do curral.
- Contratos de nabo da Helena e da Rosa continuam ativos. Primeira colheita só completa ao colher.
- Sementes especiais para o ano todo ficam para uma etapa futura.
- Clima/chuva regando, peixes por estação, árvores frutíferas e estufa: etapa 6.
- Ipês: machadinha de Ferro ou melhor, seis golpes; Ferro 1 / Ouro 2 / Metal Negro 3. Construções de animais exigem madeira nobre.
- Quadros de descanso/deitar/levantar do cavalo preservados e ainda sem uso.
- Produção animal, variedade dos campos, caça e editor F2 continuam pendentes; preservar ids salvos das moitas.

## Problemas conhecidos

- Pacote continua na preview.33 até publicação autorizada da preview.34. Não foi criada tag nem atualizada a main nesta rodada.
- Todos os 19 pacotes de sementes ficam à venda na Rosa independentemente da estação; o plantio recusa a estação incompatível e informa o motivo.
- Planta cresce um dia por dia regado; nabo leva quatro dias, aproximadamente 48 minutos reais. Sem rega automática de chuva nesta etapa.
- `src/art.ts` conserva texturas procedurais legadas `crop-0..2`, mas os canteiros utilizam os novos PNGs por espécie.
- Originais de arte permanecem fora de `public/` para não aumentar o instalador. Sprites de runtime somam aproximadamente 3 MiB.
- Repositório: `https://github.com/juniorangel2000-commits/Junior.git`.

## Testes

- Cesta: `tests/harvest-basket.test.ts`, 7 casos; receita por unidade, recusa de substituição/ingredientes ausentes, carteira, serviço exclusivo da Helena, mochila cheia/liberação de espaço, limite de estoque e compatibilidade de saves. Passaram.
- Conferência da cesta no navegador: `scripts/qa-harvest-basket.cjs` passou. Serviço real da Vila entregou 1 cesta, consumiu 1 cenoura, 1 morango, 1 milho e 20 C; ícone e descrição corretos na mochila, nenhum erro JavaScript. Capturas em `docs/planejamento/qa-cesta-helena/`. Fixture libera a Vila para testar apenas o serviço.

- Início: `npm ci`, `npm run check` e 1.876 testes / 213 arquivos passaram antes das alterações.
- Novos: `tests/crop-layout.test.ts` (4 casos: estágio 0 comum, transição das cinco fases, margens e apoio das maduras), além de `tests/crop-catalog.test.ts`, 23 casos cobrindo as 19 plantas, dias, rebrota, estações, comerciantes, migração, seleção salva e recortes transparentes.
- Conferência Chromium: `scripts/qa-crop-catalog.cjs` (Vite na porta 5190; `CHROMIUM_PATH` opcional). Equipa cenoura pela mochila, planta a espécie selecionada e monta jardim visual com as 95 fases. O jardim é uma fixture, não uma partida normal com estações misturadas.
- Encerramento: `npm run check` passou; `npm test` passou com **1.910 testes em 216 arquivos**, zero falhas; `npm run build` passou. Aviso do Vite sobre tamanho de chunk permanece, sem impedir o build.
- Prévia completa: `docs/planejamento/qa-catalogo-cultivos/catalogo.png`.
- Chromium concluído: seleção de cenoura pela mochila e consumo da semente corretos; 95 fases renderizadas sem texturas ausentes, incluindo 19 marcas de semeadura iguais; nenhum erro JavaScript. Captura: `docs/planejamento/qa-catalogo-cultivos/jardim-catalogo.png`.
