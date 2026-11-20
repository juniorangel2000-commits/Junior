# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-20
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.44`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.43`, commit `8df467d`, na `main`.
- **Estado:** golpe da enxada revisado nas duas laterais. Montaria masculina em `599eafa` e contato da pá/foice em `5e1623b`.

## Feito nesta rodada

- Refeito o perfil da lâmina de animação da enxada para que a ponta fique à frente do encaixe e voltada para o solo no contato. O ícone de inventário continua na fonte anterior.
- Fonte nativa em `referencias/personagens/ferramentas-corpo/enxada-impacto.png`. `scripts/prepare-work-tools.cjs` mantém o comprimento exibido da ferramenta equivalente ao anterior e registra a pegada, o encaixe e o ponto da ponta no manifesto.
- O último quadro de levantamento usa a pose existente. O impacto usa a mão mais baixa e o novo ângulo. Esquerda e direita são espelhadas em torno da mão.
- O relógio do golpe continua aplicando efeito no quadro 4. Conferido no Chromium com E em dois canteiros livres da Propriedade. A pegada, a escala e a textura permanecem estáveis durante o golpe. A terra aparece no contato e a pose normal volta ao final.
- `tests/player-tool-body.test.ts` valida a posição da ponta em relação ao encaixe e ao solo dos dois personagens. Fotos em `docs/planejamento/qa-enxada-preview44/`.
- Revisões anteriores de ferramentas em `5e1623b` e `a106cdb:docs/PASSAGEM.md`. Montaria revisada no chat e integrada em `599eafa`.

## Em andamento e próximo passo exato

- Receber o retorno do Junior sobre o golpe da enxada. A rodada de contato e orientação das ferramentas está concluída.
- Se a próxima prioridade continuar em arte, revisar as diagonais dos sobreviventes Marina e Rui. Hoje eles têm animações próprias nas quatro direções principais. Usar as caminhadas originais dos jogadores como referência.
- O fazendeiro montado usa uma pose por direção e acompanha o lombo animado. Uma inclinação de tronco própria para o galope fica para uma revisão futura, se pedida.

## Pendências e ideias para depois

- Histórias de Amélia e Nilo aguardam os cenários correspondentes. Planos de calendário, visitas, animais e receitas continuam em `docs/planejamento/`.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não persistem posições individuais. Itens recolhidos do chão voltam à qualidade comum.
- `qa-animal-escort.cjs` está desatualizado na volta. `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar os originais de arte em resolução nativa. O stash antigo da preview.34 está desatualizado.

## Testes

- Base: `npm ci` pelo cache, `npm run check` e 2.204 testes passando.
- Integração `7b4a645`: check, 2.204 testes em 263 arquivos e QA no Chromium sem erros. Confirmados preparo, contato no quadro 4, escala/pegada e recuperação dos dois lados.
