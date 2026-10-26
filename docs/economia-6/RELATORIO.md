# After Rain — Economia 6.0

Implementação local em Phaser/TypeScript. Nenhum commit, push, tag, Release ou publicação foi feito. A Release publicada permanece inalterada. A prévia local Windows 0.10.0-preview.1 foi preparada posteriormente, conforme descrito no adendo de arte.

## 1. Arquivos criados e modificados

Novos módulos:

- `src/data/economy-balance.ts`: preços, receitas, níveis, probabilidades, durações, contratos e calendário de reposição.
- `src/systems/economy.ts`: estoques, reservas, encomendas, fundição, contratos, estatísticas, desgaste e validação do estado persistente.
- `src/systems/mining.ts`: identificação regional dos depósitos, permissão de extração e descoberta rara de minério inteiro.
- `src/blacksmith-panel.ts`: fundição, fabricação e acompanhamento das encomendas; reutilizado pela forja própria.
- `src/economy-visuals.ts`: identificação visual dos depósitos usando as rochas e a paleta existentes.
- `tests/economy6.test.ts`: critérios econômicos e testes de regressão específicos.
- `scripts/qa-economy6.cjs`: teste real no Chromium.

Integrações modificadas:

- Tipos e itens: `src/types.ts`, `src/data/items.ts`, `src/data/village-progress.ts`.
- Comércio e serviços: `src/data/village-commerce.ts`, `src/systems/commerce.ts`, `src/systems/village-services.ts`.
- Mineração e calendário dos recursos: `src/systems/resources.ts`, `src/systems/resource-spawns.ts`.
- Fabricação e utilização: `src/data/recipes.ts`, `src/systems/crafting.ts`, `src/systems/consumables.ts`.
- Persistência: `src/systems/save.ts`.
- Cenas e interfaces: `src/scenes/ValleyScene.ts`, `src/scenes/ForestScene.ts`, `src/scenes/VillageScene.ts`, `src/ui.ts`, `src/village-ui.ts`, `src/village-equipment.ts`, `src/data/village.ts`.
- Testes antigos atualizados somente onde as regras da prévia foram substituídas: comércio, serviços, saldo inicial e teste administrativo.

## 2. Sistemas implementados

A Coroa (C) usa o saldo inteiro já existente em `villageEconomy.coins`. Novas partidas começam com 100 C; partidas anteriores conservam seu saldo. O estado opcional `economy6` guarda ferramentas, desgaste, encomendas, estatísticas de extração e conclusões dos pedidos. O estoque comercial fica junto da carteira e é salvo com ela.

Os dez comerciantes existentes foram reutilizados. Nilo agora mantém um antiquário local aberto diariamente. Seu identificador interno legado `traveler` foi preservado para não quebrar referências de arte e mapa; ele não tem caravana nem calendário de viagens.

Não foi criado nível da vila. O campo legado `villageProgress` continua representando receitas e habilidades pessoais; ele não condiciona mineração, contratos comerciais ou abastecimento de Bento.

Pedra comum, galho, fibra e ferramentas iniciais não têm ofertas comerciais. A fabricação inicial existente permanece disponível. Foice e pá receberam receitas básicas porque esses itens ainda não tinham receitas iniciais.

## 3. Itens, receitas e ferramentas

Foram adicionados os fragmentos, minérios inteiros e lingotes de Ferro, Ouro e Metal Negro, mantendo os IDs distintos. Também existem forja própria, foice/pá básicas, cogumelos e componentes comercializáveis de carpintaria.

Fundição: nove fragmentos ou um minério inteiro por lingote. Combinações usam primeiro os inteiros necessários e depois os fragmentos exatos. Não há desperdício nem conversão direta de minério inteiro em nove lingotes.

A forja própria custa 15 pedras, 8 madeiras e 6 sucatas, e deve ser fabricada junto à bancada. Instale pelo inventário em chão livre da propriedade. Interaja com mãos livres e E, a até 70 pixels. A fundição própria tem processamento pelo calendário, com retirada na aba Processamento; não cobra C nem combustível: antes desta implementação o jogo não tinha combustível de forja.

Ferro: machado/picareta usam 4 lingotes, enxada/foice/pá usam 3; mais 2 madeiras. Ouro: machado/picareta usam 5 lingotes, enxada/foice/pá usam 4; mais 2 **tábuas regulares**, o material resistente de carpintaria já existente. Não foi inventada uma nova madeira.

**Todas as ferramentas de Metal Negro usam exatamente 9 lingotes de Metal Negro e 4 lingotes de Ouro.** Isso equivale a 81 + 36 = 117 fragmentos quando nenhum minério inteiro é usado.

| Material | Eficiência | Durabilidade | Prazo de ferramenta |
|---|---:|---:|---:|
| Pedra | 1,0× | 100 | fabricação inicial |
| Ferro | 1,5× | 250 | 1 dia |
| Ouro | 2,2× | 450 | 2 dias |
| Metal Negro | 3,2× | 800 | 4 dias |

O trabalho fracionário é acumulado e salvo, sem arredondar permanentemente 1,5× para 1×. Machado/picareta aplicam trabalho aos golpes; ferramentas agrícolas/coleta ampliam a ação conforme a capacidade e o terreno válido. A ferramenta fica inutilizável ao chegar a zero, permanece no inventário e pode ser reparada. Ações inválidas não gastam durabilidade. O inventário mostra material e durabilidade.

## 4. Ferraria e interfaces

O menu normal de Bento separa a compra de materiais e dá acesso à ferraria. A ferraria tem abas **Fundição**, **Fabricar ferramentas** e **Encomendas**.

A ferramenta precisa existir e seguir a sequência Pedra → Ferro → Ouro → Metal Negro. Entregar materiais cria uma reserva persistente, sem cobrar C. Na aba Encomendas, o jogador paga integralmente a mão de obra e inicia o prazo. A retirada só é habilitada após o calendário atingir a data de conclusão. O aprimoramento substitui os metadados da ferramenta original; não acrescenta outra unidade ao inventário.

Antes de pagar, cancelar devolve integralmente os materiais, uma vez. Se não houver espaço, a reserva permanece intacta até o jogador liberar espaço. **Depois de pagar não há cancelamento:** a encomenda continua acessível até sua retirada. Essa política aparece na interface.

A fundição de Bento segue o mesmo fluxo de reserva/pagamento/retirada. Mão de obra por lingote: 25 C / 90 C / 500 C. Processamento: 30 / 90 / 240 minutos do jogo por lingote. Nenhum prazo usa a hora do computador.

Ao vencer o prazo, uma notificação informa que a encomenda está pronta. Fechar a janela, trocar de cena ou recarregar não reinicia o trabalho.

## 5. Comércio, reposição e obtenção

| Material | Comprar | Vender | Quantidade / intervalo |
|---|---:|---:|---|
| Madeira | 8 C | 2 C | catálogo normal |
| Tábuas | 18 C | 6 C | catálogo normal |
| Fragmento de Ferro | 15 C | 4 C | 4 / 2 dias |
| Lingote de Ferro | 120 C | 65 C | 3 / 3 dias |
| Fragmento de Ouro | 90 C | 18 C | 2 / 5 dias |
| Lingote de Ouro | 750 C | 380 C | 1 / 7 dias |
| Fragmento de Metal Negro | não vendido | 120 C | somente exploração |
| Lingote de Metal Negro | 5.000 C | 2.500 C | 1 / 15 dias |

Bento vende minerais a partir do dia 31. Fundição e encomendas funcionam antes disso com materiais do jogador. A reposição de Metal Negro ocorre nos dias 31, 46, 61, 76 etc. Não há acúmulo: o último ciclo substitui a disponibilidade anterior. Abrir a loja não repõe nada; o registro persistente contém ciclo, quantidade restante e quantidade comprada.

Nenhuma loja vende minério inteiro. Minérios inteiros também não são revendidos: devem ser refinados. Não há lucro imediato comprando e revendendo o mesmo produto.

Os depósitos reutilizam os nós de rocha existentes e seus limites/posicionamento. A propriedade inicial admite Ferro; a Floresta Antiga admite Ferro, Ouro e Metal Negro, com raridade crescente. Por nó de rocha elegível, a configuração atual é: propriedade 15% Ferro; floresta 24% Ferro, 4% Ouro e 0,3% Metal Negro. Isso não transforma todo recurso em minério: as demais rochas continuam fornecendo pedra.

Probabilidade de minério inteiro por depósito metálico: Ferro 0,2%; Ouro 0,05%; Metal Negro 0,01%. A descoberta é estável por ID do depósito, impedindo tentar novamente o mesmo golpe por recarga. A picareta bloqueia a extração incompatível antes de registrar progresso ou entregar recursos. Depósitos dinâmicos de Metal Negro recolhidos têm reposição estendida para 30 dias, em vez do ciclo comum de rochas.

O quadro de pedidos está nos serviços dos moradores: Tobias pede madeira, Helena pede alimentos, Amélia pede ervas e Bento pede sucata. Cada pedido tem quantidade, recompensa e ciclo configuráveis, conclusão persistente e pagamento único. Não exige evolução da vila nem entrega minerais raros como recompensa.

## 6. Testes e resultados

- TypeScript e build de produção passaram.
- Suíte completa: **656 testes em 64 arquivos**.
- O arquivo `tests/economy6.test.ts` cobre os 25 critérios obrigatórios, incluindo todas as ferramentas de Metal Negro, mistura de materiais, dinheiro/estoques inválidos, cancelamentos, prazos, persistência e trabalho fracionário.
- Chromium: 100 C iniciais; bloqueio no dia 1; estoque único no dia 31; esgotamento após compra e recarga; entrega antes de pagar; encomenda paga após recarga; retirada no prazo; tier/durabilidade; compra revertida por falha simulada de armazenamento.
- A verificação de forja própria no navegador está no mesmo roteiro: mistura de fragmentos e minério inteiro, sem mão de obra.

O relatório do navegador e capturas reais ficam nesta pasta. Os testes usam o calendário simulado do jogo, não esperas de dias reais. A integração Phaser foi verificada no Chromium local. Depois desta etapa foi gerado um pacote Windows x64 local; o arquivo e seus conteúdos são verificados pelo adendo de arte. Não houve execução nativa em Windows neste ambiente Linux.

## 7. Problemas encontrados e corrigidos

A prévia vendia pedra/fibras/galhos e ferramentas prontas, iniciava a carteira vazia, tinha reforços instantâneos e visitas periódicas de Nilo. Essas regras foram substituídas pelas instruções 6.0. Testes que exigiam os comportamentos antigos foram atualizados, mantendo os testes de recusa, atomicidade e regressão.

O catálogo ampliado ultrapassou a capacidade simultânea do inventário de teste administrativo; esse teste agora verifica cada item separadamente, respeitando o limite real da mochila. Reservas e pagamentos são validados no carregamento, com receitas e tarifas conferidas contra a configuração central.

Compras e ações da ferraria revertem o estado da sessão se o salvamento falhar. A falha foi simulada no navegador e não alterou carteira, estoque ou itens.

## 8. Balanceamento recomendado

Medir em partidas longas o tempo até o primeiro conjunto de Ferro e a renda por dia. Os 100 C iniciais cobrem a fundição de quatro lingotes de Ferro, mas a ferramenta também exige obter a mão de obra: agricultura, madeira e pedidos fornecem essa renda.

Medir principalmente o Metal Negro: 9 unidades comerciais exigem chegar pelo menos ao dia 151 se nenhuma for minerada e 45.000 C, além do Ouro e da mão de obra. Essa restrição é intencional, porém deve ser confrontada com a duração desejada de uma partida. Ajustar densidade regional e probabilidade somente em `economy-balance.ts`.

Avaliar a tarifa de reparo e a frequência dos pedidos depois de observar a renda real dos jogadores. Não é necessário mudar os valores definitivos de fabricação de Metal Negro para balancear o restante da economia.
