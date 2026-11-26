# After Rain Native — V0.01 (experimental)

Base: experimento/godot, Godot 4.4 Standard, Windows x64, renderizador Compatibility.
Não é a V51: não usa seus saves nem contém todos os sistemas de jogo. A cena e as artes originais permanecem intactas.

## Abrir e testar
Importe godot-teste/project.godot no Godot 4.4. F5 inicia a propriedade; WASD/setas movem o personagem. F3 mostra FPS, memória estática reportada pelo Godot e disponibilidade do backend C++. Essa memória não é o consumo total do processo.

Sem DLL, a movimentação segue em GDScript. Para ativar C++, copie o conteúdo do artefato native-extension-windows-x64 (quando o CI estiver verde) para godot-teste, mantendo bin/ e after_rain.gdextension na raiz do projeto. Reinicie o editor e pressione F5.

## Compilação local opcional
Em um terminal PowerShell com Python, Git e Visual Studio C++ Build Tools x64: instale SCons com python -m pip install scons. Execute godot-teste/native/build-windows.ps1. O script baixa a tag godot-4.4-stable, compila em C++20 e só instala o descritor após gerar a DLL. O build inicial é apenas de depuração Windows x64.

O módulo AfterRainMovement calcula a velocidade normalizada; colisões, animações, câmera e entrada continuam no Godot/GDScript. Não se espera ganho relevante de desempenho desse cálculo isolado: a finalidade é validar a integração. Para retirar a extensão, feche o editor e apague after_rain.gdextension e a pasta bin.

## Validação
Após importar o projeto com DLL, execute Godot 4.4 em modo headless com --path godot-teste --script res://tests/native_smoke.gd. O teste exige carregamento da classe e paridade de movimento. Validação visual e exportação do jogo completo ainda são etapas futuras.

## Executável portátil
O workflow também exporta a cena para Windows x64 usando o template debug oficial 4.4. Após validar o executável em modo headless, publica o artefato After-Rain-Native-V0.01-Windows-x64. Extraia o ZIP interno e execute o EXE mantendo PCK e DLL junto dele. Não exige Godot instalado. A versão ainda é experimental e não assinada.

## V0.02
Colisões geradas em runtime pela base dos sprites, limites, pontes, zoom e câmera suave. F4 mostra as formas em vermelho e áreas de ponte em azul. O CI verifica contagem de obstáculos, pontes, limites e presença física da colisão do poço. Não é validação visual completa. A V0.01 continua acessível no commit 17f31618fb01f35ba65cdb38cd3afc75d256cefc. O C++ continua calculando a velocidade; física e câmera usam Godot. Os sistemas de simulação C++ e iluminação ficam para a próxima etapa.

## V0.03 — núcleo do mundo
AfterRainWorld (C++20) replica src/systems/clock.ts, src/systems/calendar.ts, src/weather-model.ts e os parâmetros externos de cor de src/lighting-model.ts no commit V51 ac9e6336930dc050e4448c0cbda818fcdb2b159c. 1 minuto por segundo; dia 1 às 08:00; 28 dias por estação; 112 dias por ano; chuva determinística. Novo sinal novo_dia(dia, chuva) para integrar agricultura posteriormente. HUD, chuva visual e sombras aproximadas no Godot, sem modificar sprites. F6 avança 1 hora, F7 próximo dia às 08:00. Não são sombras de silhueta completas nem simulação agrícola ainda. Sem DLL, prévia estática de dia. Testes verificam viradas de dia/estação/ano, clima, iluminação e limite de calendário; o smoke exportado exige ambos os módulos C++.

## V0.03.1 — revisão visual
Substitui as elipses por projeções alpha das texturas originais, ancoradas na última linha opaca, incluindo o personagem. Shader com amostragem suave e gradiente de densidade. A projeção é recalculada com o sol e limitada à região visível. F8 percorre 9 horários e F9 alterna sombras. Iluminação em C++ usa 18 chaves cromáticas interpoladas e contraste moderado; chuva difunde as sombras. A arte original não foi alterada. Testes de direção, comprimento, cor de pôr do sol, crepúsculo e chuva, além da contagem de objetos no export. Testes headless não garantem aparência ou FPS; precisam de avaliação no Windows.

## V0.04 — horta experimental
19 cultivos com catálogo e sprites originais V51; crescimento, rega por chuva e murcha em C++; preparo, plantio, rega, colheita e rebrota; estoque transacional inicial de 30 tipos; save próprio com backup. Kit provisório, sem animações de ferramentas, adubo, qualidade, economia, coleta, construção ou animais. Ainda não é a entrega da Propriedade completa. CI e revisão visual necessários.

## V0.05 — mochila e regador
Mochila visual de 30 espaços por tipo, barra de 9 referências editáveis e persistentes, ícones e artes originais V51; regador de oito cargas, abastecimento e impacto único no quadro de contato, animação original de nove quadros. Rega repetida não consome carga. Saves anteriores começam vazios e recebem barra padrão. Coleta, ferramentas individuais, animações completas do corpo, qualidade agrícola e fabricação ainda pendentes. Compilação e revisão visual necessárias.

## V0.06 — coleta inicial
Recursos da propriedade reconhecidos pelas artes originais, regras de golpes/drops V51 (ferro inicial fixado pela arte do depósito), machado/picareta/enxada com arco rígido de 9 quadros a 18 fps, contato único C++ para contagem, árvore vira toco, estoque transacional, colisões e sombras sincronizadas, persistência de golpes e remoções. Sem regeneração, replantio, drops no chão, níveis de ferramentas, durabilidade ou animação completa do corpo. Testes e revisão visual necessários.

## V0.07 — fabricação e construção inicial
15 receitas locais da V51, transações, restrições de bancada e ferramenta, tempos para serrar/tábuas/banco. Cinco tipos de construção com custos da V51, prévia, rotação, colisões, porteiras novas interativas, recuperação de materiais e persistência. Arte original de três objetos copiada. Rotação plana provisória; porteira do cenário original, paredes/pisos/telhados, projetos, máquinas, durabilidade, iluminação de construções e UX ainda precisam refinamento. CI e validação visual pendentes.

## V0.08 — interior inicial
Interior 12×10 com recortes e móveis originais V51, circulação delimitada, entrada e saída, luz interna sem chuva, sono ligado ao relógio C++, baú com transferência por quantidade, saves compatíveis com versões anteriores e posição interna. Fogão visual; culinária, edição de móveis, expansão da casa, efeitos sonoros, transições refinadas e revisão visual pendentes. CI necessário.

## V0.09 — criação inicial
Seis abrigos com capacidade/custo V51 e 7 espécies com atlas originais, área de passeio e ciclos de caminhada. Produção diária 06h, cocho, ovos/pato/penas/leite/lã/esterco, carinho, silo, persistência e testes. Alojamento local provisório com corda substitui recrutamento externo apenas nesta fase. Custos de madeira nobre mantidos, mas ainda sem fonte na propriedade (não é jogabilidade completa). Sem montaria, construção por fases, interior individual, portões, qualidade, durabilidade ou ferramentas de ferro completas. Revisão CI e visual pendentes.

## V0.09.1 — correções do CI
Corrige direções constantes (sem chamadas normalized), variável duplicada no smoke, carrega texturas de casa/construção/ferramentas após a importação do Godot, sem modificar os PNGs. CI passa a exigir marcadores de cada sistema e rejeitar erros de script/runtime nos smokes, inclusive do executável. Aguardando nova execução; não certifica visual nem jogabilidade.

## V0.09.2 — ciclo de vida da criação
CI 45535603251: compilação C++ e todos os marcadores de smoke passaram, mas o encerramento acusou dois CanvasItems, texturas e fonte não liberados. A criação de Node2D e Label antes da existência da cena deixava objetos sem pai no teste isolado. Instancia ambos apenas durante setup, com propriedade pela árvore de cena; mantém rejeição de erros e acrescenta log verbose para diagnóstico residual. Nova validação pendente.

## V0.09.3 — compatibilidade do shader exportado
CI 45542084269 aprovou compilação, smoke interno e exportação, mas rejeitou erro shader_compiler.cpp:1274 (custom_samplers) no executável. Remove passagem do sampler integrado TEXTURE a função auxiliar, mantendo nove amostras, pesos e limites UV. Validação exportada e visual pendentes.

## V0.10 — pesca na propriedade
Sessão GDScript baseada nas regras V51 (habitat other, 24% materiais, quatro espécies comuns/incomuns, espera 10–20s, fisgada 3s, disputa até 45s, faixa e progresso); lançamento 1,9s, vara original, linha e boia, água real do mapa, isca consumida, coleta transacional, recordes persistidos. Receitas locais provisórias para vara/isca; sem rede, poses completas, durabilidade, vigor, aprendizagem com NPC, pesca rara em áreas externas, caderno visual ou áudio. Testes CI e aparência pendentes.

## V0.10.1 — correção de compilação da pesca
CI 45823061954 falhou em pesca.gd:192: GDScript não conseguiu inferir o tipo de `t` a partir da propriedade dinâmica `session.age`. Conversão explícita para float; regras e recursos originais mantidos. Nova validação obrigatória antes de avançar para máquinas.
