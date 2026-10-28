# Ateliê da Celina

Implementação local sobre o trabalho do Nilo, sem publicação.

- Fachada na mesma linguagem visual das lojas ajustadas: madeira e alvenaria, telhado de cerâmica, vitrines de tecidos/vestido, placa com tesoura e carretel e lanternas.
- Interior com 16 objetos próprios e 19 peças posicionadas: balcão, armário, arara, mesa de corte, manequim, estante de linhas, cesto de tecidos, máquina de costura, tesoura/fita, moldes, alfineteiro, botas, lanternas, banco, tapete e janela. Objetos são independentes e mesas mantêm seus acessórios vinculados.
- Entrada, passagem central, iluminação, sombras e colisões próprias. Catálogo de costura existente preservado.
- Rotina 08h–18h, intervalo 12h–13h30 na praça, atendimento dentro da loja, guia que espera o jogador. Editor de desenvolvimento com H e exportação After-Rain-Atelie-Editado.json.
- Atualiza somente layouts provisórios intactos, preservando layouts personalizados e saves existentes.
- O usuário enviou celina.zip com 72 PNGs: oito direções e oito passos por direção, além das poses paradas. Arquivos originais e metadata.json preservados; SHA-256 e dimensões em personagem.json. A vista south recebeu fonte refinada separada em south-refinado.png, aplicada com escala única, alinhamento da cabeça e recortes no manifesto. As outras sete direções mantêm seus pixels e padding originais. O acompanhamento e a rotina usam os oito passos recebidos.

## Correção de navegação

O teste de retorno da Celina expôs uma borda de fachada que deixava o centro de um tile livre, mas bloqueava os pés entre os centros. O planejamento da rotina passou a reservar uma margem de 8 pixels em torno do centro das células da vila, consultando a colisão real do ator. Isso não muda colisões nem teleporta personagens. O teste de ida e volta da praça agora conclui, incluindo retorno ao atendimento; testes de rotina dos outros comerciantes também passaram.

## Validação

- Suíte: 811 testes passaram em 89 arquivos.
- Quatro testes específicos do ateliê passaram novamente após o ajuste final da fachada.
- TypeScript e build passaram; permanece o aviso conhecido de bundle grande.
- Chromium: 14 verificações passaram (comércio, editor, exportação, save, fachada, noite, portas, rotina e ausência de erros JavaScript/WebGL/assets).
- Evidências desta execução nesta pasta.

Reproduzir: `python scripts/prepare-celina-assets.py` registra o atlas sem regravar um layout existente. `--write-layout` regenera deliberadamente o layout padrão. Executar Vite na porta 5177 e `node scripts/qa-celina-shop.cjs` com Playwright e Chromium disponíveis; saída padrão em /workspace/after-rain-celina (configurável por CELINA_QA_OUTPUT).

## Animação e south refinado

Suíte após integração: 824 testes passaram em 93 arquivos; TypeScript e build passaram. Chromium: 16 verificações, incluindo nove quadros distintos, cabeça na mesma altura (24 pixels no atlas), apoio dos pés entre 239 e 243 pixels, 63 poses nativas idênticas pixel a pixel e os oito passos exibidos durante acompanhamento. Contorno semitransparente residual é eliminado na montagem pela mesma quantização de alfa da frente usada nos NPCs anteriores.
