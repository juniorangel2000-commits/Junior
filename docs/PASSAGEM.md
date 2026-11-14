# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-14
- **Por:** Claude Code (encerramento de emergência: créditos do Junior acabando)
- **Continuar a partir de:** branch `release/v0.10.0-preview.35`, HEAD do branch (ovos e leite em `65ef4dc`; QA de navegador em WIP).
- **Última versão publicada:** `v0.10.0-preview.34`, Release pública com instalador e portátil Windows x64: https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.10.0-preview.34
- **Estado:** etapa 1 do plano de animais (interiores do galinheiro e do curral) implementada e validada, **com arte definitiva do SpriteCook**. Etapa 2 (ovos e leite) implementada e com testes unitários passando; o QA de navegador ainda falha na entrada do curral (ver abaixo). Não publicado.

## Feito nesta rodada

- **Etapa 2: ovos e leite** (`65ef4dc`), seguindo `docs/construcoes/PRODUCAO-ANIMAL-PLANO.md`:
  - `src/systems/animal-production.ts`:
    - Cocho por obra (`site.trough`: galinheiro 12, curral 8).
    - Às 06:00 cada animal come 1 palha. Quem está há mais tempo sem comer vem primeiro.
    - Galinha alimentada bota num ninho livre (`site.eggs`, índices 0–5).
    - Vaca alimentada fica pronta para ordenha (`save.animalCare.animals[id].milk`).
    - Dias fora: até 7 manhãs recuperadas com o estoque real, sem acumular produção.
    - Save sem `animalCare` começa no dia atual, sem produção retroativa.
    - Ações que salvam antes de aplicar: `fillTrough`, `collectEgg` e `milkCow`.
    - Validação: `validAnimalCare` e `validSiteProduction`.
  - Itens novos: `egg`, `milk` e `milkPail`. Saves antigos recebem os três com 0 (`VILLAGE_ITEM_IDS`).
  - Balde na bancada: 4 tábuas regulares + 2 fragmentos de ferro, com martelo.
  - Compradores: Helena compra ovo (8) e leite (16); Rosa compra ovo (8). Nenhuma loja vende esses produtos.
  - Interior (`FarmInteriorScene`):
    - E no cocho coloca a palha da mochila.
    - E no ninho recolhe o ovo.
    - E perto da vaca pronta ordenha: 1 s, balde ao lado da vaca e jogador parado.
    - Gota de leite acima das vacas prontas.
    - A HUD mostra cocho, alimentados e ovos ou vacas prontas.
  - A Propriedade processa as manhãs (`ValleyScene.update`), e o painel da construção mostra o resumo da produção.
  - Arte do SpriteCook, com ids em `public/assets/visual/farm/interior/spritecook-assets.json`:
    - ícones em `public/assets/visual/farm/products/`: ovo, leite e balde;
    - `nest-egg.png`;
    - cochos vazios (`trough-64-empty.png` e `trough-96-empty.png`).
- **Arte definitiva dos interiores** (`a397d2d`):
  - Piso, paredes, cocho, bebedouro, ninho, baia e divisória, gerados no SpriteCook com `coop.png` como guia de estilo.
  - **Não reduzir os PNGs:** o Junior achou borrado quando foram reduzidos para 32 px. As peças ficam na resolução original, com `setScale`/`setDisplaySize`, e o piso é montado com `FLOOR_SCALE=2`.
  - Prompts do SpriteCook: pedir "front-facing, axis-aligned, NOT isometric".

## Em andamento e próximo passo exato

- **WIP: `scripts/qa-animal-production.cjs`** (Vite em 127.0.0.1:5190):
  - Passou no galinheiro: cocho com 12 palhas, 2 ovos de manhã (ninho com a arte do ovo) e ovo recolhido.
  - Falha ao **entrar no curral** depois de sair do galinheiro. A posição do jogador fica 32 px à direita da porta (1424 contra 1392), e `nearFarmDoor` exige até 30 px.
  - Suspeita: a vaca, solta no cercado de dia (são 06:01), empurra o jogador na porta. Outra hipótese: `loadState` reposiciona o jogador.
  - Investigar se isso também acontece jogando, quando um animal está parado na porta. Se acontecer, aumentar o raio ou ignorar a colisão do animal na entrada.
  - Para o QA, uma saída é entrar pelo botão "Entrar no curral" do painel, ou fazer o teste à noite.
  - Depois disso, conferir a ordenha no navegador (gota de leite, "E ordenha com o balde" e leite na mochila) e guardar as capturas em `docs/planejamento/qa-producao/`.
- Depois: acabamento da etapa 2 (preços jogando, som próprio de ordenha) e etapa 3, **ovelha e cabra com aprisco**.
- **Versões (proposta ao Junior, ainda não confirmada):**
  - preview.35: interiores, ovos e leite;
  - preview.36: ovelha e cabra (aprisco, lã, leite de cabra, tesoura);
  - preview.37: máquinas;
  - preview.38: cozinha;
  - preview.39: porco, pato e abelhas.
- O SpriteCook está autorizado na conta do Junior (plano Apprentice, cerca de 500 créditos restantes). O Codex não tem esse conector; a arte nova fica com o Junior ou com uma sessão do Claude Code.

## Pendências e ideias para depois

- Para o Junior confirmar: o estábulo é exigido para a **corda** do cavalo, não para o cavalo comer.
- Plano completo de animais, máquinas e cozinha em `docs/planejamento/ANIMAIS-E-RECEITAS.md`, com ovelha e cabra, porco, pato, abelhas, máquinas e cozinha.
- Chamar o cavalo de longe, montaria e quadros de deitar e descansar do cavalo.
- Sementes especiais para o ano todo; clima, peixes por estação, árvores frutíferas e estufa.
- Preços dos produtos e pratos, a definir jogando.

## Problemas conhecidos

- Os animais dentro do interior não guardam a posição; a cada entrada eles aparecem espalhados (galinhas) ou nas baias (vacas).
- O interior não tem iluminação de noite; é sempre claro.
- Publicação: o Claude Code prepara a versão na `main` e o Junior cria a Release pelo site; o Codex pode criar tags normalmente.

## Testes

- `npm run check`: ok.
- `npm test`: **1.954 passaram, zero falhas, 220 arquivos**. Os 14 testes novos estão em `tests/animal-production.test.ts`: ciclo, prioridade, limite de ovos e leite, recuperação de dias, ações, falha ao salvar, validação, migração, receita e comércio.
- `npm run build`: não executado.
- Chromium:
  - `scripts/qa-farm-interior.cjs` passou nesta rodada, antes da etapa 2.
  - `scripts/qa-animal-production.cjs` **não concluído**: falha na entrada do curral (ver acima).
