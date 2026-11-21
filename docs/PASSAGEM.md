# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-21
- **Por:** Claude Code
- **Continuar a partir de:** `release/v0.10.0-preview.45` (criado da `main`, que é a preview.44 publicada pelo Codex).
- **Última versão publicada:** `v0.10.0-preview.44` (tag e Release no GitHub; [notas](cenarios/NOTAS-0.10.0-preview.44.md)).
- **Estado:** preview.45 em andamento, ainda não publicada. Tem só a compressão das imagens em WebP no build.

## Feito nesta rodada

- **Imagens em WebP sem perda no build** (pedido do Junior: "jogo mais leve"):
  - `scripts/compress-distribution.cjs` roda no fim de `npm run build`, só sobre `dist/`. Os originais em `public/` não mudam.
  - Cada PNG vira WebP sem perda **mantendo o nome `.png`**: o navegador e o Electron decodificam pela assinatura do arquivo, não pela extensão, então código, manifestos e CSS continuam iguais. Só é trocado se ficar menor; PNG de 16 bits fica como está.
  - Diferença de pixels: só a cor escondida de pixels 100% transparentes (invisível; o navegador a zera ao desenhar).
  - Resultado: imagens de 388,5 MiB para 242,3 MiB; `dist/` de cerca de 450 MB para 305 MB. Leva uns 2 minutos a mais no build.
  - Conferido: Chromium com a build servida por `vite preview` (título, propriedade, mochila, mapa, sem erros) e Electron pelo protocolo `chuva://`, igual a `desktop/main.cjs` (mesmos pixels visíveis dos originais).
  - `sharp` 0.34 como dependência de desenvolvimento; o `package-lock` tem o binário `@img/sharp-win32-x64` para o workflow do Windows.
  - Testes em `tests/compress-distribution.test.ts`.
- Antes disso, na preview.44 (Codex): caminhada e parada de Marina e Rui em 8 direções, montaria masculina, contato das ferramentas, porteira do chiqueiro aberta a 90 graus e trajeto a pé dos visitantes.

## Em andamento e próximo passo exato

- **Conferir o workflow do Windows na próxima publicação**: é a primeira vez que o build roda o `sharp` no Windows. Ver se o passo "Imagens: … comprimidos em WebP" aparece no log e se o instalador ficou menor que o da preview.44 (~520 MB).
- Publicar a preview.45 só quando o Junior disser "publicar".

## Pendências e ideias para depois

- **iPhone (conversa com o Junior, sem decisão):** o jogo poderia virar app para iPhone, offline, com Capacitor e build no GitHub Actions em máquina macOS; instalação gratuita pelo Sideloadly (7 dias) ou conta Apple (US$ 99/ano). Falta: controles de toque e de controle Bluetooth, telas para celular, peso (a compressão desta rodada ajuda) e saves em arquivo do app. App Store fica para depois.
- **Chiqueiro novo:** o ChatGPT não gerou arte parecida; o Junior vai pedir depois. Prompts na seção 0b de `docs/planejamento/ARTE-PENDENTE.md`.
- **Peças de construção:** pregos, dobradiça, engrenagem, molas e óleo têm ícone, mas não existem como item.
- Histórias de Amélia e Nilo aguardam os cenários de pântano e ruínas. Planos de calendário, visitas, animais e receitas estão em `docs/planejamento/`.
- Inclinação do tronco do fazendeiro montado no galope pode ser revista, se pedida.

## Problemas conhecidos

- Travamentos nos Campos ainda precisam de dados de F3 no PC do Junior. O Chromium de teste usa SwiftShader.
- Interiores dos animais não guardam a posição de cada animal. Itens recolhidos do chão voltam à qualidade comum.
- `qa-animal-escort.cjs` está desatualizado na volta. `qa-farm-interior.cjs` tem falha antiga na dica da porta.
- Preservar os originais de arte em resolução nativa (a compressão é só na distribuição e sem perda). O stash antigo da preview.34 está desatualizado.
- A build de produção não exporta `game` para scripts; QAs que mexem no estado usam o Vite de desenvolvimento.

## Testes

- `npm ci`, `npm run check`, **2.207 testes em 264 arquivos** e `npm run build` (com a compressão) passaram em `release/v0.10.0-preview.45`.
- Para os QAs: Vite em `127.0.0.1:5190`; para a build compilada, `npx vite preview --port 4190`.
