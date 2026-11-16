# Iluminação (preview.37)

Pedido do Junior: um sistema de luz "bem mais bonito". Escolhas dele: noite de verdade,
cores por hora do dia, luzes que brilham, sombras de nuvens, vaga-lumes e pólen, e
sombra em tudo o que fica em pé.

## Como funciona

- **Passe único na câmera** (`src/lighting-pipeline.ts`, WebGL): sombra das nuvens,
  saturação, contraste e luz ambiente da hora, luzes quentes e vinheta. Sem WebGL fica o
  sistema antigo (películas de cor) de `src/daylight.ts`.
- **Horas do dia** (`src/lighting-model.ts`, com teste): madrugada e noite azuis e escuras;
  primeira luz rosada; dia claro; hora dourada e pôr do sol. Chuva: céu fechado e cores
  apagadas. Dentro de casa a noite fica bem mais clara. A opção de intensidade do jogador
  aproxima tudo do neutro.
- **Luzes** (`Daylight.updatePipeline`), até 32 por quadro, só as que alcançam a tela:
  - janelas da casa: brilho no vidro e poça de luz na porta;
  - postes, lampiões e fogueiras (`setData('fixture-light')`): alcance 3× o raio;
  - halo do personagem e vaga-lumes.
  - A luz leva a cor da noite em direção a um dia quente, sem passar dele: vários postes
    juntos não deixam a praça mais clara que de dia, e ficam poças de luz entre o escuro.
- **Vaga-lumes e pólen** (`src/ambient-particles.ts`): em volta da câmera, num único
  Graphics.
- **Sombras do sol** (`src/solar-shadows.ts`):
  - Todo objeto em pé projeta sombra (profundidade entre 0 e 4000, altura ≥ 26 px), menos
    o chão, as plantinhas rasteiras, as camadas de janela e fogo e os animais. Os animais
    têm a sombra oval própria. `setData('no-shadow', true)` tira um objeto da regra.
  - A silhueta nasce no pé medido da arte (última linha opaca) e deita no chão, achatada
    e inclinada para o lado oposto ao sol. É mais comprida de manhã e à tarde.
  - Silhuetas de objetos parados são feitas ao entrar no cenário; as de personagens, sob
    demanda.

## Conferência

- Capturas: `node scripts/capture-lighting.cjs <pasta>` (Propriedade em 5 horários). Antes
  em `docs/planejamento/luz-antes/`, depois em `docs/planejamento/luz-depois/`.
- Desempenho: `scripts/perf-fields.cjs`.
