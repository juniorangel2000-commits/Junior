# Jardim Depois da Chuva 0.4.0 — Windows x64

Esta versão reúne as alterações feitas após a entrega pública 0.3.0. Continua no mesmo projeto, com TypeScript, Phaser 3, Vite e Electron. O pacote portátil destina-se ao Windows 10/11 de 64 bits, incluindo Windows 11 x64.

## Conteúdo da atualização

- Onze materiais locais de terreno, incluindo grama, bosque, campos, estradas, cultivo, margens, água e pisos de construção.
- Bordas mais naturais de caminhos e água; movimento e colisão usam a margem contínua visível.
- Pedras soltas coletáveis com as mãos e rochas mineráveis com picareta visualmente distintas. Arbustos, fibras, galhos e sucata reformulados. Recursos baixos fora dos caminhos.
- Flores, samambaias, capim e pedras decorativas no novo estilo. As três pedras de passagem da entrada da casa foram removidas.
- Personagem em canvas de 48×64, com três penteados, quatro direções e quatro fases de caminhada.
- Editor com seis tons de pele, seis cores de cabelo, seis cores de macacão e seis cores de camisa, bolsa opcional, três aparências prontas, redefinição e prévia giratória com caminhada.
- Personalização preservada no save. Perfis antigos continuam válidos; camisa e bolsa recebem defaults na renderização.
- Nome de Lia posicionado acima da cabeça e retrato de diálogo sem distorção.
- Mantém propriedade, Bosque do Pinheiro, Campos Abertos, coleta, fabricação de ferramentas, corte/mineração, processamento da madeira, construção, cultivo e diálogo.

![Entrada da casa na versão atual](capturas/entrada-sem-pedras.png)

## Como abrir

O arquivo terá o nome `Depois-da-Chuva-0.4.0-Windows-x64.exe`. Baixe o pacote completo e abra com dois cliques. Não exige Node.js, servidor, instalação ou conexão durante o jogo. O executável não possui assinatura digital.

O save do aplicativo permanece em `%APPDATA%\Depois da Chuva`. Nome do aplicativo, appId, origem `chuva://jogo`, chave `depois-da-chuva-v1` e formato de save versão 2 foram preservados. Mover o novo executável não muda o local do save. A partida do navegador continua separada da partida do aplicativo.

## Validação e distribuição

Estado inicial desta publicação: **em preparação**. O workflow `.github/workflows/windows-release.yml` verifica TypeScript, testes, versão da tag e gera o portátil em um runner Windows. Ao enviar a tag `v0.4.0`, publica o `.exe` e `SHA256SUMS.txt` na Release correspondente.

Os testes e builds locais já feitos nas etapas anteriores estão documentados em [terrenos](terrenos-novos.md), [recursos e margens](recursos-e-margens.md), [decoração](decoracao-pedras-flores.md) e [personagem/editor](personagem-e-criacao.md). Esta publicação repetirá os checks sobre o conjunto final e registrará o resultado de geração e integridade do download.

Não foi realizado teste interativo em Windows nativo neste ambiente. A validação no Chromium e a geração em Windows não equivalem a uma sessão de jogo manual no Windows 11.
