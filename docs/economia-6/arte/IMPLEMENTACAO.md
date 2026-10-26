# Arte da economia e prévia local 0.10.0-preview.1

Foram produzidos 85 PNGs transparentes, mantendo intactas as imagens das personagens do jogador, animais, mapas, casa e ferramentas originais.

- Nove itens metálicos: fragmento, minério inteiro e lingote para Ferro, Ouro e Metal Negro.
- Três depósitos minerais, ligados aos mesmos recursos persistidos e às mesmas exigências de picareta.
- Vinte imagens de ferramentas, cinco modelos por material. As ferramentas iniciais de machado/picareta/enxada mantêm as artes originais aprovadas. As quinze aprimoradas e a foice/pá básicas usam as imagens novas.
- Quatro estados da forja. O fogo anima apenas durante o processamento de uma encomenda na forja própria.
- Ícones para Coroa, forja, móvel fabricado, porta, janela, cerca e cogumelo; bigorna e tenaz na ferraria.
- Dez comerciantes com quatro vistas próprias, totalizando quarenta poses. Os retratos usam a mesma arte. Eles continuam estacionários; as diagonais de olhar aproveitam as vistas frontal/traseira, sem adicionar animações falsas de caminhada.

As ferramentas giram sobre o ponto do cabo identificado em cada PNG, com espelhamento do pivô para o lado oposto. O inventário e a barra rápida mostram o material atual depois da encomenda. A foice e a pá têm um movimento de uso; a foice também recolhe vegetação na floresta. Os menus e as transações existentes foram preservados.

## Validação

656 testes automatizados em 64 arquivos e TypeScript/build de produção aprovados. O teste da economia no Chromium verifica moedas, bloqueio comercial, estoque de Metal Negro, entrega/pagamento/retirada de encomendas, save/reload, devolução em falha de salvamento e fundição própria com combinação de fragmentos e minério inteiro.

A revisão de arte verifica 67 texturas do Phaser, dez aparências distintas, trinta combinações de ferramenta/lado, a troca do ícone ao aprimorar e o cancelamento visual ao pausar. O teste do build de produção confirma início de jogo, configurações gráficas persistentes, controles, mochila de trinta espaços e editor de desenvolvimento oculto.

O primeiro recorte uniforme da folha de NPCs cortava algumas mangas e chapéus e incluía pedaços dos pés da linha anterior. A extração foi corrigida para identificar as quarenta silhuetas completas. Os PNGs finais têm margens transparentes e não contêm esses fragmentos.

As folhas originais geradas estão em `fontes/`. O empacotamento é reproduzido com `node scripts/pack-economy-art.cjs`. O manifesto dos PNGs fica em `public/assets/visual/economy/manifest.json`.

## Executável

Prévia portátil Windows x64, sem publicação no GitHub. Mantém o caminho de salvamento de `Depois da Chuva` usado pelas versões anteriores. O pacote deve conter o build final e os 85 PNGs idênticos aos do projeto; `scripts/verify-economy-preview.cjs` confere os hashes, a arquitetura AMD64, a versão e os arquivos originais preservados. O resultado fica em `executavel.json` e há um `SHA256SUMS.txt` ao lado do executável.

Limitação: este ambiente é Linux. Houve teste real do jogo no Chromium e inspeção do pacote Windows; não houve execução nativa do EXE em Windows 11.

Nenhum commit, push, tag ou Release foi criado.
