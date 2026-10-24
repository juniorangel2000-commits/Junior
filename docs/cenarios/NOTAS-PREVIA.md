# After Rain 0.9.3 — mapas atualizados, recursos e natação

- Mapas enviados incorporados: Propriedade Abandonada e Floresta Antiga. Passagens funcionam apenas nos blocos marcados; antiga saída ao sul fechada por árvores variadas e piso de mata.
- HUD padrão nos cenários, sem as duas barras exclusivas da floresta.
- Natação com as sprites oficiais preservadas, oito direções e apenas a cabeça acima da água profunda. Silhueta submersa, ondulações, rastro, flutuação e entrada/saída gradual. Ferramentas bloqueadas durante o nado; save/reload na água nos dois mapas.
- Areia natural ao redor do lago, piso contínuo para eliminar emendas no zoom e recortes completos das árvores para corrigir a copa com falha.
- Rochas grandes e novas sprites mineráveis com picareta; golpes parciais e recompensas salvos.
- Recursos aleatórios com limite automático de 64 na propriedade e 48 na floresta; reposição após quatro horas do jogo, com posições e temporizador preservados no save.
- Editor por F2: trocar entre propriedade e floresta sem perder as edições, desfazer/refazer separado, novas opções de pisos e pontos de chegada/saída editáveis. Exporte cada mapa em JSON para guardar suas mudanças.
- Personagens, ferramentas, regador e progresso anteriores preservados.

**Baixe `After-Rain-0.9.3-Windows-x64.exe` e abra no Windows 11 x64.** Pacote portátil; não exige Node.js nem servidor. Instruções em `LEIA.md`; integridade em `SHA256SUMS.txt`.

Validação: TypeScript, 353 testes automatizados e build. Chromium em WebGL e Canvas: duas personagens, oito direções, margens, colisões, nado, editor, recarga nos dois mapas e troca de cenário. Regressão dos mapas: passagens marcadas, mineração, bloqueio de ferramentas, limites e reposição de recursos.

O executável é gerado no Windows pelo GitHub Actions. A validação interativa foi feita no Chromium/Linux; execução interativa no Windows 11 não testada neste ambiente. A profundidade da água é estimada pela margem e as poses de nado adaptam as animações oficiais existentes.
