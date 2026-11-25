extends RefCounted
const RECIPES={
"cord":{"name":"Corda vegetal","cost":{"fiber":3},"out":{"cord":1}},
"flaked-stone":{"name":"Pedra lascada","cost":{"stone":2},"out":{"flakedStone":1}},
"handle":{"name":"Cabo","cost":{"branch":1},"out":{"handle":1}},
"pegs":{"name":"Cavilhas","cost":{"branch":1},"out":{"peg":4}},
"hatchet":{"name":"Machadinha","cost":{"handle":1,"flakedStone":1,"cord":1},"out":{"hatchet":1}},
"pickaxe":{"name":"Picareta","cost":{"handle":1,"flakedStone":2,"cord":1},"out":{"pickaxe":1}},
"hoe":{"name":"Enxada","cost":{"handle":1,"flakedStone":1,"cord":1},"out":{"hoe":1}},
"hammer":{"name":"Martelo","cost":{"handle":1,"stone":1,"cord":1},"out":{"hammer":1}},
"rough-planks":{"name":"Tábuas brutas","cost":{"log":1},"out":{"plank":2},"tool":"hatchet","seconds":4.0},
"blade":{"name":"Lâmina de sucata","cost":{"scrap":1},"out":{"blade":1},"station":"workbench"},
"handsaw":{"name":"Serrote","cost":{"blade":1,"handle":1,"cord":1},"out":{"handsaw":1},"station":"workbench"},
"sawn-planks":{"name":"Tábuas regulares","cost":{"log":1},"out":{"board":3},"tool":"handsaw","station":"workbench","seconds":3.0},
"furniture":{"name":"Banco de madeira","cost":{"wood":10,"board":4},"out":{"furniture":1},"tool":"hammer","station":"constructionBench","seconds":3.0},
"doorKit":{"name":"Telhado de tábuas","cost":{"board":4,"peg":4},"out":{"doorKit":1},"station":"constructionBench"},
"windowKit":{"name":"Ninho e baias","cost":{"board":3,"peg":2},"out":{"windowKit":1},"station":"constructionBench"}
}
const PIECES={
"fence":{"name":"Cerca","cost":{"wood":3},"wide":false},
"gate":{"name":"Porteira","cost":{"wood":4},"wide":false},
"workbench":{"name":"Bancada de trabalho","cost":{"plank":4,"peg":4},"wide":true,"tool":"hammer"},
"constructionBench":{"name":"Bancada de construção","cost":{"board":8,"stone":6,"peg":4},"wide":true,"tool":"hammer"},
"bench":{"name":"Banco","cost":{"furniture":1},"wide":false}
}
const ART={
"fence":preload("res://arte/objetos/fence-new-5.png"),
"gate":preload("res://arte/objetos/gate-0-flipped-closed-1.png"),
"workbench":preload("res://arte/construcao/workbench.png"),
"constructionBench":preload("res://arte/construcao/constructionBench.png"),
"bench":preload("res://arte/construcao/bench.png")
}
var farm
var scene: Node2D
var world: Node2D
var player: CharacterBody2D
var nodes: Dictionary={}
var selected: String=""
var rotation:=0
var ghost: Sprite2D

func setup(root: Node2D,p: CharacterBody2D,inventory) -> void:
	scene=root
	player=p
	farm=inventory
	world=p.call("mundo_colisoes")
	ghost=Sprite2D.new()
	ghost.z_index=6
	ghost.hide()
	scene.add_child(ghost)
	for tile in farm.buildings:
		_spawn(tile)

static func footprint(tile: Vector2i,kind: String,rot: int) -> Array[Vector2i]:
	var cells: Array[Vector2i]=[tile]
	if PIECES[kind]["wide"]:
		cells.append(tile+(Vector2i.RIGHT if rot%2==0 else Vector2i.DOWN))
	return cells

func near_station(kind: String) -> bool:
	if kind=="":
		return true
	for tile in farm.buildings:
		if farm.buildings[tile]["kind"]==kind:
			for cell in footprint(tile,kind,farm.buildings[tile]["rotation"]):
				if player.global_position.distance_to(center(cell))<=80.0:
					return true
	return false

static func center(tile: Vector2i) -> Vector2:
	return Vector2(tile)*32.0+Vector2(16,16)

static func craft_state(inventory,id: String,station_ready: bool) -> String:
	if not RECIPES.has(id):
		return "Receita indisponível."
	var rule: Dictionary=RECIPES[id]
	if not station_ready:
		return "Aproxime-se da bancada correta."
	var tool: String=rule.get("tool","")
	if tool!="" and inventory.stock.get(tool,0)<1:
		return "Ferramenta necessária: "+tool
	if not inventory.transact(rule["cost"],rule["out"]):
		return "Faltam materiais ou espaço na mochila."
	return str(rule["name"])+": fabricação concluída."

func craft(id: String) -> String:
	if not RECIPES.has(id):
		return "Receita indisponível."
	return craft_state(farm,id,near_station(RECIPES[id].get("station","")))

func tile_at(point: Vector2) -> Vector2i:
	return Vector2i(floori(point.x/32.0),floori(point.y/32.0))

func piece_at(tile: Vector2i) -> Vector2i:
	for origin in farm.buildings:
		var piece: Dictionary=farm.buildings[origin]
		if tile in footprint(origin,piece["kind"],piece["rotation"]):
			return origin
	return Vector2i(-1,-1)

func can_place(tile: Vector2i,kind: String,rot: int) -> bool:
	if not PIECES.has(kind):
		return false
	for cell in footprint(tile,kind,rot):
		if cell.x<1 or cell.x>94 or cell.y<1 or cell.y>70 or player.global_position.distance_to(center(cell))>96.0:
			return false
		if farm.plots.has(cell) or piece_at(cell).x>=0:
			return false
		var at:=center(cell)
		if at.distance_to(player.global_position)<24.0:
			return false
		if not scene.get_node("Terreno").call("material_em",at) in ["grass","forest","meadow","soil","moss"]:
			return false
		if world.call("ocupado",Rect2(at-Vector2(15,15),Vector2(30,30))):
			return false
	return true

func place(tile: Vector2i) -> String:
	if selected=="" or not can_place(tile,selected,rotation):
		return "Escolha um espaço livre perto de você."
	var rule: Dictionary=PIECES[selected]
	var tool: String=rule.get("tool","")
	if tool!="" and farm.stock.get(tool,0)<1:
		return "Precisa de martelo."
	if not farm.transact(rule["cost"],{}):
		return "Materiais insuficientes."
	farm.buildings[tile]={"kind":selected,"rotation":rotation,"open":false}
	_spawn(tile)
	return str(rule["name"])+" construída."

func select(kind: String) -> void:
	selected=kind if PIECES.has(kind) else ""
	ghost.visible=selected!=""

func update_preview(point: Vector2) -> void:
	if selected=="":
		return
	var tile:=tile_at(point)
	_style_sprite(ghost,tile,selected,rotation,false)
	ghost.modulate=Color(0.6,1.0,0.65,0.6) if can_place(tile,selected,rotation) else Color(1.0,0.35,0.35,0.65)

func _style_sprite(sprite: Sprite2D,tile: Vector2i,kind: String,rot: int,open: bool) -> void:
	sprite.texture=ART[kind]
	var size:=sprite.texture.get_size()
	var cells:=footprint(tile,kind,rot)
	sprite.position=(center(cells[0])+center(cells[-1]))*0.5
	sprite.scale=Vector2.ONE*((64.0 if PIECES[kind]["wide"] else 32.0)/maxf(size.x,size.y))
	sprite.rotation=0.0
	# Rotação no plano do chão, não altera a arte original.
	if kind in ["fence","gate"] or PIECES[kind]["wide"]:
		sprite.rotation=PI*0.5*(rot%2)
	if kind=="gate" and open:
		sprite.rotation+=PI*0.5

func _spawn(tile: Vector2i) -> void:
	var piece: Dictionary=farm.buildings[tile]
	var s:=Sprite2D.new()
	s.name="Built_%d_%d" % [tile.x,tile.y]
	scene.get_node("Objetos").add_child(s)
	_style_sprite(s,tile,piece["kind"],piece["rotation"],piece["open"])
	nodes[tile]=s
	_sync_collision(tile)
	var sim:=scene.get_tree().root.get_node_or_null("MundoSimulacao")
	if sim!=null:
		sim.call("register_shadow",s)

func _sync_collision(tile: Vector2i) -> void:
	var s: Sprite2D=nodes[tile]
	var piece: Dictionary=farm.buildings[tile]
	world.call("remover_obstaculo",s.get_instance_id())
	if piece["kind"]=="gate" and piece["open"]:
		return
	for cell in footprint(tile,piece["kind"],piece["rotation"]):
		var size:=Vector2(28,22)
		if piece["kind"] in ["gate","fence"]:
			size=Vector2(32,10) if piece["rotation"]%2==0 else Vector2(10,32)
		world.call("adicionar_obstaculo",center(cell),size,s.get_instance_id())

func interact(point: Vector2,remove: bool) -> String:
	var tile:=piece_at(tile_at(point))
	if tile.x<0 or player.global_position.distance_to(point)>64.0:
		return ""
	var piece: Dictionary=farm.buildings[tile]
	var kind: String=piece["kind"]
	if remove:
		var refund: Dictionary={}
		for item in PIECES[kind]["cost"]:
			var n: int=PIECES[kind]["cost"][item]
			refund[item]=n if kind in ["fence","bench"] else floori(n*0.6)
		if not farm.transact({},refund):
			return "Mochila cheia."
		var s: Sprite2D=nodes[tile]
		world.call("remover_obstaculo",s.get_instance_id())
		s.hide()
		s.queue_free()
		nodes.erase(tile)
		farm.buildings.erase(tile)
		return "Construção recolhida."
	if kind=="gate":
		if piece["open"] and center(tile).distance_to(player.global_position)<24.0:
			return "Afaste-se para fechar a porteira."
		piece["open"]=not piece["open"]
		_style_sprite(nodes[tile],tile,kind,piece["rotation"],piece["open"])
		_sync_collision(tile)
		return "Porteira aberta." if piece["open"] else "Porteira fechada."
	return str(PIECES[kind]["name"])+" · C: fabricar."
