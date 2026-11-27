extends RefCounted
## Regras de coleta da V51. Identificadores estáveis dos nós da propriedade.
const RULES := {
	"tree":{"name":"Árvore","tool":"hatchet","hits":4,"drops":{"log":2,"branch":3,"oakSeed":1}},
	"pine":{"name":"Pinheiro","tool":"hatchet","hits":4,"drops":{"log":2,"branch":3,"pineSeed":1}},
	"stump":{"name":"Toco","tool":"hatchet","hits":3,"drops":{"wood":4,"log":1,"branch":1}},
	"log":{"name":"Tronco caído","tool":"hatchet","hits":3,"drops":{"wood":6,"log":2,"branch":2}},
	"rock":{"name":"Rocha","tool":"pickaxe","hits":5,"drops":{"stone":4}},
	"iron":{"name":"Minério de ferro","tool":"pickaxe","hits":5,"drops":{"ironShard":1}},
	"branches":{"name":"Galhos caídos","tool":"hand","hits":1,"drops":{"wood":4,"branch":3}},
	"stone":{"name":"Pedras pequenas","tool":"hand","hits":1,"drops":{"stone":3}},
	"berry":{"name":"Arbusto de berries","tool":"hand","hits":1,"drops":{"seeds":3,"fiber":2}},
	"fiber":{"name":"Fibras vegetais","tool":"hand","hits":1,"drops":{"fiber":6}},
	"scrap":{"name":"Sucata","tool":"hand","hits":1,"drops":{"scrap":2}},
	"herb":{"name":"Ervas","tool":"hand","hits":1,"drops":{"herb":2}},
	"mushroom":{"name":"Cogumelos","tool":"hand","hits":1,"drops":{"mushroom":2}},
	"grass":{"name":"Capim alto","tool":"hand","hits":1,"drops":{"freshGrass":3,"fiber":1}}
}
## Pomar (V51, src/data/orchard.ts): cada árvore dá a fruta da sua estação e volta a dar 3 dias
## depois. A árvore não é cortada nem some.
const FRUIT_SEASONS:={"orange":[3,0],"pear":[1],"apple":[2]}
const FRUIT_NAMES:={"apple":"Maçã","pear":"Pera","orange":"Laranja"}
const FRUIT_REGROW_DAYS:=3
var today:=1
var entries: Dictionary={}
var farm
var world: Node2D

static func kind_for(art: String) -> String:
	if art.begins_with("asset-tree-"): return "tree"
	if art.begins_with("asset-pine-"): return "pine"
	if art=="forest-detail-stump": return "stump"
	if art=="forest-detail-log": return "log"
	if art.begins_with("lake-rock-"): return "rock"
	if art.begins_with("detailed-ore-"): return "iron"
	if art=="asset-new-branches": return "branches"
	if art=="asset-small-stones": return "stone"
	if art=="asset-berry-bush": return "berry"
	if art=="asset-scrap": return "scrap"
	if art=="ecology-herbs": return "herb"
	if art=="forest-detail-mushrooms": return "mushroom"
	if art=="forest-detail-reeds": return "grass"
	if art.begins_with("orchard-"): return "fruit"
	if art in ["forest-detail-bush","forest-detail-fern","forest-detail-flowers"]: return "fiber"
	return ""

func build(scene: Node2D,inventory,col: Node2D) -> void:
	farm=inventory
	world=col
	for layer_name in ["Objetos","Decoracao do chao","Acima"]:
		var layer:=scene.get_node_or_null(layer_name)
		if layer==null:
			continue
		for node in layer.get_children():
			if not node is Sprite2D or node.texture==null:
				continue
			var sprite:=node as Sprite2D
			var kind:=kind_for(sprite.texture.resource_path.get_file().get_basename())
			if kind=="":
				continue
			var id:=str(scene.get_path_to(sprite))
			entries[id]={"sprite":sprite,"kind":kind,"position":sprite.global_position,"shape_id":sprite.get_instance_id()}
			if kind=="fruit":
				entries[id]["fruit"]=sprite.texture.resource_path.get_file().get_basename().trim_prefix("orchard-")

func restore() -> void:
	for id in farm.resource_progress.keys():
		if not entries.has(id):
			farm.resource_progress.erase(id)
			continue
		var entry: Dictionary=entries[id]
		var state: Dictionary=farm.resource_progress[id]
		var stage: int=state["stage"]
		var kind: String=entry["kind"]
		if stage==1 and not kind in ["tree","pine"]:
			farm.resource_progress.erase(id)
			continue
		var rule: Dictionary=RULES["stump" if stage==1 else kind]
		if stage!=2 and state["hits"]>=rule["hits"]:
			farm.resource_progress.erase(id)
			continue
		_visual(id,stage)

func target(point: Vector2,origin: Vector2) -> String:
	var best: String=""
	var distance:=35.0
	for id in entries:
		var entry: Dictionary=entries[id]
		if not entry["sprite"].visible or origin.distance_to(entry["position"])>64.0:
			continue
		var d: float=point.distance_to(entry["position"])
		if d<distance:
			distance=d
			best=id
	return best

func pick_fruit(id: String) -> String:
	var fruit: String=entries[id]["fruit"]
	var season:=int((today-1)/28.0)%4
	if not season in FRUIT_SEASONS[fruit]:
		return "%s: fora da estação." % FRUIT_NAMES[fruit]
	var last: int=int(farm.orchard.get(id,-999))
	if today-last<FRUIT_REGROW_DAYS:
		return "%s: volta a dar fruta em %d dia(s)." % [FRUIT_NAMES[fruit],FRUIT_REGROW_DAYS-(today-last)]
	if not farm.transact({},{fruit:2}):
		return "Mochila cheia."
	farm.orchard[id]=today
	return "%s ×2 colhida." % FRUIT_NAMES[fruit]

func hit(id: String,tool: String) -> String:
	if not entries.has(id):
		return "Nenhum recurso ao alcance."
	var entry: Dictionary=entries[id]
	if entry["kind"]=="fruit":
		return pick_fruit(id) if tool=="hand" else "Use a mão para colher a fruta."
	var state: Dictionary=farm.resource_progress.get(id,{"stage":0,"hits":0})
	var stage: int=state["stage"]
	if stage==2:
		return "Recurso já recolhido."
	var kind: String="stump" if stage==1 else entry["kind"]
	var rule: Dictionary=RULES[kind]
	if rule["tool"]!="hand" and tool!=rule["tool"]:
		return "Use a machadinha." if rule["tool"]=="hatchet" else "Use a picareta."
	if tool!="hand" and farm.stock.get(tool,0)<1:
		return "Ferramenta indisponível."
	var hits: int=farm.core.call("resource_hit",state["hits"],rule["hits"]) if is_instance_valid(farm.core) else mini(state["hits"]+1,rule["hits"])
	if hits<0:
		return "Recurso indisponível."
	if hits<rule["hits"]:
		farm.resource_progress[id]={"stage":stage,"hits":hits}
		return "%s: %d/%d golpes" % [rule["name"],hits,rule["hits"]]
	if not farm.transact({},rule["drops"]):
		return "Mochila cheia. O recurso foi preservado."
	var next_stage:=1 if kind in ["tree","pine"] else 2
	farm.resource_progress[id]={"stage":next_stage,"hits":0}
	_visual(id,next_stage)
	return "%s: materiais na mochila." % rule["name"]

func _visual(id: String,stage: int) -> void:
	var entry: Dictionary=entries[id]
	var sprite: Sprite2D=entry["sprite"]
	if stage==1:
		var tex:=preload("res://arte/objetos/forest-detail-stump.png")
		sprite.texture=tex
		sprite.scale=Vector2.ONE*(38.0/tex.get_width())
		sprite.offset=Vector2(0,-tex.get_height()*0.42)
	elif stage==2:
		sprite.hide()
		world.call("remover_obstaculo",entry["shape_id"])
