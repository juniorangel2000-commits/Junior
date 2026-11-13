# Passagem de trabalho

- **Atualizado em:** 2026-11-13
- **Por:** Codex
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, HEAD do branch; implementação dos cultivos em `ddc384c`.
- **Última versão publicada:** `v0.10.0-preview.33`.
- **Estado:** etapas 1, 2 e 3 de cultivos implementadas. Calendário, crescimento diário e 19 plantas com arte e comércio. Sem nova publicação nesta rodada.

## Feito nesta rodada

- 19 plantas do catálogo em `src/data/crop-catalog.ts` e `CROPS`: Nabo, Alface, Cenoura, Feijão, Tomate, Milho, Trigo, Melancia, Batata-doce, Abóbora, Aveia, Camomila, Couve, Repolho, Morango, Margarida, Girassol, Hortelã e Algodão.
- 114 sprites: semente, quatro fases (incluindo madura) e colheita por espécie. Nabo refeito no mesmo padrão. Originais em `referencias/cultivos/`, recortes em `public/assets/visual/crops/`. Preparação reproduzível: `node scripts/prepare-crops.cjs`.
- `src/crop-art.ts` carrega as fases. Propriedade e editor desenham a espécie correta, com raiz alinhada ao canteiro. A opção de ocultar recursos do editor reconhece os novos cultivos.
- Sementes equipáveis pela mochila e barra rápida; plantio consome a semente escolhida. Prompt e custo exibem a espécie equipada; `selectedCrop` é opcional no save, validado e preservado. Ids antigos `seeds` e `turnip` mantidos.
- Todas as sementes vendidas pela Rosa. **Nenhum comerciante vende colheitas.** Rosa e Helena compram colheitas comestíveis; Rosa compra flores, Amélia ervas, Celina algodão. Compradores anteriores de nabo preservados.
- Descrições das sementes mostram estação, dias regados e rebrota. O nabo agora cresce só na Primavera. Estações, dias e rebrota seguem o plano.
- Saves antigos recebem os 36 itens novos zerados pela migração existente; não mudou a versão do formato.
- Tabela de preços iniciais, compradores e instruções da arte: `docs/planejamento/ARTE-DOS-CULTIVOS.md`. Preços novos são ponto inicial de equilíbrio; nabo conserva os valores anteriores do código.

## Em andamento e próximo passo exato

- **Etapa 4:** cesta da Helena com **3 colheitas distintas + 20 C**. Vegetais, grãos e frutas elegíveis; flores, ervas e fibra excluídos. Usar `CROP_CATALOG.group` para a seleção. Criar arte da cesta/cocho quando necessário.
- Depois, **etapa 5: domesticação do cavalo**, dependente dessa cesta e do estábulo pronto. A corda só pode ser usada após a doma completa, nunca como método de aproximação.
- O cavalo já foge rapidamente nos Campos Abertos e tem animação de alimentação. Preservar os intervalos das animações idle; não tocar em personagens/ferramentas nesta etapa sem necessidade.

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

- Início: `npm ci`, `npm run check` e 1.876 testes / 213 arquivos passaram antes das alterações.
- Novos: `tests/crop-catalog.test.ts`, 23 casos cobrindo as 19 plantas, dias, rebrota, estações, comerciantes, migração, seleção salva e recortes transparentes.
- Conferência Chromium: `scripts/qa-crop-catalog.cjs` (Vite na porta 5190; `CHROMIUM_PATH` opcional). Equipa cenoura pela mochila, planta a espécie selecionada e monta jardim visual com as 76 fases. O jardim é uma fixture, não uma partida normal com estações misturadas.
- Encerramento: `npm run check` passou; `npm test` passou com **1.899 testes em 214 arquivos**, zero falhas; `npm run build` passou. Aviso do Vite sobre tamanho de chunk permanece, sem impedir o build.
- Prévia completa: `docs/planejamento/qa-catalogo-cultivos/catalogo.png`.
- Chromium concluído: seleção de cenoura pela mochila e consumo da semente corretos; 76 fases renderizadas sem texturas ausentes; nenhum erro JavaScript. Captura: `docs/planejamento/qa-catalogo-cultivos/jardim-catalogo.png`.
