# Identidade das armas — espada, arco e bumerangue

Etapa local posterior à revisão de ritmo. Sem publicação. O objetivo é dar funções distintas às primeiras três armas e tornar suas melhorias e evoluções reconhecíveis durante a partida.

## Comportamento

| Arma | Função | Melhorias e evolução |
| --- | --- | --- |
| Espada | Corte frontal orientado ao alvo mais próximo; pequeno empurrão abre passagem sem atravessar obstáculos. | Corte Amplo aumenta o setor e o número de alvos. Alcance cresce junto com o arco desenhado. Espadas Duplas produz um segundo corte em sentido visual inverso, após 0,18 s, com 60% do dano. |
| Arco | Ataques à distância direcionados a inimigos concretos. | Disparo duplo/triplo prioriza alvos distintos e concentra as flechas quando há menos alvos. O triplo substitui o duplo. Perfuração continua limitada pelas melhorias e permite atravessar grupos alinhados. |
| Bumerangue | Atravessa grupos na ida e pode atingir novamente no retorno. | Velocidade e alcance alteram o voo. Trajetória Cruzada lança dois bumerangues em sentidos opostos, com retorno ao jogador. A evolução substitui o lançamento duplo; não soma mais dois projéteis. |

A espada deixa de acertar automaticamente inimigos atrás do setor escolhido. O segundo corte preserva o ponto e a direção definidos no início do ataque; inimigos podem sair da área antes dele. O arco mantém as regras existentes de precisão, colisão e dano: mirar em um alvo não garante acertá-lo se outro inimigo ou obstáculo interceptar a flecha. O retorno do bumerangue tem um percurso máximo maior para acompanhar o jogador em movimento, sem criar projéteis permanentes.

## Apresentação

Flechas agora usam uma textura pequena própria, gerada em memória, em vez de reutilizar a lança. Há versões normal e dourada. Projéteis recebem rastros direcionais; bumerangues usam uma indicação diferente durante o retorno. Arcos de corte acompanham alcance e abertura reais. As três evoluções têm destaque dourado e estrela, nome e descrição no Arsenal.

Espada, arco e bumerangue têm sons procedurais distintos. Escolher uma dessas evoluções toca uma sequência própria. Reprodução de sons segue novos eventos, sem repetir o mesmo ataque ao renderizar uma pausa. Não foram substituídas artes PNG oficiais.

## Integração

- Novos módulos `weapon-identity.ts` e `weapon-effects.ts` centralizam descrições, geometria do corte e texturas de projéteis.
- Os IDs das armas e melhorias foram preservados, assim como os quatro espaços do Arsenal e o espaço separado dos pets.
- Novos cortes atrasados salvam a direção. Ataques de saves anteriores sem essa direção continuam aceitos e concluem com o comportamento anterior. Direções inválidas são rejeitadas pelo validador.
- O save continua preservando projéteis, recargas, acertos de ida/volta e a aleatoriedade. Não houve mudança de versão de save.
- Pools, limites de inimigos/projéteis/efeitos e colisão com os mapas permanecem ativos.

## Validação

92 testes aprovados em seis arquivos: identidade das armas, dungeons, ritmo, áudio, migração e recuperação de save. Os dez testes novos cobrem setor frontal, ampliação do corte, empurrão, segundo golpe após carregar, compatibilidade antiga, direção corrompida, mira das flechas, substituição do duplo, sentidos dos bumerangues, acertos por trecho e retorno mais longo.

TypeScript e build de produção aprovados. Permanece o aviso conhecido do Vite sobre tamanho do bundle.

A verificação no navegador usa inimigos e melhorias preparados para observar as evoluções simultâneas. A primeira tentativa procurava três flechas em voo depois de elas já terem atingido o inimigo próximo; a preparação foi ajustada para incluir a melhoria de perfuração. O comportamento de consumo das flechas foi mantido. Outra tentativa expôs dependência do sorteio aleatório na preparação de quatro armas: o teste agora usa uma semente fixa e um limite maior de escolhas, sem alterar os pesos do jogo.

Ainda falta avaliação manual de dificuldade e equilíbrio das combinações em partidas completas. A verificação automatizada não representa uma avaliação humana de som ou de toda a duração dos dois modos.

A execução final concluiu **22 verificações integradas no Chromium**, sem erros JavaScript, HTTP ou WebGL registrados. Inclui as três evoluções em uso simultâneo, indicação no Arsenal, carga de 240 inimigos com pools limitados, pausa, retomada, pets e entrega de resultado. A medição de atualização JavaScript não representa FPS na GPU nem teste de hardware Windows.

[Captura das evoluções](armas-evoluidas.png) · [Resultados integrados](validacao.json)
