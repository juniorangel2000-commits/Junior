# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-14
- **Por:** Codex
- **Continuar a partir de:** branch `release/v0.10.0-preview.35`, HEAD do branch. Etapa 3 em `e00c675`, concluída e validada em `a13381b`.
- **Última versão publicada:** `v0.10.0-preview.34`, https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.10.0-preview.34
- **Estado:** etapas 1–3 dos animais concluídas: interiores, ovos/leite e agora aprisco, ovelha/cabra animadas, lã, leite de cabra e tesoura. Branch enviado ao GitHub. **Não publicado; main, tags e versão do pacote permanecem inalteradas.**

## Feito nesta rodada

- Junior pediu implementar a próxima etapa (ovelha/cabra/aprisco), adicionar animações no padrão dos outros animais e conferir a proporção.
- **Aprisco:** construção própria no menu B, base no terreno limpo, entrega de materiais e conclusão com martelo. Custo final: 60 madeiras, 24 pedras, 18 tábuas regulares, 8 madeiras nobres, 1 módulo de porta e 1 de janela; base de 4 madeiras + 4 pedras. Área 7×6, capacidade **4 animais ao todo**, misturando ovelhas e cabras.
  - `farmAcceptsAnimal` centraliza a compatibilidade no alojamento, painel e validação. Vacas/galinhas/cavalo mantêm suas moradias.
  - Interior 12×9 com palha, cocho de 8, bebedouro e área de tosquia aberta pela frente. Reutiliza os objetos definitivos do SpriteCook em resolução original.
  - Rotina existente: cercado 06:00–18:00, dentro à noite; painel permite recolher/soltar. Entrada com E e saída andando.
- **Produção:** cada animal come 1 palha às 06:00, com a prioridade já existente para quem ficou mais tempo sem comer.
  - Cabra alimentada: 1 leite de cabra disponível por manhã, com balde e ordenha de 1 segundo.
  - Ovelha: 1 lã após **3 manhãs alimentadas**, sem exigir dias consecutivos. Sem alimento, pausa. Lã pronta e leite pendente não acumulam várias cargas por animal.
  - Registros opcionais `woolDays`/`wool` no `animalCare`; saves antigos continuam válidos. Trocar de moradia/recarregar não reinicia nem duplica a produção.
  - `canShear`/`shearSheep` fazem validação e gravação antes de aplicar. `milkCow` preserva o nome antigo, mas reconhece cabras e entrega o produto correto.
  - Cena usa uma ação comum de cuidado para ordenha/tosquia, com ferramenta visível, jogador e animal parados. Afastar o jogador cancela sem consumir o produto. Indicadores de leite/lã prontos.
  - Corrigida prioridade de interação: animal próximo do cocho não deve interceptar o E quando o cocho está mais perto.
- **Tesoura:** bancada, 2 lingotes de ferro + 1 cabo, com martelo. Integra ferramentas individuais: não empilha; cada cópia tem 100 de durabilidade e só a selecionada gasta 1 por tosquia concluída. Bento repara a selecionada por 20 C.
- **Comércio:** Helena compra leite de cabra por 20 C; Celina compra lã por 36 C. Nenhuma loja vende os produtos. Valores iniciais.
- **Arte própria:** aprisco, ícones e animais gerados por imagegen, preservando originais. O SpriteCook não está disponível nesta sessão; os fixos anteriores não foram refeitos.
  - Ovelha e cabra em oito direções, quatro poses desenhadas de caminhada por direção distribuídas nos oito passos do `AnimalWalkCycle`. Usam cadência por distância e limite de FPS, como vaca/cavalo. Nas pausas ficam em pose parada; sem descanso animado em repetição contínua.
  - A cabra foi refinada para manter patas de apoio no chão nas poses de passagem.
  - Escala final em `ANIMAL_ART`: ovelha `.28`, cabra `.27` (células de 224 px). Vista lateral: ovelha ~40 px, cabra ~45, vaca ~56. Conferidas junto à galinha e ao jogador.
  - `scripts/pack-aprisco-art.cjs` recorta/empacota sem redimensionar os pixels dos animais; hashes/retângulos em `public/assets/animals/{sheep,goat}/atlas.json`. Originais nos respectivos `source.png`.
  - A arte externa mantém o PNG original; o pátio é compactado em memória para alinhar o corpo, cercas e entrada à colisão existente.
- **QA real:** construiu base, entregou materiais, concluiu a obra, alojou duas ovelhas e duas cabras, entrou andando, abasteceu, ordenhou, tosquiou, saiu e recarregou. Estoque final: 1 leite de cabra, 1 lã, tesoura 99/100. Sem duplicação e sem erros JS.
  - `scripts/qa-aprisco.cjs` aceita diretório de saída e `QA_URL`; Vite padrão 5190, Playwright/Chromium externos.
  - `scripts/capture-aprisco-preview.cjs` usa sprites reais na mesma câmera e escala e gera o GIF com ffmpeg.
  - Evidências em `docs/planejamento/qa-aprisco/`: exterior, ordenha, tosquia, comparação estática, GIF e JSON de validação. A comparação foi mostrada ao Junior.
- Documentação atual em `docs/construcoes/APRISCO.md`; plano geral atualizado em `docs/planejamento/ANIMAIS-E-RECEITAS.md`.

## Em andamento e próximo passo exato

- Não há código WIP restante desta rodada. O primeiro commit `e00c675` tem prefixo WIP porque a validação no navegador ainda estava em curso; ela foi concluída em `a13381b`.
- Próxima implementação, **quando solicitada:** máquinas colocáveis como a cesta, dentro dos abrigos e ao ar livre na Propriedade. Plano já aprovado em `docs/planejamento/ANIMAIS-E-RECEITAS.md`: queijeira, batedeira, roca, tear e moinho primeiro; cozinha depois.
- Máquina pronta deve ser item da mochila, colocada à frente com colisão, sem bloquear entrada/cocho/passagem. Vazia pode ser recolhida; carregada trabalha pelo relógio geral, com save atômico e produto pronto visível. Não foi implementado nesta rodada.
- Junior ainda não pediu publicar esta rodada. O pacote continua preview.34; o trabalho está no branch preview.35. Não criar tag nem atualizar main sem pedido.
- As sugestões anteriores de distribuir etapas pelas previews .35–.39 eram apenas proposta; agora as três primeiras etapas estão juntas no branch .35 não publicado.

## Pendências e ideias para depois

- Máquinas → cozinha → porco/pato/abelhas, conforme plano geral. Produção por amizade/qualidade e preços finais ficam para depois.
- Confirmar com Junior a regra do estábulo para a corda do cavalo, não para ele comer. Chamar de longe, montaria e poses de deitar/descansar.
- Sementes especiais, clima/peixes por estação, frutíferas e estufa.
- Há um stash local antigo do branch preview.34 com evidências/documentação do estábulo aberto. **Não aplicar por cima desta PASSAGEM nem desfazer os interiores atuais.** O trabalho atual está enviado no branch preview.35.

## Problemas conhecidos

- Animais no interior reaparecem em posições iniciais a cada entrada; posição interna individual não é persistida. Interiores ficam sempre claros à noite.
- **Travamentos nos Campos Abertos:** na rodada anterior foram reduzidos trabalho da vegetação (índice espacial), cópias desnecessárias do save na coleta, atualização da HUD e uso do shader das janelas em mapas sem janelas (`f28f27c`). Capim próprio e animado integrado em `5424eee`.
  - Medição anterior da HUD: Campos 0,93 → 0,40 ms; Lago 2,78 → 0,26; Vila 2,36 → 0,54. Evidências em `docs/planejamento/qa-campos-abertos/`.
  - **Não afirmar ganho de FPS nem que travamentos foram resolvidos:** o navegador usa SwiftShader (vídeo emulado), sem melhora consistente dos tempos de quadro. Falta conferir no PC do Junior.
  - `scripts/qa-world-performance.cjs` compara dez cenários; `QA_SCENES` filtra, `QA_CPU_PROFILE=1` grava perfis. Rodada atual não ampliou essa medição.
- A entrada do curral após sair do galinheiro foi corrigida em `88dd14c`: vaca recolhida nascia visível antes do primeiro update e afastava o jogador. Ocultação inicial e colisão respeitam o recolhimento imediatamente. O alcance da porta continua 30 px.
- Build avisa sobre tamanho do chunk principal, sem falhar.
- **Arte dos interiores:** manter PNGs originais, `setScale`/`setDisplaySize` e piso `FLOOR_SCALE=2`; o Junior já rejeitou redução em disco. Prompts futuros do SpriteCook: "front-facing, axis-aligned, NOT isometric".

## Testes

- Baseline desta rodada: `npm ci`, `npm run check`, `npm test`: **1.962 testes / 223 arquivos**, zero falhas.
- Final: `npm run check` ok; `npm test`: **1.978 testes / 225 arquivos**, zero falhas; `npm run build` ok.
- Novos: `tests/aprisco.test.ts` (14: ciclo, alimentação parcial, pausa, mudança de moradia, ferramentas individuais, falha de save, estoque cheio, migração, comércio, circulação) e `tests/aprisco-art.test.ts` (2: fontes originais, recortes, direções e caminhada).
- `scripts/qa-aprisco.cjs`: passou, incluindo ciclo completo e recarregamento, mais comparação de escala e GIF dos sprites usados no jogo. `docs/planejamento/qa-aprisco/validacao.json` registra o resultado.
- O QA anterior de ovos/leite também passou nesta branch; suas evidências continuam em `docs/planejamento/qa-producao/`.
