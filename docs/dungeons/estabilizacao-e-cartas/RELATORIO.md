# Sessões completas, cartas, bônus de mapa e chefes

Implementação local posterior à revisão das sete armas. Sem push, release ou executável novo. A publicação disponível continua sendo preview.12.

## Regras finais de cartas e experiência

Nos níveis **10, 30 e 50**, enquanto houver espaço no Arsenal, a escolha apresenta **três armas aleatórias distintas que não estão equipadas**. O jogador recebe apenas a selecionada. Essas telas não misturam melhorias. Havendo espaço posteriormente, o calendário continua em 70, 90 etc. Com quatro armas, aparecem somente melhorias/evoluções. O HUD informa a próxima oferta.

| Carta nova | Raridade | Bônus por melhoria | Limite | Bônus máximo |
| --- | --- | --- | --- | --- |
| Aprendizado Intensivo | Super-rara | +15% de experiência | 4 | +60% |
| Potência de Combate | Super-rara | +15% de dano das armas | 4 | +60% |
| Dano contra Chefes | Super-rara | +20% de dano das armas contra chefes | 4 | +80% |

Os bônus de experiência comum e super-raro se somam: +50% e +60% totalizam +110%, sem multiplicação entre eles. O bônus contra chefes só é aplicado à categoria `boss`; brutos comuns não contam. Pets conservam seus próprios atributos e melhorias.

O custo temporário por nível usa `min(90, floor(12 + 3 × (nível − 1) + 0,15 × (nível − 1)²))` nos dois modos. A praça concede 4 XP básicos por inimigo; o estacionamento mantém 3. Isso deixa o nível 50 alcançável nos dois modos e permite desenvolver as melhorias compatíveis com as quatro armas e o pet durante os quinze minutos. Não há concessão de níveis pela passagem do tempo.

A combinação só é considerada completa quando todas as melhorias compatíveis, inclusive as do pet escolhido, chegam ao máximo. Nesse ponto, o HUD indica “Combinação completa” e novas coletas deixam de provocar níveis vazios, curas repetidas ou pausas inúteis. A progressão permanente continua separada.

## Bônus encontrados no mapa

- **Crítico:** ao coletar, concede 20% de chance de causar 50% mais dano com armas por 12 segundos ativos. Os acertos críticos têm número destacado e exclamação. Pausa suspende o tempo restante.
- **Ímã de Experiência:** ao coletar, marca os cristais de experiência que já estão no mapa e os atrai ao personagem. Não atrai saúde nem outros itens. A atração pode continuar após salvar e carregar, sem duplicar XP. Cristais criados depois não recebem essa marca automaticamente.

Os dois bônus participam do sorteio de eventos junto com saúde, velocidade, ataque e invulnerabilidade. Possuem símbolos próprios no chão e indicação no HUD. São coletáveis, não cartas permanentes.

## Zumbis e chefes

Vida, dano e velocidade dos novos zumbis crescem continuamente com o tempo ativo na praça e a cada rodada no estacionamento. Entre início e final, os multiplicadores são 1 → 2,5 para vida, 1 → 1,75 para dano e 1 → 1,3 para velocidade; corredores e brutos mantêm suas diferenças. Não há salto de atributos de um inimigo já presente quando uma fase muda.

O estacionamento gera exatamente um chefe em cada rodada 10/20/30/40/50, contando-o dentro da horda. A rodada aguarda a derrota dele e dos demais inimigos.

| Rodada | Vida aproximada | Dano de contato antes das defesas |
| --- | ---: | ---: |
| 10 | 816 | 17,3 |
| 20 | 1.392 | 20,7 |
| 30 | 2.114 | 24,3 |
| 40 | 2.984 | 28,1 |
| 50 | 6.000 | 56 |

O chefe final tem aproximadamente o dobro da vida e do dano do anterior. Chefes reutilizam a animação de zumbi, com escala maior, coloração e marca no chão; possuem barra de vida identificada no HUD. Não foram criados ataques especiais ou uma arte exclusiva nesta etapa.

O checkpoint da rodada do chefe e sua vida fazem parte do save. Retomar não gera outro chefe. Saves anteriores em uma rodada de chefe sem o checkpoint exigem sua presença antes de avançar, sem apagar a partida.

## Correções encontradas durante as sessões

- O contador de spawn ficava negativo quando a rodada já havia gerado todos os inimigos, fazendo o validador rejeitar saves de lutas longas. Agora para em zero.
- Zumbis podiam oscilar nas laterais de carros e atrás do shopping. Uma malha estática de navegação, com campo de distâncias compartilhado, fornece pontos intermediários seguros quando o caminho direto está bloqueado. O desvio é salvo e continua até sair do obstáculo.
- As colisões recalculavam dimensões de todos os objetos a cada consulta. Agora usam as mesmas medidas em células espaciais pré-calculadas. Testes compararam mais de 40 mil pontos e bordas com a implementação anterior. No microbenchmark deste ambiente, a mediana de 300 mil consultas caiu de 368 ms para 36 ms, com os mesmos 7.020 pontos bloqueados. Isso mede CPU; não representa ganho equivalente de FPS.
- Instinto de Sobrevivência podia gerar saúde além do limite de itens, invalidando saves com muitos especiais mortos. A geração respeita o limite.
- Arsenal Especializado anunciava +15% mas aplicava +100% às evoluções. O efeito passou a corresponder aos +15% descritos.

## Validação e limites

**180 testes aprovados em 12 arquivos**, TypeScript e build de produção aprovados. O Vite continua avisando sobre o tamanho do bundle. **34 verificações integradas no Chromium** aprovadas, incluindo cartas, novas ofertas de armas, bônus de mapa, chefes, persistência, retorno, falha de armazenamento e carga de 240 inimigos: [validacao.json](validacao.json).

O simulador executa o combate real em passos fixos, movimenta um bot respeitando as colisões, recolhe XP e escolhe somente cartas sorteadas. Não recebe XP, armas, níveis ou vitórias artificiais. Foram usados dois perfis de preferência e duas sementes, com um par adicional com cão: dez partidas, registradas em [simulacoes.json](simulacoes.json).

Resultados finais:

- Praça: duas das cinco partidas sobreviveram aos 900 segundos; ambas concluíram todas as melhorias compatíveis. Uma combinação **sem pet concluiu aos 14min37s**; a combinação com cão concluiu aos 11min33s. As outras três morreram antes. Isso demonstra a possibilidade da meta, sem garantir que qualquer partida ou combinação irá completá-la.
- Estacionamento: cinco de cinco partidas concluíram as 50 rodadas, com 2.800 eliminações em cada uma, incluindo os cinco chefes. Os tempos ficaram entre aproximadamente 26 e 33 minutos. Algumas combinações chegaram ao máximo; outras terminaram com melhorias restantes.

O bot conhece as posições dos inimigos e não representa uma amostra de jogadores. As partidas simuladas avaliam integridade e possibilidades; não substituem teste humano de diversão, percepção sonora, dificuldade ou desempenho no Windows. Algumas capturas do navegador usam estados preparados para isolar as funcionalidades. O balanceamento permanece uma primeira calibração.

Reprodução:

```sh
node scripts/simulate-dungeons.cjs
DUNGEON_PLAYTHROUGH_DIR=/workspace/after-rain-validated-sessions node scripts/qa-dungeons.cjs
npm run build
```

O simulador grava em `/workspace/after-rain-playthroughs` por padrão; use `DUNGEON_SIM_OUTPUT` para mudar a pasta. Passe essa mesma pasta para `DUNGEON_PLAYTHROUGH_DIR`. `--quick` reduz a matriz; `--timed-only` filtra a praça; `--xp-cap=N` é uma opção de experimento do simulador, não um ajuste do jogo publicado.

## Capturas

[Armas no nível 10](armas-nivel-10.png) · [Novas cartas](novas-cartas-super-raras.png) · [Bônus no mapa](bonus-no-mapa.png) · [Bônus ativos](bonus-ativos.png) · [Chefe da rodada 50](chefe-final-rodada-50.png)
