# Praça — preparação da preview.10

O piso recebeu uma nova versão da arte, com juntas escuras estreitas e chanfros claros. O recorte periódico e a unidade de repetição de 32 pixels de mundo continuam iguais, preservando a escala pequena dos tijolos. O PNG da preview.9 permanece disponível sem alterações; o manifesto aponta para a nova arte e registra seu SHA-256.

Conforme o ajuste final solicitado, a praça recebe a cor dos caminhos. A preparação da textura iguala a média dos três canais de cor à do piso dos caminhos, mantendo as diferenças entre juntas, faces e chanfros da nova arte. A textura e a cor dos próprios caminhos permanecem iguais.

O contorno oval agora é composto por pixel, depois da mistura dos materiais do terreno, antes das pinturas manuais do mapa. Isso evita que a interpolação em uma grade de oito pixels apague a borda. O acabamento tem face clara, sombra externa e divisões acompanhando o perímetro. O cálculo ocorre apenas na preparação da textura, sem trabalho adicional por quadro.

A praça mantém o centro (46, 38), raios de 10,5 e 8 tiles, fonte e mobiliário. A grama original, os caminhos, as colisões e os saves não foram alterados.

## Validação

- 863 testes passaram em 100 arquivos.
- TypeScript e build de produção passaram. Permanece o aviso de tamanho de bundle do Vite.
- Capturas reais no Chromium: dia com aproximação, zoom normal e noite. Conferidas visualmente para definição das juntas, continuidade da textura e acabamento do contorno.
- Textura do piso carregada e WebGL sem erro (`getError() = 0`).

Preparado localmente como `0.10.0-preview.10`, com versão sincronizada no package e lockfile e documentos de release. Nenhuma tag ou publicação criada nesta etapa.
