# Estabilização — primeira etapa

Alterações locais, sem publicação.

## Saves

A leitura distingue ausência, save válido, recuperação, arquivo inválido, versão futura e armazenamento indisponível. Um arquivo inválido deixa de ser tratado como um slot livre. Backups válidos são consultados do mais recente ao legado, sem escrever durante a leitura. Um save de versão futura não é substituído nem recuperado como uma versão anterior.

As gravações de partidas válidas mantêm duas cópias recentes, sem duplicar uma cópia idêntica. O backup legado continua preservado. Uma falha ao gravar o backup impede a gravação principal. Uma falha na escrita principal mantém o slot e suas cópias anteriores.

Ao iniciar uma nova partida sobre dados ilegíveis ou continuar por backup, há confirmação explícita. Antes de substituir o arquivo inválido, preservam-se seus bytes em outra chave. Se não houver espaço ou já existir outro original preservado, a substituição é bloqueada. Essa cópia não é apagada automaticamente.

Testes: 795 testes anteriores passaram e 10 novos casos de recuperação passaram. TypeScript e build passaram. Verificações reais de navegador estão registradas em `save-browser.json`.

## Primeira entrada na água

O custo de gerar os atlas submersos saiu do primeiro passo na água e passou à preparação do personagem. As mesmas texturas, recortes e animações continuam sendo utilizados; a criação das camadas visuais permanece leve e sob demanda. O cache pertence ao TextureManager do jogo.

Medição inicial da sessão anterior: 1.899 ms (masculino) e 1.345 ms (feminino), com centenas de leituras de pixels na primeira entrada. Na execução atual: aproximadamente 1,7 ms para ambos, zero leituras de pixels e nenhuma textura criada ao entrar na água. As execuções ocorreram no Chromium do ambiente; não são benchmarks de hardware Windows. O custo de preparação continua existindo no carregamento inicial do personagem.

Reprodução: Vite na porta 5177; com Playwright disponível, execute `WATER_ASSERT_READY=1 node scripts/qa-water-first-entry.cjs`. O teste falha se a entrada criar texturas ou ler pixels. Resultado em `water-after.json`.

## Próximas etapas

- Introduzir revisão de save e migrações numeradas com fixtures históricas.
- Investigar a chamada duplicada de iluminação antes de alterar o update das cenas.
- Extrair módulos pequenos com testes de comportamento.
- Formatação isolada e auditoria de listeners.

A animação do Nilo foi recebida e integrada com oito direções e seis passos. Os 56 PNGs enviados permanecem intactos. Não há novo executável ou release nesta etapa.

Validação final: 805 testes passaram na suíte completa; dois testes adicionais do atlas recebido passaram separadamente. TypeScript e build passaram. A verificação de proteção no navegador passou em três cenários, sem erros JavaScript.
