# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-22
- **Por:** Codex
- **Continuar a partir de:** `release/v0.10.0-preview.45`, HEAD.
- **Última versão publicada:** `v0.10.0-preview.44`, commit `cc8171a`.
- **Estado:** a Costa das Marés fica ao sul dos Campos Abertos. O rio da Propriedade atravessa os Campos e chega ao mar por uma foz sinuosa. A linha principal da Estação curva para o sul antes da divisa com as Ruínas. A preview.45 segue em desenvolvimento.

## Feito nesta rodada

- `944dd23` integrou a curva pedida pelo Junior às alterações do Claude entre `4744354` e `d699f06`. A faixa de lastro e os trilhos usam a mesma geometria em `src/data/railway.ts` e `src/railway-world.ts`. A curva termina entre as árvores ao sul. A travessia de madeira, a plataforma e a estrada para as Ruínas continuam acessíveis.
- A Propriedade e os Campos têm chegada alinhada em x=816. Nos Campos, as duas pontes de madeira usam as peças e as regras de passagem da Propriedade. A saída em x=912 leva à costa. `fieldsPlayerSafe` aceita a posição salva nadando. Na transição foram mantidos os IDs dos recursos preservados e a migração dos cortes que caíram no rio.
- O mar ocupa o sul e parte do leste da Costa. O píer conserva 460 × 112 px e entrada por terra. Os materiais do jogo, sprites separados, animações da água, inspeções, F2 e dados opcionais de save continuam integrados.
- `35c0f88` suavizou as curvas da foz. O contorno de água em `src/data/coast.ts` guia a margem desenhada, o nado, a espuma e a distribuição da vegetação. A largura na divisa continua compatível com o rio dos Campos.
- A pesca funciona no rio dos Campos com vara ou rede, seguindo a mesma exigência de isca e orientação do Damião. A Costa já usa a pesca compartilhada de praias e rios. Os peixes raros continuam exclusivos do lago.
- O Pântano tem lagoas internas e a passarela sobre a lagoa central. O degradê nas divisas está em `src/data/edge-blend.ts` e `src/edge-blend.ts`. As posições e passagens externas estão em [Mapa do vale](cenarios/MAPA-DO-VALE.md).
- A arte panorâmica, o atlas com os cenários externos, Mina Antiga, Galerias, duas dungeons e quatro interiores, e os detalhes do píer e da Estação ficam em `/workspace/afterrain-costa/`.

## Em andamento e próximo passo exato

- A estrada leste da Estação ainda aguarda um destino. Um trecho de asfalto já fica disponível até o limite do cenário.
- A história da sala de espera depende dos textos e da recompensa definidos pelo Junior. A Costa pode ganhar conchas coletáveis e uma história ligada ao barco.
- Ligar a íris azul do Pântano à história da Amélia em `src/data/npc-stories.ts`. A história do Nilo pode reaproveitar o selo das Ruínas.
- Na próxima publicação, verificar a compressão com `sharp` no Windows e comparar o instalador com os 538.845.962 bytes da preview.44.

## Pendências e ideias para depois

- [Lista de pendências](planejamento/O-QUE-FALTA.md).
- Pomar Abandonado segue como proposta de cenário.
- Chuva regando canteiros, peixes por estação e tela do calendário ficam depois dos cenários.
- Arte nova do chiqueiro e possível versão para iPhone seguem em planejamento.

## Problemas conhecidos

- Desempenho dos Campos Abertos ainda precisa de uma medição com F3 no PC do Junior.
- Interiores dos animais não guardam a posição individual. Itens recolhidos do chão voltam à qualidade comum.
- `qa-inventory.cjs` quebra ao iniciar uma partida. `qa-animal-escort.cjs` está desatualizado na volta. `qa-farm-interior.cjs` tem uma falha antiga na dica da porta.
- Preserve as fontes de arte em resolução nativa. A conversão WebP se aplica à distribuição.

## Testes

- O teste de geometria confere o encaixe do lastro com a curva, a reta ao sul e o fim da linha dentro da Estação.
- A suíte da Costa confere a continuidade da foz, proteção dos acessos, travessia e a compatibilidade do save.
- No Chromium, foram conferidas a ida e a volta Propriedade ↔ Campos ↔ Costa e a retomada de uma partida na Costa. A foz revisada foi conferida com as colisões do píer e capturas ao meio-dia.
- `npm run check` passou. `npm test` passou com 2.249 testes em 270 arquivos na versão com a foz revisada.
