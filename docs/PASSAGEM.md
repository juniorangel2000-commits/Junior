# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-16
- **Por:** Claude Code
- **Continuar a partir de:** `release/v0.10.0-preview.41` (não publicado ainda).
- **Última versão publicada:** `v0.10.0-preview.40`, enviada à `main`. **Falta o Junior criar a Release** no GitHub: tag `v0.10.0-preview.40`, target `main`, pre-release. A Release da preview.39 também não foi confirmada.
- **Estado:** preview.41 em andamento. Tudo enviado, testes passando. Publicar só quando o Junior pedir.

## Feito nesta rodada

### preview.41 (Claude Code)

- **Regras da montaria** (`src/riding-guard.ts`, `docs/construcoes/MONTARIA.md`):
  - montado, não se entra em interiores (casa, lojas, ferreiro, centro comunitário, abrigos, mina, masmorras) nem no Acampamento: a passagem avisa para descer;
  - montado ou com animal na corda, não se entra na água (quem já está nela sai para o raso).
- **Entrada da Serra** no começo da escada do Lago, lá embaixo (`LAKE_HIGHLAND_EXIT` em `src/data/highland.ts`).
- **Tela de carregamento nova** (`src/world-loading.ts`):
  - a personagem montada galopa pela barra, que vira uma trilha;
  - ao fundo, a paisagem do destino em camadas, na cor da hora do dia;
  - o passo da viagem e dicas alternadas.
  - Imagem em `docs/planejamento/carregamento-preview.png`.
- **Nomes dos lugares unificados** (`src/data/area-names.ts`), escolhidos pelo Junior: Propriedade Abandonada, Floresta Antiga, Vila, Estrada da Cidade, Lago da Cachoeira, Campos Abertos, Platô da Nascente, Acampamento dos Sobreviventes e Mina Antiga.
- `scripts/qa-horse-riding.cjs`: conferência da montaria no navegador, etapa por etapa, uma etapa por navegador.

### preview.40 (publicada)

- Montaria com a arte do Junior (dois personagens), qualidade das colheitas, painel do abrigo e fabricação. Detalhes em `docs/cenarios/NOTAS-0.10.0-preview.40.md`.

## Em andamento e próximo passo exato

1. **Junior:** criar a Release da preview.40, com a tag `v0.10.0-preview.40` e target `main` (e conferir a da preview.39).
2. Repetir no navegador as etapas de `scripts/qa-horse-riding.cjs` que ainda não rodaram:
   - `casa` (feminina) e `floresta` (masculino);
   - `agua` (os dois);
   - `cenario-<área>`, que ainda falha ao recarregar a página.
3. **No PC do Junior:** conferir a subida da escada do Lago até a Serra, porque o Lago não termina de carregar no Chromium daqui.
4. Pendentes do pedido "depois fazemos o restante":
   - porteira do chiqueiro;
   - ícones de peças de construção;
   - instalador em WebP (precisa do `sharp`);
   - ajustes pelos números do F3.

## Pendências e ideias para depois


- Plano em `docs/planejamento/ANIMAIS-E-RECEITAS.md`. Animais, cozinha, abelhas, patos, porcos, máquinas e qualidade estão prontos. Faltam conferir os preços jogando e substituir as artes provisórias.
- Estábulo/corda e calendário seguem planos anteriores.
- Há um stash antigo do branch preview.34 com evidências e documentação do estábulo aberto. **Não aplicar sobre esta PASSAGEM nem desfazer os interiores atuais.**

## Problemas conhecidos

- Os interiores dos animais não guardam a posição de cada animal lá dentro.
- Os travamentos nos Campos ainda precisam ser medidos no PC do Junior; o navegador aqui usa SwiftShader. **Não afirmar que o problema de FPS foi resolvido.**
- A arte definitiva dos interiores deve ficar na resolução original; o Junior rejeitou reduzir os PNGs.
- `scripts/qa-animal-escort.cjs` está desatualizado e falha na volta à Propriedade. A corda é conferida em `qa-horse-taming`.
- `qa-open-fields` e `qa-horse-fields` têm o caminho `executablePath:'/usr/bin/chromium'` fixo no código; para rodar aqui, use uma cópia sem esse caminho.
- `scripts/qa-farm-interior.cjs` falha (já falhava antes da preview.37): perto da porta do galinheiro aparece a dica da missão.
- Qualidade: unidades soltas no chão e recolhidas voltam como comuns.
- O Chromium daqui (SwiftShader) trava depois de alguns minutos de movimento na mesma página e não termina de carregar o Lago. Por isso `qa-horse-riding.cjs` abre um navegador por etapa.

## Testes

- `npm run check`: ok.
- `npm run build`: ok (aviso de tamanho do pacote, que já existia).
- `npm test`: **2.129 passaram, zero falhas, 245 arquivos**.
- Montaria conferida no Chromium, andando nas 4 direções principais e galopando de lado. As diagonais e a vista de costas foram conferidas em imagem montada sobre o cavalo parado.
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`.
