# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-13
- **Por:** Codex
- **Continuar a partir de:** `main` / branch `release/v0.10.0-preview.33`, versão publicada no commit `0a70b64`; o HEAD acrescenta esta confirmação de publicação.
- **Última versão publicada:** `v0.10.0-preview.33` — Release pública com instalador e portátil Windows x64.
- **Estado:** concluído e publicado.

## Feito nesta rodada

- AGENTS.md criado com o texto exato enviado pelo Junior; CLAUDE.md contém somente `@AGENTS.md`.
- Campos Abertos ao sul da propriedade: 96 × 72 blocos, igual à propriedade. O piso usa os mesmos materiais e a escala nativa da propriedade, conforme correção expressa do Junior. O estudo ilustrado NÃO é usado no jogo.
- Acesso/retorno caminhando, passagem sul reservada, placas, HUD, inventário, mapa, atalhos, companheiros, pássaros e salvamento.
- Capim alto ao vento, corte com foice, dois capins frescos no chão por moita, desgaste somente da ferramenta utilizada e rebrota em três dias.
- Silo seca um capim em uma palha após 24 horas do jogo; secagem ocupa capacidade. Receita 3 fibras → 1 palha preservada.
- Ervas, cogumelos, árvores, pedras, abrigo com entrada frontal e colisão nas paredes; vacas/galinhas/coelhos com navegação e animações existentes.
- Migração de partidas anteriores adiciona o capim fresco com estoque zero.
- Prévia real do mapa e relatório: `docs/cenarios/campos-abertos/`.

## Em andamento e próximo passo exato

- Publicação concluída: workflow `43475543958` passou no Windows. Release: https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.10.0-preview.33 . A main recebeu o commit da versão e esta passagem final, sem alterar a tag publicada.
- Depois da publicação, continuar do HEAD de main/tag preview.33. Próxima rodada de implementação usa `release/v0.10.0-preview.34`.
- Próxima entrega sugerida: produção animal (cochos/alimentação, ovos, balde e ordenha), seguindo `docs/construcoes/PRODUCAO-ANIMAL-PLANO.md`, após retorno do Junior sobre os campos.

## Pendências e ideias para depois

- Captura/caça dos animais dos campos; atualmente circulam pelo cenário.
- Editor F2 dos Campos Abertos ainda não integrado; mapa M disponível.
- Produção de ovos/leite e alimentação ainda não implementadas.
- Calendário sazonal continua adiado até concluir os cenários, por decisão do Junior.

## Problemas conhecidos

- Primeira suíte desta rodada teve uma falha por esperar três placas na propriedade. A nova saída adiciona a quarta placa; teste ajustado. Não era falha da preview.32.
- A máquina reiniciou durante a validação inicial. Dependências reinstaladas com npm ci; validações finais refeitas.
- Não confundir esta versão com sistemas futuros de caça, alimentação ou produção animal.

## Testes

- `npm ci`: ok.
- `npm run check`: ok.
- `npm test`: 1.839 passaram, zero falhas, 207 arquivos.
- `npm run build`: ok (aviso existente de tamanho do bundle).
- CI Windows: check, testes, build, instalador, portátil e publicação concluídos com sucesso.
- Conferido no jogo: acesso e retorno a pé, foice, coleta, inventário, captura do mapa, salvar e continuar nos campos. Nenhum erro JavaScript.
