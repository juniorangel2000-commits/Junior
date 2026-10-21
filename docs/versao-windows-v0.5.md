# After Rain 0.5.0 — Windows x64

Esta versão reúne todas as alterações implementadas depois da entrega 0.4.0. O pacote portátil destina-se ao Windows 10/11 de 64 bits, incluindo Windows 11 x64. Continua no mesmo projeto, com Phaser 3, Vite e Electron.

## Conteúdo

- Nome **After Rain** e tela inicial com garoa, neblina, câmera suave e controle do fundo. O vídeo do Flow ainda não foi fornecido; a abertura usa o cenário animado do jogo.
- Sprite original da casa, detalhada no estilo das árvores e do terreno atuais. Acesso de terra centralizado na porta.
- Interior personalizável com seis tipos de móvel, três pisos e três paredes. Acervo gratuito nesta etapa, limites e validação de circulação. Posição e decoração persistem.
- Cama para descansar das 19:00 às 07:59 e acordar às 08:00. O sono avança o calendário e os cultivos regados, sem regar os secos.
- Barra superior retrátil: seta revelada ao passar o mouse no centro superior, ou botão direito no cenário. Acesso a inventário, mapa, fabricação, construção, salvar e opções. Barra e menus abertos pausam a simulação.
- Missões com **X** para fechar o painel inteiro, botão discreto para reabrir e preferência lembrada localmente.
- Informações de dia/hora/recursos em cartão de **210×62 px**.
- Seis placas externas retiradas. Nome da Lia sem retângulo de fundo.
- Painel de administração por senha para buscar e conceder os 19 itens implementados. Minimizar permite testar no mapa; encerrar ou sair da partida revoga a sessão. A senha foi entregue separadamente e não está no repositório.
- Mantém propriedade, Bosque do Pinheiro, Campos Abertos, personagem/editor, coleta, cultivo, NPC, ferramentas, corte/mineração, processamento de madeira, construção e saves anteriores.

![Acesso alinhado e interface compacta incluídos no pacote](capturas/after-rain-entrada-hud.png)

## Distribuição

**Publicada e download verificado.** Baixe [After-Rain-0.5.0-Windows-x64.exe](https://github.com/juniorangel2000-commits/Junior/releases/download/v0.5.0/After-Rain-0.5.0-Windows-x64.exe) pela [Release v0.5.0](https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.5.0). Feche a versão antiga e abra o novo arquivo com dois cliques. A Release também contém [SHA256SUMS.txt](https://github.com/juniorangel2000-commits/Junior/releases/download/v0.5.0/SHA256SUMS.txt).

A [execução 39636701053](https://github.com/juniorangel2000-commits/Junior/actions/runs/39636701053), acionada pela tag no commit `67587bb3d716b530beb934b5952354722ac6c97a`, concluiu a instalação pelo lockfile, conferência da versão, TypeScript, **163 testes em 13 arquivos**, build, empacotamento e publicação em um runner Windows.

O arquivo público foi baixado integralmente por HTTP 200 e conferido:

- Tamanho: **121.064.368 bytes**, aproximadamente 115,5 MiB.
- SHA-256: `006fd65f60c50249803824d9ec2dcc9e61153dbdf1ba016f95882bf6bf7ed8dc`, igual ao manifesto público.
- Portátil NSIS com cabeçalhos MZ/PE válidos e payload **After Rain.exe AMD64/x64**, `Machine 0x8664`, `PE32+ 0x20b`.
- `app.asar` com versão **0.5.0** e entrada `desktop/main.cjs` correspondente ao projeto.
- **92 arquivos de dist comparados:** 84 idênticos byte a byte e oito com diferenças somente de CRLF/LF: seis READMEs, `favicon.svg` e `index.html`. JavaScript, CSS e os dez assets originais conferidos, incluindo `starter-cottage.png`, são idênticos ao build local.
- Identidade do armazenamento desktop preservada e senha administrativa em texto puro ausente do pacote.

O bootstrap NSIS é x86 e extrai o aplicativo x64, comportamento esperado do formato portátil. A inspeção não executou código Windows.

O local do save permanece `%APPDATA%\Depois da Chuva`, com appId `br.depoisdachuva.jogo`, origem `chuva://jogo`, chave `depois-da-chuva-v1` e formato versão 2. A mudança de nome para After Rain não cria uma nova pasta de saves. O save do navegador é separado do save do aplicativo.

O pacote roda offline e não exige Node.js, servidor nem instalação. A execução interativa no Windows nativo não foi realizada neste ambiente Linux. O próximo polimento visual da HUD será feito depois desta entrega e não integra este pacote.

O build de produção também passou pelo fluxo principal no Chromium: continuar dentro da casa, dormir, crescer cultivos regados, editar/salvar acabamentos, abrir a barra e os menus, autenticar o admin, conceder itens, fechar/reabrir missões e recarregar. A nova casa respondeu HTTP 200; não houve erros JavaScript, assets ausentes ou requisições HTTP externas no fluxo.
