# Aprisco, ovelhas e cabras

Implementado no branch `release/v0.10.0-preview.35`, ainda sem publicação.

## Construir e alojar

Abra **B → Aprisco** e coloque a base em terreno limpo da Propriedade, fora de água,
caminhos, plantações e outras construções. A base custa 4 madeiras e 4 pedras e
exige martelo. Entregue na obra 60 madeiras, 24 pedras, 18 tábuas regulares,
8 madeiras nobres, 1 módulo de porta e 1 módulo de janela. Conclua com o martelo.

O aprisco abriga **até quatro animais no total**, misturando ovelhas e cabras.
As duas espécies já vivem na Floresta Antiga. Conduza-as com a corda até a obra e
escolha **Alojar** no painel; a corda volta à mochila. Vacas, galinhas e cavalo
continuam com suas próprias moradias.

A rotina segue os outros abrigos: cercado das 06:00 às 18:00, interior à noite.
O painel permite **Recolher os animais** durante o dia. Use E na porta para entrar;
saia andando pela porta de baixo. O interior mede 12×9, com cocho, bebedouro,
espaço livre e área de tosquia aberta pela frente.

## Alimentar e recolher

- **Cocho:** E coloca palha da mochila, até 8 unidades. Às 06:00 cada animal
  alojado come 1 palha; quem está há mais tempo sem comer tem prioridade.
- **Cabra:** cada manhã alimentada deixa 1 leite de cabra disponível. Com o
  balde na mochila, E perto da cabra inicia a ordenha de 1 segundo.
- **Ovelha:** fica pronta após **três manhãs alimentadas**. Dias sem palha pausam
  o progresso. Com a tesoura na mochila, E inicia a tosquia de 1,2 segundo e
  entrega 1 lã.
- O produto pronto é indicado acima do animal. Leite e lã ficam pendentes até a
  coleta, sem acumular várias cargas no mesmo animal.
- Tosquiar reinicia os três dias de alimentação da lã. Mudar de aprisco,
  sair/entrar ou carregar a partida não reinicia nem duplica a produção.
- Falha ao salvar, ferramenta gasta ou mochila sem espaço preservam o produto.
  Afastar o jogador durante a ação cancela a coleta.

O balde continua reutilizável. A tesoura é fabricada na bancada com **2 lingotes
de ferro + 1 cabo**, exigindo martelo. Cada cópia tem sua própria durabilidade de
100 pontos, ocupa um espaço e perde 1 ponto por tosquia concluída. Bento repara a
cópia selecionada por 20 moedas.

**Helena compra leite de cabra por 20 moedas; Celina compra lã por 36.** Nenhuma
loja vende esses produtos. Valores iniciais, sujeitos a equilíbrio jogando.
Máquinas (roca, tear, queijeira etc.) continuam sendo a próxima etapa.

## Arte e animação

O aprisco tem arte externa própria. As etapas de base e estrutura reaproveitam
as peças de obra do curral, com a mesma dimensão. O interior reutiliza os fixos
definitivos do SpriteCook em resolução original.

Ovelha e cabra têm arte própria em oito direções e quatro poses de caminhada por
direção, integradas aos oito passos do controlador existente `AnimalWalkCycle`.
A cadência depende do deslocamento real, com limite de FPS e pose parada nas
pausas. Não há animação de descanso em repetição contínua.

A escala em tela é menor que a da vaca: aproximadamente 40 px de largura na vista
lateral para a ovelha e 45 para a cabra, contra 56 da vaca. As raízes das patas e
os pontos da corda foram alinhados ao padrão existente. A pose da cabra foi
refinada para manter patas de apoio no chão durante a passagem.

Os PNGs originais estão em `public/assets/animals/{sheep,goat}/source.png`, com
hashes e recortes nos `atlas.json`. `node scripts/pack-aprisco-art.cjs` empacota os
recortes sem reduzir os pixels, faz o corte de alfa e gera os atlas e ícones. A
arte externa só compacta a altura do pátio na montagem em memória para alinhar
as cercas e a porta à colisão; o PNG original permanece preservado.

## Verificação

`tests/aprisco.test.ts` cobre alojamento misto, consumo, três dias alimentados,
pausa, pendências, mudança de moradia, coleta, tesouras individuais, salvamento,
migração, comércio e circulação do interior. `tests/aprisco-art.test.ts` verifica
os recortes, oito direções e controle de caminhada.

Com Vite em 5190 e Playwright/Chromium externos:

```sh
node scripts/qa-aprisco.cjs /tmp/qa-aprisco
```

O QA constrói uma obra real em terreno preparado, entrega materiais, aloja dois
animais de cada espécie, entra andando, alimenta, ordenha, tosquia, sai e
recarrega a partida. A prévia final compara os sprites reais na mesma câmera e
escala; `ffmpeg` gera o GIF de caminhada. Evidências em
`docs/planejamento/qa-aprisco/`.
