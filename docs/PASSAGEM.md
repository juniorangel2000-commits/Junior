# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-15
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.36` (último commit desta rodada; ver `git log`).
- **Última versão publicada:** `v0.10.0-preview.35` (Release pre-release com executáveis do Windows; tag em `861ea71`, `main` igual).
- **Estado:** preview.36 em andamento, **não publicada**. Qualidade dos produtos e equilíbrio de preços prontos e testados. O Junior ainda não pediu para publicar.

## Feito nesta rodada

### Qualidade dos produtos (Claude Code)

Decisões do Junior: amizade com alimentação **e carinho**; bom vale 1,25× e excelente 1,5×.
Regras completas em `docs/construcoes/QUALIDADE.md`.

- `src/systems/item-quality.ts`: registro `save.itemQuality[item] = {good, excellent, seen}`. A mochila continua só com o total; o resto é comum.
  - Gasto que não conhece qualidade tira primeiro as comuns. `saveGame` confere o registro a cada save, e a compra também confere o item (`touchQuality`).
  - Venda (`trade(..., quality)`), cozinha, máquinas e prato do dia usam primeiro as melhores unidades (`takeBest`).
- **Amizade dos animais** (`animalCare.animals[id].bond`, 0–30): +1 por manhã alimentado, +1 com o carinho do dia (`petted`), −2 por manhã sem comida. Bom com 10, excelente com 25.
  - Carinho: E no animal dentro do abrigo (`petAnimal`), com coração sobre ele. Ordenha e tosquia têm prioridade quando prontas. A dica mostra "amizade N/30 · produz bom".
  - Ovos guardam a qualidade no ninho (`site.nestQuality`); leite e lã usam a amizade na hora.
- **Herança:** máquinas (`job.quality`) e pratos usam a média, arredondada para baixo, dos itens de animal que entraram (`ANIMAL_QUALITY_ITEMS`). Comer um prato bom ou excelente dá 1,25× ou 1,5× de vigor.
- Mochila: estrela prateada (bom) ou dourada (excelente) no espaço, e "Qualidade: 1 excelente · 3 comuns" no detalhe. `HudData.itemQuality` chega à interface por todas as cenas.
- **Defeitos corrigidos no caminho:**
  - o `apply` das máquinas no Vale e no Interior copiava só a mochila e perdia a qualidade;
  - `consumeInField` não copiava o efeito do prato (`foodEffect`) para o estado da cena.

### Equilíbrio de preços (Claude Code)

Regra fixa em `docs/construcoes/PRECOS.md`, garantida por `tests/prices-balance.test.ts`:

- produto de máquina vale pelo menos 1,3× o que entra;
- prato vale os ingredientes e a lenha vezes 1,35 (fogão), 1,45 (forno) ou 1,3 (fogueira);
- nenhum item é vendido por um morador mais barato do que outro paga por ele.

Mudanças:

- **Moinho:** 1 grão por farinha (antes eram 2, e dava prejuízo). Farinha 32, fubá 37, aveia em flocos 32.
- **Tear:** faz o item novo **tecido de lã** (`woolCloth`, Celina compra por 150). Os tecidos simples custam 8 C e não pagavam 2 novelos. O ícone é provisório (cópia do tecido simples) e está na lista de artes.
- Geleia de melancia 370. 20 pratos com preço novo (tabela no documento); só o peixe assado ficou igual.
- `scripts/qa-machines.cjs` estava desatualizado desde a preview.35 (contava as máquinas novas). Agora confere as 5 máquinas originais, o moinho novo e o tecido de lã.
- `tests/horse.test.ts`: o teste do cavalo leva cerca de 5 s e estourava o limite em máquina lenta (já falhava antes desta rodada). Agora tem limite de 30 s; nada foi pulado.

### Pixel arts que faltam

Lista em `docs/planejamento/ARTE-PENDENTE.md`: artes feitas por script na preview.35, ícones emprestados, tecido de lã e artes previstas que não existem. O Junior vai gerar no ChatGPT e mandar no chat.

## Em andamento e próximo passo exato

1. Mostrar ao Junior a qualidade e os preços novos e pedir que ele jogue para conferir os pontos de `docs/construcoes/PRECOS.md` ("A conferir jogando").
2. Se ele pedir **publicar**: `npm run build`, `npm version 0.10.0-preview.36 --no-git-tag-version`, `docs/cenarios/NOTAS-0.10.0-preview.36.md` e `LEIA-0.10.0-preview.36.md` (modelo da preview.35), commit `Release preview.36: qualidade e equilíbrio de preços`, push do branch e da `main` (avanço direto). O Junior cria a Release no GitHub (tag `v0.10.0-preview.36`, target `main`, pre-release), porque esta sessão não consegue enviar tags.
3. Ideias para a próxima etapa: mostrar a amizade no painel do abrigo; qualidade nas colheitas (adubo); preço dos animais.

## Pendências e ideias para depois

- Plano em `docs/planejamento/ANIMAIS-E-RECEITAS.md`: animais, cozinha, abelhas, patos, porcos, máquinas e qualidade estão prontos. Faltam a conferência dos preços jogando e as artes provisórias.
- Estábulo/corda, montaria e calendário seguem planos anteriores.
- Há stash antigo do branch preview.34 com evidências/documentação do estábulo aberto. **Não aplicar sobre esta PASSAGEM nem desfazer os interiores atuais.**

## Problemas conhecidos

- Interiores dos animais não persistem posição interna individual e ficam claros à noite.
- Travamentos nos Campos ainda precisam ser medidos no PC do Junior: otimizações anteriores estão em `f28f27c`, capim em `5424eee`; o navegador aqui usa SwiftShader. **Não afirmar que o problema de FPS foi resolvido.**
- Arte definitiva dos interiores deve permanecer em resolução original (`setScale`/`setDisplaySize`, piso `FLOOR_SCALE=2`); o Junior rejeitou redução dos PNGs.
- Qualidade: unidades soltas no chão e recolhidas voltam como comuns. Uma entrada sem registro logo depois de um gasto sem registro, antes de salvar, pode ser contada errado (raro; o save confere tudo).

## Testes

- `npm run check`: ok.
- `npm test`: **2.089 passaram, zero falhas, 236 arquivos** (inclui `item-quality.test.ts` e `prices-balance.test.ts`).
- `npm run build`: não rodado nesta rodada (só é obrigatório para publicar).
- Chromium, nesta rodada (`CHROMIUM_PATH=/opt/pw-browsers/chromium` quando o padrão não existir):
  - `scripts/qa-quality.cjs`: OK. Carinho, ovo excelente, estrela na mochila, queijo excelente na Propriedade e save. Capturas em `docs/planejamento/qa-qualidade/`.
  - `scripts/qa-machines.cjs`, `qa-kitchen-stage2.cjs` e `qa-preserves.cjs`: OK.
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`.
