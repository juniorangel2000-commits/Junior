# Fase 8 — pedidos e acontecimentos da mina

Bento oferece pedidos opcionais, e as galerias guardam três acontecimentos únicos. O diário registra objetivos, entregas parciais, descobertas e objetos encontrados. Interromper uma expedição preserva o trabalho feito; uma derrota devolve os objetos físicos de missão aos seus pontos de origem.

## Pedidos e acontecimentos implementados

| Pedido | Objetivo | Pagamento inicial |
| --- | --- | --- |
| Pedra para a oficina | Entregar 12 pedras, inclusive em partes | 24 C |
| Um pouco de ferro | Entregar 6 fragmentos de ferro | 30 C |
| A ferramenta esquecida | Recuperar um rolo de ferramentas em uma das áreas de trabalho | 28 C |
| Reconhecer as galerias | Visitar duas câmaras dos trilhos | 35 C |
| O carrinho abandonado | Recuperar o eixo de um carrinho antigo | 40 C, uma vez |
| A passagem esquecida | Abrir a passagem de pedra e descobrir uma antiga área de trabalho | 45 C, uma vez |
| Os registros da mina | Encontrar um caderno antigo e mostrá-lo a Bento | 40 C, uma vez |

Os quatro primeiros são renováveis. Pode haver apenas **um pedido renovável em andamento ou pronto**, e apenas **um pagamento renovável por período de quatro dias**. Um pedido não expira ao mudar de período. Se for concluído depois, o pagamento ocupa o período atual, evitando receber uma sequência de pagamentos atrasados no mesmo dia.

Quantidades, valores, período e distâncias são **provisórios**, centralizados em `src/data/mine-missions.ts`. Os valores foram mantidos abaixo dos pedidos comerciais existentes. Não há recompensa garantida em ouro ou metal negro, alteração de preços, novas receitas ou mudança no estoque particular do Bento.

Os acontecimentos únicos são independentes: podem ser aceitos em qualquer ordem ou descobertos durante a exploração. Encontrar o eixo ou o caderno inicia e registra o acontecimento mesmo sem conversar antes com Bento. O pagamento ainda exige conversar com ele e mostrar o objeto.

## Diário e interação

- Na conversa com Bento, usar **Pedidos da mina**. O painel de expedição também tem **Pedidos e descobertas da mina**, inclusive quando Bento está viajando.
- **L**, o menu superior e o botão da lista de missões abrem o **Diário da mina** nos cenários normais. As restrições de interface das dungeons permanecem.
- O diário oferece filtros de acompanhamento, todos os pedidos, acontecimentos e concluídos. Mostra estado, objetivo, progresso, região sugerida, pagamento e objetos carregados.
- Aceitar, entregar ou receber exige Bento fisicamente próximo e disponível para conversar. O diário aberto longe dele continua útil para consultar ou retomar um pedido em espera.
- Entregas de pedra e ferro usam o inventário vivo do cenário e podem ser parciais. O progresso só aumenta após os materiais serem descontados e a escrita durável ser confirmada.
- Os objetos encontrados ficam em uma seção própria do diário. O rolo de ferramentas não vira um martelo utilizável; o caderno e o eixo não são itens comerciais ou equipamentos públicos.
- O mundo usa sprites próprias para eixo, caderno e rolo de ferramentas. **E** ou clique próximo examina o objeto; distância, vida, colisão e linha de visão são verificadas antes da coleta. Não foram adicionados marcadores flutuantes em excesso.

## A passagem esquecida

Uma pequena câmara lateral foi acrescentada ao fim de um ramal a oeste da região intermediária. O acesso fica atrás de três células consecutivas de pedra, com espessura lateral; é aberto pela mesma picareta, golpes, desgaste, recompensa de pedra, colisão e atualização de bordas usados no restante da mina.

A câmara usa os pisos, paredes arredondadas e caixas existentes. O nome **Galeria esquecida** aparece quando o jogador entra. Não houve substituição da Mina Antiga, do portal central, dos trilhos principais ou das outras salas aprovadas.

Os blocos de acesso são permanentes depois de escavados e reservados ao jogador: Bento não os minera automaticamente. Os novos blocos de acesso são pedra; uma alteração mineral já salva nessas células continua respeitada. A nuvem de gás do antigo fim do ramal e seu dano nativo foram preservados.

A descoberta só é registrada pela posição real do jogador depois que ele chega à região. Uma visita do NPC, abrir o diário ou aceitar o pedido não concede a descoberta.

## Estados e continuidade

`SaveData.mineMissions` é uma extensão opcional. Saves anteriores continuam válidos. Os registros têm os estados **Disponível**, **Em andamento**, **Em espera**, **Pronto para entrega** e **Concluído**.

- Saída normal da mina, retirada de Bento, separação ou encerramento da companhia colocam objetivos incompletos em espera. Entregas parciais e lugares já reconhecidos permanecem registrados.
- Um pedido em espera pode ser retomado pelo diário, ao se juntar novamente a Bento ou pela continuação real do objetivo durante uma exploração solo.
- Objetivos prontos não são rebaixados por uma simples saída da mina. Objetos carregados podem ser levados à ferraria normalmente.
- Pedidos renováveis concluídos reabrem em um novo período. Acontecimentos únicos permanecem concluídos na mesma partida.
- Cada visita de reconhecimento conta uma única vez. Nenhum pagamento é dado por simplesmente visitar ou aceitar um pedido.

## Objetos únicos e derrota

Cada objeto possui identidade estável, estado físico e posição de origem. O rolo de ferramentas também identifica o período do pedido renovável. A coleta muda o mesmo objeto de **no mundo** para **carregado**; a entrega o torna **entregue**. Não são criadas cópias no inventário comum.

Ao perder toda a vida na mina, o retorno já existente para casa agora também:

1. Devolve cada objeto de missão carregado ao seu ponto de origem.
2. Preserva o pedido, a data de aceitação, entregas já realizadas e reconhecimentos concluídos.
3. Mantém descobertas e túneis escavados.
4. Permite recuperar o mesmo objeto novamente, com a mesma identidade e sem duplicar pagamento.

A posse física de um objeto retornado precisa ser recuperada; os demais objetivos já feitos não são reiniciados. Os pontos de origem ficam em pisos acessíveis protegidos da regeneração. A câmara descoberta continua acessível pelo trecho permanente escavado pelo jogador.

A cena completa de resgate e os diálogos específicos do Bento continuam reservados à fase 9. Aqui foi integrada a regra dos objetos ao retorno por derrota que já funcionava.

## Transações e arquivos principais

Aceitação, entrega parcial, coleta, reconhecimento e pagamento usam uma cópia de um snapshot atualizado. Só depois da escrita bem-sucedida o estado vivo recebe o resultado. Falha ou exceção de armazenamento preserva inventário, saldo, objeto e progresso. Os cenários com inventários separados recebem a atualização tanto no save quanto no inventário vivo.

- `src/data/mine-missions.ts`: pedidos, quantidades, valores e pontos de interesse.
- `src/data/mine-quest-geometry.ts`: câmara lateral e blocos de acesso.
- `src/systems/mine-mission-state.ts`: estados, identidades e validação.
- `src/systems/mine-missions.ts`: operações, snapshots, entregas, coleta e reconhecimento.
- `src/systems/mine-mission-lifecycle.ts`: interrupção, retomada e retorno de objetos.
- `src/mine-mission-journal.ts`, `mine-mission-journal.css`: diário integrado à HUD.
- `src/mine-mission-view.ts`: objetos físicos, sprites e interação nas galerias.
- `src/ui.ts`, `top-toolbar.ts`, `toolbar-icons.ts`, `main.ts`: diário, atalho e acesso ao cenário ativo.
- `src/village-ui.ts`, `bento-expedition-menu.ts`: pedidos na conversa com Bento.
- `src/scenes/MineScene.ts`: coleta, reconhecimento, apresentação e identificação da câmara.
- Cenários normais: adaptadores que preservam o inventário e a posição atuais do jogador.
- `src/systems/bento-expedition.ts`, `bento-defense.ts`, `bento-commit.ts`: continuidade durante a rotina do NPC.
- `src/systems/mining-access.ts`, `underground-renewal.ts`, `underground-recovery.ts`: saídas, proteção e derrota.
- `src/data/underground-layout.ts`, `src/systems/underground-geology.ts`, `bento-mining.ts`: região lateral, material salvo e proteção dos blocos críticos.
- `src/types.ts`, `src/systems/save.ts`: extensão opcional e validação de saves.
- `tests/mine-missions.test.ts`, `scripts/qa-mine-missions.cjs`: testes e roteiro visual.

A nova arte está em `public/assets/visual/mine/mission-objects.png`: atlas transparente de três colunas e duas linhas, com ícones e vistas para o chão. Foi criada com ImageGen; o original permanece em `/workspace/generated_images/exec-813f6a9c-0e5a-470d-9e79-03d237e2795b.png`.

## Verificação concluída

- **313 testes em 19 arquivos passaram**, incluindo 26 testes dos pedidos e acontecimentos, além de regressões de mineração, materiais, perigos, acesso, Bento, economia, saves e ferraria.
- Cobertura de entregas parciais, ciclos atrasados, pagamento único, carteira cheia, falha de armazenamento, inventário vivo, descoberta sem missão prévia, identidade estável, retorno após derrota, retomada solo e com Bento e materiais previamente salvos.
- A câmara é inacessível antes da abertura; o teste usa a picareta nativa para abrir a pedra e só então valida o caminho e a descoberta. Os pontos dos objetos foram verificados em várias sementes de mundo.
- **Build de produção passou.** Permanece o aviso conhecido do Vite sobre o tamanho do JavaScript gerado; ele não bloqueia a build.
- **Chromium passou**: pedido e entrega parcial no painel real, coleta dos objetos no mundo, diário e cargo, retorno à recepção, salvar/continuar, derrota nativa, recuperação do objeto, pagamento único e abertura com animação da picareta seguida de caminhada pelo acesso.
- Sem erros de JavaScript, sprites ausentes ou quadros inválidos. O roteiro usa posições iniciais controladas para isolar cada evento e galerias sem inimigos na demonstração; não remove os perigos do código de produção. As interações, transações, derrota, golpes e caminhada verificados usam o código real do jogo.

Roteiro: `node scripts/qa-mine-missions.cjs`, com Vite em `127.0.0.1:5190`. Capturas em `/workspace/mina-fase8-qa/`:

1. `01-Pedido-e-entrega-parcial.png`
2. `02-Peca-do-carrinho-no-mundo.png`
3. `03-Diario-com-progresso-preservado.png`
4. `04-Objetos-unicos-no-diario.png`
5. `05-Derrota-retorna-os-objetos.png`
6. `06-Descoberta-concluida-com-Bento.png`
7. `07-Parede-da-passagem-esquecida.png`
8. `08-Galeria-abandonada-descoberta.png`
9. `09-Descoberta-anotada.png`

## Próxima fase

**Fase 9: cena completa de derrota e resgate**, com participação do Bento, despertar em casa e retomada da rotina. Novas relações sociais continuam na fase 10. Quantidades, recompensas e frequência de pedidos desta entrega permanecem ajustáveis.
