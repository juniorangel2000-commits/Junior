> Registro das prévias aprovadas e incorporadas à versão 0.9.6.

# Prévia local — sombras solares e janelas

Primeira etapa sobre a versão 0.9.5 publicada, sem nova publicação ou alteração de mapas/saves. Imagens e vídeo vêm do renderizador real do jogo.

- Sombras projetadas a partir do alpha das sprites de árvores, pedras, casa, personagem e Lia. O sol move a direção e o comprimento; as bordas são suavizadas e a sombra perde força em direção à ponta. Sombras desaparecem no nascer/pôr do sol sem saltos.
- Shader GLSL em coordenadas do mundo mantém a iluminação ambiente e abre cones de luz quente diante das duas janelas da casa. Eles acendem gradualmente ao anoitecer e apagam pela manhã. A luz não sobe sobre o telhado e mantém a textura original visível.
- Esc → Visual do vale → Sombras do sol e luzes das janelas. A opção é independente da intensidade e preserva preferências antigas. Sem WebGL, o jogo mantém sua iluminação simples.
- HUD e mapa de consulta ficam fora do efeito. O interior desativa as sombras externas. Recursos coletados perdem a sombra; a recarga da partida libera programas GLSL e texturas derivadas antes de reconstruir a cena.

Esta primeira etapa usa projeção 2D e cones de luz; não inclui normais por material, sombras locais de cada janela ou oclusão completa de todas as fontes. Fontes adicionais e materiais podem ser avaliados depois da direção visual aprovada.

## Mídia

`previa-luz-sombras/comparacao.png`: visual atual e prévia, tarde/noite.
`previa-luz-sombras/sol-em-movimento.gif` e `.mp4`: passagem acelerada do sol.
`previa-luz-sombras/floresta-dia.png`: sombras na floresta.

## Validação

TypeScript, 463 testes em 44 arquivos e build passaram. Chromium: shader compilado sem erros GL; sombras ligadas/desligadas; janelas à noite; zoom e resize; entrada/saída da casa; preferência via interface; descarte do shader na recarga; troca para a floresta. Canvas sem WebGL também abriu e manteve a iluminação simples sem erros. Relatório: `previa-luz-sombras/validacao.json`.
