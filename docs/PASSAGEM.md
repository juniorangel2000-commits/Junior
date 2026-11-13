# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-13
- **Por:** Codex
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, implementação `b39c3b5`; usar o HEAD com esta passagem.
- **Última versão publicada:** `v0.10.0-preview.33`.
- **Estado:** concluído e validado; não publicado nesta rodada.

## Feito nesta rodada

- Adicionado um cavalo selvagem aos Campos Abertos (`field-horse-1`), usando o ZIP enviado pelo Junior, sem utilizar o estudo gerado anteriormente.
- Preservados 180 PNGs originais; atlas com caminhada em oito direções e corrida quando foge. Animação de mexer a cabeça preservada para uso futuro.
- Colisão maior para o cavalo, ponto inicial livre, posição salva no estado existente dos animais; carregar a partida não duplica o cavalo.
- Testes de pixels/importação, movimento, colisão e compatibilidade; QA real no Chromium com screenshot e relatório em `docs/cenarios/cavalo-campos-abertos/`.
- Refinamentos anteriores de personagens trabalhando e ipês permanecem preservados.
- Registrada a ideia de domesticação proposta pelo Junior em `docs/planejamento/DOMESTICACAO-CAVALO.md`.

## Em andamento e próximo passo exato

- Elaborar a domesticação com o Junior: estábulo pronto, comida de NPC exigindo vegetais da colheita, oferta nos Campos Abertos e confiança crescendo ao longo de sete dias.
- Aumentar a fuga do cavalo para superar a corrida do jogador; ainda usa o fator genérico .9 dos animais. Definir NPC, vegetais, receita e estábulo antes de implementar a cadeia completa.
- Cavalo já aparece no cenário, mas captura, condução e montaria ainda não existem.
- Publicar preview.34 somente quando solicitado; main/tags continuam na preview.33.

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
- `npm test`: baseline 1.854 passaram; final **1.856 passaram, zero falhas, 210 arquivos**.
- Testes específicos: 16 passaram (cavalo, animais e Campos Abertos).
- `npm run build`: não executado (sem publicação nesta rodada).
- Conferido no jogo (Chromium): cavalo com a sprite fornecida, movimento, salvamento, continuar sem duplicação e nenhum erro JavaScript.
