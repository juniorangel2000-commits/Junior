extends Node
const Farm=preload("res://scripts/fazenda_estado.gd")
const SAVE: String="user://propriedade-v1.save"
var farm=Farm.new()
var player: CharacterBody2D
var scene: Node2D
var ground: Node2D
var crops: Node2D
var hud: Label
var selected:=0
var seed_index:=0
var ids: Array=Farm.CATALOG.keys()
var message: String="E ou clique: interagir"
var elapsed:=0.0
var initialized:=false
var show_stock:=false
const InventoryUI=preload("res://scripts/mochila_ui.gd")
var inventory_ui: CanvasLayer
var pending: Dictionary={}
var action_elapsed:=0.0
var action_sprite: Sprite2D
var water_frames: Array[Texture2D]=[]
const Resources=preload("res://scripts/recursos_mundo.gd")
var resources=Resources.new()
const Build=preload("res://scripts/construcao.gd")
const BuildUI=preload("res://scripts/construcao_ui.gd")
var builder=Build.new()
var build_ui: CanvasLayer
var menu_open:=false
var craft_job: Dictionary={}
var craft_time:=0.0
const Home=preload("res://scripts/casa.gd")
var home=Home.new()
var chest_ui: CanvasLayer
var chest_open:=false
var loaded_home: Variant=null
const Husbandry=preload("res://scripts/criacao.gd")
var husbandry: Node2D
const Fishing=preload("res://scripts/pesca.gd")
var fishing: Node2D
const MachinesUI=preload("res://scripts/maquinas.gd")
var machine_ui: CanvasLayer
const KitchenUI=preload("res://scripts/cozinha.gd")
const Nutrition=preload("res://scripts/cozinha_estado.gd")
var kitchen_ui: CanvasLayer
var last_food_update: float=0.0
const TOOL_ART={"hoe":"res://arte/ferramentas/enxada.png","hatchet":"res://arte/ferramentas/machado.png","pickaxe":"res://arte/ferramentas/picareta.png"}
const SWING=[-40,-55,-35,15,75,70,45,20,0]

class SoilLayer extends Node2D:
	var farm
	func _draw() -> void:
		if farm==null:
			return
		for tile in farm.plots:
			var crop: Dictionary=farm.plots[tile]
			var wet: bool=not crop.is_empty() and bool(crop["watered"])
			var r:=Rect2(Vector2(tile)*32.0+Vector2(1,1),Vector2(30,30))
			draw_rect(r,Color(0.24,0.13,0.08,0.52) if wet else Color(0.48,0.26,0.12,0.40))
			for y in [8,16,24]:
				draw_line(r.position+Vector2(3,y),r.position+Vector2(27,y),Color(0.21,0.11,0.06,0.32),1.0)

func _ready() -> void:
	get_node("/root/MundoSimulacao").connect("novo_dia",_day_changed)
	var layer:=CanvasLayer.new()
	layer.layer=12
	add_child(layer)
	hud=Label.new()
	hud.position=Vector2(12,90)
	hud.add_theme_color_override("font_shadow_color",Color.BLACK)
	hud.add_theme_constant_override("shadow_offset_x",2)
	hud.add_theme_constant_override("shadow_offset_y",2)
	hud.mouse_filter=Control.MOUSE_FILTER_IGNORE
	layer.add_child(hud)
	inventory_ui=InventoryUI.new()
	add_child(inventory_ui)
	inventory_ui.connect("slot_selected",_select_slot)
	inventory_ui.connect("assign_requested",_assign)
	inventory_ui.connect("clear_requested",func(): _assign(""))
	inventory_ui.connect("closed",_toggle_inventory)
	for i in 9:
		water_frames.append(load("res://arte/ferramentas/regador/frame_%03d.png" % i) as Texture2D)
	build_ui=BuildUI.new()
	add_child(build_ui)
	build_ui.connect("recipe",_craft_request)
	build_ui.connect("piece",_build_select)
	build_ui.connect("close_requested",_toggle_craft)
	chest_ui=preload("res://scripts/bau_ui.gd").new()
	add_child(chest_ui)
	chest_ui.set("names",Callable(inventory_ui,"item_name"))
	chest_ui.connect("transfer",_transfer_chest)
	chest_ui.connect("close_requested",_close_chest)
	_refresh()

func _process(delta: float) -> void:
	if not initialized:
		player=get_tree().get_first_node_in_group("native_player") as CharacterBody2D
		if not is_instance_valid(player) or not is_instance_valid(player.call("mundo_colisoes")):
			return
		scene=get_tree().current_scene as Node2D
		ground=SoilLayer.new()
		ground.set("farm",farm)
		ground.z_index=-6
		scene.add_child(ground)
		crops=Node2D.new()
		crops.z_index=-3
		scene.add_child(crops)
		action_sprite=Sprite2D.new()
		action_sprite.visible=false
		action_sprite.z_index=2
		player.add_child(action_sprite)
		resources.build(scene,farm,player.call("mundo_colisoes"))
		initialized=true
		if not "--native-export-smoke" in OS.get_cmdline_user_args():
			_load()
		resources.restore()
		builder.setup(scene,player,farm)
		home.setup(scene,player)
		husbandry=Husbandry.new()
		husbandry.setup(scene,player,farm,builder)
		fishing=Fishing.new()
		fishing.setup(scene,player,farm)
		fishing.connect("result",_fishing_message)
		fishing.connect("save_requested",_save)
		machine_ui=MachinesUI.new()
		add_child(machine_ui)
		machine_ui.setup(player,farm,builder)
		machine_ui.connect("changed",_machine_message)
		kitchen_ui=KitchenUI.new()
		add_child(kitchen_ui)
		kitchen_ui.setup(player,farm)
		kitchen_ui.connect("changed",_machine_message)
		if loaded_home is Vector2:
			home.enter(loaded_home)
		_rebuild()
	_advance_action(delta)
	husbandry.update(delta,_clock())
	fishing.update(delta)
	machine_ui.update(delta,_clock())
	kitchen_ui.update(delta,_clock())
	player.set("food_speed",farm.nutrition.speed(Nutrition.absolute(_clock())))
	last_food_update+=delta
	if last_food_update>=0.5:
		last_food_update=0.0
		_refresh()
	if not home.inside and builder.selected!="":
		builder.update_preview(player.get_global_mouse_position())
	if not craft_job.is_empty():
		craft_time-=delta
		if craft_time<=0.0:
			message=builder.craft(craft_job["id"])
			craft_job.clear()
			_refresh()
	elapsed+=delta
	if elapsed>=30.0:
		elapsed=0.0
		_save()

func _clock() -> Dictionary:
	return get_node("/root/MundoSimulacao").call("snapshot")

func _day_changed(day: int,_rain: bool) -> void:
	farm.advance(day)
	if initialized:
		_rebuild()
		_save()

func _unhandled_input(event: InputEvent) -> void:
	if not initialized:
		return
	if kitchen_ui.open:
		if event is InputEventKey and event.pressed and not event.echo and event.keycode==KEY_ESCAPE:
			kitchen_ui.close_menu()
		return
	if machine_ui.open:
		if event is InputEventKey and event.pressed and not event.echo and event.keycode==KEY_ESCAPE:
			machine_ui.close_menu()
		return
	if fishing.active:
		if event is InputEventKey and event.pressed and not event.echo:
			if event.keycode==KEY_ESCAPE:
				fishing.cancel()
			elif event.keycode in [KEY_E,KEY_SPACE]:
				fishing.press()
		elif event is InputEventMouseButton and event.pressed and event.button_index==MOUSE_BUTTON_LEFT:
			fishing.press()
		return
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_1,KEY_2,KEY_3,KEY_4,KEY_5,KEY_6,KEY_7,KEY_8,KEY_9:
				_select_slot(int(event.keycode-KEY_1))
			KEY_Q:
				for offset in range(1,ids.size()+1):
					var next: int=(seed_index+offset)%ids.size()
					if farm.stock.get(Farm.CATALOG[ids[next]]["seed"],0)>0:
						seed_index=next
						farm.assign_slot(selected,Farm.CATALOG[ids[next]]["seed"])
						break
			KEY_G:
				if not chest_open and not husbandry.menu_open and not menu_open and not show_stock and pending.is_empty():
					message=farm.nutrition.eat(farm,farm.quickbar[selected],Nutrition.absolute(_clock()))
					_save()
			KEY_I:
				_toggle_inventory()
			KEY_B:
				if not home.inside and not show_stock and not menu_open:
					if husbandry.menu_open:
						husbandry.close_menu()
					else:
						husbandry.open_menu(husbandry.target(player.global_position))
			KEY_C:
				if not home.inside and not chest_open and not husbandry.menu_open:
					_toggle_craft()
			KEY_R:
				builder.rotation=(builder.rotation+1)%4
			KEY_ESCAPE:
				husbandry.cancel()
				if chest_open:
					_close_chest()
				builder.select("")
				if menu_open:
					_toggle_craft()
			KEY_F5:
				message="Progresso salvo." if _save() else "Falha ao salvar."
			KEY_E:
				if not show_stock and not menu_open and not chest_open and not husbandry.menu_open:
					var direction: Vector2=player.call("facing_vector")
					_start_action(player.global_position+direction*32.0,event.shift_pressed)
			_:
				return
		_refresh()
	elif event is InputEventMouseButton and event.button_index==MOUSE_BUTTON_LEFT and event.pressed:
		if not show_stock and not menu_open and not chest_open and not husbandry.menu_open:
			_start_action(player.get_global_mouse_position(),event.shift_pressed)

func _act(point: Vector2,restore: bool,item: String) -> void:
	if builder.selected!="":
		message=builder.place(builder.tile_at(point))
		_refresh()
		return
	if item=="hand":
		var interaction: String=builder.interact(point,restore)
		if interaction!="":
			message=interaction
			_refresh()
			return
	if item in ["hand","hatchet","pickaxe"]:
		var id: String=resources.target(point,player.global_position)
		if id!="":
			message=resources.hit(id,item)
			_refresh()
			return
		if item!="hand":
			message="Nenhum recurso ao alcance."
			_refresh()
			return
	var tile:=Vector2i(floori(point.x/32.0),floori(point.y/32.0))
	var center:=Vector2(tile)*32.0+Vector2(16,16)
	if player.global_position.distance_to(center)>64.0:
		message="Aproxime-se do canteiro."
	elif tile.x<1 or tile.y<1 or tile.x>94 or tile.y>70:
		message="Fora da propriedade."
	elif item=="hoe":
		var material_name: String=scene.get_node("Terreno").call("material_em",center)
		var world: Node2D=player.call("mundo_colisoes")
		if not restore and not farm.plots.has(tile) and (farm.livestock.reserved(tile) or builder.piece_at(tile).x>=0 or not material_name in ["grass","forest","meadow","soil","moss"] or world.call("ocupado",Rect2(center-Vector2(14,14),Vector2(28,28)))):
			message="Solo indisponível."
		else:
			message=farm.prepare(tile,restore)
	elif farm.crop_for_seed(item)!="":
		message=farm.plant(tile,farm.crop_for_seed(item),int(_clock()["day"]))
	elif item=="wateringCan":
		if _water_source(point):
			message=farm.refill()
		else:
			message=farm.water(tile)
	elif item=="hand":
		message=farm.harvest(tile)
	else:
		message="Ferramenta sem interação nesta etapa."
	_rebuild()

func _rebuild() -> void:
	ground.queue_redraw()
	for child in crops.get_children():
		crops.remove_child(child)
		child.queue_free()
	for tile in farm.plots:
		var crop: Dictionary=farm.plots[tile]
		if crop.is_empty():
			continue
		var stage: int=farm.stage(crop)
		var path: String="res://arte/cultivos/planted-seed.png" if stage==0 else "res://arte/cultivos/%s/stage-%d.png" % [crop["id"],stage-1]
		var tex:=load(path) as Texture2D
		if tex==null:
			continue
		var sprite:=Sprite2D.new()
		sprite.texture=tex
		var size:=tex.get_size()
		sprite.scale=Vector2.ONE*(30.0/maxf(size.x,size.y))
		sprite.position=Vector2(tile)*32.0+Vector2(16,28)
		sprite.offset=Vector2(0,-size.y*0.5)
		crops.add_child(sprite)
	_refresh()

func _select_slot(index: int) -> void:
	if index>=0 and index<9:
		selected=index
		_refresh()

func _assign(item: String) -> void:
	if farm.assign_slot(selected,item):
		message="Barra rápida atualizada."
	_refresh()

func _toggle_inventory() -> void:
	if (is_instance_valid(fishing) and fishing.active) or (is_instance_valid(machine_ui) and machine_ui.open) or (is_instance_valid(kitchen_ui) and kitchen_ui.open):
		return
	show_stock=not show_stock
	inventory_ui.call("toggle",show_stock)
	_refresh()

func _water_source(point: Vector2) -> bool:
	if player.global_position.distance_to(point)>64.0:
		return false
	if scene.get_node("Terreno").call("material_em",point)=="water":
		return true
	return point.distance_to(Vector2(1008,512))<=46.0

func _start_action(point: Vector2,restore: bool) -> void:
	if not pending.is_empty():
		return
	if husbandry.menu_open:
		return
	if not home.inside:
		if husbandry.selected!="":
			message=husbandry.place(point)
			_refresh()
			return
		var site: Vector2i=husbandry.target(point)
		if site.x>=0:
			husbandry.open_menu(site)
			return
	var target: String=home.target(point)
	if home.inside or target=="enter":
		_home_interact(target)
		return
	var item: String=farm.quickbar[selected]
	if builder.selected!="":
		_act(point,restore,item)
		return
	if MachinesUI.Model.MACHINES.has(item) or item=="campfire":
		builder.select(item)
		message=builder.place(builder.tile_at(point))
		builder.select("")
		_refresh()
		return
	var camp_cell: Vector2i=builder.piece_at(builder.tile_at(point))
	if camp_cell.x>=0 and farm.buildings[camp_cell]["kind"]=="campfire" and player.global_position.distance_to(point)<=64.0:
		if restore:
			message=builder.interact(point,true)
			_refresh()
		else:
			kitchen_ui.show_station("campfire")
		return
	var machine_cell: Vector2i=machine_ui.find(point)
	if machine_cell.x>=0:
		machine_ui.show_machine(machine_cell)
		return
	if item=="fishingRod":
		fishing.start(point,_clock())
		return
	if item in ["wateringCan","hatchet","pickaxe","hoe"]:
		if player.global_position.distance_to(point)>64.0:
			message="Aproxime-se do alvo."
			_refresh()
			return
		farm.nutrition.spend(1,Nutrition.absolute(_clock()))
		pending={"point":point,"restore":restore,"item":item,"impacted":false}
		action_elapsed=0.0
		player.set("tool_busy",true)
		action_sprite.visible=true
		return
	_act(point,restore,item)

func _advance_action(delta: float) -> void:
	if pending.is_empty():
		return
	action_elapsed+=delta
	var point: Vector2=pending["point"]
	var direction: Vector2=(point-player.global_position).normalized()
	if direction.is_zero_approx():
		direction=Vector2.DOWN
	action_sprite.position=direction*18.0+Vector2(0,-12)
	action_sprite.flip_h=direction.x<0.0
	var frame:=mini(8,int(action_elapsed*18.0))
	var item: String=pending["item"]
	var tex: Texture2D=water_frames[frame] if item=="wateringCan" else load(TOOL_ART[item]) as Texture2D
	action_sprite.rotation=0.0 if item=="wateringCan" else deg_to_rad(float(SWING[frame])*( -1.0 if direction.x<0.0 else 1.0))
	if tex!=null:
		action_sprite.texture=tex
		action_sprite.scale=Vector2.ONE*(32.0/maxf(tex.get_width(),tex.get_height()))
	if not pending["impacted"] and action_elapsed>=4.0/18.0:
		pending["impacted"]=true
		_act(point,pending["restore"],pending["item"])
	if action_elapsed>=9.0/18.0:
		pending.clear()
		player.set("tool_busy",false)
		action_sprite.hide()

func _refresh() -> void:
	if hud==null or inventory_ui==null:
		return
	var item: String=farm.quickbar[selected]
	hud.text="E ou clique: interagir | Q: trocar semente no espaço | I: mochila | C: fabricar/construir | B: criação | G: comer | F5: salvar\n%s · Regador %d/8\n%s" % [inventory_ui.call("item_name",item),farm.water_charges,message]
	if initialized:
		var now: float=Nutrition.absolute(_clock())
		var effect_id: String=farm.nutrition.active(now)
		hud.text+="\nVigor %d/100" % farm.nutrition.vigor
		if effect_id!="":
			hud.text+=" · "+str(Nutrition.EFFECTS[effect_id]["name"])
			if farm.nutrition.extra(now)>0:
				hud.text+=" +%d" % farm.nutrition.extra(now)
	inventory_ui.call("sync",farm.stock,farm.quickbar,selected,farm.water_charges)

func _save() -> bool:
	if not initialized or "--native-export-smoke" in OS.get_cmdline_user_args():
		return false
	var clock:=_clock()
	var f:=FileAccess.open(SAVE+".tmp",FileAccess.WRITE)
	if f==null:
		return false
	f.store_var({"schema":1,"day":int(clock["day"]),"minute":float(clock["minute"]),"position":home.exterior_position if home.inside else player.global_position,"home_position":player.global_position-Home.ORIGIN if home.inside else null,"farm":farm.export_state()},false)
	f.flush()
	f.close()
	if FileAccess.file_exists(SAVE) and DirAccess.copy_absolute(SAVE,SAVE+".bak")!=OK:
		return false
	return DirAccess.rename_absolute(SAVE+".tmp",SAVE)==OK

func _load() -> void:
	for path in [SAVE,SAVE+".bak"]:
		if not FileAccess.file_exists(path):
			continue
		var f:=FileAccess.open(path,FileAccess.READ)
		if f==null or f.get_length()>4000000:
			continue
		var data=f.get_var(false)
		if not data is Dictionary or data.get("schema")!=1:
			continue
		if not data.get("day") is int or data["day"]<1 or data["day"]>999999 or not data.get("minute") is float or not is_finite(data["minute"]) or data["minute"]<0.0 or data["minute"]>=1440.0:
			continue
		if not data.get("position") is Vector2 or not data["position"].is_finite() or not data.get("farm") is Dictionary:
			continue
		if not farm.import_state(data["farm"],data["day"]):
			continue
		get_node("/root/MundoSimulacao").call("restore_clock",data["day"],data["minute"])
		resources.restore()
		var world: Node2D=player.call("mundo_colisoes")
		if world.call("terreno_livre",data["position"],scene.get_node("Terreno")) and not world.call("ocupado",Rect2(data["position"]-Vector2(7,4),Vector2(14,8))):
			player.global_position=data["position"]
		var room_pos: Variant=data.get("home_position")
		if room_pos is Vector2 and room_pos.is_finite() and Home.walkable(room_pos):
			loaded_home=room_pos
		message="Progresso recuperado."
		return

func _notification(what: int) -> void:
	if what==NOTIFICATION_WM_CLOSE_REQUEST:
		_save()

func ready_for_test() -> bool:
	return initialized and is_instance_valid(farm.core)

func resource_count() -> int:
	return resources.entries.size()

func _toggle_craft() -> void:
	menu_open=not menu_open
	build_ui.call("show_menu",menu_open)

func _build_select(kind: String) -> void:
	builder.select(kind)
	if menu_open:
		_toggle_craft()
	message="Posicione no chão · R gira · Esc cancela."
	_refresh()

func _craft_request(id: String) -> void:
	if not craft_job.is_empty():
		message="Já existe uma fabricação em andamento."
	elif Build.RECIPES.has(id):
		var rule: Dictionary=Build.RECIPES[id]
		if not builder.near_station(rule.get("station","")):
			message="Aproxime-se da bancada correta."
		elif rule.get("seconds",0.0)>0.0:
			craft_job={"id":id}
			craft_time=rule["seconds"]
			message="Fabricando %s..." % rule["name"]
		else:
			message=builder.craft(id)
	_refresh()

func _home_interact(target: String) -> void:
	match target:
		"enter":
			builder.select("")
			home.enter()
			message="Casa · E na cama, baú ou saída."
		"exit":
			_close_chest()
			home.leave()
			message="Propriedade."
		"bed":
			message=get_node("/root/MundoSimulacao").call("sleep_until_morning")
			if message.begins_with("Você acordou"):
				farm.nutrition.restore()
			_save()
		"chest":
			chest_open=true
			player.set("tool_busy",true)
			chest_ui.call("update_items",farm.stock,farm.chest)
			chest_ui.call("show_menu",true)
		"woodStove":
			kitchen_ui.show_station("stove")
		_:
			message="Aproxime-se da cama, baú ou saída."
	_refresh()

func _close_chest() -> void:
	if not chest_open:
		return
	chest_open=false
	chest_ui.call("show_menu",false)
	player.set("tool_busy",false)

func _transfer_chest(item: String,to_chest: bool,amount: int) -> void:
	if not chest_open or not home.inside:
		return
	message="Transferência concluída." if farm.transfer_chest(item,to_chest,amount) else "Quantidade ou espaço insuficiente."
	chest_ui.call("update_items",farm.stock,farm.chest)
	_refresh()

func home_ready() -> bool:
	return is_instance_valid(home.root)

func animals_ready() -> bool:
	return is_instance_valid(husbandry) and is_instance_valid(husbandry.panel)

func _fishing_message(value: String) -> void:
	message=value
	_refresh()

func fishing_ready() -> bool:
	return is_instance_valid(fishing) and is_instance_valid(fishing.rod) and fishing.rod.texture!=null

func _machine_message(value: String) -> void:
	message=value
	_refresh()
	_save()

func machines_ready() -> bool:
	return is_instance_valid(machine_ui) and is_instance_valid(machine_ui.panel)

func kitchen_ready() -> bool:
	return is_instance_valid(kitchen_ui) and is_instance_valid(kitchen_ui.panel)
