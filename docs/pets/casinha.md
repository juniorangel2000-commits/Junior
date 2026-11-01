# Casinha dos companheiros

A casinha aparece atrás da casa da propriedade. A posição é salva; ao introduzir o recurso em uma partida antiga, a primeira área livre entre quatro candidatas é usada, preservando construções, canteiros e alterações manuais do mapa. Se todas estiverem ocupadas, é necessário liberar uma área e carregar a propriedade novamente. A formação rochosa com musgo e vegetação foi integrada atrás da clareira. Um caminho de terra curvo liga a lateral da casa à casinha, sem pintar o piso sob construções ou na água. A rocha não é colocada sobre construções, canteiros ou água pintada já existentes; nesses casos a área anterior é preservada.

São três melhorias, com materiais debitados somente depois da gravação bem-sucedida do rascunho do save:

| Etapa | Materiais | Resultado |
| --- | --- | --- |
| Base | 6 tábuas brutas, 8 pedras, 2 cordas | Apoios preparados, materiais de reparo ao lado da ruína |
| Estrutura e telhado | 8 tábuas regulares, 12 cavilhas, 2 peças metálicas | Arte intermediária |
| Camas e potes | 6 tecidos, 12 fibras, 2 refeições | Arte restaurada, adoções e três vagas liberadas |

Um martelo é necessário e não é consumido. O menu acessado com mãos + E mostra quantidades disponíveis e fontes. Tobias oferece o preparo de tábuas/cavilhas; Celina, tecidos/cordas; Ícaro, fixadores. Os comércios já vendem os materiais correspondentes e Helena vende refeições. A costura de Celina também libera a receita de tecido. Serviços mantêm as transações atômicas existentes.

Novos resgates nas dungeons exigem casinha no estágio 3 e menos de três pets adquiridos. A mesma verificação ocorre na entrega da recompensa. Pets de partidas antigas são preservados, inclusive se excederem a capacidade; novas aquisições ficam bloqueadas. Não há remoção automática nem perda de pets antigos.

Pets recém-adquiridos vão para o quintal. O menu dos companheiros permite enviá-los à casinha, chamá-los ou escolher um para seguir. Os residentes usam as animações existentes, passeiam, procuram uns aos outros, visitam os dois potes e descansam perto das entradas. Há separação entre animais e verificação do terreno a cada passo. Atividades, escolhas de alvos e mudanças sutis de pose são visuais; não foi adicionado um sistema de fome, sede ou gasto contínuo de ração. As posições e a condição de morador são salvas; a atividade momentânea é reiniciada ao trocar de cenário. A pausa congela essas atividades.

Os três PNGs originais RGBA têm 1254×1254 pixels e foram preservados sem edição. O jogo usa o mesmo recorte e âncora para os três, na escala do mapa. A versão de ruína é usada antes e depois da limpeza da base, com tábuas novas ao lado após a primeira melhoria.

Validação: testes unitários de reparos, materiais, serviços, crafting, capacidade, migração compatível e movimentação; `scripts/qa-pet-shelter.cjs` verifica as três etapas pela interface real, gravação, moradores, escolha/retorno do companheiro, pausa e ausência de erros. Capturas em `/workspace/pet-shelter-qa`.

## Proporção dos cães

Todos os cães recebem um aumento visual de 15% em relação ao enquadramento anterior. O gato mantém a escala original. O cálculo compartilhado em `petSpritePose` aplica a mesma proporção a caminhada, repouso, ataque, retratos e versões especiais, tanto no quintal e demais mapas quanto nas dungeons, mantendo os pivôs dos pés.

A casinha foi reduzida de escala 0,14 para 0,10 (aproximadamente 29%), com colisão e ponto do pote de água ajustados. O caminho usa terra pixelada com variações de cor, largura e falhas nas bordas para deixar a grama aparecer, em uma textura reaproveitada entre entradas no mapa.

A montanha foi ampliada proporcionalmente de 760 para 1600 unidades de largura, mantendo a base atrás da clareira. A verificação de canteiros existentes passou a cobrir toda a largura da propriedade para acompanhar a nova área da formação rochosa.
