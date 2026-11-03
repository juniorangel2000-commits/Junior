# Fase 7 — expedições conjuntas com Bento

O jogador pode combinar uma viagem na ferraria ou se juntar ao Bento durante o trajeto. Bento guia os mapas externos; na Mina Antiga e nas galerias o jogador pode assumir a liderança. A companhia é opcional e termina sem retirar o jogador da exploração.

## Como usar

- Na conversa da ferraria, abrir **Expedição à mina** e combinar a próxima viagem. O convite fica salvo, pode ser cancelado e usa a saída semanal já existente; não cria viagens ou mineração ilimitadas.
- Durante a viagem, chegar perto do Bento e pressionar **E**. O mesmo painel permite pedir para acompanhá-lo.
- **Me acompanhe:** disponível dentro da mina. O jogador escolhe o caminho e Bento segue até uma posição próxima, acessível e segura.
- **Mostre o caminho:** devolve a liderança ao Bento, que retoma a rota sugerida para as galerias. Na estrada, ele continua sendo o guia.
- **Espere aqui:** mantém a posição exata. Perigos, separação prolongada ou o horário de retorno podem encerrar a espera.
- **Vamos voltar:** Bento usa o caminho de volta e os portais existentes. O jogador pode acompanhá-lo ou permanecer na mina.
- **Vou continuar por conta própria:** encerra a companhia e Bento inicia o retorno.

O painel segue os materiais e cores da HUD, mostra o estado da companhia e apresenta apenas ações contextuais. Não altera itens, receitas, preços, missões ou o inventário do jogador.

## Caminhada e separação

A viagem mantém o mesmo Bento salvo na fase 5. Nenhum comando reposiciona o jogador ou o NPC. A navegação e os passos usam `bento-navigation`, a busca incremental existente e `advanceWorldRoute`, com as colisões reais dos mapas.

Bento espera se o jogador fica para trás, inclusive do outro lado de um portal. Ao reencontrar o companheiro, retoma a caminhada. Dentro da mina, tenta alcançar o jogador por uma rota válida. Se o alvo não é acessível, espera em local seguro; separação prolongada encerra a companhia e inicia o retorno. A passagem entre recepção e galerias continua sendo feita pela porta central real.

O convite aceito se concretiza na próxima saída da rotina. Se o jogador não o acompanha, aplicam-se as mesmas regras de espera e separação; não existe obrigação de entrar na mina nem deslocamento automático do jogador.

A espera, liderança, alvo de acompanhamento, separação e motivo de encerramento são persistentes. O horário limite da rotina tem prioridade sobre uma ordem de esperar.

## Segurança, defesa e fuga

- Bento verifica zumbis visíveis, morcegos hostis, ar contaminado, desabamentos e iluminação. Paredes bloqueiam a detecção e o ataque.
- O acompanhamento considera as lanternas fixas efetivamente renderizadas e a luz da lanterna carregada pelo jogador. Os pontos das lanternas fixas são compartilhados com o renderer e não mudam de lugar quando uma parede é escavada.
- Bento não persegue zumbis para iniciar combate. Diante de perigo ele procura uma rota de afastamento; só usa o martelo quando uma ameaça está próxima o suficiente para exigir defesa.
- A defesa reutiliza o arco frontal, linha de visão, dano e intervalo do martelo existentes. Alcança um alvo ameaçador por golpe, não concede experiência, moedas ou itens e tem impacto persistido exatamente uma vez.
- Foram reutilizadas a animação de martelo da fase 6 e a caminhada oficial em oito direções. O contato causa efeito sonoro no cenário carregado; a caminhada de retirada reflete a distância realmente percorrida.
- Ferimento, risco persistente, desabamento ou contaminação podem encerrar a expedição. Bento primeiro abandona o perigo imediato e depois calcula o trajeto longo para a saída, evitando ficar parado no meio de uma ameaça durante a busca.
- A retirada usa navegação de emergência com custo para perigos e continua respeitando a geometria. Ela permite sair de uma área perigosa já ocupada, sem entrar deliberadamente em uma nova área contaminada. O jogador parado no trajeto pode ser contornado.
- Bento tem saúde própria e recebe dano e intervalo de contato do sistema existente. Como residente que não pode morrer ou exigir resgate, sua saúde não entra em estado terminal; ferimentos provocam a retirada física. O retorno à oficina restaura sua condição. Não existe teleporte usado para resolver a fuga.

Os perigos fora da tela usam o mesmo `UndergroundHazards`, com Bento como alvo físico. A saúde salva do jogador não recebe dano dessa simulação. Entrar na mina não cria uma cópia de Bento ou reinicia o encontro.

A mineração do NPC agora também registra o ruído nativo. Uma saída pode terminar sem materiais quando ele precisa recuar antes de concluir um bloco. Não há compensação ou recurso gerado para simular uma coleta que não ocorreu.

## Parâmetros provisórios

Valores de companhia em `src/data/bento-expedition.ts`, separados das regras públicas de equipamentos e das cotas da fase 6:

| Parâmetro | Valor inicial |
| --- | --- |
| Conversa | 78 px |
| Distância de acompanhamento | 48 px |
| Distância para esperar reagrupar | 160 px |
| Separação antes do retorno | 60 segundos de simulação |
| Perigo persistente antes de abandonar a saída | 12 segundos |
| Calma antes de retomar uma ação | 1,5 segundo |
| Velocidade de retirada | 104 px/s |
| Saúde crítica | 32 de 100 |
| Alcance defensivo | 36 px, um alvo |
| Animação defensiva | 0,6 segundo, contato em 0,3 segundo |
| Escuridão considerada insuficiente | Opacidade acima de 0,64, sem fonte de luz válida |

O dano e intervalo defensivos são os do martelo atual: 25 e 2,4 segundos. Gás mantém os 2% de vida por segundo definidos na especificação; o desabamento aplica o dano nativo uma única vez por evento. As visitas semanais, limite de pedra/ferro, transporte e depósitos continuam com os parâmetros da fase 6.

A busca tem orçamento de 32 expansões por atualização normal e até 128 durante a retirada. Não mantém os outros cenários carregados nem executa uma busca global bloqueante para cada passo.

## Persistência e arquivos

`SaveData.bentoExpedition` é uma extensão opcional: saves anteriores permanecem válidos. Comandos são aplicados a uma cópia e só entram no estado vivo após uma escrita durável bem-sucedida. Impactos defensivos persistem o dano e a marca de impacto na mesma transação. Os snapshots mantêm o estado atual do jogador, a mina compartilhada e a rotina real de Bento.

Arquivos principais:

- `src/data/bento-expedition.ts`: parâmetros iniciais.
- `src/systems/bento-expedition-state.ts`: saúde, convite, companhia, defesa e validação.
- `src/systems/bento-expedition.ts`: comandos, liderança, espera e separação.
- `src/systems/bento-defense.ts`: reação, dano, defesa e retirada.
- `src/systems/bento-mine-safety.ts`: risco, luz e saída de áreas perigosas.
- `src/systems/bento-navigation.ts`, `bento-travel.ts`, `bento-travel-state.ts`: integração com navegação, viagens e portais.
- `src/systems/bento-commit.ts`, `bento-mining.ts`: transações, continuidade e ruído de mineração.
- `src/systems/underground-hazards.ts`: alvos reais de jogador/NPC no mesmo modelo de perigos.
- `src/systems/underground-light.ts`, `src/underground-view.ts`: posições compartilhadas e estáveis de lanternas.
- `src/bento-expedition-menu.ts`, `bento-expedition.css`: painel de companhia.
- `src/bento-travel-view.ts`, `bento-work-art.ts`: contexto, animações e retorno à apresentação original.
- `src/village-ui.ts`, `src/scenes/VillageScene.ts`: convite na ferraria.
- `CityForestScene`, `FishingLakeScene`, `HighlandScene`, `MineScene`: adaptação dos comandos ao save vivo de cada cenário.
- `src/types.ts`, `src/systems/save.ts`: extensão validada do save.
- `tests/bento-expedition.test.ts`, `tests/bento-work.test.ts`, `scripts/qa-bento-expedition.cjs`: verificações dirigidas.

## Verificação concluída

- **281 testes em 17 arquivos passaram.** Incluem 23 testes específicos da fase 7 e regressões de mineração, armazenamento, economia, saves, rotina, navegação, equipamentos e perigos.
- Os testes da companhia cobrem convite durável, cancelamento, comando distante ou rejeitado, espera na estrada e após portal, liderança na mina, espera salva, retomada do caminho, volta opcional e separação por falta de uma rota acessível.
- Os testes de segurança cobrem luz fixa e carregada, contaminação, ameaça distante, morcego pacífico/hostil, defesa sem recompensa, falha de gravação, impacto após reload, dano de desabamento sem repetição e fuga física de encontros extremos nas galerias superficiais e profundas.
- **Build de produção passou.** Permanece somente o aviso conhecido do Vite sobre o tamanho do JavaScript gerado; ele não impede a build.
- **Chromium passou**, exercitando o convite pelo painel da ferraria, comandos contextuais, Bento esperando na estrada, acompanhamento dentro da mina, salvar/continuar com espera ativa, retomada da liderança, retorno opcional, defesa animada e saída por portal durante uma retirada. Sem erros de JavaScript, quadros/texturas ausentes ou deslocamento forçado do jogador.
- Inventário e economia do jogador foram comparados antes e depois do roteiro. Não houve recompensa automática ou alteração de saldos.

Roteiro: `node scripts/qa-bento-expedition.cjs`, com Vite em `127.0.0.1:5190`. Usa cenários de teste separados para ferraria, estrada e galerias: as posições iniciais são fixtures explícitas; os movimentos verificados depois delas passam pelo update real da cena. A demonstração de comandos usa uma galeria segura; a defesa final injeta um encontro hostil e utiliza perseguição, dano e saída nativos. Esses preparativos não fazem parte do código de produção.

Capturas em `/workspace/bento-fase7-qa/`:

1. `01-Convite-na-ferraria.png`
2. `02-Bento-lidera-a-viagem.png`
3. `03-Bento-espera-na-estrada.png`
4. `04-Jogador-assume-a-lideranca.png`
5. `05-Acompanhando-pelos-tuneis.png`
6. `06-Esperar-em-local-seguro.png`
7. `07-Voltar-sem-forcar-o-jogador.png`
8. `08-Defesa-com-o-martelo.png`
9. `09-Retirada-pela-passagem-real.png`

## Limites e próxima fase

Esta fase não implementa os pedidos e acontecimentos especiais da mina, o diário dessas missões, objetos únicos, a cena completa de resgate ou novos relacionamentos. Esses itens permanecem nas fases 8, 9 e 10.

**Próxima fase: pedidos e acontecimentos da mina**, com estados persistentes, progresso preservado após uma expedição interrompida e integração ao diário.
