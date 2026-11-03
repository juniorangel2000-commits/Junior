# JARDIM DEPOIS DA CHUVA
# IMPLEMENTAÇÃO INTEGRADA — SISTEMA COMPLETO DE MINERAÇÃO + NPC FERREIRO

## INSTRUÇÃO PRINCIPAL

Quero que você implemente no projeto existente do jogo **Jardim Depois da Chuva** dois sistemas completos e totalmente integrados:

**SISTEMA 1 — MINERAÇÃO SUBTERRÂNEA**
Um grande mapa subterrâneo contínuo, com escavação livre, blocos destrutíveis, minérios aleatórios, regeneração parcial de galerias, perigos ambientais, inimigos, coleta de recursos e persistência.

**SISTEMA 2 — NPC FERREIRO**
Um personagem com animações e movimentação em oito direções, rotina semanal, deslocamento entre mapas, mineração real, inventário próprio, depósito particular, oficina funcional, expedições conjuntas, comportamento defensivo, missões, resgate do jogador e relacionamentos sociais simples.

OS DOIS SISTEMAS DEVEM FUNCIONAR JUNTOS.

Não quero dois protótipos independentes, dois sistemas de mineração separados ou apenas documentação. Quero que essas funcionalidades sejam implementadas efetivamente no jogo existente.

Leia todas as especificações antes de começar.

---

# PARTE 1 — REGRAS DE PRESERVAÇÃO

## 1.1. Inspeção inicial

Antes de modificar o código:

1. Identifique a engine, linguagem e estrutura do projeto.
2. Localize o sistema de mapas e transições.
3. Localize o sistema de tiles, colisões e navegação.
4. Localize as ferramentas e a lógica de mineração existentes.
5. Localize o inventário, os recursos e seus identificadores.
6. Localize o relógio, calendário e salvamento.
7. Localize o sistema de NPCs e suas animações.
8. Localize a Vila, o ferreiro e a região destinada à mina.
9. Localize os sistemas de combate, zumbis, iluminação e diálogos.
10. Identifique quais funcionalidades já existem e quais ainda precisam ser criadas.

Não suponha que uma funcionalidade já exista sem verificar.

## 1.2. Restrições obrigatórias

- Preserve os cenários aprovados.
- Preserve os personagens e suas características visuais.
- Preserve todos os sprites oficiais existentes.
- Não substitua arte aprovada por placeholders como resultado final.
- Não modifique receitas, itens ou sistemas que não estejam relacionados à implementação.
- Não modifique as regras das picaretas.
- Não crie novos níveis, atributos ou categorias de picaretas.
- Não crie um sistema paralelo de inventário para o jogador.
- Não crie um sistema paralelo de combate.
- Não duplique recursos ou identificadores de itens.
- Não crie novos NPCs sem necessidade e autorização.
- Não adicione minérios não aprovados.
- Não reconstrua todo o jogo.
- Preserve a compatibilidade das partidas salvas sempre que tecnicamente possível.
- Evite dependências novas desnecessárias.

Faça alterações modulares, reutilizando os sistemas existentes.

**IMPORTANTE SOBRE O CODEX:** trabalhe com eficiência. Inspecione somente os arquivos relevantes e execute testes direcionados. Não repita auditorias completas do projeto a cada alteração.

---

# PARTE 2 — ESTRUTURA DA MINA ABANDONADA

## 2.1. Localização

A mina abandonada deve ficar integrada à região montanhosa do mundo, próxima ao rio, respeitando a organização geográfica do projeto.

Utilize o cenário de entrada existente, caso já tenha sido criado.

Não altere desnecessariamente a localização ou a estrutura de outros cenários.

## 2.2. Um único mapa subterrâneo

REGRA DEFINITIVA:

**A MINA DEVE SER UM GRANDE MAPA SUBTERRÂNEO CONTÍNUO.**

Não dividir a mina em vários andares independentes.

Não criar menus de escolha de profundidade.

O jogador deve caminhar naturalmente pelas galerias e avançar para regiões mais profundas através de túneis conectados.

A mina precisa transmitir a sensação de uma grande estrutura subterrânea abandonada, explorável e parcialmente escavável.

## 2.3. Elementos ambientais

Incluir, aproveitando os assets existentes:

- Entrada principal.
- Corredores de mineração.
- Galerias secundárias.
- Bifurcações.
- Paredes rochosas.
- Regiões de escavação.
- Suportes de madeira.
- Trilhos antigos.
- Carrinhos de minério abandonados.
- Equipamentos de mineração antigos.
- Lanternas e outras fontes de iluminação.
- Estruturas danificadas.
- Passagens bloqueadas.
- Salas abandonadas.
- Regiões de risco.
- Espaços para acontecimentos especiais.

Manter a pixel art detalhada, top-down e coerente com o estilo visual já aprovado para Jardim Depois da Chuva.

Se não houver assets adequados, reutilize os compatíveis ou utilize o fluxo de criação de sprites disponível no projeto. Não considere elementos artísticos concluídos quando ainda dependerem de assets ausentes.

---

# PARTE 3 — SISTEMA DE ESCAVAÇÃO

## 3.1. Escavação bloco por bloco

O jogador deve poder utilizar suas picaretas existentes para destruir blocos de rocha e abrir caminhos subterrâneos.

Funcionamento necessário:

1. Identificar o bloco selecionado.
2. Verificar se é escavável.
3. Validar alcance e ferramenta pelo sistema existente.
4. Executar a animação de mineração.
5. Aplicar o dano de mineração.
6. Mostrar rachaduras progressivas.
7. Destruir o bloco ao atingir o limite necessário.
8. Gerar o recurso correspondente.
9. Permitir a coleta pelo jogador.
10. Remover a colisão do bloco destruído.
11. Atualizar o autotiling das paredes vizinhas.
12. Atualizar a navegação dos personagens e inimigos.
13. Salvar permanentemente a alteração.

O espaço escavado deve se tornar caminhável imediatamente.

Não permitir que blocos destruídos continuem bloqueando o jogador por falhas de colisão.

## 3.2. Três categorias de regiões

**CATEGORIA A — Estruturas protegidas**

Inclui corredores principais, paredes estruturais, suportes indispensáveis, acessos obrigatórios e regiões críticas.

Não podem ser destruídos.

**CATEGORIA B — Escavação permanente**

O jogador pode destruir blocos permitidos e abrir caminhos.

Esses caminhos permanecem escavados definitivamente.

**CATEGORIA C — Galerias secundárias renováveis**

Permitem escavação e também regeneração parcial de blocos, conforme regras específicas.

Essas três categorias não podem ser confundidas durante a geração ou o salvamento.

## 3.3. Requisitos técnicos

- Colisões coerentes.
- Autotiling atualizado.
- Animações e efeitos de impacto.
- Recursos sem duplicação.
- Persistência de túneis.
- Navegação atualizada localmente.
- Destruição segura de blocos adjacentes.
- Compatibilidade com as ferramentas existentes.

Não atualizar o mapa inteiro após destruir cada bloco quando uma atualização localizada for suficiente.

---

# PARTE 4 — MINÉRIOS E RECURSOS

## 4.1. Materiais oficiais

Utilizar exclusivamente:

- Pedra — recurso comum.
- Ferro — minério comum.
- Ouro — minério raro.
- Metal negro — minério extremamente raro.

NÃO ADICIONAR COBRE.

Não inventar outros minérios.

Reutilizar os identificadores, sprites e receitas já existentes.

## 4.2. Distribuição aleatória

Os depósitos devem surgir em posições aleatórias válidas, considerando:

- Profundidade.
- Raridade.
- Tipo de galeria.
- Blocos escaváveis.
- Estado atual da mina.

Ferro será relativamente comum.

Ouro será mais raro.

Metal negro será excepcionalmente raro.

**NÃO GARANTIR METAL NEGRO EM NENHUMA EXPEDIÇÃO.**

Mesmo nas regiões profundas, podem existir galerias completamente sem metal negro.

Não criar depósitos obrigatórios de recursos raros.

As probabilidades devem ser configuráveis, pois os valores numéricos definitivos ainda não foram aprovados.

## 4.3. Profundidade

Criar quatro faixas ambientais dentro do mesmo mapa:

**Superficial**
- Risco menor.
- Melhor iluminação.
- Mais pedra e ferro.
- Menor concentração de zumbis.

**Intermediária**
- Maior complexidade dos túneis.
- Mais escuridão.
- Mais zumbis.
- Possibilidade de ouro.
- Primeiras regiões contaminadas.

**Profunda**
- Perigos mais frequentes.
- Galerias escuras.
- Mais desabamentos.
- Morcegos agressivos ocasionais.
- Maior oportunidade de encontrar recursos raros.

**Extrema**
- Risco elevado.
- Maior concentração de inimigos.
- Condições ambientais perigosas.
- Probabilidade relativamente maior de recursos raros, sem garantias.

Essas faixas são regiões do mesmo espaço subterrâneo, não mapas separados.

---

# PARTE 5 — REGENERAÇÃO PARCIAL DE GALERIAS

Implementar regeneração parcial de blocos em galerias secundárias autorizadas.

ATENÇÃO:

**OS PRÓPRIOS BLOCOS DE ROCHA DEVEM PODER REAPARECER. NÃO APENAS OS MINÉRIOS.**

## 5.1. Condições obrigatórias

A regeneração só ocorre quando:

1. Passar o intervalo necessário de dias dentro do jogo.
2. O jogador sair da mina.
3. O jogador iniciar uma nova expedição.

Não regenerar blocos ao redor do jogador enquanto ele estiver explorando.

## 5.2. Distribuição

Os novos blocos devem aparecer em posições aleatórias válidas.

As probabilidades de minérios devem continuar respeitando raridade e profundidade.

Os intervalos de renovação podem variar conforme os minérios ou regiões.

Esses intervalos ainda não possuem valores oficiais. Criar parâmetros configuráveis.

## 5.3. Proteções

A regeneração nunca pode:

- Fechar a única saída.
- Bloquear corredores principais.
- Apagar permanentemente os caminhos da categoria B.
- Gerar rochas sobre jogadores ou NPCs.
- Destruir estruturas existentes.
- Tornar missões impossíveis.
- Bloquear objetos especiais.
- Aprisionar personagens.
- Impedir acesso a regiões obrigatórias.

Após regenerar, atualizar corretamente colisões, navegação e autotiling.

Salvar datas, posições e estados regenerados para evitar duplicações.

---

# PARTE 6 — PERIGOS SUBTERRÂNEOS

Implementar cinco categorias principais de perigos.

## 6.1. Zumbis

Reutilizar o sistema de zumbis já existente.

Características:

- Podem caminhar pelas galerias.
- Alguns permanecem parados até detectar atividade.
- Podem perceber o jogador pela proximidade.
- A mineração pode produzir sons que atraem zumbis próximos.
- Sua presença aumenta nas regiões profundas.
- Respeitam paredes intactas e caminhos escavados.
- Sua navegação deve reagir às modificações dos túneis.

Não duplicar o sistema de combate.

## 6.2. Desabamentos

Implementar desabamentos localizados.

Sequência obrigatória:

1. Sons de rochas se movimentando.
2. Aviso visual de desabamento.
3. Área de perigo destacada, semelhante aos ataques sinalizados dos chefes das dungeons.
4. Tempo suficiente para sair da região.
5. Queda de rochas.
6. Aplicação de dano.
7. Possível criação de obstáculos temporários em regiões não essenciais.

O dano deve ser ALTO.

A proposta inicial de 15% da vida máxima foi rejeitada pelo usuário.

O valor final ainda não foi aprovado. Deixar configurável, com valor provisório identificado.

Não permitir múltiplos acertos injustos pelo mesmo impacto.

Evitar bloqueios permanentes de rotas obrigatórias.

## 6.3. Ar contaminado

REGRA DEFINITIVA:

**O AR CONTAMINADO CAUSA 2% DA VIDA MÁXIMA POR SEGUNDO DE EXPOSIÇÃO.**

Requisitos:

- Dano contínuo enquanto o jogador estiver na região.
- Cálculo independente da taxa de quadros.
- Sinalização visual.
- Aviso ao entrar.
- Feedback de exposição.
- Interrupção do dano ao sair da região.
- Áreas claramente identificáveis.

Não inventar novos equipamentos de proteção, receitas ou itens consumíveis sem aprovação.

O ferreiro deve reconhecer e evitar essas passagens.

## 6.4. Escuridão progressiva

A visibilidade diminui conforme a profundidade.

Integrar ao sistema de iluminação existente.

Utilizar as fontes de luz já previstas no jogo.

A iluminação deve respeitar paredes e obstáculos quando o sistema existente permitir.

Não tornar todas as galerias completamente invisíveis.

Não substituir o sistema atual de iluminação desnecessariamente.

## 6.5. Morcegos

Implementar três comportamentos:

**Tranquilos**
- Permanecem em áreas de repouso.
- Fogem quando perturbados.
- Não atacam.

**Reativos**
- Normalmente evitam o jogador.
- Podem reagir quando perturbados em seus locais de descanso.

**Agressivos**
- Podem realizar investidas.
- Causam dano leve.
- Mais presentes em determinadas regiões profundas.
- Não devem dominar os combates subterrâneos.

Criar estados de repouso, voo, fuga e ataque, aproveitando sprites e sistemas existentes.

---

# PARTE 7 — NPC FERREIRO: ESTRUTURA GERAL

O ferreiro deverá ser um NPC persistente, capaz de:

- Trabalhar na oficina.
- Caminhar pela Vila.
- Interagir com outros NPCs.
- Viajar entre mapas.
- Explorar a mina.
- Minerar blocos reais.
- Transportar recursos.
- Armazenar materiais pessoais.
- Participar de expedições conjuntas.
- Oferecer pedidos.
- Reagir a perigos.
- Resgatar o jogador.
- Desenvolver relacionamentos sociais simples.

Sua lógica deve ser organizada por estados, prioridades e eventos.

Não criar cópias do ferreiro para simular suas diferentes atividades.

Deve existir apenas uma identidade persistente para esse personagem.

---

# PARTE 8 — ANIMAÇÕES COMPLETAS DO FERREIRO

Quero animações visualmente coerentes com os demais personagens aprovados.

## 8.1. Movimentação

- Parado em oito direções.
- Caminhada em oito direções.
- Mudanças naturais de direção.
- Paradas corretas.
- Transições entre estados.

## 8.2. Trabalho

- Trabalhando na bigorna.
- Utilizando a forja.
- Minerando.
- Recolhendo recursos.
- Organizando ferramentas.
- Guardando recursos.
- Retirando materiais do depósito.
- Preparando equipamentos.

## 8.3. Comportamentos adicionais

- Conversar.
- Cumprimentar moradores.
- Descansar.
- Observar o ambiente.
- Reagir a ameaças.
- Defender-se.
- Fugir.
- Esperar o jogador.
- Retomar a caminhada.

IMPORTANTE:

Verifique os sprites existentes antes de criar novos.

Se houver ferramentas de criação de sprites disponíveis e adequadas, produza os quadros ausentes respeitando rigorosamente a identidade visual do personagem.

Caso contrário, implemente os estados e identifique precisamente os quadros que faltam.

Não utilize animações improvisadas ou movimentação artificial como versão final.

---

# PARTE 9 — ROTINA SEMANAL

O ferreiro deve visitar a mina aproximadamente duas ou três vezes por semana do jogo.

Nos demais dias, trabalha principalmente na Vila.

Os dias específicos e horários devem ser configuráveis.

Uma proposta inicial é:

- Duas viagens regulares por semana.
- Uma terceira viagem ocasional.
- Outros dias de trabalho na oficina.
- Períodos para atividades sociais e descanso.

A rotina precisa utilizar o relógio e o calendário existentes.

## 9.1. Dias de oficina

Pode:

- Preparar ferramentas.
- Trabalhar na bigorna.
- Utilizar a forja.
- Atender o jogador.
- Organizar o depósito.
- Conversar durante intervalos.
- Descansar.

## 9.2. Dias de mineração

Deve:

1. Preparar equipamentos.
2. Sair da oficina.
3. Caminhar pela Vila.
4. Percorrer os mapas intermediários.
5. Chegar à mina.
6. Explorar e minerar.
7. Recolher recursos.
8. Retornar à Vila.
9. Guardar materiais.
10. Retomar a rotina.

O horário de deslocamento deve respeitar a distância real e os caminhos existentes.

---

# PARTE 10 — NAVEGAÇÃO ENTRE MAPAS

Implementar movimentação contínua e coerente entre os cenários.

Quando o jogador estiver no mesmo mapa:

- Movimentação real.
- Animações em oito direções.
- Colisões.
- Desvio de obstáculos.
- Interação.
- Transições reais pelos acessos.

Quando o jogador estiver em outro mapa:

- Simulação leve pelo relógio do jogo.
- Progresso de deslocamento.
- Destino persistente.
- Posição coerente quando o mapa for carregado.

Não manter todos os mapas ativos simultaneamente apenas para simular o NPC.

Não permitir:

- NPC duplicado.
- Teletransporte visível.
- Caminhada através de paredes.
- Desaparecimento sem transição.
- Reinicialização da viagem ao trocar de cenário.

---

# PARTE 11 — OFICINA DO FERREIRO

REGRA DEFINITIVA:

**A OFICINA FICA FECHADA ENQUANTO O FERREIRO ESTIVER AUSENTE.**

Quando estiver viajando, minerando ou fora do horário de atendimento, os serviços comerciais ficam indisponíveis.

Quando retornar e iniciar o expediente, os serviços voltam a funcionar.

Não criar ajudantes substitutos.

Não alterar preços, receitas, itens ou serviços existentes.

Apresentar um aviso simples quando a oficina estiver fechada.

Preservar o interior da oficina já criada.

---

# PARTE 12 — MINERAÇÃO REAL DO FERREIRO

O ferreiro também poderá destruir blocos da mina.

Sua mineração deve utilizar a mesma lógica de escavação existente para o jogador.

Não criar um sistema paralelo.

## 12.1. Recursos permitidos

Mineração automática autorizada:

- Pedra comum.
- Ferro, com limites.

Não permitir mineração automática de ouro ou metal negro pelo ferreiro.

Não permitir mineração de estruturas protegidas nem blocos críticos de missões.

## 12.2. Comportamento

1. Procurar um bloco permitido.
2. Verificar a segurança.
3. Caminhar até uma posição válida.
4. Executar a mineração.
5. Destruir o bloco.
6. Atualizar o cenário.
7. Coletar o material.
8. Adicionar ao inventário pessoal.
9. Procurar outro bloco ou encerrar.

## 12.3. Limitações

Estabelecer limites configuráveis de:

- Blocos minerados por expedição.
- Capacidade de transporte.
- Tempo dedicado à mineração.
- Frequência de trabalho.

Nenhum limite numérico definitivo foi aprovado.

Não permitir mineração infinita.

Se o jogador e o ferreiro atingirem o mesmo bloco, a destruição e a recompensa só poderão acontecer uma vez.

Quando a mina estiver descarregada, a rotina do NPC poderá avançar, mas não deverá inventar recursos nem destruir indiscriminadamente blocos fora de uma simulação validada.

A mineração real deve ser persistente.

---

# PARTE 13 — INVENTÁRIO PESSOAL DO FERREIRO

O ferreiro terá um inventário próprio e persistente.

Recursos minerados pertencem exclusivamente a ele.

Não transferir automaticamente para o jogador.

Não modificar estoque comercial.

Não modificar preços ou receitas.

A capacidade é limitada.

Quando estiver cheio, o ferreiro deve parar de coletar novos recursos.

Utilizar os IDs dos recursos já existentes.

Não criar versões duplicadas de ferro ou pedra.

---

# PARTE 14 — DEPÓSITO PARTICULAR

REGRA DEFINITIVA:

**O DEPÓSITO PARTICULAR FICA DENTRO DA OFICINA EXISTENTE.**

Não construir outro edifício.

Não criar anexo.

Reservar um canto coerente do interior para armazenar os materiais pessoais.

O ferreiro deverá:

- Caminhar até o depósito.
- Guardar recursos.
- Retirar materiais.
- Organizar o armazenamento.
- Utilizar parte dos recursos em trabalhos pessoais.

O jogador não pode acessar esse estoque.

O depósito não está conectado ao comércio.

A capacidade deverá ser limitada e configurável.

## 14.1. Consumo de materiais

Parte da pedra e do ferro poderá ser consumida gradualmente em atividades pessoais da forja.

Essas atividades podem ter animações e registros internos.

Não devem produzir automaticamente mercadorias para o jogador.

## 14.2. Depósito cheio

Quando estiver cheio:

- Priorizar atividades pessoais que consumam materiais.
- Suspender temporariamente a coleta.
- Continuar visitando a mina para inspeções ou pedidos quando apropriado.
- Retomar a mineração quando houver espaço.

Não excluir recursos arbitrariamente para liberar espaço.

---

# PARTE 15 — EXPEDIÇÕES CONJUNTAS OPCIONAIS

O jogador poderá acompanhar o ferreiro até a mina.

Não haverá obrigação de participar.

## 15.1. Liderança dinâmica

REGRA DEFINITIVA:

**DURANTE A VIAGEM, O FERREIRO LIDERA. DENTRO DA MINA, O JOGADOR PODE ASSUMIR A LIDERANÇA.**

Na viagem:

- O ferreiro escolhe a rota.
- Caminha pelos mapas.
- Espera quando necessário.
- Permite que o jogador o acompanhe.

Na mina:

- O jogador pode acompanhar o caminho sugerido pelo ferreiro.
- Pode assumir a liderança.
- Pode explorar livremente.
- Pode pedir ao ferreiro que o acompanhe.

## 15.2. Interações

Implementar opções contextuais equivalentes a:

- Me acompanhe.
- Mostre o caminho.
- Espere aqui.
- Vamos voltar.

## 15.3. Separação

Se o jogador se afastar:

1. O ferreiro tenta acompanhá-lo por caminhos acessíveis.
2. Se não conseguir, procura uma posição segura.
3. Espera por algum tempo.
4. Se a separação continuar, pode retornar à Vila.

Não atravessar paredes nem ignorar perigos para seguir o jogador.

A expedição conjunta pode terminar sem impedir o jogador de continuar explorando.

---

# PARTE 16 — COMPORTAMENTO DEFENSIVO DO FERREIRO

REGRA DEFINITIVA:

**O FERREIRO SOMENTE SE DEFENDE QUANDO AMEAÇADO.**

Não procura zumbis para atacar.

Não inicia combates desnecessários.

Suas prioridades são:

1. Detectar perigo.
2. Evitar a ameaça.
3. Procurar rota segura.
4. Defender-se se necessário.
5. Fugir.

## 16.1. Sobrevivência

REGRA DEFINITIVA:

**O FERREIRO SEMPRE CONSEGUE ESCAPAR DE SITUAÇÕES EXTREMAS.**

Ele não morre e não fica permanentemente incapacitado.

O jogador não precisa resgatá-lo.

Quando estiver visível, a fuga deve acontecer de maneira coerente com o cenário.

Evitar demonstrar invulnerabilidade artificial ou teletransporte na frente do jogador.

Usar resolução fora de cena somente quando necessária para garantir continuidade.

## 16.2. Reação a perigos

- Zumbis: evitar e fugir.
- Desabamentos: abandonar áreas sinalizadas.
- Ar contaminado: procurar rotas alternativas.
- Escuridão: considerar a iluminação existente.
- Morcegos agressivos: afastar-se ou defender-se.

Situações extremas podem encerrar uma expedição.

---

# PARTE 17 — SISTEMA DE PEDIDOS

Criar dois grupos de pedidos opcionais.

## 17.1. Pedidos repetíveis

Exemplos:

- Entregar ferro.
- Recuperar ferramentas perdidas.
- Buscar materiais.
- Investigar uma galeria.
- Recuperar componentes.
- Realizar pequenas entregas.

Recompensas devem respeitar a economia existente.

Evitar gerar quantidades ilimitadas de moedas ou materiais.

## 17.2. Acontecimentos especiais únicos

Preparar e implementar, conforme os recursos disponíveis:

**O carrinho abandonado**
Recuperar componentes de um antigo carrinho de mineração.

**A passagem esquecida**
Investigar uma galeria antiga e descobrir uma região abandonada.

**Os registros da mina**
Encontrar documentos sobre as antigas atividades de mineração.

Acontecimentos únicos não devem se repetir na mesma partida.

Não garantir ouro ou metal negro como recompensa.

Não obrigar o jogador a seguir uma história linear.

---

# PARTE 18 — ESTADOS DAS MISSÕES

Cada pedido precisa ter estados persistentes:

- Disponível.
- Em andamento.
- Em espera.
- Pronto para entrega.
- Concluído.

## 18.1. Expedição interrompida

REGRA DEFINITIVA:

**PEDIDOS INTERROMPIDOS NÃO SÃO CANCELADOS.**

Se o ferreiro fugir ou a expedição terminar:

- O pedido fica em espera.
- O progresso é preservado.
- O jogador pode continuar sozinho.
- O jogador pode retomar com o ferreiro em outro dia.

Não reiniciar objetivos já concluídos.

## 18.2. Diário de atividades

Integrar ao diário existente ou criar o menor módulo necessário caso não exista.

Exibir objetivos e estados.

Evitar marcadores excessivos ou interfaces invasivas.

---

# PARTE 19 — OBJETOS ESPECIAIS DE MISSÃO

REGRA DEFINITIVA:

**AO PERDER TODA A VIDA NA MINA, OBJETOS ÚNICOS DE MISSÃO RETORNAM AO LOCAL ORIGINAL.**

Exemplo:

O jogador encontra um diário antigo, mas é derrotado antes de entregá-lo.

O diário retorna ao local em que foi encontrado.

O jogador poderá buscá-lo novamente.

Regras:

- Não duplicar objetos.
- Manter identificadores únicos.
- Preservar a missão.
- Preservar o progresso já realizado.
- Manter a posição original ou uma posição alternativa segura na mesma região quando necessário.
- Garantir que o objeto continue acessível.

---

# PARTE 20 — SISTEMA DE DERROTA NA MINA

Quando o jogador perder toda a vida dentro da mina, executar um evento especial.

## 20.1. Consequências

**PERDER:**
- Todos os recursos carregados na mochila.
- Inclusive recursos obtidos antes de entrar na mina.

**PRESERVAR:**
- Ferramentas permanentes.
- Equipamentos permanentes.
- Recursos guardados na base.
- Progressão do personagem.
- Túneis escavados.
- Descobertas.
- Progresso de missões.

Objetos únicos de missão retornam ao local original.

Não oferecer recuperação dos recursos comuns perdidos.

## 20.2. Cena de resgate

Executar:

1. Personagem perde toda a vida.
2. Tela escurece.
3. Ações são interrompidas.
4. Tempo avança de maneira coerente.
5. Jogador reaparece em sua própria cama.
6. Ferreiro aparece próximo ao personagem.
7. Inicia diálogo de resgate.
8. Jogador recupera o controle.
9. Ferreiro retoma sua rotina.

Diálogo sugerido:

"Você me deu um susto! Encontrei você desmaiado lá na mina e trouxe você de volta para casa. Parece que perdeu tudo que estava carregando. Tome mais cuidado da próxima vez."

Criar algumas variações naturais.

O evento funciona mesmo que não seja um dia regular de mineração.

Não duplicar o ferreiro nem deixá-lo preso permanentemente na casa do jogador.

---

# PARTE 21 — VIDA SOCIAL DOS NPCs

Criar um sistema reutilizável de relacionamentos persistentes.

REGRA DEFINITIVA:

**POR ENQUANTO, UTILIZAR A OPÇÃO A: INTERAÇÕES SOCIAIS SIMPLES.**

Os relacionamentos podem influenciar:

- Conversas.
- Cumprimentos.
- Frequência de encontros.
- Pequenas animações sociais.
- Comentários sobre acontecimentos registrados.
- Afinidades positivas ou negativas.

NÃO DEVEM alterar:

- Profissões.
- Horários de trabalho.
- Atividades principais.
- Funcionamento de lojas.
- Compromissos essenciais.
- Expedições programadas.
- Economia.

Não implementar nesta etapa um sistema social complexo que reorganize a vida dos moradores.

## 21.1. Conversas espontâneas

Quando dois NPCs existentes estiverem disponíveis e próximos, poderão:

- Aproximar-se.
- Virar-se um para o outro.
- Conversar.
- Fazer pequenos gestos.
- Despedir-se.
- Retomar suas rotinas.

Não criar novos moradores para preencher interações.

## 21.2. Memória

Registrar acontecimentos relevantes como:

- Primeira expedição conjunta.
- Descoberta de galerias.
- Fuga de zumbis.
- Pedidos interrompidos.
- Pedidos concluídos.
- Resgate do jogador.
- Expedição produtiva.
- Relacionamentos entre moradores.

Os diálogos deverão respeitar acontecimentos que realmente ocorreram.

Não gerar lembranças falsas.

Evitar repetições constantes.

---

# PARTE 22 — PERSISTÊNCIA COMPLETA

Todos os sistemas precisam utilizar salvamento consistente.

Salvar, conforme necessário:

**Mina**
- Blocos destruídos.
- Túneis escavados.
- Blocos regenerados.
- Recursos e depósitos minerais.
- Histórico de renovação.
- Regiões descobertas.
- Objetos únicos.
- Estados de eventos.

**Ferreiro**
- Localização.
- Mapa atual.
- Destino.
- Estado da rotina.
- Horário e calendário.
- Inventário pessoal.
- Depósito particular.
- Estado da expedição conjunta.
- Pedidos oferecidos e aceitos.
- Memórias relevantes.
- Relacionamentos sociais.

**Jogador**
- Progresso de missões.
- Descobertas.
- Recursos e equipamentos preservados.
- Consequências da derrota.

Criar mecanismos de migração ou valores padrão seguros quando uma partida antiga não possuir os novos dados.

Não permitir que carregar e salvar duplique minérios, itens ou personagens.

---

# PARTE 23 — DESEMPENHO E INTEGRAÇÃO

O sistema deve funcionar em um mundo aberto com vários cenários.

Prioridades:

- Simulação leve de NPCs fora do mapa ativo.
- Navegação eficiente.
- Atualização localizada de colisões.
- Autotiling sem reconstruções completas.
- Iluminação otimizada.
- Ativação seletiva de inimigos.
- Salvamento incremental quando apropriado.
- Limites de processamento para sistemas ambientais.
- Evitar múltiplas instâncias do mesmo NPC.
- Evitar cálculos desnecessários em mapas descarregados.

Reaproveitar a mesma lógica de mineração para jogador e ferreiro.

Reaproveitar a infraestrutura de rotina do ferreiro para futuros NPCs, sem implementar comportamentos complexos para todos eles agora.

---

# PARTE 24 — CRITÉRIOS DE ACEITAÇÃO

Considere o sistema de mineração funcional somente quando for possível:

1. Entrar na mina.
2. Explorar suas galerias.
3. Minerar blocos individuais.
4. Abrir passagens caminháveis.
5. Coletar pedra, ferro, ouro e metal negro conforme raridade.
6. Salvar e recuperar túneis escavados.
7. Regenerar parcialmente galerias autorizadas.
8. Enfrentar zumbis.
9. Escapar de desabamentos sinalizados.
10. Receber dano correto do ar contaminado.
11. Utilizar iluminação.
12. Encontrar morcegos com comportamentos diferentes.
13. Sair da mina sem perder as alterações.

Considere o sistema do ferreiro funcional somente quando ele conseguir:

1. Trabalhar na oficina.
2. Caminhar com animações coerentes.
3. Seguir sua rotina semanal.
4. Viajar entre mapas.
5. Fechar a oficina durante suas ausências.
6. Minerar blocos permitidos.
7. Guardar recursos no inventário pessoal.
8. Depositar materiais na própria oficina.
9. Participar de expedições conjuntas.
10. Alternar liderança com o jogador.
11. Esperar ou retornar quando houver separação.
12. Fugir de situações extremas.
13. Oferecer pedidos repetíveis.
14. Participar de acontecimentos únicos.
15. Preservar pedidos interrompidos.
16. Participar da cena de resgate do jogador.
17. Conversar com outros NPCs.
18. Preservar seu estado ao salvar e carregar.

NÃO MARCAR COMO CONCLUÍDA UMA FUNCIONALIDADE QUE AINDA NÃO FUNCIONE REALMENTE.

---

# PARTE 25 — PLANO DE IMPLEMENTAÇÃO OBRIGATÓRIO

Quero implementar os dois sistemas, mas sem tentar modificar todo o projeto de uma única vez.

Organize o trabalho nesta sequência:

## FASE 1 — ANÁLISE E INTEGRAÇÃO

- Identificar sistemas existentes.
- Localizar arquivos relevantes.
- Confirmar dependências.
- Determinar quais componentes podem ser reutilizados.
- Criar um plano técnico curto.

Não fazer auditoria global desnecessária.

## FASE 2 — MINA E ESCAVAÇÃO

- Integrar a entrada da mina.
- Criar o ambiente subterrâneo contínuo.
- Implementar blocos escaváveis.
- Integrar as picaretas existentes.
- Atualizar colisões e autotiling.
- Garantir persistência.

## FASE 3 — RECURSOS E REGENERAÇÃO

- Distribuição aleatória.
- Profundidade e raridade.
- Coleta de recursos.
- Regeneração parcial.
- Proteção de corredores e acessos.

## FASE 4 — PERIGOS

- Zumbis subterrâneos.
- Ruído de mineração.
- Desabamentos.
- Ar contaminado.
- Escuridão.
- Morcegos.

## FASE 5 — FERREIRO: MOVIMENTAÇÃO E ROTINA

- Estados e animações.
- Calendário semanal.
- Caminhada entre mapas.
- Navegação.
- Oficina aberta e fechada.
- Salvamento.

## FASE 6 — FERREIRO: MINERAÇÃO E INVENTÁRIO

- Mineração real limitada.
- Inventário pessoal.
- Transporte de recursos.
- Depósito interno na oficina.
- Trabalhos pessoais.
- Limites de armazenamento.

## FASE 7 — EXPEDIÇÕES CONJUNTAS

- Convites.
- Caminhada conjunta.
- Liderança dinâmica.
- Comandos contextuais.
- Separação inteligente.
- Defesa e fuga.

## FASE 8 — MISSÕES E EVENTOS

- Pedidos repetíveis.
- Acontecimentos únicos.
- Diário.
- Estados persistentes.
- Retomada de pedidos.
- Objetos especiais.

## FASE 9 — DERROTA E RESGATE

- Perda dos recursos.
- Preservação de equipamentos.
- Retorno dos objetos especiais.
- Despertar em casa.
- Diálogo com ferreiro.
- Retomada da rotina.

## FASE 10 — RELACIONAMENTOS SOCIAIS

- Afinidade persistente.
- Conversas espontâneas.
- Pequenas animações.
- Memória de acontecimentos.
- Preservação das rotinas principais.

## FASE 11 — POLIMENTO E TESTES

- Corrigir animações.
- Verificar colisões.
- Verificar mudanças de mapa.
- Verificar salvamento.
- Corrigir duplicações.
- Testar expedições interrompidas.
- Testar situações extremas.
- Revisar desempenho.

---

# PARTE 26 — COMO EXECUTAR SEM DESPERDIÇAR CRÉDITOS

Não quero gastar o limite do Codex em análises repetidas ou reescritas desnecessárias.

Siga estas regras:

1. Inspecione apenas os componentes relevantes para cada fase.
2. Preserve o código funcional.
3. Faça alterações pequenas e verificáveis.
4. Conclua uma fase antes de iniciar outra.
5. Utilize testes direcionados.
6. Não refaça assets já aprovados.
7. Não execute verificações globais caras sem necessidade.
8. Registre decisões técnicas relevantes para a próxima sessão.
9. Não esconda funcionalidades incompletas.
10. Não substitua sistemas complexos por soluções falsas ou apenas visuais.

Se o tempo ou limite da sessão terminar, deixe o projeto em estado funcional e informe a fase exata em que parou.

Não abandone uma implementação parcialmente feita para começar outra sem antes estabilizar a anterior.

---

# PARTE 27 — RELATÓRIO AO FINAL DE CADA FASE

Ao terminar uma fase, informe objetivamente:

**FASE CONCLUÍDA:**
Nome da fase.

**ARQUIVOS MODIFICADOS:**
Lista dos arquivos realmente alterados.

**FUNCIONALIDADES IMPLEMENTADAS:**
Somente funcionalidades verificadas.

**TESTES:**
Quais foram executados e quais passaram ou falharam.

**PENDÊNCIAS:**
Problemas reais, parâmetros provisórios e assets faltantes.

**PRÓXIMA FASE:**
Qual será implementada a seguir.

Não afirmar que o jogo está completo quando ainda existirem etapas pendentes.

---

# RESULTADO FINAL DESEJADO

Quero que Jardim Depois da Chuva tenha um sistema de mineração profundo e explorável, onde o jogador possa abrir seus próprios túneis, encontrar recursos, enfrentar perigos e modificar permanentemente o ambiente.

Ao mesmo tempo, quero um ferreiro que pareça um habitante real desse mundo: trabalha, viaja, minera, guarda materiais, participa de expedições, conversa, oferece pedidos, lembra dos acontecimentos e salva o jogador quando ele desmaia na mina.

Tudo deve funcionar como parte de um mesmo jogo, com uma arquitetura integrada, persistente, otimizada e preparada para futuras expansões.

**INICIE PELA FASE 1. APRESENTE UM PLANO TÉCNICO CURTO E, EM SEGUIDA, COMECE A IMPLEMENTAÇÃO DA FASE 2 NA MESMA SESSÃO, SE HOUVER TEMPO E ACESSO AO PROJETO. NÃO PARE APENAS NA DOCUMENTAÇÃO.**

Mantenha o projeto funcional a cada etapa e preserve rigorosamente as decisões aprovadas.