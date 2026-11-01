# After Rain 0.10.0-preview.26 — Diário de pesca e exploração

O diário de pesca agora segue o visual da HUD e reúne descobertas, recordes e preparos. Esta versão também inclui as correções de rotinas, plataformas e águas realizadas após a prévia 25.

## Pesca

- J e o menu superior abrem o diário: seis espécies, silhuetas das desconhecidas, filtro de descobertas, contagens, primeiro dia e recordes independentes de peso e comprimento.
- Movimentos próprios de cada espécie na disputa, preservando a identidade oculta até a captura.
- Dois reforços da vara, preparos de massa e insetos, preços por espécie e tamanho e uma encomenda diferente do Damião por dia. Serviços na cabana pela manhã e na vila conforme a rotina.
- Horário e condição diária de pesca influenciam as espécies. A condição é estável ao recarregar; não acrescenta uma nova chuva visual aos cenários.
- Peixes raros exclusivos do Lago entre as Serras. Lixo: 8% no lago e 24% nos demais locais, aplicado ao sorteio de capturas comuns.
- Recordes e recompensas salvos antes de confirmar a captura; falhas de gravação não duplicam entregas. Estoques antigos continuam compatíveis com receitas e comércio.

## Exploração

- Damião percorre o caminho entre lago, estrada e vila; rotinas preservam a posição e não saltam diretamente ao destino pelo relógio.
- Colisões de varanda, píeres, pontes e montanha revisadas. Acessos pelas entradas e pela escada; proteção contra subir pelas laterais a partir da água.
- Passos e som próprio de nado em todos os cenários externos. Personagem visível na varanda da cabana.
- Água em movimento e peixes nos mapas externos compatíveis, ilha com margens irregulares e árvore de copa larga, correção da mancha branca na areia e barco com balanço suave.

## Validação

TypeScript, build e suíte de sistemas aprovados; verificações no navegador cobrem coleção, atalhos, pausa, filtros, iscas persistidas, tela estreita, troca de cenário, captura, rede, fuga e salvamento. O workflow Windows repete os testes e gera instalador, portátil e SHA256SUMS.txt.
