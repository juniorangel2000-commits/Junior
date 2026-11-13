# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-13
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, HEAD do branch (implementação `a712469`).
- **Última versão publicada:** `v0.10.0-preview.33`: Release pública com instalador e portátil Windows x64; workflow `43475543958` aprovado, confirmado pelo Codex na `main`.
- **Estado:** concluído (ipês e madeira nobre implementados e validados); **não publicado**, o Junior não pediu publicação.

## Feito nesta rodada

- **Ipês-amarelos** exclusivos dos Campos Abertos: 6 árvores em clareiras (`FIELDS_IPES` em `src/data/open-fields.ts`), com copa dourada gerada em memória a partir de `asset-tree-1`.
- Corte só com **machadinha de Ferro ou melhor**; a de Pedra é recusada sem golpe e sem desgaste. São 6 golpes salvos (`openFields.hits`), e cada golpe gasta 1 de durabilidade da cópia usada.
- **Madeira nobre** (`hardwood`) por árvore: Ferro 1, Ouro 2, Metal Negro 3, mais 2 galhos. O ipê vira toco e rebrota em 7 dias (`openFields.felled`). Pedido expresso do Junior: 1 madeira com ferro, aumentando nas machadinhas melhores.
- **Construções de animais** passam a pedir madeira nobre: Galinheiro +6, Curral +10.
- **Regra permanente:** toda construção de animais futura também deve pedir madeira nobre (`ANIMAL_BUILDING_MATERIAL`). O teste `tests/ipe-trees.test.ts` falha se não pedir.
- **Compatibilidade de saves:**
  - Os ids das moitas não mudam: os troncos dos ipês são indexados depois de gerar as moitas.
  - Saves antigos recebem a madeira nobre com estoque zero.
  - Galinheiros e currais já concluídos são migrados como abastecidos; obras em andamento precisam da madeira nobre.
- Ícone `public/assets/visual/open-fields/hardwood.png`, recolorido a partir do ícone de troncos.
- Documentação, prévias e QA de navegador: `docs/cenarios/ipes-campos-abertos/` e `scripts/qa-ipe-trees.cjs`.

## Em andamento e próximo passo exato

- **Animação de corte de corpo inteiro (pedido do Junior):** a machadinha deve ter animação igual à da picareta.
  - A picareta usa folhas `public/assets/visual/characters/<personagem>/work-mining.png`: 6 quadros × 4 linhas de 256 px, na ordem frente, costas, direita, esquerda. Elas são preparadas por `scripts/prepare-player-mining.cjs` e desenhadas por `src/player-mining-art.ts` e `ToolVisual.show` quando `tool==='pickaxe'&&body`.
  - Para a machadinha: gerar `work-chopping.png` para `farmer-male` e `farmer-female` no mesmo formato, com uma machadinha no lugar da picareta. Depois registrar as caixas do metal (como `PLAYER_PICKAXE_HEADS`) e usar a pose quando `tool==='hatchet'&&body`. O Claude Code não gera imagens; esta etapa é para o Codex.
  - Nos Campos Abertos, `playGather('hatchet', …)` não passa o corpo. Ao integrar, passe `this.player.sprite`, como faz o `ForestScene`.
- Se o Junior aprovar, publicar como preview.34.

## Pendências e ideias para depois

- **Visual dos Campos Abertos:** comparado à Propriedade e à Floresta Antiga, o cenário está uniforme.
  - O capim está espalhado por igual, o piso é um verde só e as árvores formam só uma parede na borda.
  - Os ipês já criam pontos de destaque, mas faltam bosques no meio do mapa, manchas de flores e de terra e talvez água.
  - Cuidado: mudar a geração das moitas altera os ids salvos em `openFields.cut`. É preciso migrar ou manter os ids.
- Produção animal (cochos, ovos, balde e ordenha), seguindo `docs/construcoes/PRODUCAO-ANIMAL-PLANO.md`. Lembrar da regra da madeira nobre nas novas construções.
- Captura/caça dos animais dos campos; editor F2 dos Campos ainda não integrado.
- Calendário sazonal continua adiado até concluir os cenários, por decisão do Junior.

## Problemas conhecidos

- Com 1 madeira por ipê (machadinha de ferro) e rebrota em 7 dias, o ritmo é de até 6 madeiras nobres por semana do jogo. Um galinheiro leva cerca de 1 semana e um curral cerca de 2. Ajuste `IPE_REGROW_DAYS` ou os custos se o Junior achar lento.
- A animação atual da machadinha é a ferramenta desenhada ao lado do corpo parado, sempre virada para a esquerda ou a direita, mesmo de costas (ver próximo passo).

## Testes

- `npm ci`: ok (com `ELECTRON_SKIP_BINARY_DOWNLOAD=1`, sem o Electron).
- `npm run check`: ok, antes e depois.
- `npm test`: antes, 1.839 passaram; depois, **1.850 passaram, zero falhas, 208 arquivos**. O teste da construção da fazenda foi ajustado: o jogador do teste agora carrega madeira nobre.
- `npm run build`: não executado (não houve publicação).
- Conferido no jogo (Chromium):
  - A machadinha de pedra é recusada e a de ferro derruba o ipê em 6 golpes.
  - Aparecem o toco e a madeira nobre na mochila, com ícone próprio.
  - O mapa M mostra os ipês, e o toco se mantém ao continuar o jogo.
  - Nenhum erro de JavaScript.
