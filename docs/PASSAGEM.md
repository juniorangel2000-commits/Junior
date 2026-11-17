# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-17
- **Por:** Claude Code
- **Continuar a partir de:** `release/v0.10.0-preview.43` (em andamento, ainda não publicada).
- **Última versão publicada:** `v0.10.0-preview.42`, na `main`, com a Release criada no GitHub.
- **Estado:** preview.43 com presentes, níveis de amizade e respostas nas conversas prontos e enviados. Falta versão do pacote e notas (só quando o Junior pedir para publicar).

## Feito nesta rodada

### preview.43 (em andamento): explorar os moradores

Pedido do Junior: "precisamos explorar os outros npcs" e "adicionar respostas diferentes do jogador, igual Stardew Valley".

- **Presentes** (`src/data/npc-gifts.ts`, `src/systems/npc-gifts.ts`, aba "Presentear" na janela do morador):
  - um presente por dia para cada um dos 10 moradores;
  - cada morador adora, gosta e não gosta de certos itens; comida da cozinha agrada a todos;
  - amizade: adora +4, gosta +2, neutro +1, não gosta −2;
  - a reação fica anotada e aparece na mochila da aba ("♥♥ adora", "✗ não gosta");
  - ferramentas, máquinas e equipamentos não podem ser dados.
- **Níveis de amizade:** À vontade (3), Amizade (8), Grande amizade (15), Melhores amigos (25). A barra do cabeçalho mostra os quatro.
- **Presentes de amizade:** ao chegar em 8, 15 e 25, o morador dá itens com uma fala própria (`FRIENDSHIP_REWARDS`). Se a mochila estiver cheia, entrega na próxima conversa.
- **Respostas do jogador** (`src/data/npc-answers.ts`):
  - no fim de cada uma das 60 conversas aparecem 3 respostas: boa (+2), neutra (+1) e ruim (−2);
  - o morador responde a cada uma;
  - a ordem muda a cada dia;
  - uma resposta por dia;
  - substituem os botões genéricos "É bom conversar com você" e "Prefiro não conversar agora".
- **Correção: moradores invisíveis (um quadradinho andando no lugar do Damião).**
  - Causa: ao sair de um cenário, as imagens dele eram liberadas um instante depois de o próximo cenário já ter conferido que existiam. O Damião, que a Vila monta, ficava sem imagem na Estrada e no Lago.
  - Agora a liberação roda no começo do próximo cenário, antes do carregamento dele (`src/scene-texture-release.ts`).
  - Teste em `tests/scene-texture-release.test.ts`. No Chromium, o Damião na Estrada voltou a ter desenho.
- **Save:** `npcSocial.players[id]` ganhou `giftDay`, `known` e `rewards`, todos opcionais e validados. Saves antigos continuam válidos.

### preview.42 (publicada)

- Fogueira montada no chão, tela de viagem com o cavalo em toda troca de cenário, aspersor sem requisitos (`docs/cenarios/NOTAS-0.10.0-preview.42.md`).

## Em andamento e próximo passo exato

Plano dos moradores, combinado com o Junior (em ordem):

1. ~~Presentes e amizade com recompensas~~ (feito) e ~~respostas nas conversas~~ (feito).
2. **História pessoal de cada morador:** uma missão em 3 partes que se abre com a amizade. O Junior vai adicionar dois cenários novos, um **pântano** e uma **ruína**, que devem ser usados nessas histórias. Exemplos: flor rara da Amélia no pântano, peça antiga do Nilo nas ruínas.
3. **Rotina na vila:** moradores andando pela praça, almoçando na pousada e fechando a loja à noite, como o Bento.
4. **Visitas à propriedade** em dias de amizade alta.

Outras ideias: ferramentas na mão (machadinha e picareta), Marina e Rui andando, desempenho (F3 no PC do Junior), porteira do chiqueiro, Actions sem Node 20.

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
- `npm test`: **2.170 passaram, zero falhas, 255 arquivos**.
- Montaria conferida no Chromium, andando nas 4 direções principais e galopando de lado. As diagonais e a vista de costas foram conferidas em imagem montada sobre o cavalo parado.
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`.
