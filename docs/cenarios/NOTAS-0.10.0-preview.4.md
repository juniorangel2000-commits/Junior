# After Rain v0.10.0-preview.4 — rotinas da vila e armazém editado

Augusto e Bento agora têm atendimento, circulação no comércio, intervalo na praça, conversas entre si e retorno às lojas seguindo o relógio do jogo. Os trajetos respeitam móveis, outros personagens e as passagens pelas portas.

- Nomes dos comerciantes e da Lia aparecem somente ao passar o mouse sobre o personagem.
- Nomes e falas usam texto de interface com nitidez independente do zoom e a moldura de madeira e papel da HUD.
- Os diálogos na praça mostram uma fala de cada vez.
- O armazém incorpora integralmente as 41 peças do JSON editado enviado, com objetos guardados, colisões e acessórios preservados.
- O novo padrão substitui somente o armazém original intacto; edições próprias posteriores são preservadas.
- Compra e venda respeitam horário e interior do proprietário; conversas, contratos e outros serviços continuam disponíveis.
- Corrige o salvamento após iniciar uma condução e protege a chegada de personagens nas portas.

Editores desta prévia: F2 na vila, H/F2 no armazém e H na ferraria.

Validação local: TypeScript, build, 736 testes em 73 arquivos, 20 verificações de rotina/interface e 22 verificações de regressão em navegador. Esta release repete os testes e gera o executável no Windows.
