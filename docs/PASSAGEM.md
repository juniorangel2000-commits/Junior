# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-18
- **Por:** Claude Code
- **Continuar a partir de:** `release/v0.10.0-preview.44` (criado a partir da `main`; por enquanto só os prompts do chiqueiro novo).
- **Última versão publicada:** `v0.10.0-preview.43` (commit de release enviado ao branch e à `main`). **A tag e a Release são criadas pelo Junior no GitHub** (push de tag é recusado nesta sessão).
- **Estado:** preview.43 publicada: presentes, amizade, respostas, histórias, rotina da vila, chuva sorteada, visitas à propriedade, Marina e Rui andando, velocidade dos personagens e Actions no Node 24.

> **Pedido do Junior (20/11/2026): não publicar novas versões no GitHub por enquanto** (sem `npm version`, notas de release, push para a `main` nem pedido de Release), até ele pedir de novo. Continue commitando e enviando o branch `release/v0.10.0-preview.44` normalmente.

## Feito nesta rodada

### preview.43 (publicada): explorar os moradores

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
- **Histórias pessoais** (`src/data/npc-stories.ts`, `src/systems/npc-stories.ts`, aba "História" na janela do morador):
  - 8 moradores têm uma história em 3 partes: Tobias (a ponte do avô), Helena (o caderno da vó Lúcia), Damião (o barco), Augusto (a carroça e a feira), Bento (o martelo do pai), Rosa (o jardim da praça), Celina (agasalhos para o acampamento) e Ícaro (o rádio).
  - Cada parte se abre com amizade 3, 8 e 15 e pede uma entrega.
  - Ao entregar: fala de agradecimento, recompensa (itens, Coroas e, na Helena, receitas) e +3 de amizade.
  - A aba mostra "História ✦" quando dá para entregar.
  - **Amélia e Nilo** ficam para quando o Junior adicionar o pântano e as ruínas.
  - Save: `npcStories` (partes concluídas por morador, 0–3), opcional e validado.
- **Correção: moradores invisíveis (um quadradinho andando no lugar do Damião).**
  - Causa: ao sair de um cenário, as imagens dele eram liberadas um instante depois de o próximo cenário já ter conferido que existiam. O Damião, que a Vila monta, ficava sem imagem na Estrada e no Lago.
  - Agora a liberação roda no começo do próximo cenário, antes do carregamento dele (`src/scene-texture-release.ts`).
  - Teste em `tests/scene-texture-release.test.ts`. No Chromium, o Damião na Estrada voltou a ter desenho.
- **Rotina da vila** (`src/data/village-schedule.ts`, ligada em `src/systems/merchant-routine.ts`):
  - **Folga semanal:** Augusto e Amélia (dias 5, 12, 19, 26), Nilo (4…), Tobias e Ícaro (6…), Rosa e Celina (7, 14, 21, 28). Loja fechada o dia todo; com sol passeiam pela vila (praça e frente de lojas vizinhas, 9h–18h); com chuva ficam na pousada. Bento, Damião e Helena não folgam. A janela do morador mostra "Folga hoje" e, nos outros dias, "folga nos dias …".
  - **Chuva:** o almoço é dentro da pousada da Helena em vez da praça.
  - **Noite na pousada:** 3 moradores por noite, em rodízio (`innGuests`), jantam na pousada depois de fechar a loja, até as 21h, e voltam para casa.
  - `merchantPeriod(id, hora, dia)` agora aceita o dia e devolve 'closed' na folga. Sem campo novo no save.
  - Testes em `tests/village-schedule.test.ts`.
- **Chuva** (pedido do Junior: "não parece estar chovendo" e "a chuva deve ser aleatória"):
  - `src/weather-model.ts`: o tempo agora é sorteado por dia (hash do número do dia, sem padrão semanal), com chance por estação (primavera 34%, verão 18%, outono 30%, inverno 24%). O dia 1 é sempre aberto. O mesmo dia sempre dá o mesmo tempo.
  - `src/world-rain.ts`: muito mais gotas (até 620 + 240), espalhadas de forma uniforme, e respingos no chão. Com "reduzir movimento" (efeitos de animação desligados no Windows) a chuva antes sumia; agora cai mais devagar. O Junior aprovou o visual fino original, só com mais gotas.
  - A luz em dia de chuva ficou um pouco mais fechada (`src/lighting-model.ts`).
- **Visitas à propriedade** (`src/systems/property-visits.ts`, `src/property-visit.ts`, ligado em `ValleyScene`):
  - Um morador com amizade 8 ou mais, no dia de folga e com tempo aberto, visita de manhã, depois de o jogador dormir (pedido do Junior): às 08:00 sai da entrada da estrada da vila e anda até a porta da casa (caminho com A*, desviando das construções; se não houver caminho, aparece na porta depois de 6 s). Às 10:15 volta pela estrada e some na entrada; às 11:00 está de novo na vila. Chance de 65% por dia; no máximo um por dia. Só os 7 que têm folga (Bento, Damião e Helena não visitam).
  - Aviso ao aparecer, balão "Oi! Vim fazer uma visita.", tecla E para conversar. A janela é a mesma da vila (conversa, presentes, história).
  - Traz um presente (botão "Receber presente", uma vez por dia, +1 de amizade) e comenta a propriedade (muda quando há 6 ou mais plantações).
  - Durante a visita, ele some da vila e a janela dele lá diz "Visitando a sua propriedade".
  - As imagens do visitante só carregam no dia da visita, depois que as imagens-fonte terminam (para não repetir o quadradinho do Damião).
  - Save: `propertyVisitDay` (opcional, validado). Testes em `tests/property-visits.test.ts`. Conferido no Chromium com o Ícaro: aparece, conversa e entrega 2 molas.
- **Marina e Rui andando** (`src/systems/property-survivors.ts`, `src/property-survivors-view.ts`, ligado em `ValleyScene`):
  - Eles moram na propriedade (acolhidos pelo serviço da Helena) e antes ficavam parados perto da casa (o desenho estava em `village-equipment.ts`, removido de lá).
  - Rotina pela hora: Marina cuida das plantações, da horta e busca água; Rui trabalha na bancada (se houver), no poço e na horta. Almoço e fim de tarde em frente de casa; às 20:00 entram em casa e voltam às 07:00. Com chuva ficam na varanda. Sem plantação ou bancada, vão à horta.
  - Arte: só a pose parada em 4 direções (sul, norte, leste, oeste, todas carregadas agora); andando, um sobe e desce de até 2 px a cada passo. Exibidos em 64 × 64 (antes 48 × 64, espremidos).
  - Balão com a tarefa ao chegar perto. Destino ajustado ao centro do ladrilho livre mais próximo (o poço ocupa o ladrilho pedido).
  - Sem campo novo no save. Testes em `tests/property-survivors.test.ts`; conferido no Chromium andando de casa até a horta.
- **Actions no Node 24:** `actions/checkout@v5`, `actions/setup-node@v5` e `actions/upload-artifact@v6` nos dois workflows (a v5 do upload-artifact ainda usava Node 20). Conferido: a execução da preview.43 passou.
- **Velocidade dos personagens** (pedido do Junior: "deixe a velocidade como a do jogador"): `src/data/npc-speed.ts` (`NPC_WALK_SPEED = 84`, igual a `PLAYER_SPEED`) para moradores na vila e nas lojas, guia, Bento, Damião, sobreviventes e visitante. Testes de passo máximo por quadro passaram a usar 8,4 px. Teste em `tests/player-running.test.ts`.
- **Save:** `npcSocial.players[id]` ganhou `giftDay`, `known` e `rewards`, todos opcionais e validados. Saves antigos continuam válidos.

### preview.42 (publicada)

- Fogueira montada no chão, tela de viagem com o cavalo em toda troca de cenário, aspersor sem requisitos (`docs/cenarios/NOTAS-0.10.0-preview.42.md`).

## Em andamento e próximo passo exato

Plano dos moradores, combinado com o Junior (em ordem):

1. ~~Presentes e amizade com recompensas~~ (feito) e ~~respostas nas conversas~~ (feito).
2. ~~Histórias pessoais~~ (feito para 8 moradores). **Falta:** Amélia (flor rara no **pântano**) e Nilo (peça antiga nas **ruínas**), quando o Junior adicionar esses cenários. Pode também usar os cenários novos em partes extras das outras histórias.
3. ~~Rotina na vila~~ (feito: folga, chuva, noite na pousada; trabalho, almoço e visitas já existiam). Ainda não conferida andando no navegador, só nos testes.
4. ~~Visitas à propriedade~~ (feito). Ideias para depois: Bento/Damião/Helena visitarem à noite, visitas no aniversário.

**Próximo passo:** a Release da preview.43 saiu com sucesso (execução 44370859861, já com as Actions no Node 24): instalador, executável sem instalação, LEIA e SHA256SUMS. Na preview.44: chiqueiro novo **em espera** (o ChatGPT não gerou uma arte parecida; o Junior vai pedir depois. Há uma montagem aprovada por ele: chiqueiro atual com a folha aberta de `docs/arte-recebida/lote01-fazenda/porteira/porteira_aberta_90graus.png` recortada em x 74–186, y 28–216, redimensionada para 176 px de altura e colada em (318, 775) de `pigsty.png`, com o vão preenchido como hoje; prompts na seção 0b de `docs/planejamento/ARTE-PENDENTE.md`), números do F3 do Junior e histórias da Amélia e do Nilo quando houver pântano e ruínas.

Outras ideias: desempenho (F3 no PC do Junior), porteira do chiqueiro.

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
- `npm run build`: ok na preview.43 (aviso de tamanho do pacote, que já existia).
- `npm test`: **2.192 passaram, zero falhas, 259 arquivos**.
- Montaria conferida no Chromium, andando nas 4 direções principais e galopando de lado. As diagonais e a vista de costas foram conferidas em imagem montada sobre o cavalo parado.
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`.
