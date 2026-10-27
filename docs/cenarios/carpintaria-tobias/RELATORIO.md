# Carpintaria do Tobias e finalização dos comércios

Implementação local posterior à preview.6. Nenhuma publicação nesta etapa.

## Comércios finalizados

O novo `After-Rain-Rosa-Editada.json` foi incorporado sem alterar seus bytes: 20 peças. Ferraria (52 peças) e armazém (41 peças) mantêm exatamente os arquivos aprovados na preview.6.

H, F2, botão de pausa e sugestões do guia de controles não oferecem edição nesses três interiores, inclusive em builds de desenvolvimento. Compras, vendas, serviços, rotinas e salvamento continuam funcionando. As edições anteriores efetivas são preservadas; o padrão antigo intacto da Rosa migra para o novo, inclusive quando o editor tinha escrito flags equivalentes.

## Nova carpintaria

Fachada criada do zero, inspirada na composição e na arte da ferraria: prédio de alvenaria e madeira à esquerda e oficina aberta coberta à direita. Janelas com iluminação noturna, duas luminárias e fumaça na chaminé. A área da oficina é transitável, com colisão na bancada, madeiras, paredes e bases dos postes. Camadas da imagem são compostas em runtime sem modificar o PNG original.

O interior possui 17 objetos novos: balcão, estante de madeiras, painel de ferramentas, bancada com morsa, armário, tábuas, cadeira em construção, barril de retalhos, cavaletes, grampos, projeto, livro, ferramentas manuais, lanterna, banco, tapete e janela com venezianas. Total: 20 peças contando estrutura, piso e a segunda lanterna.

**Todo o piso é de madeira**, incluindo a área de trabalho, conforme solicitado. Paredes usam a mesma constante verde-escura da ferraria. Preços, receitas e funções comerciais existentes foram reaproveitados.

Apenas a carpintaria nova continua com H/F2 e editor de desenvolvimento para ajustes. Importação/exportação: `After-Rain-Carpintaria-Editada.json`. Alterações validam colisões, entrada, atendimento, posição do jogador e do NPC, navegação e salvamento. Os editores externos e a personalização da casa do jogador permanecem disponíveis.

## Tobias e animações

Rotina integrada ao calendário existente: atendimento 08h–12h e 13h30–18h; caminhada à praça no intervalo e retorno ao comércio. Compra/venda dentro da própria loja, condução opcional e demais serviços separados.

Os 56 PNGs do pacote de animação foram preservados com hashes. O atlas tem oito direções, uma pose parada e seis quadros de caminhada por direção. As sete direções restantes usam os pixels nativos com compensação apenas da margem transparente do idle. A vista south recebeu uma arte refinada separada (parado + seis fases), com correção dos braços na segunda metade do ciclo.

Os quadros south compartilham escala e transformação vertical. A ancoragem horizontal usa a cabeça, nunca a posição variável do pé levantado. No atlas validado, o topo varia dois pixels nativos e o pé até quatro pixels, preservando o passo. Na escala do jogo, a variação vertical de apoio é de até uma unidade. A suavização de imagens permanece desligada.

O retrato da loja também utiliza a frente refinada. Texturas temporárias da montagem são removidas após criar o atlas; os PNGs continuam disponíveis em disco. O GIF é uma prévia codificada a partir dos quadros exportados pelo jogo, na cadência aproximada da caminhada do NPC; os assets do jogo continuam em PNG.

## Verificação

TypeScript e build aprovados. 761 testes automatizados em 79 arquivos e 30 verificações no Phaser/WebGL aprovadas. Validado: quatro rotinas, 56 quadros do Tobias, seis poses distintas do ciclo frontal, ausência dos editores nos três comércios concluídos, atendimento, arquivo exato da Rosa, fachada, circulação externa, editor/exportação da carpintaria, madeira em todo o piso, luzes, pausa na praça, retorno, encerramento noturno, persistência e manutenção do editor de mapas externos. Sem erros de execução ou assets ausentes.

Capturas ocultam as árvores apenas para revisão. A validação visual foi feita no navegador local; esta etapa não gerou novo executável Windows.

## Arquivos principais

Novos: `src/data/tobias-shop.ts`, `src/tobias-shop.ts`, `src/data/tobias-layout.json`, `src/tobias-sprites.ts`, `public/assets/visual/village/tobias/`, `src/data/rosa-layout-v1.json`, `scripts/prepare-tobias-assets.py`, `scripts/qa-tobias-finalized-shops.cjs`, `tests/tobias-shop.test.ts`, `tests/tobias-sprites.test.ts`.

Integração: `src/scenes/VillageScene.ts`, `src/data/merchant-rooms.ts`, `src/merchant-interior.ts`, `src/systems/merchant-routine.ts`, `src/data/village.ts`, `src/village-world.ts`, `src/economy-art.ts`, `src/solar-shadows.ts`, `src/ui.ts`, `src/control-guide.ts`, `src/types.ts`, `src/data/rosa-layout.json`. Testes e verificadores existentes acompanham as quatro rotinas e os interiores concluídos. O empacotador da Rosa não sobrescreve mais seu layout autoral.
