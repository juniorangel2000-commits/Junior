# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-22
- **Por:** Claude (terminando o Pomar que o Codex começou; os créditos do Codex acabaram)
- **Continuar a partir de:** `release/v0.10.0-preview.47`, HEAD (em desenvolvimento, não publicada).
- **Última versão publicada:** `v0.10.0-preview.46`, com instalador gerado (438.633.617 bytes, contra 538.845.962 da preview.44: a compressão WebP funcionou no Windows). Tem o mesmo conteúdo da preview.45. A tag da preview.45 existe, mas o processo do Windows falhou: faltava `docs/cenarios/LEIA-0.10.0-preview.45.md`.
- **Atenção ao publicar:** além de `NOTAS-<versão>.md`, crie `docs/cenarios/LEIA-<versão>.md`. O processo do Windows copia esse arquivo para a Release e falha se ele não existir.
- **Estado:**
  - A Costa das Marés fica ao sul dos Campos Abertos.
  - O rio da Propriedade atravessa os Campos e chega ao mar por uma foz sinuosa.
  - O Pântano tem só lagos, sem rio.
  - Todas as divisas entre mapas externos usam o mesmo chão compartilhado da divisa Floresta ↔ Propriedade.
  - A linha principal da Estação curva para o sul antes da divisa com as Ruínas.
  - O Pomar Abandonado fica a leste da Vila, abaixo das Ruínas, e já está jogável.
  - A preview.45 segue em desenvolvimento.

## Feito nesta rodada

- **Festivais da vila** (`src/systems/festivals.ts`, `src/festival-decor.ts`), um por estação:

  | Festival | Data e local | Anfitrião e concurso |
  | --- | --- | --- |
  | Feira das Sementes | Primavera 14, praça, 10h–18h | Rosa, concurso de flores (girassol, camomila ou íris) |
  | Festa da Praia | Verão 14, Costa das Marés, 15h–21h | Damião, 3 caranguejos, com fogueira e a vila em roda (`BEACH_FIRE`, `BEACH_RING` em `npc-outings.ts`) |
  | Festa da Colheita | Outono 21, praça, 10h–19h | Augusto, 5 de uma colheita |
  | Noite das Lanternas | Inverno 21, praça, 17h–23h | Helena, troca de presentes com 1 prato; +1 de amizade com todos |

  - As lojas param, e até quem está de folga vai à festa. Na vila, os moradores ficam no período de intervalo e se juntam na praça.
  - O concurso aparece na conversa com o anfitrião, uma vez por ano (`festivalDone` no save, campo opcional e validado).
  - A praça ganha bandeirinhas, barracas e lanternas, ainda provisórias.
  - A HUD mostra o festival do dia ao lado do ano. Passando o mouse na data, aparece o próximo festival.
  - Foram conferidas no Chromium a Feira (prêmio de 200 coroas) e a Festa da Praia (prêmio de 300).

- **Atividades nos cenários novos** (preview.47, em desenvolvimento):
  - **Costa:** 12 conchas na areia (`src/systems/forage.ts`) voltam em 2 dias, e a Celina compra. Com a rede na mochila, dá para pegar caranguejo: ele só se assusta bem de perto (`fleeScale`), foge devagar e o alcance é de 150 px. O Damião compra.
  - **Pântano:** as três íris azuis podem ser colhidas e voltam em 7 dias.
  - **Cozinha:** suco de laranja, doce de pera, torta de maçã (no forno) e caranguejada, ensinados pela Helena e vendidos na pousada.
  - **Histórias:** Amélia ("A íris da vó Dita") e Nilo ("A marca das três pontas", com o cofre da bilheteria da Estação). Agora os dez moradores têm história.
  - **Ícones provisórios:** concha, íris e caranguejo vêm das artes do jogo ou do desenho dos bichos. Os pratos novos são pratos existentes com a cor trocada.
  - **Save:** ganhou `forageHarvest`, campo opcional e validado. Os itens novos entram em saves antigos pela migração da mochila.

- **Bichos dos cenários com sprites provisórios** (`src/data/critters.ts`, `src/critters.ts`). O ChatGPT não conseguiu gerar as artes, então o desenho é pixel art feito no código. Cada quadro é uma grade de letras, com contorno e luz de cima automáticos, e o segundo quadro do andar mexe as pernas sozinho.
  - **Espécies (14):** o vaga-lume e o gato vira-lata saíram a pedido do Junior; a noite já tem vaga-lumes.

    | Cenário | Bichos |
    | --- | --- |
    | Costa | caranguejo, gaivota, tartaruga à noite |
    | Pomar | esquilo, ouriço |
    | Pântano | garça |
    | Ruínas | morcego ao anoitecer, lagartixa, coruja no arco |
    | Estação | pombo, rato |
    | Campos | borboletas, perdiz, raposa ao anoitecer |

  - **Comportamentos:**
    - andam e fogem correndo;
    - o caranguejo corre para a água e some;
    - as aves levantam voo;
    - borboletas e morcegos voam à toa;
    - a coruja fica parada e vira para o jogador;
    - o ouriço vira bolinha.
  - Os que fogem voltam depois de 12 a 30 s, longe do jogador.
  - São só decoração: não bloqueiam ninguém e não vão para o save.
  - **Para trocar pela arte definitiva:** o pacote de prompts está com o Junior, com folhas de 8 direções e células de 224 px. Basta substituir `art` e `special` pela folha de sprites; o comportamento não muda.

- **Moradores nos cenários novos** (`src/systems/npc-outings.ts`, `src/npc-outing-visit.ts`):
  - Rosa vai ao Pomar, Amélia ao Pântano, Nilo às Ruínas e Ícaro à Estação, na plataforma. Damião (à tarde, depois do lago) e Celina vão à Costa. Tobias vai aos Campos, perto dos ipês.
  - Cada um sai 2 dias por semana, fora da folga e sem chuva, e fica no ponto dele trabalhando. Quando o jogador chega perto, vira para ele.
  - A conversa usa o painel da vila: amizade, presentes, história e uma fala do lugar. O presente do dia dá +1 de amizade, e o save guarda `npcOutingGifts`, campo opcional e validado.
  - Na vila, a loja fica fechada nesse horário, e a placa e a janela do morador dizem onde ele está e quando volta.
  - Os testes de rotina da vila passaram a usar um dia sem saídas (`tests/helpers/quiet-day.ts`).

- **Pomar Abandonado** (Codex: `19bcf29`, `84d8360`; Claude terminou):
  - **Onde fica:** a leste da Vila. A saída é a borda leste da Vila em (94, 62), e a chegada é a borda oeste do Pomar em (1, 56). No vale, o Pomar fica em (6144, 192), logo abaixo das Ruínas.
  - **O que tem:** trilhas de terra, macieiras, pereiras, laranjeiras e frutíferas secas, prensa antiga, galpão, lagoa de irrigação e caixotes (`src/data/orchard.ts`, `src/orchard-world.ts`).
  - **Frutas:** caídas no chão, recolhidas com E. Voltam em 3 dias (`orchardHarvest` no save) e Rosa compra na Vila.
  - **F2 e divisas:** o Pomar funciona no F2, e as divisas com a Vila e as Ruínas usam o chão compartilhado.
  - **Acabamento do Claude:**
    - as frutas caídas ficaram menores, a pedido do Junior (de 17 para 13 px);
    - perto da saída leste da Vila, a dica mostra "Pomar Abandonado ao leste";
    - Organizar a mochila agora põe maçã, pera e laranja em comida;
    - o Pomar entrou no mapa do vale.

- **Mapa do vale** ([documento](cenarios/MAPA-DO-VALE.md)): todos os mapas externos montados na posição em que as saídas se encontram.
  - A posição de cada mapa e as divisas estão em `src/data/valley-seams.ts` (`VALLEY_LAYOUT`, `VALLEY_SEAMS`).
  - A imagem é gerada com o `captureMap()` de cada cena e 160 px de margem, para as copas da borda cruzarem a divisa.
- **Campos alinhados à Propriedade** (`fa38fbb`): a chegada norte fica em x=816, a mesma coluna da saída sul da Propriedade.
  - O rio entra com a posição e a largura do rio da Propriedade, e a ponte norte fica na trilha principal.
  - A geração antiga (`ORIGINAL_TRAILS`, `ORIGINAL_ENTRY_X`) mantém ids e posições dos saves. O que caiu no rio ou nas trilhas novas está em `FIELDS_RETIRED_PATCHES`, e `migrateSave` apaga só esses cortes.
  - `fieldsPlayerSafe` aceita a posição salva nadando.
- **Pântano só com lagos** (`d699f06`, a pedido do Junior):
  - O canal virou a lagoa da passarela, e há uma lagoa nova ao sul. Nenhuma água encosta nas bordas.
  - O jacaré `swamp-caiman-49-29` passou para (49, 45).
  - Edições F2 antigas que apontem para esse id ou para nenúfares do canal deixam de aparecer, sem invalidar o save.
- **Chão compartilhado nas divisas** (`dee10f8`):
  - **Por quê:** o Junior comparou com a divisa Floresta ↔ Propriedade ("parecem continuação") e achou as outras "cortadas". O degradê de cor de `d699f06` saiu.
  - **Como:** `drawValleySeams(scene, área, água)` aplica a técnica de `map-seam-ground` em todas as divisas. Numa faixa de 256 px, o chão vira uma mistura das texturas de floresta, grama, prado e musgo em coordenadas do vale, idêntica dos dois lados da linha. Perto do Pântano, a paleta `marsh` puxa para musgo e lama.
  - **Ficam de fora:** a água de cada mapa e os trechos `open`, onde trilha, estrada ou rio atravessam.
  - **Camada:** a faixa fica em −89, acima do terreno pintado no F2 (−90) e abaixo de objetos e personagens. No Platô, fica em −69.
- **Do Codex, em paralelo** (`626c962`, `944dd23`, `35c0f88`, `67508cb`, juntados em `d8d4e2d`, `a0d8498` e `7f72c4b`):
  - A linha principal da Estação curva para o sul e termina entre as árvores. Lastro e trilhos usam a mesma geometria em `src/data/railway.ts` e `src/railway-world.ts`, e a travessia, a plataforma e a estrada para as Ruínas continuam acessíveis.
  - A foz da Costa foi arredondada (`src/data/coast.ts`). Na divisa com os Campos, o rio continua em x≈461–571, contra 459–570 nos Campos, dentro do trecho aberto da divisa.
  - Os Campos ganharam pesca no rio, com vara ou rede, seguindo a exigência de isca do Damião. A Costa usa a pesca compartilhada de praias e rios, e os peixes raros continuam exclusivos do lago.
  - A arte panorâmica, o atlas com Mina, Galerias, dungeons e interiores, e os detalhes do píer e da Estação ficam em `/workspace/afterrain-costa/`, na máquina do Codex.

## Em andamento e próximo passo exato

- O Junior deve conferir no jogo as divisas e a chegada nova dos Campos, logo abaixo da saída sul da Propriedade.
- A estrada leste da Estação ainda aguarda um destino.
- A história da sala de espera depende dos textos e da recompensa definidos pelo Junior. A Costa pode ganhar conchas coletáveis e uma história ligada ao barco.
- Ligar a íris azul do Pântano à história da Amélia em `src/data/npc-stories.ts`. A história do Nilo pode reaproveitar o selo das Ruínas.
- Claude e Codex enviaram commits ao mesmo branch ao mesmo tempo, e houve três merges seguidos. Antes de começar, faça `git fetch` e confira o HEAD remoto.

## Pendências e ideias para depois

- [Lista de pendências](planejamento/O-QUE-FALTA.md).
- Chuva regando canteiros, peixes por estação e tela do calendário ficam depois dos cenários.
- Arte nova do chiqueiro e possível versão para iPhone seguem em planejamento.

## Problemas conhecidos

- O desempenho dos Campos Abertos ainda precisa de medição com F3 no PC do Junior. No Chromium de teste, com SwiftShader, os Campos rodam a cerca de 11 FPS.
- Interiores dos animais não guardam a posição individual. Itens recolhidos do chão voltam à qualidade comum.
- `qa-inventory.cjs` quebra ao iniciar uma partida. `qa-animal-escort.cjs` está desatualizado na volta. `qa-farm-interior.cjs` tem uma falha antiga na dica da porta.
- Preserve as fontes de arte em resolução nativa. A conversão WebP se aplica à distribuição.

## Testes

- Bichos: `tests/critters.test.ts` confere desenho, paleta e lugar de cada espécie no seu cenário. No Chromium foram vistos caranguejo, pombo, garça, raposa, coruja e esquilo, cada um reagindo como esperado, sem erros.
- Saídas dos moradores: 2.258 testes. No Chromium, os sete moradores foram encontrados no cenário, conversaram e deram o presente, sem erros de página.
- Final, com o Pomar: `npm run check` passou e `npm test` passou com 2.254 testes em 271 arquivos.
- No Chromium, com o Pomar:
  - Vila → Pomar, com chegada em (4,5; 56,5);
  - a fruta foi recolhida com E, e a segunda tentativa foi recusada;
  - o save no Pomar foi recarregado e voltou dentro dele;
  - a volta chegou na saída leste da Vila;
  - zero erros de página.
- `tests/valley-seams.test.ts` confere:
  - que cada divisa fica na borda comum dos dois mapas;
  - que a mistura é inteira junto à linha e zero nas trilhas e rios;
  - que o Pântano não tem água nas bordas.
- `tests/coast.test.ts` e `tests/open-fields.test.ts` conferem a chegada alinhada, a continuidade do rio na borda, as pontes e a migração dos cortes. O teste de geometria da Estação confere a curva.
- No Chromium foram conferidos:
  - Propriedade → Campos, com chegada em (816, 140), a ponte norte atravessada a pé e a volta;
  - Campos ↔ Costa e a retomada na Costa;
  - a foz revisada, nas capturas do Codex;
  - zero erros de página.
