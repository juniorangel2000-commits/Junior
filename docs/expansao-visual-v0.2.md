# Expansão e integração visual — versão 0.2.0

Esta etapa continua o projeto TypeScript/Phaser/Vite existente. Mantém a criação de personagem, o cultivo, Lia, inventário, receitas, construção e salvamento da vertical slice.

## Áreas implementadas

O mundo contínuo passa de 54×42 para **96×72 tiles**, com 32 pixels por tile. As coordenadas da propriedade, da casa, da horta e da posição inicial foram preservadas.

| Área | Limite lógico | Acesso e conteúdo |
| --- | --- | --- |
| Minha propriedade | Oeste do tile 50, ao norte do tile 42 | Casa inicial, horta, Lia, lago, ruínas e recursos básicos |
| Bosque do Pinheiro | A partir de x=50, ao norte de y=42 | Ponte a leste, trilhas, pinheiros, árvores de corte, rochas e coleta |
| Campos Abertos | A partir de y=42 | Trilha ao sul pela lateral oeste da horta, clareiras, recursos e ponte sul |

O rio tem largura definida e duas travessias. As clareiras das novas áreas permitem construção com as mesmas regras e custos da propriedade. O cultivo permanece nos 45 tiles da horta inicial. O mapa é percorrido com os controles normais; não há teletransporte pelo menu.

**M** abre um esquema do terreno jogável e indica a posição atual. A ilustração do mapa expandido fica separada como referência artística. Vila, costa, montanha e demais locais desenhados nela continuam previstos para etapas futuras.

## Origem e adaptação da arte

Os quatro pacotes originais estão em [pacotes_existentes/](../pacotes_existentes/README.md), e a seleção de referências WebP está em [referencias/](../referencias/README.md). Os assets utilizados pelo jogo são copiados para `public/assets/visual/`, mantendo os pacotes recebidos como material de consulta.

`src/visual-assets.ts` carrega fontes locais e monta texturas em Canvas com filtragem nearest-neighbor. O personagem usa as bases em quatro direções do pacote de ações; os ícones, recursos e módulos arquitetônicos vêm dos pacotes recebidos. A fachada da casa combina módulos creme, madeira, venezianas azul-esverdeadas e telhas terracota. Árvores e pinheiros são desenhados em Canvas para complementar esse conjunto.

Os 71 PNGs copiados têm suas fontes e SHA-256 registrados em [origem-dos-assets.json](origem-dos-assets.json). O arquivo original chamado `banco_jardim.png` representa uma floreira; ele foi preservado no pacote, e o móvel banco mantém seu desenho local para evitar mostrar o objeto errado. Fibras e cordas usam imagens distintas.

O footprint físico e o pivô visual são propriedades separadas. O personagem colide pelos pés, em uma base de 14×8 pixels, e objetos altos usam profundidade pela posição no chão. A câmera usa zoom inteiro. Recursos maiores não ganham uma colisão do tamanho da copa ou de toda a imagem.

As fontes preservadas não significam que todos os frames ou módulos foram aprovados para uso final. O pacote de ações contém composições experimentais; há revisão pendente de movimentos de ferramentas, poses, junções de paredes/telhados e objetos com perspectiva incompatível. A expansão usa uma seleção de assets; não importa automaticamente todos os protótipos HTML.

## Compatibilidade e correções

- As dimensões compartilhadas ficam em `src/data/regions.ts`; salvamento, construção e detecção de abrigo usam os limites do mapa atual.
- Posição, construções e golpes parciais de recursos podem ser persistidos nas duas áreas novas.
- O formato do save permanece na versão 2, com a mesma chave `depois-da-chuva-v1`. A migração de partidas v1, o backup e a proteção contra sobrescrever saves de versões futuras foram preservados.
- A geração das árvores antigas reproduz seu fluxo aleatório anterior para manter posições e IDs de recursos da propriedade.
- A animação de caminhada só avança quando o personagem se desloca, evitando caminhar parado contra uma colisão.
- Setas e espaço deixam de acionar a navegação da página durante a partida. A digitação nos campos continua separada dos controles.
- O handler de assets do aplicativo desktop aguarda a leitura assíncrona e captura falhas de carregamento.
- Menus e mapa pausam a simulação; ações e salvamento continuam usando os sistemas existentes.

## Validação desta atualização

TypeScript, **104 testes em seis arquivos**, build de produção e geração do portátil Windows x64 foram aprovados. O conteúdo de `app.asar` foi comparado ao build local, e o payload Electron foi confirmado como Windows AMD64. A versão compilada passou pela migração v1 com backup, cultivo, cerca/banco, pausa e diálogo em Chromium, sem erros de JavaScript ou assets. O percurso completo passou em Chromium: criação e customização, mapa M pausado, coleta e fabricação das três ferramentas, caminhada até Bosque e Campos, corte/mineração, golpes parciais salvos, processamento e bancada em cada área, recarga das construções sem duplicação e retorno à propriedade. Menus foram exercitados em 960×640 e 1280×800, sem erros de JavaScript ou assets.

Uma amostra de cinco segundos em Chromium com renderização por software mediu 33,6 FPS, mediana de 33,3 ms por quadro e percentil 95 de 50 ms. Esse resultado descreve o ambiente de teste e não garante uma taxa de quadros no computador do jogador.

O portátil local tem 103.783.761 bytes; seu SHA-256 é `f3398c78c6841dbeda281aaf5d9fa073fccda263838cc7b2a0a7c6ec96a94997`. A Release é gerada novamente pelo workflow em Windows e terá seu próprio manifesto de integridade. A disponibilização pública será conferida após enviar a tag `v0.2.0`.

Para repetir as verificações de código e gerar o executável:

```bash
npm run check
npm test
npm run build
npm run desktop:win
```

O destino é Windows 10/11 de 64 bits, com foco em Windows 11 x64. Gerar o pacote ou testar no Chromium de outro sistema operacional não equivale a uma abertura interativa em Windows nativo. O aplicativo mantém a origem `chuva://jogo` e os dados em `%APPDATA%\Depois da Chuva`.

## Limitações preservadas

Uma cultura e uma NPC; casas preexistentes exteriores; recursos esgotados sem respawn; inventário por contadores; sem baús, durabilidade, clima funcional, combate, hordas, áudio ou multiplayer. O abrigo 3×3 continua sendo colocado de uma vez, com a economia e as camadas da vertical slice. O escopo desta expansão não inclui todas as regiões, estações de trabalho ou funcionalidades mostradas nas pranchas conceituais.
