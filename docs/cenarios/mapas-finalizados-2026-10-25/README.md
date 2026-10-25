> Alterações incorporadas à versão 0.9.7. As primeiras prévias registram a etapa anterior às passagens automáticas.

# Mapas finalizados, pontes e barra de opções

Implementação local após a publicação 0.9.6.

Os dois JSONs enviados em 25/10/2026 estão preservados em `originais/` e copiados integralmente para `src/data/maps`. Os pontos continuam sendo propriedade: entrada (2,52), saída (1,52); floresta: entrada (93,46), saída (94,46).

As pontes receberam cabeceiras de pedra, tábuas acabadas, travessas diagonais, corrimãos e ferragens. As medidas e os bloqueios laterais foram preservados. As placas são novas artes de madeira com uma seta, sem nomes. A posição acompanha os pontos do editor e não cria uma nova colisão nem uma passagem adicional.

O novo botão **Gráficos** da barra superior reúne iluminação do dia, intensidade e sombras/luzes dos shaders, com preferências persistentes e restauração do padrão. Essas opções saíram do painel de pausa. O botão aparece em todos os cenários.

O ícone **Controles** recebeu nova arte de teclado e mouse. O painel agora mostra teclas desenhadas e seis grupos: andar/explorar, itens/ferramentas, mochila/construção, animais/corda, câmera/tela e menus/editor. Cabeçalho fixo e rolagem preservam o acesso em janelas menores.

A revisão de mapas passou para 2. A migração compara o mapa salvo com a base efetiva da 0.9.6 para incorporar as novas pinturas do autor, preservando edições reais feitas pelo jogador, pisos apagados, pontos personalizados, objetos, inventário, coletas e cultivos. Não altera a origem/chave do salvamento.

Validações: TypeScript, **482 testes em 48 arquivos**, build e Chromium. O navegador conferiu os dois JSONs integrais, as nove ações da barra, persistência/restauração das opções gráficas, grupos de controles, layout a 800px, barreiras laterais de ambas as pontes e transições propriedade → floresta → propriedade. Nenhum erro de JavaScript ou asset ausente. Relatório: `previas/validacao.json`.

Prévias reais do jogo:

- [Controles](previas/controles.png)
- [Barra superior](previas/barra-superior.png)
- [Gráficos](previas/graficos.png)
- [Ponte norte](previas/ponte-north.png)
- [Ponte sul](previas/ponte-south.png)
- [Placa da propriedade](previas/placa-propriedade.png)
- [Placa da floresta](previas/placa-floresta.png)

O atlas original das novas artes está em `public/assets/ui/graphics-controls-signs.png`. A base anterior está preservada na tag v0.9.6.

## Passagens automáticas e editor de desenvolvimento

As saídas externas agora mudam de cenário ao caminhar além da linha da placa, seguindo a seta, dentro da passagem marcada. A linha e a placa compartilham a posição; os pontos de chegada ficam antes dela. Parar perto, apertar E ou andar em outras bordas não troca o mapa. Qualquer slot pode estar selecionado. O transporte por corda mantém a checagem de proximidade do animal e aguarda sua aproximação depois da travessia, sem exigir novo comando. A tecla E continua para objetos, personagens e interações dentro da casa.

O editor está disponível em `npm run dev`. Na versão normal de produção, foram retirados os acessos da tela inicial, pausa, F2 e guia de controles. Para gerar um pacote especial de desenvolvimento com o editor, use `VITE_DEVELOPMENT_TOOLS=1` no ambiente do build. Esse sinalizador é definido na geração do pacote, não pelo jogador.

Validação atualizada: **487 testes em 49 arquivos**, TypeScript e build. Teste de navegador `scripts/qa-auto-map-transition.cjs`: ida/volta por movimento, chegada sem retorno automático, E sem transição, movimentação fora da passagem, ferramenta selecionada, corda/entrega de animal e acessos ao editor ocultos no build de produção. Resultado em `transicoes-automaticas.json`.
