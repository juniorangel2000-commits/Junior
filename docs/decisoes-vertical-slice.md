# Decisões da vertical slice

Registro da adaptação de **Jardim Depois da Chuva** ao repositório existente, após auditoria e autorização para continuar em 20/10/2026. A fonte das receitas e da economia é a [Bíblia recebida](../documentacao/01_BIBLIA_DO_JOGO.md), conciliada com [decisões e pendências](../documentacao/05_DECISOES_E_PENDENCIAS.md). Os documentos recebidos foram preservados integralmente em `documentacao/`, com `LEIA_PRIMEIRO.md` na raiz.

Custos, rendimentos, tempos e limites ficam configuráveis no código. Alterações futuras devem registrar o motivo e atualizar testes e documentação. O arquivo `documentacao/06_DADOS_PROVISORIOS.json` é referência para adaptação ao modelo da engine.

## 1. Primeiras tábuas e bancada sem dependência circular

O jogador começa uma nova partida com inventário vazio. Galhos, pedra e fibra possuem pontos fixos próximos da casa, inclusive novos pontos para partidas antigas que tenham esgotado as coletas anteriores.

Componentes manuais permitem produzir as três ferramentas iniciais:

| Receita | Materiais | Resultado |
| --- | --- | --- |
| Corda vegetal | 3 fibras | 1 corda |
| Pedra lascada | 2 pedras | 1 pedra lascada |
| Cabo | 1 galho | 1 cabo |
| Cavilhas | 1 galho | 4 cavilhas |
| Machadinha de pedra | 1 cabo + 1 pedra lascada + 1 corda | 1 machadinha |
| Picareta rudimentar | 1 cabo + 2 pedras lascadas + 1 corda | 1 picareta |
| Martelo rudimentar | 1 cabo + 1 pedra + 1 corda | 1 martelo |

A machadinha permite processar **1 tronco em 2 tábuas brutas**, em **4 segundos**, sem bancada ou serrote. A bancada usa **4 tábuas brutas + 4 cavilhas**, exigindo possuir o martelo. Assim, o primeiro tronco não depende de uma estação ainda inexistente.

## 2. Sucata, lâmina e serrote improvisado

Há sucata em posições acessíveis e fixas nas ruínas a oeste. Perto da bancada, **1 sucata metálica → 1 lâmina de sucata**; depois **1 lâmina + 1 cabo + 1 corda → 1 serrote improvisado**.

Com serrote improvisado e bancada, **1 tronco → 3 tábuas regulares**, em **3 segundos**. Tábuas regulares são um item distinto das tábuas brutas. O rendimento de quatro tábuas exige o serrote reforçado, que permanece uma ampliação futura.

A fabricação mostra progresso e modifica o inventário somente ao concluir. Cancelar antes da conclusão preserva os insumos; não há fila offline ou processamento paralelo. A conclusão revalida a transação inteira para impedir consumo parcial e duplicação.

## 3. Abrigo com piso, estrutura e cobertura materiais

O abrigo inicial usa peças reais, em camadas independentes de piso, estrutura e telhado. A cobertura consome recursos e ocupa um segmento de **1×3 tiles**, com rotação horizontal/vertical. O telhado se oculta ao entrar para revelar o interior.

O critério de reconhecimento desta fatia exige:

- de **1 a 64 tiles internos**;
- contorno fechado por **paredes/janelas** e pelo menos **uma porta fechada**;
- **piso e cobertura construídos** sobre o interior;
- uma passagem utilizável pela porta.

Uma abertura ou porta aberta interrompe o fechamento. Cerca, banco, bancada, árvores, água e paredes da casa preexistente não substituem as peças do contorno. O jogo reconhece o recinto e informa seu estado no HUD. Clima, temperatura, descanso e proteção contra inimigos são sistemas posteriores.

### Economia das peças

| Peça | Custo | Requisito |
| --- | --- | --- |
| Piso rústico 1×1 | 1 tábua bruta | Martelo + bancada próxima |
| Parede | 2 tábuas brutas + 1 cavilha | Martelo + bancada próxima |
| Janela | 2 tábuas brutas + 1 cavilha | Martelo + bancada próxima |
| Porta | 3 tábuas brutas + 2 cavilhas | Martelo + bancada próxima |
| Cobertura 1×3 | 2 tábuas brutas + 3 fibras | Martelo + bancada próxima |
| Bancada | 4 tábuas brutas + 4 cavilhas | Martelo |
| Cerca existente | 2 madeiras | Regras existentes |
| Banco existente | 4 madeiras + 2 pedras | Regras existentes |

O projeto de abrigo **3×3 externo** utiliza **9 pisos, 6 paredes, 1 porta, 1 janela e 3 segmentos de cobertura**: **32 tábuas brutas + 9 cavilhas + 9 fibras**. Seu espaço interno mínimo é o tile central. A bancada pode ficar do lado de fora, próxima à obra.

O modo livre e o projeto usam os mesmos IDs de peças, custos, camadas e validações. O projeto não dá desconto nem gera materiais ocultos. A casa conceitual 8×6 do dossiê é outro projeto e não utiliza esse orçamento.

A desmontagem das peças novas devolve **60% de cada componente, arredondado para baixo**. A cerca e o banco mantêm reembolso integral como exceção de compatibilidade com a entrega anterior. Esse comportamento fica explícito para evitar perda inesperada de materiais ao reorganizar as construções antigas.

## Recursos e equilíbrio inicial

| Recurso | Ação | Resultado |
| --- | --- | --- |
| Feixe de madeira/galhos | Coletar com as mãos | 4 madeiras + 3 galhos |
| Pedras pequenas | Coletar com as mãos | 3 pedras |
| Sementes | Coletar com as mãos | 3 sementes |
| Fibra vegetal | Coletar com as mãos | 6 fibras |
| Sucata metálica | Coletar com as mãos | 2 sucatas |
| Árvore cortável inicial | 4 golpes de machadinha | 2 troncos + 3 galhos |
| Rocha/veio inicial | 5 golpes de picareta | 4 pedras |

Esses valores de árvore e rocha ficam dentro dos intervalos de referência da Bíblia. Árvores médias, ferro e ferramentas reforçadas permanecem para expansão. Cada recurso conserva ID estável; golpes parciais e esgotamento são salvos. O último golpe entrega a recompensa uma única vez e atualiza a colisão.

## IDs e partidas anteriores

A base conserva os IDs anteriores para madeira, pedra, sementes, nabos, cerca e banco. `bench` continua sendo o banco decorativo; `workbench` identifica a estação. `plank` representa tábua bruta; a tábua regular tem ID próprio.

Partidas v1 preservam o estoque original sem conversões silenciosas: madeira genérica continua madeira e pode ser usada nas receitas legadas. Novos materiais e ferramentas começam zerados, com recursos básicos adicionais no mundo para permitir seguir a cadeia.

O save passa à versão 2 mantendo a chave histórica `depois-da-chuva-v1`. Antes da primeira gravação da migração, o conteúdo anterior recebe cópia local em `depois-da-chuva-v1-backup`. Se a cópia falhar, o slot antigo não é substituído. A origem interna e o diretório de dados do aplicativo permanecem estáveis. O processamento interrompido é cancelado sem custo; não retoma automaticamente ao carregar.

## Configuração e escopo efetivo

| Arquivo | Responsabilidade |
| --- | --- |
| `src/data/items.ts` | IDs, nomes e descrições |
| `src/data/recipes.ts` | Receitas, requisitos, rendimentos e tempos |
| `src/data/blueprints.ts` | Custos das peças e composição do projeto 3×3 |
| `src/systems/resources.ts` | Ferramentas exigidas, golpes e drops |
| `src/systems/building.ts` | Validação das peças, camadas, projeto e desmontagem |
| `src/systems/shelter.ts` | Critério e limite do recinto |
| `src/systems/save.ts` | Validação, migração e persistência |

Os documentos originais descrevem o jogo completo e suas metas de QA. Esta integração ainda usa arte procedural provisória e não implementa energia, durabilidade/reparo, drops físicos, animações finais de ação, clima, ameaça ou IA avançada. A existência desses itens no dossiê não comprova sua implementação. As caixas do documento original de QA foram preservadas, sem preenchimento automático.

A grade lógica permanece em 32 pixels; o personagem original conserva a base de 24×32 enquanto os assets externos aguardam QA e adaptação. Personagem, preview e mundo devem manter proporção, pés alinhados e colisão independente da imagem durante a futura importação.
