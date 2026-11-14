# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-14
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, HEAD do branch (doma em `ebfa13a`).
- **Última versão publicada:** `v0.10.0-preview.33`.
- **Estado:** doma do cavalo implementada e validada, **faltando só o estábulo, que o Junior vai fazer pelo Codex**. Não publicado.

## Feito nesta rodada

- **Conferência da cadeia até a cesta** (`scripts/qa-harvest-chain.cjs`): dia 1 → sementes da Rosa → cenoura e morango na Primavera → guardados até o Verão → milho → cesta da Helena. Correção do aviso "não cresce **na** Primavera" (`IN_SEASON`).
- **Doma do cavalo** (`src/systems/horse-taming.ts`), com as decisões do Junior desta rodada:
  - **Sem cocho.** O jogador **usa** a cesta e ela **fica no chão** como objeto do cenário, não como item solto; o cavalo vai até ela.
  - **Dia sem cesta zera a confiança.** São 7 dias seguidos.
  - Fases: dias 1–2 com o jogador a 300 px da cesta; dias 3–4 a 170 px; dias 5–7 a 56 px. O raio de fuga diminui junto.
  - Barra de confiança (7 quadrinhos) sobre o cavalo.
  - Domado: ele vem até você, E abre a janela do nome (`GameUI.askText`) e depois faz carinho.
  - **Corda (G) só depois da doma, do nome e com o estábulo pronto.**
  - Travessia com o cavalo para a Propriedade; G solta a corda e o cavalo vira do jogador.
- Detalhes da doma:
  - A cesta é guardada em `horseTaming.basket`; com E perto dela, volta para a mochila.
  - Lugares apertados para a cesta são recusados.
  - Com o jogador fora dos Campos, o cavalo come a cesta do dia, e o efeito é aplicado ao voltar (`settleHorseTaming`).
- **O cavalo como animal do jogador:** `src/data/domestic-animals.ts` (Floresta + cavalo) é usado na corda, na entrega, em `assignFarmAnimal`, no painel ("Alojar <nome>"), na Propriedade (`src/animals.ts`) e na validação do save. A corda pode sair dos Campos (`AnimalEscort.area` aceita `'openFields'`).
- `AnimalBrain.fleeRadius` ajustável por fase (0 = não foge); os outros animais seguem o padrão.
- `HorseIdleCycle.eatBasket` reaproveita a animação de comer.
- Um estábulo provisório chegou a ser criado e **foi removido** a pedido do Junior. Só ficou `animal:'horse'` permitido em `FARM_BUILDINGS`.

## Em andamento e próximo passo exato

- **Estábulo (Codex)**, conforme a seção "Encaixe do estábulo" de `docs/planejamento/DOMESTICACAO-CAVALO.md`:
  - Nova construção em `FARM_KINDS`/`FARM_BUILDINGS` com `animal:'horse'`, capacidade 1 e madeira nobre no custo.
  - Arte, ícone `farm-<tipo>` e ferramenta `farm-<tipo>` (em `Tool`, `TOOLS` e `QUICK_TOOLS`).
  - A doma não precisa mudar.
  - Depois, estender `scripts/qa-horse-taming.cjs` para cobrir corda, travessia e "Alojar".
- Para o Junior confirmar: o estábulo é exigido para a **corda**, não para o cavalo comer, para a doma poder ser testada antes do estábulo existir. Se preferir exigir já para comer, mudar em `OpenFieldsWorld.basketFor` e em `settleHorseTaming`.

- **Depois do estábulo:**
  1. O Claude Code confere a doma completa, com corda, travessia e "Alojar".
  2. Publicar a preview.34 se o Junior pedir, corrigindo antes o texto da missão "Primeira colheita".
  3. Seguir a ordem de `docs/planejamento/ANIMAIS-E-RECEITAS.md`, plano aprovado pelo Junior em 14/11/2026:
     - interiores das construções de animais, com a opção "Recolher os animais";
     - ovos e leite;
     - ovelha e cabra com aprisco;
     - máquinas, colocadas como a cesta, dentro e fora das construções;
     - cozinha;
     - porco (com sobras da horta), pato e abelhas (colmeia comprada na Vila, enxame nos ipês).
  4. A arte dos animais novos, das construções, das máquinas e dos ícones fica com o Codex ou com pacotes gerados pelo Junior.

## Pendências e ideias para depois

- Chamar o cavalo de longe, montaria (sela) e quadros de deitar, descansar e levantar.
- Texto da missão "Primeira colheita" diz "nabo", mas aceita qualquer plantação.
- Sementes especiais para o ano todo; clima, peixes por estação, árvores frutíferas e estufa (etapa 6).
- Ipês: machadinha de Ferro ou melhor; toda construção de animais exige madeira nobre.
- Produção animal, variedade dos campos, caça e editor F2 pendentes; preservar ids das moitas.

## Problemas conhecidos

- O pacote continua na preview.33 até a publicação autorizada da preview.34.
- Se o jogador ficar perto da cesta o dia todo nas fases iniciais e sair do cenário só no dia seguinte, a cesta do dia anterior é creditada ao voltar (regra de "fora dos Campos"). Efeito pequeno, documentado.
- Repositório: `https://github.com/juniorangel2000-commits/Junior.git`.

## Testes

- `npm run check`: ok.
- `npm test`: antes, 1.910; depois, **1.926 passaram, zero falhas, 217 arquivos**. Os 16 novos estão em `tests/horse-taming.test.ts`, com um estábulo de teste simulado só nesse arquivo.
- `npm run build`: não executado (sem publicação).
- Chromium, `scripts/qa-horse-taming.cjs`:
  - Dia sem cesta zera a confiança.
  - 7 dias seguidos com 420, 230 e 95 px de distância conforme a fase.
  - O cavalo domado vem até você, o nome "Trovão" é dado pela janela, a corda é recusada sem estábulo e a doma é preservada ao recarregar.
  - Nenhum erro de JavaScript. Capturas em `docs/planejamento/qa-doma-cavalo/`.
- Chromium, `scripts/qa-harvest-chain.cjs`: cadeia até a cesta ok.
