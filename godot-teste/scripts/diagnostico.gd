extends CanvasLayer
## Painel de diagnóstico opcional, F3. Não modifica a simulação.
var _label: Label
var _tempo := 0.0

func _ready() -> void:
	layer = 100
	_label = Label.new()
	_label.position = Vector2(12, 48)
	_label.add_theme_color_override("font_color", Color.WHITE)
	_label.add_theme_color_override("font_shadow_color", Color.BLACK)
	_label.add_theme_constant_override("shadow_offset_x", 2)
	_label.add_theme_constant_override("shadow_offset_y", 2)
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label.visible = false
	add_child(_label)
	_atualizar()
	if "--native-export-smoke" in OS.get_cmdline_user_args():
		call_deferred("_smoke_export")

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_F3:
		_label.visible = not _label.visible
		_atualizar()

func _process(delta: float) -> void:
	_tempo += delta
	if _tempo >= 0.5:
		_tempo = 0.0
		if _label.visible:
			_atualizar()

func _atualizar() -> void:
	var player := get_tree().get_first_node_in_group("native_player")
	var backend := "C++ ativo" if is_instance_valid(player) and player.get("usando_cpp") else "GDScript (alternativa)"
	_label.text = "Native V0.15 | %s\nFPS: %d | Memória estática Godot: %.1f MiB" % [backend, Engine.get_frames_per_second(), float(OS.get_static_memory_usage()) / 1048576.0]

## Runs only when explicitly requested by the CI, not during normal gameplay.
func _smoke_export() -> void:
	await get_tree().process_frame
	await get_tree().physics_frame
	var player := get_tree().get_first_node_in_group("native_player")
	if not is_instance_valid(player) or not player.get("usando_cpp"):
		push_error("NATIVE_EXPORT_FAIL: player or C++ backend unavailable")
		get_tree().quit(1)
		return
	var sprite := player.get_node_or_null("Corpo") as AnimatedSprite2D
	if sprite == null or sprite.sprite_frames == null:
		push_error("NATIVE_EXPORT_FAIL: player sprites unavailable")
		get_tree().quit(1)
		return
	for anim in sprite.sprite_frames.get_animation_names():
		for index in sprite.sprite_frames.get_frame_count(anim):
			if sprite.sprite_frames.get_frame_texture(anim, index) == null:
				push_error("NATIVE_EXPORT_FAIL: missing sprite " + str(anim))
				get_tree().quit(1)
				return
	var actual: Vector2 = player.call("_calcular_velocidade", Vector2(1, 1))
	var expected := Vector2(1, 1).normalized() * float(player.get("velocidade"))
	if not actual.is_equal_approx(expected):
		push_error("NATIVE_EXPORT_FAIL: wrong movement")
		get_tree().quit(1)
		return
	var world: Node2D = player.call("mundo_colisoes")
	if not is_instance_valid(world) or world.call("total_obstaculos") < 500 or world.call("total_pontes") != 2:
		push_error("NATIVE_EXPORT_FAIL: map collision setup")
		get_tree().quit(1)
		return
	if world.call("dentro_do_mapa", Vector2(-1, 100)) or world.call("dentro_do_mapa", Vector2(3080, 100)) or not world.call("dentro_do_mapa", Vector2(816, 592)):
		push_error("NATIVE_EXPORT_FAIL: world bounds")
		get_tree().quit(1)
		return
	var query := PhysicsPointQueryParameters2D.new()
	query.position = Vector2(1008, 496)
	query.collision_mask = 2
	if player.get_world_2d().direct_space_state.intersect_point(query).is_empty():
		push_error("NATIVE_EXPORT_FAIL: well collider missing")
		get_tree().quit(1)
		return
	var sim := get_tree().root.get_node_or_null("MundoSimulacao")
	if sim == null or not sim.call("using_cpp"):
		push_error("NATIVE_EXPORT_FAIL: world C++ backend unavailable")
		get_tree().quit(1)
		return
	var date: Dictionary = sim.call("snapshot")
	if date.get("day",0) != 1 or date.get("minute",0.0) < 480.0:
		push_error("NATIVE_EXPORT_FAIL: world clock invalid")
		get_tree().quit(1)
		return
	await get_tree().process_frame
	if sim.call("shadow_caster_count") < 500:
		push_error("NATIVE_EXPORT_FAIL: silhouette casters not initialized")
		get_tree().quit(1)
		return
	var farm_node:=get_tree().root.get_node_or_null("Fazenda")
	if farm_node==null or not farm_node.call("ready_for_test") or not ResourceLoader.exists("res://arte/cultivos/turnip/stage-3.png"):
		push_error("NATIVE_EXPORT_FAIL: farm unavailable")
		get_tree().quit(1)
		return
	if not ResourceLoader.exists("res://arte/ferramentas/regador/frame_008.png") or not ResourceLoader.exists("res://arte/ferramentas/enxada.png"):
		push_error("NATIVE_EXPORT_FAIL: tool art missing")
		get_tree().quit(1)
		return
	if farm_node.call("resource_count")<500:
		push_error("NATIVE_EXPORT_FAIL: resources unavailable")
		get_tree().quit(1)
		return
	if not ResourceLoader.exists("res://arte/construcao/workbench.png") or not ResourceLoader.exists("res://scripts/construcao_ui.gd"):
		push_error("NATIVE_EXPORT_FAIL: building assets missing")
		get_tree().quit(1)
		return
	if not farm_node.call("home_ready") or not ResourceLoader.exists("res://arte/casa/room-source.png"):
		push_error("NATIVE_EXPORT_FAIL: home unavailable")
		get_tree().quit(1)
		return
	if not farm_node.call("animals_ready") or not ResourceLoader.exists("res://arte/animais/chicken.png"):
		push_error("NATIVE_EXPORT_FAIL: livestock unavailable")
		get_tree().quit(1)
		return
	if not farm_node.call("fishing_ready"):
		push_error("NATIVE_EXPORT_FAIL: fishing unavailable")
		get_tree().quit(1)
		return
	if not farm_node.call("machines_ready") or not ResourceLoader.exists("res://arte/maquinas/stoneMill.png"):
		push_error("NATIVE_EXPORT_FAIL: machine system unavailable")
		get_tree().quit(1)
		return
	if not farm_node.call("kitchen_ready") or not ResourceLoader.exists("res://arte/cozinha/roastedFish.png"):
		push_error("NATIVE_EXPORT_FAIL: kitchen unavailable")
		get_tree().quit(1)
		return
	print("NATIVE_EXPORT_SMOKE_OK")
	get_tree().quit(0)
