# After Rain 0.9.4 — animais, corda e natação polida

- Galinha e vaca com as sprites enviadas pelo jogador: oito direções, poses paradas e oito frames de caminhada por direção. PNGs originais preservados, sem reduzir a resolução da arte.
- Andar ajustado: ritmo próprio por espécie, orientação pelo ângulo real, curvas estáveis, menos desvios pelo centro dos tiles e menos alternância entre parado e caminhando durante a condução.
- Todos os animais passeiam. Os selvagens fogem ao se aproximar em um raio moderado de 4,5 tiles, a 90% da velocidade do jogador. Animais acolhidos passeiam pela propriedade sem fugir.
- **C: 3 fibras vegetais → 1 corda reutilizável. E: prender animal próximo. G: soltar.** A corda pode ser fabricada na propriedade ou na floresta, sem bancada. Um animal por vez.
- Acolhimento exige conduzir o animal pela floresta e atravessar a saída marcada até a propriedade. O animal nunca vira um item do inventário. A corda volta ao jogador ao soltar ou concluir o trajeto; posições e condução acompanham o save.
- Corda ligada à **mão esquerda anatômica** da fazendeira e do fazendeiro, acompanhando as 128 poses originais. A outra ponta acompanha a **cabeça** da galinha e da vaca em cada frame e direção. Desenho atrás das sprites, sem cobrir o animal.
- Natação polida: caminhada no raso e nado em água profunda; silhueta submersa com braços e pernas mais naturais, sombra do cabelo feminino, transparência que desaparece gradualmente da cintura aos pés e flutuação sem balançar a câmera.
- Ondulações contornam o corpo: parte traseira atrás da personagem e arco da frente na linha da água, abaixo do rosto. Ferramentas continuam bloqueadas durante o nado.
- Inclui a base completa da 0.9.3: mapas enviados, HUD compartilhada, margem de areia, água animada, rochas mineráveis, recursos renováveis com limite por mapa, editor F2 com pisos e pontos de entrada/saída configuráveis, ferramentas e regador.

**Baixe `After-Rain-0.9.4-Windows-x64.exe` e abra no Windows 11 x64.** É portátil e não exige Node.js nem servidor. As partidas continuam no mesmo local da versão anterior; não é necessário apagar o save.

Validação: TypeScript, **403 testes automatizados**, build e Chromium. Conferidos a fabricação da corda, prender/soltar, salvar/recarregar durante a condução, trajeto completo até a propriedade, acolhimento sem duplicar animal ou corda e origem real da corda nas 128 poses dos dois personagens. As prévias dos animais usam a cena real da floresta. O executável é gerado no Windows pelo GitHub Actions; a validação interativa foi feita no Chromium/Linux, sem execução interativa no Windows 11 neste ambiente.

Instruções em `LEIA.md`; integridade do download em `SHA256SUMS.txt`.
