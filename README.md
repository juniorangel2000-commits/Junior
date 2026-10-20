# Depois da Chuva

Uma pequena clareira, uma casa que resistiu e a chance de recomeçar. **Depois da Chuva** é um jogo original para navegador, single-player, com exploração, cultivo e construção em pixel art 2D top-down. Esta primeira entrega é uma fatia jogável tranquila, feita com TypeScript, Phaser 3 e Vite.

As três propostas para a próxima direção de arte estão na [galeria de estudos visuais](docs/direcao-visual/README.md). São conceitos para aprovação; ainda não foram aplicados ao jogo.

## Instalar e abrir

Use Node.js **22.12 ou superior** e npm. Não há backend, serviços pagos, contas ou chaves de API.

```bash
npm ci
npm run dev
```

Abra no navegador o endereço mostrado pelo Vite, normalmente `http://localhost:5173`. O foco inicial é computador com teclado e mouse. A tela inicial permite começar um jogo e continuar quando há um save local válido.

Para gerar e conferir a versão de produção:

```bash
npm run check
npm test
npm run build
npm run preview
```

O build fica em `dist/`. Sirva essa pasta por HTTP; abrir `index.html` diretamente pelo sistema de arquivos não é o fluxo suportado. O Vite 7 requer Node.js 20.19+ ou 22.12+; a versão recomendada acima atende a esse requisito.

## Aplicativo para Windows

**Download publicado:** [Depois da Chuva v0.1.0 para Windows x64](https://github.com/juniorangel2000-commits/Junior/releases/tag/v0.1.0). Na seção **Assets**, baixe `Depois-da-Chuva-0.1.0-Windows-x64.exe`.

O pacote portátil é gerado em `release/Depois-da-Chuva-0.1.0-Windows-x64.exe`. Ele é destinado a **Windows 10/11 de 64 bits**. Para jogar, abra esse arquivo com dois cliques. Não precisa instalar Node.js, abrir um terminal, manter o Vite ativo, conectar à internet ou executar como administrador. A primeira abertura pode demorar um pouco enquanto o pacote prepara seus arquivos temporários.

O aplicativo usa Electron e inclui o jogo e seu próprio motor de execução. O save fica nos dados locais do usuário, em `%APPDATA%\Depois da Chuva`. Ele é separado do save do navegador e permanece ao fechar o jogo ou mover o executável. A origem interna do jogo permanece fixa entre versões; a pasta temporária do portátil não determina o local do save.

Para reconstruir o executável a partir do código:

```bash
npm ci
npm run desktop:win
```

Para abrir o aplicativo em desenvolvimento, use `npm run desktop`. O empacotamento precisa baixar ferramentas oficiais do Electron e NSIS, mas o aplicativo pronto funciona offline. O código da versão web continua disponível com `npm run dev`.

O pacote não possui assinatura digital de editor. O executável publicado no GitHub foi gerado em um runner Windows, onde as verificações TypeScript, testes de sistemas e empacotamento concluíram com sucesso. A abertura interativa do jogo no Windows ainda não foi testada. O conteúdo real de `app.asar` do pacote inicial também foi executado com Electron em Linux, verificando carregamento sem servidor, criação, plantio, rega e recuperação do save após fechar e mover o pacote. O conteúdo da janela não recebe acesso a Node.js e roda com isolamento de contexto e sandbox.

### Disponibilizar um download pelo GitHub

O arquivo `.github/workflows/windows-release.yml` prepara uma geração do pacote em um runner Windows. Depois de enviar o projeto ao GitHub, a execução manual desse workflow gera um artefato `Depois-da-Chuva-Windows-x64`, contendo o `.exe` e `SHA256SUMS.txt`, disponível para download na página da execução. Isso não exige fornecer uma chave pessoal ao jogo.

Quando uma tag `v*` é enviada ao repositório, o mesmo workflow gera e publica os arquivos em uma GitHub Release. A publicação usa a autorização temporária fornecida pelo próprio GitHub à execução. A [execução da versão v0.1.0](https://github.com/juniorangel2000-commits/Junior/actions/runs/39476344094) concluiu com sucesso. O executável e o manifesto `SHA256SUMS.txt` foram baixados novamente pelos links públicos, com resposta HTTP 200 e SHA-256 correspondente.

Caminhos internos como `/workspace/Junior/release/...` identificam arquivos deste ambiente e não equivalem a um anexo ou a um link público de download. Para distribuir o pacote fora do ambiente, use o download do artefato do workflow ou de uma Release publicada.

## Como jogar

Crie seu personagem escolhendo nome, tom de pele, penteado, cor do cabelo e roupa. A prévia mostra as escolhas. Você começa com 12 madeiras, 6 pedras e 8 sementes de nabo.

| Controle | Ação |
| --- | --- |
| WASD ou setas | Caminhar |
| E | Usar a ferramenta selecionada perto do personagem |
| Clique esquerdo no mundo | Usar a ferramenta no ponto próximo clicado |
| 1 | Mãos: coletar recursos, colher e conversar |
| 2 | Plantar uma semente de nabo |
| 3 | Regar uma planta |
| 4 | Construir uma cerca: 2 madeiras |
| 5 | Colocar um banco: 4 madeiras e 2 pedras |
| 6 | Remover cerca ou banco construído, recuperando todos os materiais |
| I | Abrir ou fechar a mochila |
| Esc | Pausar ou fechar o menu |

As ferramentas também podem ser selecionadas na barra inferior. A interação exige proximidade: caminhe até o objeto ou o canteiro. A câmera acompanha o personagem e obstáculos como casas, árvores, água e construções bloqueiam a passagem.

### Um primeiro dia

1. Vá até Lia, perto da horta, e converse com **1 + E**.
2. Explore a clareira com as mãos para recolher madeira, pedras e sementes dos recursos espalhados pelo mapa.
3. Caminhe até a terra preparada ao sul da casa, selecione **2** e plante.
4. Selecione **3** e regue o mesmo canteiro. O nabo precisa de **45 segundos de simulação** após a rega para ficar pronto.
5. Use as mãos (**1**) no nabo maduro para colher: você recebe um nabo e uma semente para plantar novamente.
6. Experimente colocar cercas e bancos na grama livre. Use **6** para recolhê-los e reorganizar o espaço.

O regador não precisa ser reabastecido nesta versão. Plantas não crescem sem a primeira rega e não murcham. O ciclo completo de dia e noite dura aproximadamente **12 minutos de simulação**, com mudança de iluminação. Menus e diálogos pausam o tempo, o movimento e o crescimento; o teclado do jogo não movimenta o personagem enquanto você digita o nome.

## Salvamento

Há **um slot local**, guardado no `localStorage` do navegador na chave `depois-da-chuva-v1`. Ele preserva personagem, posição, dia e horário, mochila, plantações, construções, recursos coletados e o primeiro encontro com Lia.

O jogo salva ao iniciar uma partida, após ações, ao pausar ou sair para o menu e a cada **12 segundos de simulação**. Também tenta salvar quando a página é ocultada ou fechada. Um novo jogo usa o mesmo slot; preserve sua partida antes de começar outra.

Não há progresso enquanto o jogo está fechado. O save pertence ao navegador e à origem usados para abrir o jogo: outro navegador, porta ou domínio tem armazenamento separado. Limpar os dados do site remove o progresso. Se o armazenamento estiver bloqueado ou sem espaço, o jogo informa que a partida ficará apenas na sessão atual. Dados inválidos ou corrompidos não são carregados.

## O que está implementado

- Tela inicial, novo jogo e continuação de save válido.
- Personalização humana com prévia visual.
- Mapa original com propriedade, casa exterior, horta, mata, ruínas, riacho e ponte.
- Movimento em oito direções independente da taxa de quadros, colisões e câmera acompanhando o personagem.
- Coleta de três recursos e mochila com madeira, pedra, sementes e nabos.
- Ciclo completo de plantar, regar, crescer e colher uma cultura.
- Construção e remoção de cerca e banco, com custo e reembolso de materiais.
- Lia com apresentação e conversa posterior.
- Dia/noite, menus que pausam e salvamento local.
- Arte gerada localmente a partir de desenhos originais em código; nenhum asset remoto é necessário.

## Limitações desta entrega

Esta versão não contém combate, zumbis, hordas, sobreviventes hostis, fome, dano, cadeias de missões, relações de amizade progressivas ou economia. Há uma cultura, uma NPC, dois objetos construíveis e um mapa fixo. As casas e ruínas são exteriores; não há interiores visitáveis. Recursos coletados não reaparecem durante a partida. Não há áudio, suporte específico a toque ou controle, multiplayer, sincronização de saves ou crescimento offline. A animação do personagem é simples.

## Organização

```text
src/
  main.ts                 Inicialização do Phaser e ligação com a interface
  types.ts                Tipos compartilhados
  ui.ts                   Telas, menus, criação e HUD em português
  style.css               Interface e layout
  art.ts                  Sprites originais e desenho do personagem
  world.ts                Mapa, terrenos, colisões e recursos
  player.ts               Movimento do personagem
  scenes/ValleyScene.ts    Integração e ciclo da simulação
  systems/
    inventory.ts          Estoque e custos
    farming.ts            Plantio, rega, crescimento e colheita
    building.ts           Colocação, remoção e reembolso
    npc.ts                Diálogo da Lia
    save.ts               Validação e persistência local
tests/systems.test.ts      Testes dos sistemas de jogo
desktop/main.cjs          Janela e carregamento local do aplicativo
desktop/resources/        Ícones originais do aplicativo
electron-builder.yml      Empacotamento portátil para Windows
vite.config.ts            Caminhos relativos para os assets locais
```

Os testes automatizados verificam consumo atômico, custos e reembolso, plantio/rega/colheita, crescimento equivalente entre taxas de quadros, validação e recuperação de saves, dados corrompidos e falhas do armazenamento. Para alterações visuais ou de controles, também confira o fluxo no navegador.

## Validação desta entrega

`npm ci`, `npm run check`, os **17 testes** de `npm test` e `npm run build` foram executados com sucesso. O Vite informa um aviso de tamanho do pacote JavaScript, que inclui o motor Phaser; isso não impede a execução ou o build.

O fluxo também foi exercitado em Chromium com automação Playwright: criação e alteração da prévia, digitação do nome, movimento por WASD e setas, colisão com a casa, coleta dos três recursos, plantio e rega, crescimento em tempo real e colheita, colocação e remoção dos dois objetos, diálogo com Lia, pausa da simulação e continuação após recarregar. A iluminação noturna e a troca de dia foram verificadas carregando um save próximo à meia-noite. Não foram observados erros de JavaScript ou assets nesse percurso. A automação de navegador foi executada com ferramentas do ambiente; o projeto não exige Playwright para jogar ou executar os testes de sistemas.
