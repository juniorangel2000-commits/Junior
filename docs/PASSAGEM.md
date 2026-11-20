# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-20
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.44`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.43`, commit `8df467d`, na `main`.
- **Estado:** a pá e a foice usam o mesmo relógio para animação, efeito no alvo e gasto de durabilidade. Montaria masculina integrada em `599eafa`.

## Feito nesta rodada

- A pá e a foice da Propriedade e a foice da Floresta Antiga esperam o quadro 4 para preparar o canteiro ou cortar a vegetação. Nos Campos Abertos, foice e machadinha do ipê passaram a usar o mesmo relógio da animação.
- `ToolSwing` concentra o relógio de 18 quadros por segundo e entrega um único contato aos 4/18 s. `ToolUse` continua fornecendo a mesma interface e o mesmo formato de snapshot para os golpes existentes e para Bento.
- A ferramenta guarda a direção, o alvo e o ID da cópia escolhida. No contato, são conferidos alcance, alvo e durabilidade disponível da mesma cópia. Pausa, saída de cena e troca de ferramenta cancelam as ações aplicáveis.
- O jogador fica no lugar durante o golpe. A pá fica um pouco mais alta no último quadro de preparação, de modo que sua descida coincida com a mudança do solo.
- `scripts/qa-gather-contact.cjs` confere o uso pela mochila na Propriedade e Floresta e pela tecla E nos Campos. Com duas cópias na mochila, verifica que o alvo fica intacto no quadro 3, que cancelar não produz efeito, que o quadro 4 muda o alvo e que só uma cópia perde um ponto. A recuperação não repete o efeito.
- A documentação da montaria está em `docs/construcoes/MONTARIA.md`. A revisão das ferramentas, rotinas da vila, passadas de Marina e Rui e porteira a 90 graus está em `a106cdb:docs/PASSAGEM.md`.

## Em andamento e próximo passo exato

- Revisar a orientação da lâmina da enxada no impacto. Conferir esquerda e direita lado a lado, com o cabo na mão e a lâmina legível no contato. Preservar os ícones e a escala.
- O fazendeiro montado usa uma pose por direção e acompanha o lombo animado. Uma inclinação de tronco própria para o galope fica para uma revisão futura, se pedida.

## Pendências e ideias para depois

- Diagonais autorais para Marina e Rui com as caminhadas originais do jogador como referência.
- Histórias de Amélia e Nilo aguardam os cenários correspondentes. Planos de calendário, visitas, animais e receitas continuam em `docs/planejamento/`.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não persistem posições individuais. Itens recolhidos do chão voltam à qualidade comum.
- `qa-animal-escort.cjs` está desatualizado na volta. `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar os originais de arte em resolução nativa. O stash antigo da preview.34 está desatualizado.

## Testes

- Base: `npm ci` pelo cache, `npm run check` e 2.204 testes passando.
- Integração em `5e1623b`: check e 2.204 testes (263 arquivos) passaram. Chromium confirmou pá e foice na Propriedade e foice na Floresta Antiga e nos Campos Abertos, sem erros de página. A Propriedade foi conferida de novo após o ajuste visual da pá.
