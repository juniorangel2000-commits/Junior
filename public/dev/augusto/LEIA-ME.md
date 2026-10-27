# Armazém do Augusto — biblioteca de objetos novos

Objetos inteiros e independentes, criados pelo processo usado na ferraria e integrados ao armazém no jogo.

## Entrega

- 31 PNGs novos em `sprites/`, criados do zero com referência visual ao armazém recebido e à madeira da ferraria.
- Revisão 2: cômoda de estoque, gaveteiro de sementes, banco de espera, cadeira, expositor de suprimentos e mesa de embalagem. Parede escura `#26302c`, lida diretamente de `SMITH_WALL_COLOR` da ferraria.
- Nenhum objeto foi recortado da ilustração do interior. Fachada e interior recebidos estão preservados em `referencias/`.
- Resolução nativa, transparência e pixels dos PNGs gerados foram mantidos. O redimensionamento ocorre somente na visualização.
- `manifest.json`: identificador, dimensões, origem, escala sugerida, posição de composição, suporte, profundidade, interação futura e colisão sugerida por peça.
- `index.html`: conjunto, catálogo com fundo quadriculado, referência original, arraste de peças e exportação das posições.
- O balcão move seus cinco acessórios apoiados; a mesa move as hortaliças.
- `personagem/`: 56 PNGs recebidos em `Idle.zip`, preservados byte a byte: oito poses paradas e seis quadros de caminhada em cada uma das oito direções. `animacao.html` mostra o conjunto animado.
- Poses de 112×112 e caminhada de 160×160 compartilham uma tela de 160×160 com deslocamento fixo de 24 pixels para as poses. Não há recorte, redimensionamento de cada quadro nem recentralização automática dos pés.

## Objetos

Balcão central; balança de pratos; livro-caixa; estante de mantimentos; armário de estoque; estante estreita de garrafas; sacos de grãos; caixas de frutas; caixas de hortaliças; pilha de sacos de estoque; tapete verde; quadro botânico; barril; vaso de flores; lanterna; escada; banquinho; varal de ervas; caixa de troco; mesa expositora; cesta de maçãs; capacho; toalha do balcão; caixote vazio; vaso de ervas.

## Revisão e limites

Os 31 objetos estão **em revisão visual**, sem aprovação artística automática. A validação técnica confirma RGBA, margens da silhueta, carregamento e igualdade dos hashes com os arquivos gerados. Transparência sozinha não equivale à aprovação final.

As paredes da composição são um guia simples de posicionamento. O piso de madeira e o Augusto foram reaproveitados sem modificar seus arquivos. O armazém está integrado ao jogo, com colisões, compra e venda no interior e editor de desenvolvimento acessível por H ou F2. Os oito outros comerciantes possuem bases de interior provisórias, reutilizando esta coleção; a ferraria mantém seu cenário próprio. O visualizador é exclusivamente de desenvolvimento e não substitui o editor existente.

Os objetos aprovados do Bento permanecem preservados. A animação recebida do Augusto é carregada ao lado dos arquivos antigos, sem substituir seus PNGs.

## Conferência

Teste de navegador: 31 imagens carregadas sem erros; cor da parede amostrada no canvas e comparada à ferraria; transparência no fundo quadriculado e no piso; arraste do balcão com os cinco acessórios; exportação JSON; restauração; acesso à referência. Relatórios e capturas estão em `validacao/` e `previas/` no pacote.

Para abrir localmente, sirva esta pasta com um servidor HTTP e acesse `index.html`. O carregamento JSON não funciona de forma consistente por `file://`.
