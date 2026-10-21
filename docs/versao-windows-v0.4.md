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

Baixe [Depois-da-Chuva-0.4.0-Windows-x64.exe](https://github.com/juniorangel2000-commits/Junior/releases/download/v0.4.0/Depois-da-Chuva-0.4.0-Windows-x64.exe) pela [Release 0.4.0](https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.4.0). Feche a versão antiga e abra o novo arquivo com dois cliques. Não exige Node.js, servidor, instalação ou conexão durante o jogo. O executável não possui assinatura digital.

O save do aplicativo permanece em `%APPDATA%\Depois da Chuva`. Nome do aplicativo, appId, origem `chuva://jogo`, chave `depois-da-chuva-v1` e formato de save versão 2 foram preservados. Mover o novo executável não muda o local do save. A partida do navegador continua separada da partida do aplicativo.

## Validação e distribuição

**Publicada e download verificado.** A [execução 39621761382](https://github.com/juniorangel2000-commits/Junior/actions/runs/39621761382), acionada pela tag `v0.4.0` no commit `885752f9a93e97aa6fa93c20f142c2eb83b488d9`, concluiu com sucesso em um runner Windows. Incluiu instalação pelo lockfile, conferência da tag, TypeScript, **135 testes em nove arquivos**, build, geração do portátil, manifesto de integridade e publicação.

O arquivo público foi baixado integralmente por HTTP 200 e conferido:

- Nome: `Depois-da-Chuva-0.4.0-Windows-x64.exe`.
- Tamanho: **119.488.181 bytes** (aproximadamente 114 MiB).
- SHA-256: `0c4227ae18f00b92bb7f73b5295ba74b3d944f536524ad1d166f95d484d9e991`.
- Hash idêntico ao [manifesto público SHA256SUMS.txt](https://github.com/juniorangel2000-commits/Junior/releases/download/v0.4.0/SHA256SUMS.txt); cabeçalhos MZ/PE do portátil válidos.
- Pacote disponível também no artefato `Depois-da-Chuva-Windows-x64` da execução de CI.

A inspeção do arquivo baixado confirmou o payload Windows **AMD64/x64** (`Machine 0x8664`, `PE32+ 0x20b`) e `package.json` versão 0.4.0. O bootstrap do portátil NSIS é x86 e extrai o aplicativo x64; isso é esperado para esse formato.

Os **89 arquivos de `dist/`** foram comparados ao conteúdo de `app.asar`: 83 idênticos byte a byte, incluindo JavaScript, CSS e os nove PNGs de atlas da arte atual. Os outros seis diferem somente nas quebras de linha do checkout Windows: quatro READMEs de assets, `favicon.svg` e `index.html`. A entrada `desktop/main.cjs` também corresponde após normalizar CRLF/LF. Nenhum arquivo do pacote foi modificado durante a inspeção.

Os checks locais sobre o conjunto final também passaram: TypeScript, 135 testes, build e sintaxe de `desktop/main.cjs`. No Chromium, o build estático de produção passou por criação personalizada, movimento, pausa, salvar, menu, recarregar e continuar preservando aparência, posição e inventário. Os nove atlases da arte atual responderam localmente sem falhas; não houve erros JavaScript/HTTP nem requisições externas.

Os detalhes das etapas anteriores estão em [terrenos](terrenos-novos.md), [recursos e margens](recursos-e-margens.md), [decoração](decoracao-pedras-flores.md) e [personagem/editor](personagem-e-criacao.md).

Não foi realizado teste interativo em Windows nativo neste ambiente. A validação no Chromium e a geração em Windows não equivalem a uma sessão de jogo manual no Windows 11.
