# Dungeons e sobrevivência — primeira versão jogável

> Etapa mais recente: [animações recebidas da Sentinela, em quatro direções](animacoes-sentinela/RELATORIO.md).
> Integração anterior: [animações do Demolidor](animacoes-demolidor/RELATORIO.md).
> Etapa anterior: [identidade dos chefes, balanceamento e frentes para animação](chefes-e-balanceamento/RELATORIO.md).
> Etapa anterior: [mapas abertos, banco vertical e experiência junto da vida](mapas-abertos/RELATORIO.md).
> Revisão de base: [mapas e HUD](mapas-e-hud/RELATORIO.md).
> Etapa anterior: [sessões completas, cartas, bônus de mapa e chefes](estabilizacao-e-cartas/RELATORIO.md).
> Revisões posteriores: [ritmo de sobrevivência, etapa 1](ritmo-sobrevivencia/RELATORIO.md), [identidade das primeiras três armas](identidade-armas/RELATORIO.md) e [quatro armas restantes e Escudo de Choque](armas-defesa/RELATORIO.md).

Implementação local posterior à preview.11. Não houve push, tag, release ou geração de executável Windows. A especificação recebida está em [ESPECIFICACAO-1.0.txt](ESPECIFICACAO-1.0.txt).

## Como acessar

Entre na floresta ao norte da vila, alcance a placa da estrada e interaja com E. A viagem dura aproximadamente cinco segundos, com estrada molhada, chuva, som ambiente e avanço da câmera. O menu oferece duas prévias dos mapas reais:

- Praça Central Abandonada: sobreviver por 900 segundos ativos.
- Estacionamento de Shopping: concluir 50 rodadas.

Ambos os mapas medem 3072 × 2304 pixels; a câmera acompanha o personagem. Vitória, derrota e abandono retornam à posição e direção guardadas na estrada. Pausa e escolha de cartas suspendem combate e cronômetro. O relógio normal do mundo não avança dentro do desafio.

## Sistemas implementados

Sete armas automáticas: espada, arco, lança, bumerangue, martelo, lâmina giratória e escudo orbital. O Arsenal permite quatro armas simultâneas e mantém o pet em um espaço próprio. Há 56 melhorias com raridades fixas, limites, requisitos e evoluções lendárias. Cada escolha oferece três opções elegíveis, sem repetir melhorias já concluídas. Os pesos 60/30/9/1 são aplicados às cartas elegíveis; não representam percentuais finais garantidos por raridade.

Experiência e melhorias temporárias pertencem à expedição. Evolução permanente do personagem e de cada pet utiliza dados separados. Cães e gatos podem ser resgatados, inclusive variantes raras; apenas o companheiro escolhido participa do combate. Pets possuem atributos próprios, recuperação e ataques. Fora das dungeons, o acompanhamento e a coleta auxiliar foram integrados somente à nova floresta de acesso, com limite diário de coleta.

Eventos incluem suprimentos, velocidade, ataque, invulnerabilidade e resgate. Recompensas usam moedas, experiência permanente, materiais já existentes e pets. Materiais aguardam espaço quando o inventário está cheio. Resultados possuem identificadores para impedir entrega duplicada; falha ao gravar mantém a opção de tentar novamente. Não foram adicionadas receitas exclusivas ou equipamentos permanentes especiais.

Salvar e continuar preserva a expedição, incluindo aleatoriedade, inimigos, projéteis, melhorias, recargas, ataques atrasados e efeitos temporários de combate. A retomada começa pausada. Encerrar a expedição descarta os bônus temporários e registra as recompensas permanentes.

## Organização e arte

- `src/dungeons/run.ts`: simulação de combate independente de Phaser.
- `config.ts`, `upgrades.ts`, `progression.ts` e `snapshot.ts`: balanceamento, cartas, progressão e validação.
- `spatial.ts`: busca por proximidade; `maps.ts` e `world.ts`: mapas, obstáculos e desenho.
- `art.ts`, `ui.ts`, `ui.css` e `world-companion.ts`: atlas, interface e pet fora do combate.
- `src/scenes/DungeonScene.ts`: viagem, menu, renderização, entrada e retorno.
- `tests/dungeons.test.ts` e `scripts/qa-dungeons.cjs`: verificações reproduzíveis.

Foram criados quatro atlas PNG: objetos urbanos, armas, cães/gatos e zumbi com caminhada nas quatro direções. Os PNGs originais gerados foram preservados; metadados registram recortes e hashes. Recursos são carregados sob demanda; texturas intermediárias são removidas após o processamento em memória.

Movimentação, personagem, inventário, armazenamento e áudio existentes foram reaproveitados. Não foram alteradas as artes oficiais dos NPCs, os interiores dos comércios ou suas rotinas. Tipagem de chefe foi reservada para expansão, sem chefes ativos nesta versão.

A simulação usa passo fixo, índice espacial e pools de imagens. Limites configuráveis: 240 inimigos, 160 projéteis e 48 efeitos. Esses limites protegem o custo de processamento; não constituem garantia de FPS em qualquer equipamento.

## Validação realizada

- 95 testes aprovados em seis arquivos: dungeons, floresta de acesso, migração de save, recuperação de save, save da vila e áudio.
- TypeScript e build de produção aprovados. Vite mantém o aviso de tamanho de bundle.
- 19 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL registrados: [validacao.json](validacao.json).
- Entrada com viagem real, combate automático inicial, três cartas, quatro armas, pausa, retomada, abandono, retorno, resgate e seleção de pet, progressão pela interface, vitória, derrota e nova tentativa após falha de armazenamento.
- Carga controlada com 240 inimigos: média aproximada de 1,56 ms por atualização JavaScript no ambiente de teste, sem ultrapassar os pools. A medição não inclui custo de GPU e não é uma medição de FPS no Windows.
- Limite de 900 segundos e transições das 50 rodadas verificados por testes controlados. Não foi realizado um percurso humano completo de 15 minutos nem uma campanha manual de 50 rodadas. Os testes de vitória, derrota, lotação de inimigos e aquisição de pets usam estados preparados pelo script; o combate inicial é observado sem ataque manual.

Comandos:

```sh
npx vitest run tests/dungeons.test.ts tests/city-forest.test.ts tests/save-migration.test.ts tests/audio.test.ts tests/village-save.test.ts tests/save-recovery.test.ts --maxWorkers=2
npm run build
node scripts/qa-dungeons.cjs
```

Ainda é necessário jogar sessões longas para avaliar dificuldade, ritmo das cartas, recompensas e leitura visual das hordas em condições reais. A integração automatizada foi validada; o balanceamento final depende dessa avaliação manual.

## Capturas

[Menu da cidade](menu-cidade.png) · [Praça](praca-completa.png) · [Estacionamento](estacionamento-completo.png) · [Cartas](cartas.png) · [Evolução permanente](evolucao-permanente.png) · [Pet na floresta](pet-na-floresta.png) · [Resultado](resultado.png)
