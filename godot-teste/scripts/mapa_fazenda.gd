extends RefCounted
## Pontos fixos da Propriedade refeita (ferramentas/refazer_fazenda.py gera o mapa com os
## mesmos valores). Mudou o mapa? Atualize os dois lugares.
const HOUSE:=Vector2(752,1152)             # base da arte da casa
const ENTRANCE:=Vector2(752,1182)          # porta (base + 30)
const WELL:=Vector2(976,1148)              # base do poço
const PLAYER_START:=Vector2(752,1230)
## Canteiros já preparados no começo da partida (os mesmos da V51 e de saves antigos).
const START_PLOTS:=Rect2i(21,20,9,5)
