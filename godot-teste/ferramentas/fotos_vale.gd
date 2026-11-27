extends SceneTree
## Fotos de cada cenário do vale (conferência). Precisa de tela (no Linux: xvfb-run).
## godot --path godot-teste --rendering-driver opengl3 --resolution 1600x900 --script res://ferramentas/fotos_vale.gd -- <pasta> --sem-save [área ...]
## Também confere a passagem a pé da Propriedade para a Floresta (estrada oeste).
const Vale=preload("res://scripts/vale.gd")
var out_dir:="user://fotos-vale"

func _initialize() -> void:
	_run.call_deferred()

func _frames(n: int) -> void:
	for i in n:
		await process_frame

func _shot(name: String) -> void:
	await _frames(20)
	await RenderingServer.frame_post_draw
	root.get_viewport().get_texture().get_image().save_png(out_dir.path_join(name+".png"))
	print("FOTO ",name)

## Célula livre mais perto do ponto pedido (o cenário já deve estar carregado).
func _free_spot(world: Node2D,p: Vector2) -> Vector2:
	for r in range(0,1400,24):
		for k in 16:
			var q:=p+Vector2(r,0).rotated(TAU*k/16.0)
			if world.call("terreno_livre",q,null) and not _solid(q):
				return q
	return p

func _solid(p: Vector2) -> bool:
	var query:=PhysicsPointQueryParameters2D.new()
	query.position=p
	query.collision_mask=2
	var space: PhysicsDirectSpaceState2D=root.get_world_2d().direct_space_state
	return not space.intersect_point(query).is_empty()

func _run() -> void:
	var args:=OS.get_cmdline_user_args()
	var areas: Array=[]
	for a in args:
		if a.begins_with("--"):
			continue
		if out_dir=="user://fotos-vale" and (a.begins_with("/") or a.begins_with("user://")):
			out_dir=a
		else:
			areas.append(a)
	DirAccess.make_dir_recursive_absolute(out_dir)
	var farm_node:=root.get_node("Fazenda")
	var sim:=root.get_node("MundoSimulacao")
	change_scene_to_file("res://cenas/propriedade.tscn")
	while not bool(farm_node.get("initialized")):
		await process_frame
	var core: Object=sim.get("_core")
	var day:=2
	while bool(core.call("rain_for_day",day)):
		day+=1
	sim.call("restore_clock",day,690.0)
	var player: CharacterBody2D=farm_node.get("player")
	var vale: Node2D=farm_node.get("vale")
	var world: Node2D=player.call("mundo_colisoes")
	if areas.is_empty():
		areas=vale.get("available").keys()
	# Passagem a pé: estrada oeste da Propriedade até a Floresta.
	if vale.get("available").has("forest"):
		player.global_position=Vector2(60,1690)
		await _frames(30)
		Input.action_press("ui_left")
		for i in 150:
			await physics_frame
		Input.action_release("ui_left")
		await _frames(5)
		print("PASSAGEM oeste: x=%d área=%s" % [player.global_position.x,Vale.area_at(player.global_position)])
		await _shot("passagem-floresta")
	for area in areas:
		var r: Rect2=Vale.layout()[area]
		vale.call("ensure_loaded",r.get_center())
		for i in 4:
			await physics_frame
		player.global_position=_free_spot(world,r.get_center())
		vale.set("current","")
		await _frames(30)
		await _shot("vale-"+area)
	print("FOTOS_VALE_OK")
	quit()
