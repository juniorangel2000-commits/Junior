# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-14
- **Por:** Claude Code
- **Continuar a partir de:** `main` / tag `v0.10.0-preview.34` (`f2ec90c`). Próxima rodada: branch `release/v0.10.0-preview.35`.
- **Última versão publicada:** `v0.10.0-preview.34`, Release pública com instalador e portátil para Windows x64: https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.10.0-preview.34
- **Estado:** preview.34 publicada. O workflow `43547628017` passou em todas as etapas e anexou o instalador, o portátil, o `SHA256SUMS.txt` e o `LEIA.md`.

## Feito nesta rodada

- **Publicação da preview.34** (notas em `docs/cenarios/NOTAS-0.10.0-preview.34.md`): calendário com estações e ano, cultivo por dias regados, 19 plantas com arte, ipês e madeira nobre, machadinha de corpo inteiro, cavalo nos Campos, cesta da Helena, doma completa e estábulo do Codex.
- Missão "Primeira colheita": agora pede "Plantar uma semente da estação" e "Colher a primeira plantação", porque o nabo só cresce na Primavera.
- Doma conferida do dia 1 até "Alojar Trovão" (`scripts/qa-horse-taming.cjs`); cadeia até a cesta conferida em `scripts/qa-harvest-chain.cjs`.
- **Plano aprovado** de animais, máquinas e cozinha em `docs/planejamento/ANIMAIS-E-RECEITAS.md`:
  - ovelha e cabra completas, porco (come sobras da horta e produz esterco), pato e abelhas (colmeia comprada na Vila, enxame nos ipês a cada 5 dias);
  - interiores das construções de animais, com "Recolher os animais";
  - máquinas colocadas como a cesta, dentro e fora das construções, com projetos aprendidos com Tobias, Bento e Ícaro;
  - cozinha com fogão a lenha, forno de barro e fogueira, receitas da Helena e escondidas, caderno, efeitos, pedidos e qualidade.

## Em andamento e próximo passo exato

- **Como publicar a partir do Claude Code:** sessões do Claude Code na nuvem **não podem criar tags** (o git e a API do GitHub respondem 403 a tags). O caminho é:
  1. O Claude Code envia a versão para a `main` (versão, `NOTAS-` e `LEIA-<versão>.md`, que o workflow exige).
  2. O Junior cria a Release pela página do GitHub: tag nova `v<versão>` e target `main`, marcando pre-release.
  3. A tag dispara o workflow, que agora aceita a Release já existente: atualiza título e notas e anexa os arquivos.
  - Plano B: em Actions → "Run workflow", escolher a tag.
  - O Codex continua podendo criar e enviar tags normalmente.
- Próxima rodada (`release/v0.10.0-preview.35`), seguindo a ordem de `docs/planejamento/ANIMAIS-E-RECEITAS.md`:
  1. Interiores do galinheiro e do curral, com a opção "Recolher os animais".
  2. Ovos e leite (`docs/construcoes/PRODUCAO-ANIMAL-PLANO.md`).
  3. Ovelha e cabra com aprisco.
  4. Máquinas.
  5. Cozinha.
  6. Porco, pato e abelhas.
- A arte (animais animados, aprisco, chiqueiro, colmeia, interiores, máquinas e uns 40 ícones) fica com o Codex, com pacotes gerados pelo Junior ou com um plugin de geração de sprites, se o Junior instalar.

## Pendências e ideias para depois

- Para o Junior confirmar: o estábulo é exigido para a **corda**, não para o cavalo comer (`OpenFieldsWorld.basketFor` e `settleHorseTaming`).
- Chamar o cavalo de longe, montaria (sela) e quadros de deitar, descansar e levantar.
- Sementes especiais para o ano todo; clima, peixes por estação, árvores frutíferas e estufa (etapa 6 de cultivos).
- Preços dos produtos animais e dos pratos, a definir jogando.
- Variedade visual dos Campos, caça e editor F2 pendentes; preservar os ids das moitas.

## Problemas conhecidos

- Aviso do Vite sobre o tamanho do pacote JavaScript (já existia); não impede o build.
- Se o jogador ficar perto da cesta o dia todo nas fases iniciais e sair do cenário só no dia seguinte, a cesta do dia anterior é creditada ao voltar. Efeito pequeno, documentado.
- Repositório: `https://github.com/juniorangel2000-commits/Junior.git`.

## Testes

- `npm run check`: ok.
- `npm test`: **1.929 passaram, zero falhas, 218 arquivos**.
- `npm run build`: ok (aviso de tamanho do pacote).
- Chromium: `scripts/qa-horse-taming.cjs` (doma completa com estábulo) e `scripts/qa-harvest-chain.cjs` (cadeia até a cesta) passaram, sem erros de JavaScript.
