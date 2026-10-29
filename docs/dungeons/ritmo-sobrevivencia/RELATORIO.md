# Ritmo de sobrevivência — etapa 1

Revisão local posterior à preview.12, tomando Vampire Survivors como referência de ritmo e legibilidade do combate. Não publicada. Esta etapa cobre hordas, experiência e feedback de ataques; não significa que todas as características da referência foram implementadas.

## Mudanças

O novo diretor (`src/dungeons/director.ts`) deriva suas decisões do tempo ativo e da rodada salvos. Alterna aproximação por todos os lados, por um flanco e por lados opostos. Cada padrão dura 30 segundos na praça; no estacionamento alterna a cada rodada. Tentativas bloqueadas pelo cenário usam alternativas ao redor do jogador, preservando a distância mínima de surgimento.

Na praça, a pressão cresce em seis estágios (início, 1, 3, 6, 10 e 13 minutos). Os lotes passam de dois inimigos a cada 1,5 segundo a doze a cada 0,65 segundo, respeitando o teto de 240. A cada ciclo de 90 segundos, os dez segundos finais reduzem os reforços a um inimigo a cada 2,8 segundos. Os inimigos existentes continuam perseguindo; esse respiro não pausa o combate. Corredores e brutos ganham presença nas etapas posteriores. Nas 50 rodadas, o crescimento ocorre por grupos de dez rodadas, preservando a condição de limpar a horda e o intervalo entre rodadas.

A experiência deixa de usar crescimento exponencial. O custo passa a `12 + 6 × (nível − 1) + 0,35 × (nível − 1)²`, arredondado para baixo: 12 XP no nível 1 e 480 XP no nível 30. Isso mantém escolhas alcançáveis nas fases posteriores. Experiência já ganha e melhorias salvas são preservadas; a curva nova se aplica ao continuar uma expedição. O progresso permanente permanece separado.

A espada inicial passa de 15 para 22 de dano e de 1,1 para 0,85 segundo de intervalo. Um zumbi comum do início pode cair com um golpe. Isso é um ajuste inicial de balanceamento, sujeito a avaliação em jogo.

Acertos produzem lampejo breve no inimigo, números de dano flutuantes, pequenas marcas de impacto e som procedural com frequência limitada. Espada desenha um arco e martelo uma onda circular. Os sinais de impacto duram até 0,42 segundo e têm limite de 48 registros e 48 textos reutilizados. Pausar congela esses sinais; carregar não reapresenta impactos antigos. O HUD identifica a fase atual da horda.

## Validação

- 62 testes aprovados em cinco arquivos: ritmo, dungeons, áudio, recuperação de save e floresta de acesso.
- Sete testes novos cobrem pressão crescente, padrões e respiros, rodadas, curva de experiência, pausa, continuidade determinística do save e limite dos sinais de impacto.
- TypeScript e build de produção aprovados; permanece o aviso de tamanho do bundle do Vite.
- 20 verificações integradas no Chromium aprovadas, incluindo Arsenal, pets, pausa, save, vitória/derrota, falha de armazenamento, retorno e os novos efeitos visuais. Evidências em [validacao.json](validacao.json).
- [Captura do impacto](impacto-combate.png) feita com inimigo preparado pelo teste. A carga de 240 inimigos também usa estados controlados. Essas verificações não substituem sessões completas de balanceamento nem medições de FPS em computadores Windows.

Uma tentativa inicial de verificação visual perdeu o menu durante a atualização dos arquivos em desenvolvimento. A execução final utilizou outro servidor, com os arquivos estáveis, e concluiu os 20 checks sem erros registrados.

## Próximas etapas

Avaliar uma sessão completa em cada modalidade, ajustando densidade, sobrevivência e quantidade de melhorias obtidas. Depois, revisar diferenças e combinações entre armas, evoluções, encontros especiais e desbloqueios. Pets, sete armas, quatro espaços e os dois modos permanecem ativos nesta etapa. Não foram adicionados chefes ou novos desbloqueios.
