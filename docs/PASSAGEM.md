# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-17
- **Por:** Claude Code
- **Continuar a partir de:** `main` (preview.42). Próxima rodada: criar `release/v0.10.0-preview.43` a partir da `main`.
- **Última versão publicada:** `v0.10.0-preview.42`, enviada à `main`. **Falta o Junior criar a Release** no GitHub (tag `v0.10.0-preview.42`, target `main`, pre-release), e as da preview.40 e 41 se ainda não existirem.
- **Estado:** preview.42 pronta, com versão do pacote, `NOTAS-0.10.0-preview.42.md` e `LEIA-0.10.0-preview.42.md`.

## Feito nesta rodada

### preview.42 (publicada)

- **Fogueira montada no chão:** usar a fogueira portátil monta ela acesa na frente do personagem, em qualquer cenário ao ar livre (`src/systems/placed-campfires.ts`, `src/campfire-controller.ts`).
  - Fica salva (`campfires` no save, opcional, com validação). Máximo de 3 por lugar.
  - Perto dela aparece "E · cozinhar"; o caderno tem o botão "Apagar e recolher a fogueira".
- **Aspersor sem requisitos:** instala em qualquer lugar da propriedade, sem precisar de água perto.
- **Máquinas:** mensagem de instalação com o gênero certo (tear, moinho, forno, barril).
- **Colmeia vazia:** usar fora do lugar explica que ela vai perto de um ipê florido nos Campos Abertos.
- **Tela de carregamento em toda troca de cenário** (`src/travel-loading.ts`):
  - é a tela do cavalo, numa camada por cima do jogo;
  - aparece ao ir para Floresta, Campos, Vila, Estrada, Lago, Platô, Acampamento, Mina e expedições, e na volta à propriedade;
  - fica no mínimo 0,9 s, e o cenário fica pausado por baixo;
  - não aparece ao entrar em casa.
  - O cavalo e o cenário de fundo agora animam mesmo com "menos animação" ligado no Windows, que era a causa provável de o cavalo ficar parado. O desenho do cavalo é lido uma vez só.
  - Conferido no Chromium: na ida para a Vila foram 17 amostras e 17 quadros diferentes, e a tela saiu sozinha ao chegar.

### preview.41 (publicada)

- Quadro de pedidos, janela dos moradores refeita, aspersor, espadas e ferramentas novas (`docs/cenarios/NOTAS-0.10.0-preview.41.md`).

## Em andamento e próximo passo exato

1. **Junior:** criar a Release da preview.42 e testar no PC a fogueira no chão e a tela de carregamento ao trocar de cenário.
2. Ideias para depois (o Junior escolhe):
   - **Ferramentas na mão:** refazer a machadinha e a picareta durante o uso (`tools/hatchet`, `tools/pickaxe`).
   - **Marina e Rui andando** pela propriedade (`characters/survivors/`).
   - **Desempenho:** números do F3 no PC do Junior; instalador em WebP (`sharp`, precisa de aprovação).
   - **Porteira do chiqueiro** do lote 01.
   - **Ações do GitHub:** atualizar para as versões que não usam mais o Node 20.

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
- `npm test`: **2.160 passaram, zero falhas**.
- Montaria conferida no Chromium, andando nas 4 direções principais e galopando de lado. As diagonais e a vista de costas foram conferidas em imagem montada sobre o cavalo parado.
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`.
