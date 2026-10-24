# Fazendeira enviada pelo jogador

Integração local preparada em 23/10/2026. Ainda não publicada em Release.

O pacote `uma_personagem_feminina_fazendeira.zip` contém 56 PNGs de 256×256:
uma pose parada e seis quadros de caminhada para cada uma das oito direções.
Todos os PNGs e o `metadata.json` estão preservados, sem alteração de bytes,
em `public/assets/visual/characters/farmer-female/`.

A seleção apresenta personagens com visual fixo e um campo de nome. Foram
retiradas as opções de pele, cabelo, roupas e acessórios. O catálogo em
`src/data/characters.ts` também inclui o fazendeiro enviado em seguida. Cada
personagem mantém a sua sequência: seis quadros nesta fazendeira, oito no fazendeiro.

## Renderização e salvamento

- Os quadros seguem a ordem original `frame_000` até `frame_005`, sem interpolar,
  deformar membros, recolorir ou adicionar acessórios.
- As texturas mantêm os pixels nativos dos PNGs, sem redução: cada quadro ocupa
  192×256, retirando apenas margens transparentes, com origem fixa (128, 232).
  A exibição no mundo continua 48×64; a redução ocorre somente na exibição,
  preservando os detalhes para a prévia e o zoom. Não se recentra cada quadro.
- A caminhada acompanha a distância realmente percorrida: um ciclo a cada
  48 pixels do mundo. A prévia usa 10,5 quadros/s, equivalente à velocidade
  de caminhada de 84 pixels/s. A pose parada é independente do ciclo.
- Saves novos registram `characterId: farmer-female`. Saves antigos sem esse
  campo usam a fazendeira sem reescrever o perfil nem apagar progresso.
  Campos antigos de aparência permanecem apenas para compatibilidade;
  não alteram a imagem da personagem.
- Lia conserva sua imagem anterior, tanto no cenário quanto no diálogo.
- O editor de mapa e as alterações já existentes no projeto foram preservados.

## Prévias

- `selecao.png`: tela de seleção sem personalizações.
- `no-jogo.png`: personagem no cenário real.
- `oito-direcoes.png`: poses paradas nas oito direções.
- `caminhada.png`: PNG animado (APNG), oito caminhadas em resolução nativa e sem
  redução de cores. `caminhada.gif` é uma alternativa com paleta limitada.
- `zoom-200.png`: captura da textura original no zoom máximo.
- `quadros-renderizados.json`: imagens produzidas pelo renderizador do jogo,
  utilizadas para montar as prévias e comparar os quadros.

## Validação

`npm run check`, `npm test` (301 testes em 23 arquivos) e `npm run build`.
O build tem apenas o aviso já existente sobre tamanho do bundle.

`scripts/qa-character.cjs` verifica no Chromium: os 56 quadros contra os PNGs
originais, seis quadros distintos por direção, visual independente de cores
legadas, ausência dos controles antigos, seleção e caminhada, três tamanhos
de janela, teclas nas oito direções, salvamento e recarga dentro/fora da casa,
retrato de Lia, interação diagonal e ausência de erros de JavaScript/arquivos.
A comparação usa agora os pixels em resolução nativa e verifica também que
nenhum pixel visível foi recortado, que o tamanho no mundo continua igual e
que o zoom de 200% utiliza a textura detalhada.

Os testes de salvamento verificam também a persistência da personagem com
sementes, recompensas da casa já recolhidas e alterações de terreno do editor.
