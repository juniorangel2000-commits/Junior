# AFTER RAIN — Implementação do Sistema de Natação

## 1. Objetivo principal

Implemente um sistema completo de natação no jogo **After Rain**, preservando integralmente os sprites oficiais dos personagens.

Quando o personagem entrar em uma região de água profunda:

- Apenas a cabeça deverá permanecer visível acima da superfície.
- O pescoço, os ombros, o tronco, os braços e as pernas deverão ficar submersos.
- O corpo submerso deverá permanecer parcialmente visível através da água, como uma silhueta azul-esverdeada escura e semitransparente.
- A silhueta deverá acompanhar o movimento do personagem, mantendo suas proporções.
- Pequenas ondulações deverão aparecer ao redor da cabeça.
- O personagem poderá nadar livremente nas direções permitidas pelo jogo.

**Não substitua os sprites originais por imagens do PixelLab.** Utilize as texturas e animações existentes no projeto.

## 2. Inspeção obrigatória do projeto

Antes de implementar:

1. Examine a estrutura atual do projeto Phaser + TypeScript.
2. Identifique a versão instalada do Phaser e as APIs de renderização disponíveis.
3. Localize o sistema de movimentação em `src/player.ts` ou nos arquivos equivalentes.
4. Identifique como o mundo, a água e as colisões são construídos em `src/world.ts` e nas cenas.
5. Localize os sprites e as animações dos personagens.
6. Verifique como o jogo gerencia profundidade de renderização, estados e transições entre regiões.

Os nomes dos arquivos são referências. Confirme a estrutura real antes de modificar qualquer código.

## 3. Renderização da natação

Crie um sistema de renderização dividido em três componentes.

### Camada A — Corpo submerso

- Utilize a aparência original do personagem como base.
- Represente a parte submersa como uma silhueta escurecida.
- Aplique tonalidade azul-esverdeada combinando com a água local.
- Utilize transparência ajustável, inicialmente entre 35% e 55%.
- A silhueta deve preservar o formato do corpo, evitando uma sombra oval genérica.
- Mantenha os pixels definidos, sem suavização ou filtros que descaracterizem a pixel art.
- Caso a água apresente variações de profundidade, ajuste a intensidade do escurecimento.

### Camada B — Superfície da água

- A superfície deve aparecer visualmente sobre o corpo submerso.
- Utilize máscaras, recortes ou camadas de renderização compatíveis com a versão do Phaser.
- Preserve o desenho original da água.
- A máscara deve acompanhar o personagem durante o deslocamento.
- Evite cortes artificiais nas texturas ou problemas de ordenação de profundidade.

### Camada C — Cabeça visível

- Renderize apenas a cabeça original do personagem acima da superfície.
- Defina o recorte conforme as dimensões reais de cada sprite.
- Não utilize uma proporção fixa para todos os personagens.
- Preserve cabelos, rosto, acessórios e cores.
- A cabeça deve permanecer alinhada à silhueta submersa durante todo o movimento.
- Implemente uma oscilação vertical discreta para simular a flutuação.

**Resultado esperado:** o jogador deve reconhecer imediatamente seu personagem, mesmo enquanto estiver nadando.

## 4. Animações de movimento

Implemente os seguintes estados:

- `swim_idle`: personagem flutuando sem deslocamento.
- `swim_up`: nadando para cima.
- `swim_down`: nadando para baixo.
- `swim_left`: nadando para a esquerda.
- `swim_right`: nadando para a direita.

Se o jogo utilizar oito direções, preserve esse suporte.

Caso não existam animações específicas de natação, adapte as animações disponíveis sem alterar permanentemente os sprites originais.

O movimento precisa transmitir a sensação de natação, evitando que o personagem pareça estar caminhando dentro da água.

## 5. Ondulações e efeitos aquáticos

Implemente efeitos sutis em pixel art:

**Personagem parado:**
- Pequenas ondulações circulares ao redor da cabeça.
- Animação lenta e discreta.
- Leve oscilação vertical.

**Personagem nadando:**
- Ondulações acompanhando o deslocamento.
- Pequenos rastros na água.
- Respingos discretos próximos à cabeça.
- Frequência dos efeitos proporcional à velocidade.

**Entrada na água:**
- Transição visual entre caminhada e natação.
- Pequeno efeito de respingo ao entrar.
- O corpo deve desaparecer gradualmente sob a superfície conforme a profundidade.

**Saída da água:**
- O corpo deve reaparecer normalmente.
- A velocidade de caminhada deve ser restaurada.
- Os efeitos de natação devem ser removidos sem deixar sombras ou máscaras presas na cena.

## 6. Movimentação e colisões

Integre o sistema à movimentação existente:

- Detecte quando o personagem entra em águas profundas.
- Permita deslocamento nas áreas navegáveis.
- Aplique velocidade de natação configurável, inicialmente inferior à velocidade de caminhada.
- Preserve colisões com margens, pedras, árvores, construções e outros obstáculos.
- Impeça a travessia de limites inválidos do mapa.
- Não permita que o jogador fique preso durante a transição entre terra e água.

Se o jogo tiver áreas de água rasa, mantenha a caminhada normal nessas regiões e ative a natação somente na profundidade apropriada.

## 7. Compatibilidade com personagens

O sistema deve funcionar com:

- Personagem masculino.
- Personagem feminino.
- Personagens personalizados.
- NPCs, quando receberem comportamento de natação.

Evite duplicar a implementação para cada personagem. Crie um componente reutilizável que aceite configurações individuais de recorte, escala e animação.

## 8. Organização técnica

Organize a implementação em componentes claros, por exemplo:

- `SwimmingController.ts` — estados e deslocamento.
- `SwimmingRenderer.ts` — cabeça, silhueta e máscaras.
- `WaterEffects.ts` — ondulações e respingos.
- `SwimmingConfig.ts` — profundidade, transparência, velocidades e ajustes visuais.

Utilize nomes diferentes se a arquitetura existente exigir.

Priorize a reutilização dos sistemas atuais em vez de reescrever funcionalidades já existentes.

Evite gerar novas texturas ou objetos a cada frame. Reutilize elementos, descarte recursos corretamente e mantenha bom desempenho.

## 9. Testes obrigatórios

Verifique:

1. Entrada e saída da água em todas as direções.
2. Cabeça corretamente visível, sem aparecer o tronco.
3. Silhueta submersa acompanhando o personagem.
4. Ausência de problemas de máscara ou profundidade visual.
5. Colisões com margens e obstáculos.
6. Movimento parado e movimento contínuo.
7. Compatibilidade com personagens masculino e feminino.
8. Funcionamento ao mudar de cena e ao carregar um jogo salvo.
9. Ausência de regressões na movimentação em terra.
10. Funcionamento com as configurações de renderização realmente utilizadas pelo projeto.

Execute as verificações de TypeScript e os testes disponíveis.

## 10. Requisitos finais

**Preserve os gráficos existentes do After Rain.**

Não redesenhe personagens, não altere suas proporções e não substitua suas sprites oficiais.

Não modifique desnecessariamente a aparência dos lagos, rios e outras áreas aquáticas.

O efeito deve funcionar com os sprites já existentes, independentemente de novas animações do PixelLab.

Implemente primeiro uma versão funcional, depois refine a qualidade visual mantendo compatibilidade e desempenho.

Ao finalizar, apresente:

- Arquivos criados e modificados.
- Explicação de como o sistema funciona.
- Parâmetros disponíveis para ajustar o efeito.
- Testes executados e respectivos resultados.
- Limitações identificadas.

**Importante:** trabalhe somente no ambiente local autorizado. Não faça commit, push ou publicação no GitHub sem autorização explícita.