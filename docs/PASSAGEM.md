# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-14
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.35`, HEAD do branch (arte dos interiores em `a397d2d`).
- **Última versão publicada:** `v0.10.0-preview.34`, Release pública com instalador e portátil Windows x64: https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.10.0-preview.34
- **Estado:** etapa 1 do plano de animais (interiores do galinheiro e do curral) implementada e validada, **com arte definitiva do SpriteCook**. Não publicado.

## Feito nesta rodada

- **Arte definitiva dos interiores, gerada no SpriteCook** (conta do Junior, plano Apprentice; ~350 créditos gastos):
  - Guia de estilo: `public/assets/visual/farm/coop.png`, enviado ao SpriteCook como asset `19a37d0a-a42b-4de5-841a-dab0bf97dfab`.
  - Modelo `gemini-nano-banana-2.1`, pixel art. Os prompts precisam pedir "front-facing, axis-aligned, NOT isometric"; sem isso as peças vêm em diagonal.
  - Arquivos em `public/assets/visual/farm/interior/`: piso de palha, piso de tábuas, parede do fundo, topo de parede, ninho, bebedouro, cocho curto (galinheiro), cocho longo (curral), baia e divisória. O id de cada um no SpriteCook está em `spritecook-assets.json`.
  - **Qualidade:** as peças ficam na resolução original do SpriteCook e são reduzidas só na exibição (`setScale`/`setDisplaySize`, como `coop.png` na Propriedade). O piso é montado com o dobro da resolução do mundo (`FLOOR_SCALE=2`). Na primeira tentativa reduzi tudo para 32 px e o Junior achou borrado; não reduzir os PNGs de novo.
  - `src/farm-interior-art.ts`: `preloadFarmInteriorArt` (chamado no `preload()` da `FarmInteriorScene`) e `fixtureKey`. As chaves de textura continuam as mesmas da arte provisória.
- Antes, nesta mesma rodada (`8d17a2d`): cena `FarmInteriorScene`, plantas em `src/data/farm-interiors.ts`, rotina dia/noite e "Recolher os animais" / "Soltar no cercado" em `src/systems/farm-interior.ts`.

## Em andamento e próximo passo exato

- O Junior perguntou se vale fazer **novas artes externas** do galinheiro e do curral combinando com o jogo. Aguardando a resposta dele sobre o que mudar; os externos atuais já usam a mesma paleta de palha e madeira.
- Depois, etapa 2: **ovos e leite** (`docs/construcoes/PRODUCAO-ANIMAL-PLANO.md`), usando os ninhos e as baias do interior, com cocho abastecido com palha.
- O SpriteCook já está autorizado nesta conta (`get_credit_balance` responde). Fica disponível para as próximas artes: animais, aprisco, chiqueiro, colmeia, máquinas e ícones.

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
- `npm test`: **1.940 passaram, zero falhas, 219 arquivos**. Teste novo em `tests/farm-interior.test.ts`: cada objeto fixo tem o PNG e a chave esperados.
- `npm run build`: não executado (sem publicação).
- Chromium (`scripts/qa-farm-interior.cjs`, Vite em 127.0.0.1:5190):
  - entra no galinheiro à noite com a galinha, identifica o ninho e sai pela porta;
  - entra também no curral;
  - nenhum erro de JavaScript;
  - capturas em `docs/planejamento/qa-interiores/`: `galinheiro-noite.png` e `curral-noite.png`, mais as plantas inteiras `piso-coop.png` e `piso-barn.png`.
