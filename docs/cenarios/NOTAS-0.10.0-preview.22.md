# After Rain 0.10.0-preview.22 — companheiros, propriedade e partidas salvas

## Companheiros e casinha

- Golden Retriever e Border Collie, com animações em oito direções e versões especiais identificadas por ✦. A coleção exibe oito variações entre cães e gato.
- Bark do Golden é usado no ataque e periodicamente em repouso. O arquivo do Border Collie não contém Bark; seu ataque usa a animação Jump disponível.
- Todos os cães ficaram 15% maiores, preservando a escala do gato e o alinhamento de suas animações nos mapas e dungeons.
- Casinha atrás da casa do jogador, com três melhorias: base; estrutura e telhado; camas e potes. O menu mostra os custos e onde obter materiais por comércio, serviços e crafting.
- Novos resgates de companheiros exigem a casinha completamente reparada e menos de três pets adquiridos. Companheiros de saves antigos são preservados mesmo se excederem esse limite.
- Moradores passeiam pelo quintal, procuram outros pets para brincar, visitam os potes e descansam perto das entradas. Esses comportamentos são visuais, sem um novo sistema de fome ou sede.
- K abre/fecha os companheiros. Painel flutuante com o estilo da HUD, comandos Seguir/Esperar/Chamar, botões de minimizar/fechar e posição arrastável. Um painel fechado pode ser recuperado em K → Mostrar painel flutuante.

## Propriedade e vila

- Formação rochosa com musgo e vegetação ampliada para preencher a vista atrás da casa. Trilha de terra curva com textura, largura variável e bordas misturadas à grama.
- Casinha dos pets na proporção menor da prévia aprovada, com colisão e acesso aos potes ajustados.
- Pássaros de ambientação nos mapas externos, com pequenos saltos, voo e reação à aproximação do jogador; pousam em chão livre e aparecem durante o dia.
- Novo fundo para a criação de personagens. Lia foi removida das cenas e das missões; campos antigos do save são mantidos para compatibilidade.
- Rotinas dos comerciantes avançam enquanto o jogador está nos outros mapas do mundo. A entrada na vila restaura suas atividades, sem reiniciar todos nas portas.
- Piso e lago da vila reaproveitam texturas quando o terreno não muda, reduzindo o custo de voltar ao mapa. O primeiro carregamento ainda pode levar alguns segundos conforme o computador.

## Partidas e estabilidade

- Partidas salvas no menu inicial: criar novas histórias, escolher qual carregar, renomear a partida e excluir com confirmação.
- O save antigo aparece na lista e permanece na chave original. Cada nova partida tem dados e cópias de segurança independentes; renomear a partida não muda o personagem.
- Migração de saves anteriores para o formato 3, preservação do original e cópias rotativas separadas por partida. Saves inválidos ou de versões futuras não são sobrescritos automaticamente.
- Quadros de monstros usam recortes transparentes com as âncoras originais; atualizações visuais evitam reaplicar textura e escala sem mudança. Esses ajustes preservam alcance, dano e colisões do combate.
- Painel de controles ampliado com atalhos de construção, companheiros, mochila, pesca, câmera e navegação dos menus.

## Validação

1.282 testes automatizados, TypeScript e build de produção. Verificações no Chromium cobriram reparos pela interface, salvamento de cada etapa, limite de adoções, três moradores e seus comandos, pausa, criação/carregamento/renomeação/exclusão de partidas, preservação do save antigo, pássaros e continuidade das rotinas da vila.

Testes de renderização por software com até 480 inimigos não equivalem a uma medição de FPS no Windows do jogador. O executável é gerado e verificado pelo workflow Windows da release.

Baixe `After-Rain-0.10.0-preview.22-Windows-x64.exe`. O arquivo `SHA256SUMS.txt` permite conferir sua integridade.
