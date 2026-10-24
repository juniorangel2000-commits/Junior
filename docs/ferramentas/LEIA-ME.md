# Ferramentas recebidas e prévia de encaixe

Os dois ZIPs foram preservados em `public/assets/visual/tools/`, incluindo seus
metadados e os 36 PNGs originais de 97×97. Nenhum PNG foi reduzido ou redesenhado.

- Picareta: pose base e nove quadros de animação. À esquerda usa a sequência
  original; à direita usa espelhamento horizontal em tempo de renderização,
  inclusive nas diagonais, conforme a correção solicitada pelo jogador.
- Machado: oito vistas e nove quadros por lado. O lado da lâmina é conferido
  visualmente; os nomes east/west do export não indicam o lado para atacar.
- Nas outras seis orientações, o machado usa as vistas fornecidas. Não há
  animações de golpe próprias dessas direções nos arquivos recebidos.
- Os ícones da mochila, fabricação e barra de atalhos usam as novas artes.

## Correção da orientação

A primeira composição aplicava uma rotação extra sobre os quadros enviados.
Essa rotação foi retirada após a revisão do jogador: a cabeça da ferramenta
permanece acima do cabo, usando apenas o movimento original da sequência.
O ponto de pega acompanha o cabo e coincide com a palma da personagem. O
espelhamento ajusta também a origem, mantendo o cabo na mão ao inverter o lado.

Os arquivos recebidos mostram ferramentas isoladas. Esta é uma prévia do seu
encaixe sobre as poses atuais dos personagens; ainda não inclui novas poses
dos braços ou do tronco para compor um golpe corporal completo.

## Animações para revisão

- `fazendeira-ferramentas.png`: PNG animado com picareta e machado para ambos os lados.
- `fazendeiro-ferramentas.png`: a mesma apresentação com o fazendeiro.
- `personagens-com-ferramentas.png`: imagem estática com os dois personagens.

As imagens são capturas do renderizador Phaser no zoom de 200%, sem reduzir
as capturas ou converter suas cores em paleta de GIF. Cada animação reúne uma
pose de repouso, os nove quadros originais e uma pausa para revisar o ciclo.

## Integração e verificações

O golpe aplica o efeito no quadro de contato, apenas uma vez. A caminhada
pausa durante o uso. Pausar, abrir menus, trocar de ferramenta, sair da partida
ou carregar outro estado cancela o golpe pendente. O alvo, o alcance e a posse
da ferramenta são conferidos novamente no contato. Slots vazios deixam as mãos
livres. Os IDs existentes, as receitas, os custos e as recompensas são mantidos.

Checks, 317 testes e build passaram na integração. Depois da correção visual,
os checks, os 14 testes de ferramentas, o build e a captura no navegador passaram.
`validacao-browser.json` registra os testes de golpes, cancelamento, movimento,
recompensas e salvamento com ambos os personagens. `validacao-visual.json`
registra a captura corrigida, incluindo espelhamento e ausência de rotação extra.

Reprodução: `scripts/qa-tools.cjs` usa Playwright; `scripts/build-tool-previews.py`
monta os PNGs animados com Pillow. `QA_PREVIEW_ONLY=1` captura somente a prévia.
Ainda não publicado em Release.
