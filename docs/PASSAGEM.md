# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-13
- **Por:** Codex
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, implementação `a85756d`; usar o HEAD, que inclui documentação e esta passagem.
- **Última versão publicada:** `v0.10.0-preview.33`.
- **Estado:** concluído e validado; não publicado nesta rodada.

## Feito nesta rodada

- Continuado o trabalho do Claude com ipês exclusivos dos Campos Abertos, madeira nobre e custos de construções de animais, sem alterar essas regras.
- Gerados `work-chopping.png` para farmer-male e farmer-female: folhas 1536 × 1024, seis colunas e quatro linhas de células 256 × 256, na ordem frente, costas, direita e esquerda.
- Corte de corpo inteiro integrado ao preparador da mineração (`src/player-mining-art.ts`) e `ToolVisual.show`, com texturas independentes e metal por nível.
- Propriedade e Floresta usam as novas poses pelo fluxo existente. Campos Abertos passa o corpo do jogador ao `playGather` para usar a mesma animação.
- Pés alinhados por direção; corpo normal restaurado ao terminar/cancelar. Originais e script reproduzível em `referencias/personagens/corte` e `scripts/prepare-player-chopping.cjs`.
- Junior apontou o levantamento da ferramenta do lado errado nas vistas direita/esquerda. Corrigidos somente esses dois quadros em cada personagem.
- Junior pediu para voltar à vista traseira anterior: ela foi preservada integralmente. As tentativas posteriores de refazer as costas NÃO foram integradas. Conferência pixel a pixel confirmou os outros 22 quadros iguais à folha base.
- Documentação e relatório nativo em `docs/personagens/corte/`.

## Em andamento e próximo passo exato

- Aguardar revisão do Junior sobre as animações. Se pedir publicação, publicar preview.34 seguindo AGENTS.md; não criar preview.35 antes disso.
- Não publicar nem atualizar main automaticamente nesta rodada: foi solicitada implementação, sem novo pedido de publicação.
- Antes de publicar: executar build, atualizar versão do pacote e notas/LEIA, incluir esta passagem, criar tag anotada e acompanhar CI Windows.

## Pendências e ideias para depois

- Os ipês do Claude exigem machadinha de Ferro ou melhor e seis golpes. Cada árvore fornece madeira nobre: Ferro 1, Ouro 2, Metal Negro 3, mais dois galhos. Rebrota em sete dias.
- Galinheiro pede seis madeiras nobres, curral dez. Toda construção futura de animais também deve exigir madeira nobre (`ANIMAL_BUILDING_MATERIAL` e teste de ipês).
- Melhorar variedade visual dos Campos Abertos sem mudar os IDs salvos das moitas.
- Produção animal (cochos, alimentação, ovos, balde e ordenha), captura/caça e editor F2 dos campos continuam pendentes.
- Calendário sazonal continua adiado a pedido do Junior até concluir os cenários.

## Problemas conhecidos

- O pacote continua com versão preview.33 até a publicação autorizada da preview.34; o branch contém trabalho ainda não distribuído no instalador.
- Manter a vista traseira atual: Junior preferiu essa versão à tentativa de levantar a ferramenta centralizada.

## Testes

- `npm ci`: ok.
- `npm run check`: ok antes e depois.
- `npm test`: baseline 1.850 passaram; final após correções, **1.854 passaram, zero falhas, 209 arquivos**.
- `npm run build`: não executado (sem publicação solicitada nesta rodada).
- Conferido no jogo (Chromium): 32 combinações de personagem, direção e nível, todos os quadros de corte, troca de corpo e restauração; nenhum erro JavaScript. Repetido após a correção lateral.
- Conferência de pixels: os 22 quadros fora dos dois levantamentos laterais foram preservados em cada personagem, incluindo todas as costas.
