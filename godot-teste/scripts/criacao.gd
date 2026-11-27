extends Node2D
const Model=preload("res://scripts/criacao_estado.gd")
const ART={"chicken":[64,0.75,17,9,24],"duck":[224,0.18,90,5,24],"cow":[192,0.5,46,9,48],"goat":[224,0.27,90,9,42],"sheep":[224,0.28,90,9,38],"pig":[224,0.28,90,5,36],"horse":[192,0.65,56,9,58]}
const DIRS=[Vector2.DOWN,Vector2.LEFT,Vector2.RIGHT,Vector2.UP,Vector2(-0.7071067811865476,0.7071067811865476),Vector2(0.7071067811865476,0.7071067811865476),Vector2(-0.7071067811865476,-0.7071067811865476),Vector2(0.7071067811865476,-0.7071067811865476)]
var model
var farm
var player: CharacterBody2D
var scene: Node2D
var world: Node2D
var builder
var sprites: Dictionary={}
var brains: Dictionary={}
var buildings: Dictionary={}
var textures: Dictionary={}
var selected: String=""
var ghost: Sprite2D
var panel: PanelContainer
var list: VBoxContainer
var active_tile:=Vector2i(-1,-1)
var message: Label
var menu_open:=false
var _timer:=0.0

func setup(root: Node2D,p: CharacterBody2D,inventory,construction) -> void:
	scene=root
	player=p
	farm=inventory
	model=farm.livestock
	builder=construction
	world=p.call("mundo_colisoes")
	scene.add_child(self)
	ghost=Sprite2D.new()
	ghost.z_index=8
	ghost.hide()
	add_child(ghost)
	for kind in Model.RULES:
		textures[kind]=load("res://arte/criacao/%s.png" % kind)
	for kind in ART:
		textures[kind]=load("res://arte/animais/%s.png" % kind)
	for tile in model.sites:
		_spawn_site(tile)
	var layer:=CanvasLayer.new()
	layer.layer=17
	add_child(layer)
	panel=PanelContainer.new()
	panel.theme=preload("res://scripts/tema_ui.gd").theme()
	layer.add_child(panel)
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.offset_left=-340
	panel.offset_right=340
	panel.offset_top=-255
	panel.offset_bottom=255
	var col:=VBoxContainer.new()
	panel.add_child(col)
	var title:=Label.new()
	title.text="Criação · abrigos e cuidados"
	col.add_child(title)
	message=Label.new()
	col.add_child(message)
	var scroll:=ScrollContainer.new()
	scroll.custom_minimum_size=Vector2(650,430)
	col.add_child(scroll)
	list=VBoxContainer.new()
	list.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	scroll.add_child(list)
	panel.hide()

func center(tile: Vector2i) -> Vector2:
	return Vector2(tile)*32.0+Vector2(16,16)

func tile_at(point: Vector2) -> Vector2i:
	return Vector2i(floori(point.x/32.0),floori(point.y/32.0))

func site_rect(tile: Vector2i,kind: String) -> Rect2:
	var rule: Dictionary=Model.RULES[kind]
	return Rect2(Vector2(tile)*32.0,Vector2(rule["w"],rule["h"])*32.0)

func can_place(tile: Vector2i,kind: String) -> bool:
	if model.sites.size()>=32:
		return false
	var rule: Dictionary=Model.RULES[kind]
	var r:=site_rect(tile,kind)
	if r.grow(16).has_point(player.global_position) or r.get_center().distance_to(player.global_position)>250.0:
		return false
	for other in model.sites:
		if r.intersects(site_rect(other,model.sites[other]["kind"])):
			return false
	for y in rule["h"]:
		for x in rule["w"]:
			var cell:=tile+Vector2i(x,y)
			if cell.x<1 or cell.x>94 or cell.y<1 or cell.y>70 or farm.plots.has(cell) or builder.piece_at(cell).x>=0:
				return false
			var c:=center(cell)
			if not scene.get_node("Terreno").call("material_em",c) in ["grass","forest","meadow","soil","moss"] or world.call("ocupado",Rect2(c-Vector2(15,15),Vector2(30,30))):
				return false
	return true

func _style(sprite: Sprite2D,tile: Vector2i,kind: String) -> void:
	sprite.texture=textures[kind]
	var r:=site_rect(tile,kind)
	sprite.position=r.get_center()
	sprite.scale=r.size/sprite.texture.get_size()

func place(point: Vector2) -> String:
	if selected=="":
		return ""
	var tile:=tile_at(point)
	if not can_place(tile,selected):
		return "Abrigo precisa de área livre."
	var cost: Dictionary=Model.RULES[selected]["cost"].duplicate()
	cost["wood"]=int(cost.get("wood",0))+4
	cost["stone"]=int(cost.get("stone",0))+4
	if farm.stock.get("hammer",0)<1 or not farm.transact(cost,{}):
		return "Precisa de martelo e dos materiais da obra."
	model.add_site(tile,selected)
	_spawn_site(tile)
	selected=""
	ghost.hide()
	return "Abrigo construído."

func _spawn_site(tile: Vector2i) -> void:
	var site: Dictionary=model.sites[tile]
	var kind: String=site["kind"]
	var rule: Dictionary=Model.RULES[kind]
	var sprite:=Sprite2D.new()
	scene.get_node("Objetos").add_child(sprite)
	_style(sprite,tile,kind)
	buildings[tile]=sprite
	# A fachada ocupa o corpo; o cercado inferior fica livre para os animais.
	var r:=site_rect(tile,kind)
	var solid_size:=Vector2(r.size.x,rule["body"]*32.0)
	world.call("adicionar_obstaculo",r.position+solid_size*0.5,solid_size,sprite.get_instance_id())
	scene.get_tree().root.get_node("MundoSimulacao").call("register_shadow",sprite)
	for animal in site["animals"]:
		_spawn_animal(tile,animal)

func _spawn_animal(tile: Vector2i,animal: Dictionary) -> void:
	var id: int=animal["id"]
	if sprites.has(id):
		return
	var kind: String=animal["kind"]
	var art: Array=ART[kind]
	var s:=Sprite2D.new()
	s.texture=textures[kind]
	s.hframes=art[3]
	s.vframes=8
	s.scale=Vector2.ONE*art[1]
	s.offset=Vector2(0,-art[2])
	scene.get_node("Objetos").add_child(s)
	var rule: Dictionary=Model.RULES[model.sites[tile]["kind"]]
	var r:=site_rect(tile,model.sites[tile]["kind"])
	var zone:=Rect2(r.position+Vector2(18,rule["body"]*32.0+14),Vector2(r.size.x-36,maxf(4.0,(rule["h"]-rule["body"])*32.0-28)))
	s.position=zone.get_center()
	sprites[id]=s
	brains[id]={"zone":zone,"goal":zone.get_center(),"distance":0.0,"wait":0.3+float(id%5)*0.2,"direction":0,"kind":kind}

func update(delta: float,clock: Dictionary) -> void:
	_timer+=delta
	if _timer>=0.5:
		_timer=0.0
		model.tick(model.production_day(int(clock["day"]),float(clock["minute"])))
	if selected!="":
		var tile:=tile_at(player.get_global_mouse_position())
		_style(ghost,tile,selected)
		ghost.modulate=Color(0.5,1,0.6,0.6) if can_place(tile,selected) else Color(1,0.3,0.3,0.6)
	for id in brains:
		var b: Dictionary=brains[id]
		var s: Sprite2D=sprites[id]
		var art: Array=ART[b["kind"]]
		if b["wait"]>0.0:
			b["wait"]-=delta
			s.frame=b["direction"]*art[3]
			continue
		var goal: Vector2=b["goal"]
		if s.position.distance_to(goal)<2.0:
			var zone: Rect2=b["zone"]
			b["goal"]=zone.position+Vector2(randf()*zone.size.x,randf()*zone.size.y)
			b["wait"]=randf_range(0.5,2.0)
			continue
		var d: Vector2=(goal-s.position).normalized()
		var best:=0
		for i in DIRS.size():
			if d.dot(DIRS[i])>d.dot(DIRS[best]):
				best=i
		b["direction"]=best
		var step:=minf(25.0*delta,s.position.distance_to(goal))
		s.position+=d*step
		b["distance"]+=step
		var phase:=int(float(b["distance"])/float(art[4])*8.0)%8
		s.frame=best*art[3]+1+(int(phase/2.0) if art[3]==5 else phase)

func target(point: Vector2) -> Vector2i:
	for tile in model.sites:
		if site_rect(tile,model.sites[tile]["kind"]).grow(24).has_point(point) and player.global_position.distance_to(point)<=70.0:
			return tile
	return Vector2i(-1,-1)

func open_menu(tile: Vector2i=Vector2i(-1,-1)) -> void:
	active_tile=tile
	menu_open=true
	panel.show()
	_refresh()

func close_menu() -> void:
	menu_open=false
	panel.hide()

func cancel() -> void:
	selected=""
	ghost.hide()
	close_menu()

func _button(label: String,action: Callable) -> void:
	var b:=Button.new()
	b.text=label
	b.focus_mode=Control.FOCUS_NONE
	b.pressed.connect(action)
	list.add_child(b)

func _refresh() -> void:
	for node in list.get_children():
		list.remove_child(node)
		node.queue_free()
	_button("Fechar (Esc)",close_menu)
	if not model.sites.has(active_tile):
		for kind in Model.RULES:
			var rule: Dictionary=Model.RULES[kind]
			var cost: Array[String]=[]
			for item in rule["cost"]:
				cost.append("%s ×%d" % [item,rule["cost"][item]])
			_button("%s · %s + base" % [rule["name"],", ".join(cost)],func():
				selected=kind
				ghost.show()
				close_menu())
		return
	var site: Dictionary=model.sites[active_tile]
	var rule: Dictionary=Model.RULES[site["kind"]]
	var label:=Label.new()
	label.text="%s · %d/%d animais · cocho %d/%d" % [rule["name"],site["animals"].size(),rule["capacity"],site["trough"],rule["trough"]]
	list.add_child(label)
	var quality_label:=Label.new()
	quality_label.text="Qualidade na mochila · ovos: %s · ovos de pato: %s · leite: %s · lã: %s" % [farm.quality_label("egg"),farm.quality_label("duckEgg"),farm.quality_label("milk"),farm.quality_label("wool")]
	list.add_child(quality_label)
	if site["kind"]=="silo":
		_button("Preparar 1 palha com 3 fibras",func():
			message.text="Palha preparada." if farm.transact({"fiber":3},{"hay":1}) else "Faltam fibras ou espaço."
			_refresh())
		_button("Guardar palha no silo",func():
			var n:=mini(240-model.silo_hay,int(farm.stock.get("hay",0)))
			if n>0 and farm.transact({"hay":n},{}):
				model.silo_hay+=n
			message.text="Silo: %d/240" % model.silo_hay
			_refresh())
		_button("Retirar 10 palhas (%d disponíveis)" % model.silo_hay,func():
			var n:=mini(10,model.silo_hay)
			if n>0 and farm.transact({},{"hay":n}):
				model.silo_hay-=n
			_refresh())
		return
	for kind in rule["kinds"]:
		_button("Alojar %s (corda necessária; provisório)" % Model.KINDS[kind],func():
			if farm.stock.get("cord",0)>0 and model.admit(active_tile,kind):
				_spawn_animal(active_tile,site["animals"][-1])
				message.text="Animal alojado."
			else:
				message.text="Precisa de corda e espaço no abrigo."
			_refresh())
	_button("Abastecer cocho",func(): message.text=model.fill(active_tile,farm); _refresh())
	_button("Carinho diário",func(): message.text=model.pet(active_tile); _refresh())
	_button("Recolher produção (ovos %d, pato %d, esterco %d)" % [site["eggs"],site["duckEggs"],site["manure"]],func(): message.text=model.collect(active_tile,farm); _refresh())
	for a in site["animals"]:
		var info:=Label.new()
		info.text="%s #%d · amizade %d/30 · %s" % [Model.KINDS[a["kind"]],a["id"],a["bond"],"alimentado" if a["fed"]==model.last_day else "sem alimentação hoje"]
		list.add_child(info)
