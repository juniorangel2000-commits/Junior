# TESTES E CRITÉRIOS DE ACEITE — JARDIM DEPOIS DA CHUVA

Os itens são critérios de conclusão, **não testes já aprovados**; o Codex deve assinalar apenas após executá-los no projeto principal.

## Checkpoint 0 — Auditoria
- [ ] Engine, linguagem, comando de execução e estrutura de projeto identificados.
- [ ] Código existente preservado e funcionalidades existentes inventariadas.
- [ ] Diagnóstico foi aprovado antes de mexer no repositório.

## Checkpoint 1 — Cena e personagem
- [ ] Personagem legível em zoom normal; cabeça, botas e mãos não cortadas.
- [ ] Frente, costas, esquerda e direita com transição correta, câmera estável.
- [ ] Colisão impede atravessar parede, árvore, rocha e área proibida.
- [ ] Pixel art mantém pixels nítidos; sem reamostragem borrada.
- [ ] Mover personagem não altera o visual/preset do personagem.

## Checkpoint 2 — Inventário e crafting inicial
- [ ] Coletar galhos, pedras e fibras gera pilhas com IDs e quantidades corretos.
- [ ] Inventário cheio despeja o excedente no chão sem perder nem duplicar itens.
- [ ] Crafting sem materiais suficientes falha sem custo parcial.
- [ ] Criar corda, cabo, pedra lascada, cavilhas, machadinha, picareta, martelo.
- [ ] Comando repetido/duplo clique não duplica item, especialmente se ação foi cancelada.
- [ ] Picareta rudimentar obtida SEM exigir ferro ou sucata.

## Checkpoint 3 — Mundo reativo
- [ ] Árvores apresentam progresso legível e final de queda/toco.
- [ ] Rocha apresenta rachaduras e fragmentos; picareta consome durabilidade.
- [ ] Golpes fora do alcance ou em alvo inválido não danificam nem concedem recursos.
- [ ] Alvo destruído não concede drops novamente.
- [ ] Cancelar antes do contato não gasta recurso/energia.
- [ ] Feedback contextual identifica ferramenta, estado e motivo de erro.

## Checkpoint 4 — Bancada e serragem
- [ ] Tronco com machadinha gera 2 tábuas brutas.
- [ ] 4 tábuas brutas + 4 cavilhas constroem a bancada.
- [ ] Sucata é alcançável sem dependência de sorte.
- [ ] Na bancada, sucata dá lâmina e lâmina+cabo+corda dá serrote.
- [ ] Tronco com serrote improvisado gera 3 tábuas regulares; gasta 1 tronco exato.
- [ ] Tempo de processamento, indicador visual, cancelamento e durabilidade coerentes.

## Checkpoint 5 — Construção e roof-on/off
- [ ] Piso, parede, porta, janela e cobertura em grade com footprint/pivô corretos.
- [ ] Prévia sinaliza peça válida, bloqueada ou sem materiais; há texto além da cor.
- [ ] Construção não permite sobreposição/água sem ponte/enterrar jogador.
- [ ] Telhado oculta ao entrar; interior é visível; exterior mantém telhado terracota.
- [ ] Colisão atualiza ao colocar/remover peças.
- [ ] Desmontagem retorna <= custo original, em torno de 60% inicialmente.
- [ ] Custo do projeto 3×3 = soma das mesmas peças construídas manualmente.
- [ ] É possível adicionar novas paredes e decorar sem destruir a casa existente.

## Checkpoint 6 — Save/load
- [ ] Localização, direção e inventário persistem.
- [ ] Durabilidade das ferramentas persiste.
- [ ] Árvore cortada, rocha minerada e itens caídos persistem.
- [ ] Bancada, estoques/filas, peça construída e telhado persistem.
- [ ] Abrir/save/carregar repetidamente não duplica itens ou entidades.
- [ ] Saves antigos têm fallback/migração se esquema evoluir.

## Checkpoint 7 — Revisão artística
- [ ] Sem recortes cortando ferramenta, mão, cabelo, telhado ou caixilhos.
- [ ] Sprites transparentes realmente usam RGBA; sem quadriculado de fundo pintado.
- [ ] Tiers das ferramentas são visualmente distintos.
- [ ] Renderização do personagem mantém pivô fixo dos pés nos 8 frames.
- [ ] Casas são creme/bege, com madeira/terracota e venezianas azul-esverdeadas, conforme referências.
- [ ] UI escala corretamente; rótulos e números de crafting são legíveis.

## Roteiro manual obrigatório para a primeira vertical slice

1. Comece com inventário vazio perto da casa abandonada.
2. Colete galho, fibra, pedra; produza cabo, corda e pedra lascada.
3. Crie machadinha e picareta; corte árvore e minere rocha.
4. Procure o mesmo alvo outra vez; confirme que não há recompensa adicional após destruição.
5. Transforme tronco em tábuas; faça cavilhas; monte bancada com martelo.
6. Encontre sucata posicionada no mapa; faça lâmina/serrote; transforme tronco em tábuas regulares.
7. Abra inventário e crafting e confira textos/quantidades/durabilidade.
8. Entre no modo B; coloque piso e parede; cheque colisão, custo e acesso à porta.
9. Selecione projeto pronto 3×3; confira se custo coincide com construção peça a peça.
10. Desmonte uma peça; confira recuperação parcial sem duplicação.
11. Salve, feche, reinicie e carregue; verifique personagem, árvores, rochas, recursos, casa, estações e inventário.
12. Verifique legibilidade em gameplay real e compare com a imagem de referência, não apenas com pôsteres.

## Entrega de cada etapa

O Codex deve responder: mudanças efetivas, arquivos alterados, como rodar, testes executados e resultado, dificuldades visuais, limitações, decisões pendentes, e confirmação clara se avançamos ou não.
