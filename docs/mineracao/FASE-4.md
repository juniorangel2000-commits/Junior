# Fase 4 — perigos e acesso à mineração

**Concluída e validada.** 255 casos de teste direcionados em 19 arquivos,
checagem TypeScript e build de produção passaram. O roteiro de Chromium
confirmou porta central → menu → cenário separado → retorno à recepção,
cancelamento sem iniciar expedição, cinco golpes reais de picareta e coleta,
zumbi atraído pelo som, fuga/acerto único de desabamento, contaminação,
pausa, cura, espada, morcegos, save/continue e retorno à própria cama.
Sem erros de JavaScript ou assets ausentes no roteiro.

Capturas locais da execução:
`/workspace/mineracao-fase4-qa/02-Menu-de-mineracao.png` e
`/workspace/mineracao-fase4-qa/03-Cenario-de-mineracao.png`.

## Correção de fluxo solicitada

A instrução mais recente substitui o acesso direto da fase 2: **a passagem
central da Mina Antiga abre um menu, e confirmar leva a outro cenário onde se
minera**. A sala aprovada permanece como recepção, com as colisões e a arte
originais. O jogador não atravessa a porta para cair diretamente nas galerias.

- `Mina`: recepção da Mina Antiga, câmera limitada à sala; E na porta central
  abre o menu. Voltar/fechar não inicia uma expedição nem regenera recursos.
- `Mineracao`: Galerias da Mina, cenário separado com escavação contínua dentro
  dele. Não há escolha de andares/profundidades. O acesso fica na ponta sul dos
  trilhos; voltar pela mesma passagem devolve o jogador à recepção.
- A transição só ocorre depois de salvar. Uma falha conserva o cenário atual,
  inventário e mundo. Recarregar continua no cenário correto. Os saves anteriores
  são adaptados ao restaurar o cenário, mantendo os túneis e materiais.
- Entrar no edifício não inicia renovação; ela acontece ao confirmar a entrada
  nas galerias, obedecendo às condições da fase 3.

## Perigos implementados

- Zumbis oficiais, com a vida/dano/velocidade existentes. Descansam até perceber
  proximidade com visão livre ou ouvir mineração. Perseguem a última posição
  percebida e respeitam o terreno; o A* existente é reutilizado, com cache por
  alvo/revisão de escavação. Não há teletransporte de inimigos.
- Corte de espada, arco frontal, seleção de alvo, dano, intervalo e efeito visual
  das dungeons. Perseguição e dano com intervalo de proteção também foram
  extraídos para componentes compartilhados, usados pelas dungeons e pela mina.
  Espaço ataca com a espada equipada; E/clique também permitem combate próximo.
- Desabamentos provocados por atividade de mineração: som de rocha, marcação
  compartilhada com os ataques dos chefes, aviso, tempo de fuga, queda e um único
  impacto. Não criam bloqueios permanentes ou fecham rotas essenciais.
- Ar contaminado em galerias laterais: **2% da vida máxima por segundo**, inclusive
  durante o intervalo de proteção de contato. Para de causar dano ao sair. Aviso,
  névoa e vida na HUD; sem equipamentos ou itens de proteção novos.
- Escuridão interpolada por profundidade, iluminação radial/fixtures existente,
  lanterna já disponível e limites das paredes por raios. Atualiza apenas uma
  máscara da câmera, em meia resolução e até 10 vezes por segundo; o terreno não
  é redesenhado por quadro. Alguma visibilidade permanece fora das luzes.
- Morcegos tranquilos, reativos e agressivos; repouso, voo, fuga, aviso e investida.
  Sprite nova com asa animada e repouso, baseada na arte da mina. Os tranquilos
  não atacam; reativos evitam o jogador e defendem o repouso; agressivos dão dano
  leve e recuam entre investidas. Colisão não permite atravessar rochas.
- Vida, inimigos derrotados, objetivos de perseguição, ação de desabamento,
  intervalos de ataque e estados dos morcegos ficam no save. Pausa/inventário
  interrompem a simulação; continuar a partida não restaura inimigos nem vida.
- Consumíveis de recuperação já existentes restauram vida na mina com os mesmos
  valores e consumo durável. Não foram criadas receitas, ferramentas ou moedas.

## Valores provisórios

Centralizados em `src/data/underground-hazards.ts`:

| Parâmetro | Valor inicial |
| --- | --- |
| Vida | 100, mesma base da dungeon |
| Zumbis por faixa | 3 / 5 / 7 / 9 |
| Alcance do som de mineração | 420 px |
| Memória do alerta | 14 s |
| Desabamento | **45% da vida máxima**, provisório e ainda não aprovado |
| Aviso do desabamento | 2,8 s, raio de 58 px |
| Chance por golpe, por faixa | 2,5% / 5% / 8% / 11%; intervalo de 35 s |
| Morcego agressivo | 3 de dano, aviso de 0,65 s, intervalo de 9 s |
| Gás | **2% por segundo: regra definitiva, não provisória** |

## Vida zero e fases futuras

Os perigos exigem um resultado funcional ao zerar a vida: o jogador encerra a
exploração e retorna perto da própria cama, perdendo os recursos carregados
(inclusive os anteriores à expedição). Ferramentas, equipamentos, túneis,
progresso e estoques separados permanecem. A recuperação é uma transação única;
falha de gravação permite repetir sem apagar a partida.

Isso não representa a fase 9 completa. **Bento ainda não faz viagens semanais,
mineração própria, expedições conjuntas ou a cena/conversa de resgate.** Essas
integrações seguem nas fases 5–9. Não há missões únicas novas nesta etapa, nem
sistema de relacionamentos concluído. O próximo passo do plano é a rotina de
Bento (fase 5).

## Arquivos desta etapa

- Acesso: `src/mining-entry-menu.ts`, `src/data/mining-entry.ts`,
  `src/systems/mining-access.ts`, `src/scenes/MineScene.ts`,
  `src/scenes/HighlandScene.ts`, `src/main.ts`, `src/underground-view.ts`.
  `src/scenes/FishingLakeScene.ts` encaminha o retorno à propriedade sem desviar
  o jogador que desmaiou de volta para o lago.
- Regras: `src/data/underground-hazards.ts`,
  `src/systems/underground-hazard-state.ts`, `src/systems/underground-hazards.ts`,
  `src/systems/underground-light.ts`, `src/systems/underground-recovery.ts`.
- Arte/luz: `src/underground-hazard-art.ts`, `src/underground-lighting.ts`,
  `public/assets/visual/mine/cave-bats.png` e manifesto `cave-bats.json`.
- Componentes existentes: `src/dungeons/combat-core.ts`,
  `src/dungeons/ground-warning.ts`, `src/dungeons/run.ts`,
  `src/dungeons/boss-render.ts`, `src/dungeons/lighting.ts`, `src/audio.ts`,
  `src/systems/consumables.ts`, `src/systems/field-inventory.ts`,
  `src/systems/world-sword.ts`, `src/systems/underground.ts`,
  `src/systems/underground-renewal.ts`, `src/systems/save.ts`, `src/types.ts`,
  `src/ui.ts`, `src/style.css`.
- Verificação: `tests/underground-hazards.test.ts`,
  `tests/mining-access.test.ts`, `scripts/qa-underground-hazards.cjs`.

Sem dependências novas. Esta etapa não publica instalador nem muda a versão.
