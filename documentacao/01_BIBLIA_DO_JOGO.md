# BÍBLIA DE DESENVOLVIMENTO — JARDIM DEPOIS DA CHUVA

**Versão:** 1.0 (documento-mestre para Codex)  
**Contexto:** decisões tomadas no estúdio criativo; implementação em separado.  
**Referências:** Stardew Valley e Project Zomboid apenas como inspirações de mecânica/atmosfera, com identidade própria, artes originais e sem reutilização de recursos proprietários desses jogos.

## 0. Visão em uma frase

Um RPG de sobrevivência acolhedora em pixel art detalhada no qual o jogador transforma uma casa e terras abandonadas em uma propriedade personalizada, fabrica cada ferramenta a partir de recursos básicos, cultiva, explora e gradualmente forma uma comunidade num mundo que também apresenta ameaças.

### Experiência desejada

- Dias tranquilos e atividades prazerosas: jardim, horta, carpintaria, decoração, coleta, descoberta e relações com sobreviventes.
- Expedições e tensão opcionais/ambientais: regiões hostis, hordas ocasionais e sobreviventes inimigos, sem tornar o jogo exclusivamente de combate.
- Progressão visual: lugar selvagem/abandonado → casa recuperada → fazenda/oficina → vila personalizada.
- Liberdade criativa real, não decoração superficial: reposicionar, ampliar, reformar, desmontar e conectar estruturas.
- Mundo reativo: árvore permanece cortada, rocha permanece minerada, recursos ficam no chão, porta abre, telhado se oculta ao entrar, NPC usa construções (fase posterior).

## 1. O que foi decidido / o que NÃO foi decidido

**Aprovado:** visão de cima com apresentação levemente tridimensional de fachadas, pixel art detalhada, personagem visível nas quatro direções, propriedade ampliável, mapa grande e conectável, agricultura, exploração, fabricação progressiva inclusive da picareta e do serrote, construção em dois modos (livre e projetos prontos), interiores ricos e telhados em camada separada.

**Planejado, mas não especificado por completo:** IA avançada de NPCs e inimigos; características e natureza das hordas; economia/comércio; temporadas, clima e eventos; narrativa, relações, criação de animais e culinária; multiplayer; diferentes biomas além da região inicial; personalização completa de roupas e rosto. Não implementar esses sistemas em profundidade sem uma nova definição.

**Não presumir:** que os pôsteres gerados sejam arquivos de sprite prontos; que a engine seja Godot, Unity ou JavaScript; que os protótipos HTML tenham sido integrados ao jogo principal; que o nome seja definitivo.

## 2. Identidade visual oficial

### Cenário e arquitetura

- **Arte original de referência:** `01-jardim-depois-da-chuva.png` e versão mais pixelada `jardim_depois_da_chuva_em_pixel_art.png`.
- Pixel art artesanal de alta densidade visual, contornos nítidos, iluminação suave e paleta natural/terrosa.
- Casa principal de reboco **creme/bege**, telhado de **cerâmica terracota alaranjada**, estrutura de **madeira visível**, portas rústicas, janelas de madeira com **venezianas azul-esverdeadas**, floreiras, trepadeiras e vasos.
- Árvores densas em verdes variados; flores, pedras, trilhas irregulares, lago/rios, pontes de madeira, poças depois da chuva.
- Interiores tão detalhados quanto os exteriores: assoalho, móveis, iluminação aconchegante, equipamentos, objetos organizáveis e personalidade dos cômodos.
- Evitar aparências genéricas de blocos quadrados, jogos low poly e sprites simplificados de protótipo como resultado final.
- Interiores/pisos/telhados são camadas separadas; paredes podem cobrir personagens parcialmente e devem ser tratadas por ordenação Y e/ou translucidez.

### Personagem

- Primeira ficha visual: `ficha_de_personagem_em_pixel_art.png`.
- Personagem de referência de cabelo castanho preso, camisa clara de manga dobrada, jardineira/calça jeans azul e botas, acessórios de explorador/carpinteiro.
- Essa aparência é **o primeiro preset**, não o único personagem: jogador poderá escolher nome e aparência num editor futuro.
- Manter silhueta, rosto e paleta coerentes entre frente, costas, esquerda, direita, parado, caminhada e ações.
- **Tamanho real de personagem no jogo ainda depende de verificação em movimento**: mundo em grade lógica de 32×32; sprite poderá ter canvas 64×64 com espaço para golpes, desde que não corte mãos/ferramentas. O protótipo de ações v0.1 usa canvas maior 96×128 e precisa de normalização de renderização/pivô antes da integração.
- Personagem legível à escala normal e em zoom de câmera 2×–4× via nearest-neighbor; nunca minúscula.

## 3. Mapa, exploração e região inicial

**Região base:** mapa ampliado em `a_detailed_illustrated_game_map_poster_in_a_pixel.png` (conceitual; não é tilemap diretamente navegável).

Áreas aprovadas/consideradas no mapa ampliado:

1. **Sua propriedade**: casa inicial, terreno para cultivar, oficinas e extensões; local seguro.
2. **Campos abertos**: espaço para construção, caminhos, celeiros, cercas e futuras casas de NPCs.
3. **Floresta antiga**: árvores, galhos, plantas, exploração e rotas escondidas.
4. **Montanhas e mina**: pedras, minerais e aumento gradual do risco.
5. **Lago do Pinheiro / pesca**: água e coleta, pesca futura.
6. **Rio central e pontes**: divisão visual do território com conexões reais.
7. **Vila**: estruturas exploráveis, comércio e NPCs futuros.
8. **Acampamento de sobreviventes**: sociabilidade, pedidos e integração comunitária futura.
9. **Ruínas antigas**: exploração e mistério.
10. **Área perigosa**: inimigos e hordas (detalhamento futuro).
11. **Pântano**: riscos e recursos especiais futuros.
12. **Posto abandonado**: sucata garantida e local para exploração.
13. **Costa**: expansão, pesca e coleta futura.

**Regra de escala:** não condensar todo o mapa em uma tela; o personagem caminha com câmera acompanhando e transições fluidas. A região inicial poderá começar pequena em implementação e crescer sem refazer as coordenadas. **Reservar grandes áreas edificáveis** (conceito visual: aproximadamente 40% do mapa inicial potencialmente personalizável, valor em estudo), mantendo florestas e pontos de interesse.

## 4. Ciclo central e vertical slice

`Explorar → coletar galhos/pedras/fibras → fabricar machadinha + picareta + martelo → cortar árvore + minerar → processar troncos → fabricar bancada → encontrar sucata → montar serrote → serrar tábuas → construir/reparar abrigo → salvar → continuar.`

A primeira versão integrada deve permitir ao usuário realizar esse ciclo sem telas simuladas. Como metas posteriores: cultivar, armazenar, mobiliar, interagir com um sobrevivente e explorar região perigosa.

### Regras de interação

- Movimento livre por WASD/setas, colisões com mundo e alvos.
- `E` interagir/coletar; `Espaço` ou ação contextual para ferramenta; `B` construção; atalhos 1–4/seleção na hotbar; `Esc` fechar/cancelar (remapeáveis para não quebrar controles existentes).
- Ação requer ferramenta correta, alcance, linha livre de obstáculos, energia e alvo em estado válido.
- Modelo de estado: `ocioso → validar → preparar → contato → atualizar alvo e ferramenta → recuperação → conclusão`.
- Modificações e consumo **no ponto de contato ou conclusão especificado**; cancelar antes não consome recursos; não disparar duas vezes.
- Feedback de erro legível: `Faltam 2 tábuas`, `É necessário um serrote`, `Sua picareta precisa de reparo`.
- Drops caem no mundo se inventário estiver cheio, mantidos no save com ids únicos.

## 5. Ações, alvos e animações

| Ação | Alvo | Progresso visual | Conclusão |
|---|---|---|---|
| Cortar | árvore pequena/média | intacta → marcada → fendida → queda/toco | troncos, galhos e eventualmente folhas |
| Minerar | rocha/depósito | intacto → rachado → fragmentado → removido | pedras/minérios |
| Serrar | tronco e ferramenta/estação | tronco íntegro → corte parcial → serragem | tábuas; rendimento conforme ferramenta |
| Construir | peça em prévia | fantasma → fundação → estrutura → acabada | peça persistente, colisão atualizada |

Efeitos planejados: lascas de madeira, folhas, pó de pedra, pequenos fragmentos, serragem, impacto discreto, partículas de montagem, sons e barra de progresso contextual. Som pode atrair ameaças em fase futura. Usar feedback visual além de cor para acessibilidade.

### Contrato de animações (planejamento)

- Quatro direções: baixo, cima, esquerda, direita.
- Ações prioritárias: cortar, minerar, serrar, construir. Oito quadros por direção são a referência inicial: **4 × 4 × 8 = 128 quadros**.
- Referência temporal: perto de 10 fps, ajustável; fases preparação, impacto e recuperação; mantenha pivô dos pés estável para evitar saltos na tela.
- Os 128 quadros do protótipo existente são **composições experimentais**, não animações manuais finais. Pôsteres são ilustrações, não sprites recortados com pivô validado.
- O frame exato de impacto deve ser **configurável por ação**, preferindo o índice 4 (zero-based) do laboratório v0.1 até revisão dos quadros definitivos, evitando decisões conflitantes espalhadas pelo código.

## 6. Recursos e materiais

### Recursos brutos

Galho, madeira bruta, tronco, fibra vegetal, folhas, pedra pequena/grande, argila, areia, sucata metálica, carvão vegetal, água, minério de ferro superficial/profundo, plantas silvestres; outros recursos (frutas, sementes, cogumelos, cobre, ouro etc.) entram após núcleo inicial.

### Materiais processados

Corda vegetal, pedra lascada, cabo, cavilhas, tábua bruta, tábua regular, viga, lâmina de sucata, barra de ferro, pregos, blocos de pedra, tijolos crus/cozidos, vidro (tardio), telhas, tecido simples e compostagem (posterior).

### Ferramentas (núcleo)

- **Primitivas:** faca improvisada, machadinha de pedra, picareta rudimentar, martelo rudimentar, pá e tocha.
- **Intermediárias:** serrote improvisado, enxada, machado/picareta reforçados, martelo de carpinteiro.
- **Avançadas:** serrote reforçado, machado/picareta de ferro, martelo e pá de ferro.
- **A picareta é obrigatória no início**; é produzida a partir de recursos comuns, não exige minério para obter o primeiro minério.
- Durabilidade e reparo sem exclusão definitiva da ferramenta quando chega a zero; melhoria deve valer a pena em tempo, energia e rendimento.

### Receitas canônicas do primeiro teste

| Item/receita | Custo | Resultado/estação |
|---|---|---|
| Corda vegetal | 3 fibras | 1 corda; mãos |
| Pedra lascada | 2 pedras | 1 pedra lascada; mãos |
| Cabo | 1 galho | 1 cabo; mãos |
| Cavilhas | 1 galho | 4 cavilhas; mãos |
| Machadinha de pedra | 1 cabo + 1 pedra lascada + 1 corda | 1 machadinha; mãos |
| Picareta rudimentar | 1 cabo + 2 pedras lascadas + 1 corda | 1 picareta; mãos |
| Martelo rudimentar | 1 cabo + 1 pedra + 1 corda | 1 martelo; mãos |
| Tábuas brutas | 1 tronco | 2 tábuas; machadinha |
| Bancada simples | 4 tábuas brutas + 4 cavilhas | 1 bancada; martelo |
| Lâmina de sucata | 1 sucata metálica | 1 lâmina; bancada (processo lúdico abstrato) |
| Serrote improvisado | 1 lâmina + 1 cabo + 1 corda | 1 serrote; bancada |
| Tábuas regulares | 1 tronco | 3 com serrote improvisado / 4 com reforçado |

**Este quadro substitui valores diferentes vistos em pôsteres conceituais antigos.** Balanceamento permanece editável, mas há uma fonte inicial única para o Codex.

### Balanceamento provisório

| Objeto/ação | Resistência/tempo | Resultado | Custo energia |
|---|---|---|---|
| Árvore pequena | 4 golpes com machadinha | 1–2 troncos e 2–3 galhos | 2/golpe |
| Árvore média | 7 golpes | 2–3 troncos e 3–5 galhos | 2/golpe |
| Rocha comum | 5 golpes com picareta | 3–5 pedras | 3/golpe |
| Ferro superficial | 7 golpes com picareta inicial | 1–2 minério | 3/golpe |
| 1 tronco na machadinha | ~4 s | 2 tábuas brutas | 5 |
| 1 tronco no serrote improvisado | ~3 s | 3 tábuas regulares | 4 |
| 1 tronco no serrote reforçado | ~2 s | 4 tábuas regulares | 3 |
| Colocar módulo | ~1,5–2,5 s | 1 peça | configurar |

Energia inicial de referência: **100**. Duração de referência machadinha/picareta iniciais: **45 impactos**; serrote inicial **25 troncos**; martelo inicial **60 módulos**. Melhorias de ferramentas podem alcançar **100–120 impactos**. Tempo médio desejado para o primeiro abrigo: **20–35 min** de jogo ativo, sujeito a playtests.

## 7. Estações de trabalho

1. **Bancada simples:** reparo e fabricação de ferramentas, peças, serrote e móveis básicos.
2. **Bancada de carpintaria:** melhoria de tábuas, vigas, portas, janelas, mobiliário e componentes estruturais.
3. **Forja rústica:** ferro, ferragens e ferramentas avançadas (após vertical slice).
4. **Forno de materiais:** argila, tijolos, telhas (após vertical slice).
5. **Mesa de construção:** projetos prontos, consulta dos custos totais (pode ser uma aba antes de ter objeto próprio).
6. **Estações posteriores:** estação de costura, cozinha, reservatório, compostagem, tear e horta elevada.

Baús e armazenamento próximos poderão abastecer bancadas, respeitando distâncias e permissão (fase de qualidade de vida após crafting básico).

## 8. Construção: dois modos, um único sistema

### Modo livre

Selecionar peça → fantasma/grade → girar → verificar suporte/colisão/acesso e materiais → confirmar → animação de construção → criar e persistir peça. Peças: piso, parede, canto, porta, janela, cerca, portão, telhado, escada, móveis e decorações. Divisórias e aposentos podem ser alterados.

### Modo projetos prontos

Escolher esquema (abrigo simples, cabana de madeira, casa de pedra, celeiro, oficina, estufa, poço, galpão, moinho e torre de vigia como exemplos) → visualizar localização/custo → colocar etapas modularmente → permitir reformar e ampliar depois. Custos **idênticos** ao modo livre; modelo pronto é apenas uma receita espacial.

### Regras técnicas

- Mundo em grid lógico de 32×32; 32×64 para paredes altas; arte maior ancorada no mesmo grid.
- Divisão em camadas: terreno, piso, estruturas/parede, personagens e objetos, cobertura, detalhes/partículas. Renderização deve cuidar da profundidade em Y.
- Telhado independente: remover/ocultar/translucidar ao entrar ou apontar dentro da casa; preservar estilo terracota.
- Encaixes devem permitir cantos, L, T, cruzes, finais e junções de telhado/varanda. Os atlas de conceito **ainda não garantem** conexões sem emendas.
- Comando `B` abre construção; fantasma sinaliza estado válido/inválido/falta de materiais, também em texto/ícone.
- Bloquear sobreposição, construção em água sem ponte, portas inacessíveis, NPC/personagem preso e estruturas sem suporte.
- Desmontar recupera provisoriamente **60%** de componentes, sem exceder custo nem duplicar itens.
- Toda parede, baú, móvel e plantação deve ser persistente em saves com IDs estáveis.

### Economia inicial de construção (a partir da especificação mais recente)

| Módulo | Materiais |
|---|---|
| Piso rústico 1×1 | 1 tábua bruta |
| Parede 1 módulo | 2 tábuas brutas + 1 cavilha |
| Porta simples | 3 tábuas brutas + 2 cavilhas |
| Janela com veneziana | 2 tábuas brutas + 1 cavilha |
| Cobertura simples 1×3 | 2 tábuas brutas + 3 fibras |

**Abrigo inicial 3×3:** 9 pisos, 6 paredes, 1 porta, 1 janela, 3 coberturas = **32 tábuas brutas, 9 cavilhas e 9 fibras**. O jogo começa preferencialmente perto de casa abandonada **reparável com menor custo**, e essa cabana nova é um teste de construção. A casa-modelo maior do protótipo visual mede **8×6 tiles**, com quarto, sala/cozinha e oficina; **não** confundir a casa 8×6 com o custo 3×3.

## 9. Inventário, HUD, crafting e interface

**Arte aprovada:** `a_detailed_colorful_pixel_art_game_ui_concept_ima.png`, referência para aparência, não HTML/GUI final.

Componentes visuais:

- HUD: retrato, saúde/energia, horário e dia/estação do ano (clima e calendário posterior), barra rápida com itens selecionáveis e quantidades.
- Inventário: grade com pilhas/quantidades, arrastar e soltar, ícone de personagem, acessórios e espaços de equipamento.
- Ferramenta: nome, tier, função, durabilidade atual/máxima, dicas e descrição contextual.
- Crafting: abas por categoria, lista pesquisável, receita, disponibilidade dos ingredientes, quantidades, botão fabricar, feedback de material faltante e estação necessária.
- Bancadas: mesma linguagem visual, receitas extras e tempo de processamento.
- Construção: categorias, miniatura e prévia do edifício, totalizadores de materiais, estado de colocação e progresso de obra.
- Baús: mover pilhas sem duplicação; hotbar permanece funcional.
- Interface com molduras rústicas, madeira escura, painéis creme, vinhas/pequenos detalhes em verde, boa leitura e espaçamento; deve escalar em telas menores.

O conceito mostra moeda, fome/energia, dias etc.; **não assumir** que todos os sistemas estão implementados ou aprovados em números detalhados.

## 10. Agricultura e animais (planejamento posterior)

- Preparar canteiros, plantar sementes, regar, ver crescimento em estágios, colher produtos.
- Exemplos visuais: cenoura, alface, tomate, milho, batata, trigo e outras plantas.
- Variáveis futuras: duração do crescimento, clima/estações, fertilidade, irrigação e produtos processados.
- Animais domésticos/fazenda e relacionamento: interagir, alimentar e cuidados, só após núcleo estar estável.

## 11. NPCs, comunidade, ameaças e eventos (fases futuras)

- **NPCs sociáveis e hostis**: personalidades, rotinas, diálogos, competências e relacionamentos.
- Atribuição de funções: cuidar da horta, produzir, patrulhar, trabalhar em oficinas, manter casas.
- Casas atribuíveis aos NPCs; construção livre pode desenvolver vila/comunidade.
- Hordas/eventos de ameaça ocasionais; intensidade não deve anular a atmosfera tranquila.
- Inimigos gerados apenas após definir sua natureza, combate e regras de dificuldade, com salvamento e equilíbrio.
- Comércio e quests simples na vila ou no acampamento, depois do primeiro NPC integrado.

## 12. Mundo persistente e engenharia

Salvar/carregar: personagem (posição, direção, aparência, energia), inventário, equipamentos e desgaste, tempo, árvores/rochas e resistência restante, drops no chão, estado de plantio, estações/filas, posições de objetos, estado de módulos/portas/baús, interiores e telhados; NPCs e missões quando existirem.

IDs estáveis para objetos e transações; consumo idempotente de recursos; impedir segundo drop em alvo destruído; evitar crafting duplo ao apertar rápido/abrir e fechar menus. Usar dados configuráveis para itens, receitas, ações e construção; validar dependências e dados referenciados. Criar migrações de save quando evoluir o schema.

## 13. Prioridade de implementação

**P0: diagnóstico do repositório existente, preservação e protótipo estável.**

**P1: movimento, colisão, câmera, escala legível, interação, HUD mínima, mapa inicial explorável.**

**P2: inventário, drops, ferramentas iniciais inclusive picareta, crafting mãos e árvore/rocha com estados.**

**P3: processamento de madeira, bancada simples, serrote, UI crafting e durabilidade.**

**P4: paredes/pisos/portas e telhado em grade, modo livre, projeto pronto 3×3, salvar/recarregar.**

**P5: refinamento das animações, partículas, sons, visual de construções e ergonomia.**

**P6: cultivo básico e crescimento de plantas, tempo de mundo, móveis e baús.**

**P7: NPC inicial, comunidade básica, vila e eventos de risco, depois aprofundamento.**

Evitar mapa gigantesco totalmente preenchido no primeiro sprint: entregar pequena fatia funcional e expandir de modo incremental sem perder o layout geral.

## 14. Critérios de sucesso da primeira versão integrada

1. Inicializar com inventário vazio e personagem claramente visível, em quatro direções.
2. Encontrar galhos, pedra e fibras garantidos perto da casa.
3. Fabricar machadinha e picareta com recursos coletados.
4. Derrubar árvore e minerar rocha com progresso, animação básica e drops sem duplicação.
5. Transformar madeira em tábuas e construir bancada.
6. Obter sucata em posição acessível e fabricar serrote.
7. Abrir crafting, conferir materiais e criar item/peça.
8. Colocar piso ou parede no modo livre com colisão correta.
9. Selecionar projeto pronto que usa os mesmos custos da construção manual.
10. Salvar, encerrar, voltar e encontrar mundo/inventário/durabilidade preservados.
11. A arte no jogo parecer com as referências aprovadas, sem personagem ilegível, cortes e objetos gigantes fora de escala.

---

**Documento-mestre consolidado.** Quando outra nota conflitar com esta, consultar `05_DECISOES_E_PENDENCIAS.md`; receitas e números podem ser alterados depois dos testes, mas não silenciosamente por meio de um pôster conceitual.
