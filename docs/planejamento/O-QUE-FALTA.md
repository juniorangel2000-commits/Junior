# After Rain — o que ainda falta no jogo

> **Para o ChatGPT (ou outra IA) que for ajudar:** este arquivo resume o jogo e lista tudo
> que ainda precisa ser feito, em 21/11/2026, depois da preview.44 publicada e da
> preview.45 em andamento. Use como ponto de partida para planejar, escrever textos,
> criar prompts de arte ou sugerir prioridades. O código é feito pelo Claude Code e pelo
> Codex no repositório `juniorangel2000-commits/Junior`; as regras deles estão em `AGENTS.md`
> e o estado mais recente em `docs/PASSAGEM.md`.

## O jogo em poucas linhas

- **After Rain** é um jogo de fazenda e sobrevivência em pixel art, depois de uma grande
  chuva que mudou o mundo. Feito com Phaser 3 + TypeScript, empacotado para Windows com
  Electron. Textos em português do Brasil.
- **Já existe:** propriedade com casa, horta, poço, construções de animais com interior
  (galinheiro, curral, aprisco, chiqueiro, estábulo), máquinas (queijeira, tear, moinho,
  forno, barril, prensa, colmeia…), cozinha com receitas e qualidade, pesca com diário,
  mineração, expedições (dungeons), cavalo domável e montaria, companheiros (pets),
  sobreviventes do acampamento que ajudam na propriedade, Marina e Rui morando na
  propriedade, vila com 10 moradores (lojas, rotina diária, folga, almoço, pousada à noite,
  amizade, presentes, respostas nas conversas, histórias pessoais de 8 deles e visitas à
  propriedade), calendário de 4 estações × 28 dias, chuva sorteada, dia e noite com luz.
- **Cenários:** Propriedade, Floresta, Campos Abertos, Vila, Estrada, Lago, Serra (Platô),
  Acampamento, Mina e Dungeons. Pântano, Ruínas, Estação Ferroviária, Costa das Marés e Pomar Abandonado estão
  jogáveis no branch da preview.45.

## 1. Conteúdo e cenários

- [x] **Pântano jogável** ao sul da Floresta Antiga, com editor F2, passarela, sapos e jacarés (branch da preview.45).
- [x] **Rio da Propriedade nos Campos** (preview.45): o rio corta os Campos de norte a sul, com duas pontes iguais às da propriedade, e deságua no mar da Costa.
- [x] **Mapa do vale e junções** (preview.45): todos os mapas externos montados na posição das saídas ([mapa](../cenarios/MAPA-DO-VALE.md)). Rio contínuo do Platô até o mar; chegada dos Campos alinhada à Propriedade; canal do Pântano nasce da lagoa do norte.
- [x] **Pântano só com lagos** e **chão compartilhado nas divisas** de todos os mapas externos (preview.45), igual ao da Floresta com a Propriedade.
- [ ] Definir o destino da estrada a leste da Estação.
- [ ] **História da Amélia** em 3 partes. A íris azul do Pântano já tem sprite e posição no mapa. Modelo em `src/data/npc-stories.ts`.
- [x] **Ruínas jogáveis** a leste da Estrada da Cidade, com o asfalto contínuo ao norte, investigação no antigo posto, porão, selo de bronze que Nilo identifica e grama alta editável.
- [x] **Estação Ferroviária Desativada** a leste das Ruínas (preview.45): ligação nos dois sentidos, sala de espera com arte frontal, trilhas sinuosas, capim alto, F2 no exterior e save. A história curta depende dos textos e da recompensa do Junior.
- [x] **Costa das Marés** ao sul dos Campos Abertos (preview.45): praia, foz do rio, píer, barco, cabana e F2. Sem estrada nem ligação com a Estação.
- [x] **Pomar Abandonado** a leste da Vila. Trilhas de terra, frutíferas, prensa antiga, galpão, lagoa de irrigação e frutas recolhíveis.
- [ ] Adicionar conchas coletáveis e uma história ligada ao barco da Costa. A pesca já funciona na enseada e na foz.
- [ ] Desenvolver a **história pessoal do Nilo** se o Junior quiser expandir a ligação com o selo.
- [ ] Usar o pântano e as ruínas também em partes extras das histórias dos outros moradores.
- [ ] **Editor de mapa (F2) nos Campos Abertos**: ainda não integrado nesse cenário.

## 2. Moradores e comunidade

- [ ] **Eventos e festivais da vila** por estação (feira, festa da colheita etc.): não existem.
- [ ] **Aniversários dos moradores** (presente em dobro no dia, fala especial): não existem.
- [ ] **Visitas à noite** de Bento, Damião e Helena (hoje só os 7 que têm folga visitam a
  propriedade, de manhã).
- [ ] Decidir se haverá **namoro/casamento** ou só amizade (ainda não decidido).
- [x] Caminhada, parada e viradas nas oito direções para Marina e Rui (preview.44).

## 3. Calendário e clima

- [ ] **Chuva regando as plantações** (hoje a chuva é só visual e afeta a pesca).
- [ ] **Inverno de verdade:** frio, neve no chão e no céu, efeito nas plantações.
- [ ] **Peixes por estação** (hoje dependem de hora, isca e clima, não da estação).
- [ ] **Tela de calendário** com estação, ano, previsão do tempo e eventos da comunidade.
- [ ] **Sementes especiais que crescem o ano todo**, obtidas de formas diferentes (não só
  compradas). Quais plantas e como obter: a definir.
- [ ] **Árvores frutíferas** e **estufa**.
- Plano completo em `docs/calendario-sazonal-planejado.md` e `docs/planejamento/CULTIVOS-E-CALENDARIO.md`.

## 4. Fazenda, animais e economia

- [ ] **Equilíbrio de preços** de todos os produtos (máquinas, cozinha, animais) jogando.
- [ ] **Posição dos animais dentro das construções** não é guardada ao sair e voltar.
- [ ] Conferir a **iluminação noturna dos abrigos** em jogo. O modo de iluminação com lampiões já está integrado.
- [ ] Itens soltos no chão e recolhidos **voltam com qualidade comum** (perdem a qualidade).
- [ ] **Cavalo:** chamar de longe, sela (talvez fabricada) e as animações de deitar,
  descansar e levantar (os quadros já existem).
- Planos: `docs/planejamento/ANIMAIS-E-RECEITAS.md`, `docs/planejamento/DOMESTICACAO-CAVALO.md`.

## 5. Interface

- [x] Mochila reformulada e barra rápida maior (preview.45, ainda não publicada).
- [ ] Revisar as outras telas no mesmo estilo da mochila nova: fabricação, cozinha,
  baús/máquinas, mapa e pausa.
- [ ] **Suporte a controle** (PlayStation/Xbox, USB ou Bluetooth) no PC e no Steam Deck.

## 6. Desempenho

- [ ] **Travamentos nos Campos Abertos:** medir com o F3 no PC do Junior antes de mexer.
- [ ] **A Propriedade carrega o que não usa:** cavalo (45 MB, vive nos Campos), imagens dos
  pets do abrigo (~60 MB), coelho, cervo, pato, porco e a animação de nado antes de nadar.
- [ ] Medir quais atlas de animais ainda ocupam espaço vazio. O primeiro recorte já foi feito na preview.39.
- [ ] Vídeos da estrada (16 + 13 MB): reduzir só com o aval do Junior (há pequena perda).
- [x] Imagens em WebP sem perda no build (preview.45): jogo de ~450 MB para ~305 MB.
- Detalhes em `docs/planejamento/DESEMPENHO.md`.

## 7. Arte que falta

- [ ] **Chiqueiro novo** (o Junior quer gerar depois; o ChatGPT não acertou o estilo na
  primeira tentativa). Prompts e referências em `docs/planejamento/ARTE-PENDENTE.md`.
- [ ] Itens que ainda usam o ícone de outro item ou provisórios: ver a seção 2 de
  `docs/planejamento/ARTE-PENDENTE.md` (algumas linhas já foram resolvidas pelo lote 01;
  conferir no jogo antes de pedir).
- [ ] Arte das futuras novidades: ruínas, inverno/neve, árvores frutíferas, estufa
  e festivais.
- **Estilo para pedir arte:** pixel art detalhado, paleta quente, contorno marrom-escuro,
  visto de cima em 3/4, de frente, sem isometria, fundo branco liso, sem reduzir os PNGs.

## 8. Outras plataformas

- [ ] **iPhone (offline):** transformar o jogo num app com Capacitor, gerado no GitHub
  Actions em máquina macOS e instalado pelo Sideloadly (grátis, renovar a cada 7 dias) ou
  pela conta Apple (US$ 99/ano). Antes disso: controles de toque e de controle, telas para
  celular, menos memória e saves em arquivo do app. App Store fica para depois.

## 9. Manutenção

- [ ] Conferir na próxima publicação se o build do Windows roda a compressão WebP (`sharp`)
  e se o instalador ficou menor que os ~520 MB da preview.44.
- [ ] Atualizar scripts de conferência antigos: `qa-inventory.cjs` (quebra ao iniciar a
  partida), `qa-animal-escort.cjs` (volta) e `qa-farm-interior.cjs` (dica da porta).
- [ ] Alguns scripts de conferência têm o caminho do Chromium fixo (`/usr/bin/chromium`).

## Sugestão de ordem

1. Jogar a Estação Ferroviária no PC do Junior e ajustar o que ele pedir; definir a história curta da sala de espera.
2. Jogar a Costa das Marés e o rio dos Campos no PC do Junior. Ligar a íris azul do Pântano à história da Amélia.
3. Publicar a preview.45 quando o Junior pedir e conferir a compressão no instalador para Windows.
4. Medir o desempenho dos Campos Abertos no PC do Junior com F3.
5. Integrar a chuva à rega e os peixes às estações. Em seguida, adicionar tela de calendário com previsão, eventos e aniversários.
6. Inverno, árvores frutíferas, estufa e sementes especiais.
7. Controle e, depois, a versão para iPhone.
