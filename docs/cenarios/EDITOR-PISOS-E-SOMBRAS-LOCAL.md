> Registro das prévias aprovadas e incorporadas à versão 0.9.6.

# Edição dos pisos e passagem central das sombras

Alterações locais sobre a prévia de iluminação; sem nova publicação.

## Editor de mapas

O botão **Ocultar recursos**, ao lado da grade, esconde árvores, rochas, sucatas, galhos, troncos, tocos, plantas, cultivos visuais e a camada de decoração rasteira. Pisos, água, pontes, casa e guias permanecem visíveis. O botão passa a se chamar **Mostrar recursos**.

A escolha é mantida durante a troca entre Propriedade e Floresta e depois de pintar, desfazer ou refazer. Ela não altera os JSONs, a colisão, os IDs, as recompensas ou o histórico do mapa. Escolher uma ferramenta de objetos volta a mostrar os recursos; clicar com seleção enquanto estão ocultos não move objetos invisíveis. As proteções de água, construções e cultivos continuam valendo. A regra anterior que remove plantas baixas quando seu piso é pintado foi preservada.

## Sombras

O contorno deixou de girar como uma imagem inteira. Agora o eixo horizontal da sprite se mantém paralelo ao chão, e a altura é projetada por uma matriz afim. A componente lateral passa continuamente por zero e muda de sinal sem inverter o contorno; a componente vertical permanece positiva e curta ao meio-dia solar. O ponto de apoio continua fixo na base do objeto.

A mesma projeção é usada pelo renderizador WebGL e pelo Canvas, mantendo as texturas derivadas já existentes. A iluminação das janelas e os controles opcionais foram preservados.

## Validação

Testes de classificação e restauração da visibilidade; continuidade da projeção no centro. QA no Chromium cobre os dois cenários, pintura sob árvore oculta sem removê-la, desfazer/refazer, troca de mapa, exportação sem flags visuais e passagem da sombra pelo centro. Artefatos em `editor-pisos-e-sombras`.

Validação final após os novos lagos: 473 testes em 46 arquivos, TypeScript, build e repetição do QA no navegador passaram.
