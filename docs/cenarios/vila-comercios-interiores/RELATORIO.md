# Vila: comércios, circulação, iluminação e edição

Implementação local de 26/10/2026. Não houve commit, push ou publicação nesta etapa.

## Comportamento

- A conversa externa mantém diálogo, contratos e serviços. A opção **Leve-me até sua loja** inicia a condução somente quando escolhida. Comprar e vender ficam disponíveis no interior do próprio comerciante, com a regra conferida também no comando da transação.
- O guia usa as rotas existentes, prefere as ruas, evita obstáculos e espera se o jogador se afastar. O jogador continua controlando seu movimento. Cruzar a porta transfere o mesmo NPC para o interior; não cria outro personagem.
- Augusto utiliza as oito poses e os 48 quadros de caminhada recebidos em `Idle.zip`. Os 56 PNGs continuam intactos. O alinhamento usa uma translação fixa de 24 pixels nas poses de 112×112 dentro da tela de 160×160; nenhuma pose é esticada ou recentralizada pelos pés.
- A ferraria mantém seu cenário e editor próprios. O armazém usa as 31 peças independentes, piso, paredes escuras e colisões. Os outros oito comércios têm interiores funcionais provisórios com móveis existentes, à espera da personalização artística individual.
- Entradas e saídas buscam uma posição desocupada para os pés e um tile diferente do outro ator. A mesma proteção é aplicada quando Bento atravessa a porta durante sua rotina.
- As casas comuns usam o volume da parede com cantos recortados, permitindo aproximação sob o beiral. O poço bloqueia a abertura inteira e os dois apoios. Colisões de cenário próximas ao poço continuam valendo.

## Iluminação

As fontes visíveis usam um shader radial por luminária em WebGL e uma alternativa em Canvas. A fornalha externa do Bento continua acesa de dia, com animação na área da chama e luz pulsante. Postes, lanternas de parede, lanternas portáteis, luminárias instaladas e forjas em uso seguem o mesmo controle de intensidade e iluminação dinâmica.

Fontes inativas não criam shaders. Ao esconder ou destruir uma fonte, seu efeito deixa de aparecer. Equipamentos externos não iluminam o interior da casa. As sombras solares existentes continuam preservadas; esta mudança não cria mapas de normais ou novas sombras por luminária.

## Ferramentas de desenvolvimento

- **F2 na vila:** editor de mapas com Propriedade, Floresta Antiga e Vila; pintura, vegetação, ocultar recursos, grade, desfazer/refazer, rascunho, importação/exportação JSON e aplicação na partida. Fachadas, equipamentos fixos e acessos ficam protegidos.
- **H ou F2 dentro do armazém:** editor de peças reutilizado da ferraria. Permite adicionar, mover, dimensionar, ocultar, definir colisão, associar acessórios ao móvel de apoio, alternar efeitos e mudar o acabamento do piso e o tom da parede. Exporta `After-Rain-Armazem-Editado.json`.
- **H na ferraria:** mantém o editor existente.
- Alterações que ocupam o personagem ou o comerciante, obstruem a entrada ou invalidam a estrutura são recusadas. Falha de salvamento reverte a alteração.

Os editores dependem de `DEVELOPMENT_TOOLS`. Estão ativos no servidor de desenvolvimento e em builds de autoria com `VITE_DEVELOPMENT_TOOLS=1`; o build comum para jogadores mantém os acessos ocultos.

## Persistência

Campos opcionais novos: `villageMapEdits`, `merchantScenes`, `merchantInterior` e `shopResidents`. Partidas anteriores continuam aceitas. Os mapas têm históricos e rascunhos separados. A ferraria continua utilizando seus próprios campos e o layout editado recebido anteriormente.

## Verificação

- TypeScript sem erros.
- 725 testes automatizados passaram em 71 arquivos.
- Build de produção concluído. Permanece o aviso já existente sobre o tamanho do bundle.
- Navegador real: 22 verificações passaram, incluindo campos contextuais e painel do editor sem sobreposição da HUD; condução opcional, bloqueio externo de compra/venda, serviços externos, entrada física, loja interna, editor de peças, exportação, pintura com desfazer/refazer, salvamento após reiniciar a cena e chegada sem sobreposição ou compartilhamento do tile.
- WebGL: 13 luzes da vila/fornalha, zero erros de execução ou de OpenGL; desligamento pela opção gráfica; fornalha iluminada durante o dia.
- Equipamentos: poste instalável, lanterna portátil e lanterna da casa; sem vazamento do poste externo para o interior.
- Canvas: 13 luzes renderizadas pela alternativa e desligamento pela configuração, sem erros.

Os resultados estão em `qa.json`, `qa-canvas.json` e `qa-augusto-animacao.json`. As capturas mostram a vila sem as árvores na frente do cenário.

## Arquivos principais

`src/augusto-sprites.ts`, `src/data/architecture-collision.ts`, `src/data/village.ts`, `src/village-world.ts`, `src/fixture-lighting.ts`, `src/fixture-light-model.ts`, `src/daylight.ts`, `src/village-equipment.ts`, `src/smith-effects.ts`, `src/home-art.ts`, `src/systems/actor-arrival.ts`, `src/systems/merchant-visit.ts`, `src/data/merchant-rooms.ts`, `src/merchant-interior.ts`, `src/village-ui.ts`, `src/smith-layout-editor.ts`, `src/scenes/VillageScene.ts`, `src/scenes/MapEditorScene.ts`, `src/scenes/ValleyScene.ts`, `src/systems/map-editor.ts`, `src/data/default-maps.ts`, `src/map-editor.ts`, `src/map-editor-ui.ts`, `src/map-editor-baseline.ts`, `src/systems/save.ts`, `src/types.ts`, `src/economy-art.ts` e `src/ui.ts`.

Testes novos em `tests/augusto-sprites.test.ts` e `tests/merchant-visit.test.ts`. Conferências reais em `scripts/qa-merchant-interiors.cjs` e `scripts/qa-fixture-canvas.cjs`.
