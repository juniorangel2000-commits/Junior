# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-13
- **Por:** Codex
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, implementação `ccdd7da`; usar o HEAD com esta passagem.
- **Última versão publicada:** `v0.10.0-preview.33`.
- **Estado:** concluído e validado; não publicado nesta rodada.

## Feito nesta rodada

- Refinadas as quatro folhas de trabalho (machadinha/picareta, fazendeiro/fazendeira), usando as quatro vistas originais de cada personagem como referência de rosto, cabelo, roupa e proporções.
- Mantidos o formato 1536 × 1024, células 256 × 256, seis quadros e quatro direções, relógio de impacto e integração nos três cenários.
- Mantidos os levantamentos laterais da machadinha à frente do personagem. A pose traseira continua como o Junior preferiu, sem a tentativa centralizada.
- Repouso e retorno agora usam exatamente os mesmos pixels para evitar mudança de aparência no fechamento do ciclo.
- Recalculados escala e encaixes dos pés por personagem/atividade/direção.
- Fontes refinadas preservadas em `referencias/personagens/trabalho-refinado/`; preparo compartilhado em `scripts/prepare-player-work.cjs`, chamado pelos dois comandos anteriores.
- GIFs atuais e relatório em `docs/personagens/trabalho-refinado/`.

## Em andamento e próximo passo exato

- Junior deve avaliar os GIFs refinados da machadinha e picareta. As folhas aproximam o original, mas não reutilizam a cabeça original pixel a pixel. Evitar prometer identidade perfeita antes da revisão visual dele.
- Se pedir publicação, publicar preview.34 conforme AGENTS.md: build, versão do pacote, notas/LEIA, tag anotada, CI e main. Não criar preview.35 antes disso.
- Nesta rodada não houve pedido de publicação; main e tags permaneceram na versão publicada.

## Pendências e ideias para depois

- Ipês do Claude exclusivos dos Campos Abertos: machadinha de Ferro ou melhor, seis golpes; madeira nobre por árvore: Ferro 1, Ouro 2, Metal Negro 3, mais dois galhos; rebrota em sete dias.
- Galinheiro exige seis madeiras nobres, curral dez. Novas construções de animais também devem exigir madeira nobre (`ANIMAL_BUILDING_MATERIAL` e teste dos ipês).
- Melhorar variedade visual dos campos sem mudar os IDs salvos das moitas.
- Produção animal (cochos, alimentação, ovos, balde e ordenha), captura/caça e editor F2 dos campos continuam pendentes.
- Calendário sazonal continua adiado a pedido do Junior até concluir os cenários.

## Problemas conhecidos

- Pacote ainda usa versão preview.33 até publicação autorizada da preview.34.
- Documentação anterior em `docs/personagens/corte/` registra a primeira etapa; os novos originais substituem visualmente as folhas anteriores. A documentação atual está em `trabalho-refinado/`.

## Testes

- `npm ci`: ok.
- `npm run check`: ok antes e depois.
- `npm test`: baseline e final **1.854 passaram, zero falhas, 209 arquivos**.
- Testes específicos das duas animações: oito passaram.
- `npm run build`: não executado (sem publicação solicitada nesta rodada).
- Conferido no jogo (Chromium): 64 combinações de personagem, ferramenta, direção e nível; todos os quadros e restauração do corpo, sem erros JavaScript. A primeira tentativa foi interrompida por HMR durante preparo das imagens; a execução final passou.
