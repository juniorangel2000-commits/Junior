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
		initialized=true
		if not "--native-export-smoke" in OS.get_cmdline_user_args():
			_load()
		_rebuild()
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
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_1,KEY_2,KEY_3,KEY_4:
				selected=int(event.keycode-KEY_1)
			KEY_Q:
				seed_index=(seed_index+1)%ids.size()
			KEY_I:
				show_stock=not show_stock
			KEY_F5:
				message="Progresso salvo." if _save() else "Falha ao salvar."
			KEY_E:
				var direction: Vector2=player.call("facing_vector")
				_act(player.global_position+direction*32.0,event.shift_pressed)
			_:
				return
		_refresh()
	elif event is InputEventMouseButton and event.button_index==MOUSE_BUTTON_LEFT and event.pressed:
		_act(player.get_global_mouse_position(),event.shift_pressed)

func _act(point: Vector2,restore: bool) -> void:
	var tile:=Vector2i(floori(point.x/32.0),floori(point.y/32.0))
	var center:=Vector2(tile)*32.0+Vector2(16,16)
	if player.global_position.distance_to(center)>64.0:
		message="Aproxime-se do canteiro."
	elif tile.x<1 or tile.y<1 or tile.x>94 or tile.y>70:
		message="Fora da propriedade."
	elif selected==1:
		var material_name: String=scene.get_node("Terreno").call("material_em",center)
		var world: Node2D=player.call("mundo_colisoes")
		if not restore and not farm.plots.has(tile) and (not material_name in ["grass","forest","meadow","soil","moss"] or world.call("ocupado",Rect2(center-Vector2(14,14),Vector2(28,28)))):
			message="Solo indisponível."
		else:
			message=farm.prepare(tile,restore)
	elif selected==2:
		message=farm.plant(tile,str(ids[seed_index]),int(_clock()["day"]))
	elif selected==3:
		message=farm.water(tile)
	else:
		message=farm.harvest(tile)
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

func _refresh() -> void:
	var def: Dictionary=Farm.CATALOG[ids[seed_index]]
	var actions:=["Mão","Enxada","Sementes","Regador"]
	hud.text="1 Mão | 2 Enxada | 3 Sementes | 4 Regador\nSelecionado: %s | Q: %s (%d) | I: mochila | F5: salvar\n%s" % [actions[selected],def["name"],farm.stock.get(def["seed"],0),message]
	if show_stock:
		for item in farm.stock:
			if farm.stock[item]>0:
				hud.text+="\n%s × %d" % [item,farm.stock[item]]

func _save() -> bool:
	if not initialized or "--native-export-smoke" in OS.get_cmdline_user_args():
		return false
	var clock:=_clock()
	var f:=FileAccess.open(SAVE+".tmp",FileAccess.WRITE)
	if f==null:
		return false
	f.store_var({"schema":1,"day":int(clock["day"]),"minute":float(clock["minute"]),"position":player.global_position,"farm":farm.export_state()},false)
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
		var world: Node2D=player.call("mundo_colisoes")
		if world.call("terreno_livre",data["position"],scene.get_node("Terreno")) and not world.call("ocupado",Rect2(data["position"]-Vector2(7,4),Vector2(14,8))):
			player.global_position=data["position"]
		message="Progresso recuperado."
		return

func _notification(what: int) -> void:
	if what==NOTIFICATION_WM_CLOSE_REQUEST:
		_save()

func ready_for_test() -> bool:
	return initialized and is_instance_valid(farm.core)
