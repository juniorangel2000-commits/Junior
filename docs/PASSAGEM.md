# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-17
- **Por:** Claude Code
- **Continuar a partir de:** `release/v0.10.0-preview.41` (não publicado ainda).
- **Última versão publicada:** `v0.10.0-preview.40`, enviada à `main`. **Falta o Junior criar a Release** no GitHub: tag `v0.10.0-preview.40`, target `main`, pre-release. A Release da preview.39 também não foi confirmada.
- **Estado:** preview.41 em andamento. Tudo enviado, testes passando. Publicar só quando o Junior pedir.

## Feito nesta rodada

### preview.41 (Claude Code) — tudo enviado, nada publicado

- **Montaria:** não entra em interiores, na água (nem com animal na corda) nem no Acampamento (`src/riding-guard.ts`). Testada no navegador com `scripts/qa-horse-riding.cjs`.
- **Entrada da Serra** no começo da escada do Lago.
- **Tela de carregamento nova** (`src/world-loading.ts`) e **nomes dos lugares unificados** (`src/data/area-names.ts`).
- **Peças de construção:** o Ícaro separa sucata em pregos, dobradiças, molas e engrenagens; o Bento vende caro; as máquinas pedem as peças (`src/systems/scrap-sorting.ts`, `docs/construcoes/FABRICACAO.md`).
- **Quadro de pedidos** (o quadro com telhado na frente do centro comunitário, `src/request-board.ts`): pedidos de Rosa, Tobias, Helena, Amélia, Bento e Damião; um "!" aparece quando há algo para entregar.
- **Janela dos moradores refeita:**
  - serviços em cartões com chips "tenho/preciso";
  - amizade no cabeçalho;
  - conversa num palco com balão;
  - 6 conversas por morador (`src/data/npc-conversations.ts`);
  - − e + na compra.
- **Ícaro:** luminárias e aspersor viraram dois projetos.
- **Corda vegetal:** nenhum morador compra nem vende.
- **Aspersor automático** (arte do Junior) no lugar da bomba d'água: gira em loop (quadros 1–14, `scripts/pack_sprinkler.py`) e joga pingos acompanhando os braços. GIF em `docs/planejamento/aspersor-pingos.gif`.
- **Sucata no chão** usa o desenho do inventário.
- **Espadas:** arte das 4 espadas (`scripts/import_swords.py`). A espada ganhou níveis de ferro, ouro e metal negro, como as ferramentas:
  - melhorada no Bento e depois na bancada;
  - golpe 1×, 1,4×, 1,9× e 2,6×;
  - desenho e cor do golpe por nível;
  - continua sem desgaste.

### preview.40 (publicada)

- Montaria, qualidade das colheitas, painel do abrigo e fabricação (`docs/cenarios/NOTAS-0.10.0-preview.40.md`).

## Em andamento e próximo passo exato

1. **Pedido do Junior ainda não entregue:** "verifique no jogo o que falta fazer sprite e já gere um prompt para cada item com as características; se precisar, mande referências; tudo dentro de um zip". Levantamento já feito, falta montar o zip com os prompts e referências.
   - **Itens com ícone emprestado:**
     - Infusão de cogumelos e Tônico de ervas (usam o regador);
     - Curativos e Acessórios (usam a corda);
     - Refeições (usa a semente de nabo);
     - Lanterna (usa o martelo);
     - Componentes eletrônicos (usam a lâmina);
     - Roupas (usa a fibra);
     - Enxada (usa um desenho provisório).
   - **Desenhados por código no mundo:**
     - a luminária instalada (retângulos em `src/village-equipment.ts`);
     - os sobreviventes Marina e Rui na propriedade (retângulos no mesmo arquivo).
   - Conferir também a arte da bancada de fabricação do aspersor.
2. Conferir no jogo as espadas de nível:
   - a ferraria, aba "Ferramentas e reparos";
   - o golpe no Acampamento e na mina.
   As duas só foram cobertas por testes automáticos.
3. **Junior:** criar a Release da preview.40 (tag `v0.10.0-preview.40`, target `main`).
4. Pendentes antigos: porteira do chiqueiro, instalador em WebP (`sharp`), números do F3.
5. Publicar a preview.41 quando o Junior pedir.

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
- `npm test`: **2.150 passaram, zero falhas, 250 arquivos**.
- Montaria conferida no Chromium, andando nas 4 direções principais e galopando de lado. As diagonais e a vista de costas foram conferidas em imagem montada sobre o cavalo parado.
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`.
