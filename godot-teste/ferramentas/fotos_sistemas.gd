extends SceneTree
## Fotos dos sistemas do protótipo nativo, para conferência visual.
## Precisa de tela (no Linux sem monitor: xvfb-run). Não use --headless: sem renderizador não há imagem.
## godot --path godot-teste --rendering-driver opengl3 --resolution 1600x900 --script res://ferramentas/fotos_sistemas.gd -- <pasta> --sem-save
## Com --sem-save a partida das fotos não lê nem grava o progresso do jogador.

var out_dir: String="user://fotos"
var farm_node: Node
var sim: Node

func _initialize() -> void:
	var args:=OS.get_cmdline_user_args()
	if args.size()>0 and not args[0].begins_with("--"):
		out_dir=args[0]
	DirAccess.make_dir_recursive_absolute(out_dir)
	_run.call_deferred()

func _frames(n: int) -> void:
	for i in n:
		await process_frame

func _shot(name: String) -> void:
	await _frames(12)
	await RenderingServer.frame_post_draw
	var path:=out_dir.path_join(name+".png")
	root.get_viewport().get_texture().get_image().save_png(path)
	print("FOTO ",path)

## Mapa inteiro, sem HUD, ao meio-dia.
func _map_shot() -> void:
	var player: CharacterBody2D=farm_node.get("player")
	var cam: Camera2D=player.get_node("Camera")
	var keep:=[cam.zoom,cam.limit_left,cam.limit_top,cam.limit_right,cam.limit_bottom,player.global_position,cam.position_smoothing_enabled]
	var layers: Array=[]
	for n in [root.get_node("MundoSimulacao"),farm_node]:
		for c in n.get_children():
			if c is CanvasLayer and c.layer>=11:
				layers.append([c,c.visible])
				c.visible=false
	cam.position_smoothing_enabled=false
	cam.limit_left=-4000
	cam.limit_top=-4000
	cam.limit_right=8000
	cam.limit_bottom=8000
	cam.zoom=Vector2.ONE*0.3125
	player.global_position=Vector2(1536,1152)
	var core: Object=sim.get("_core")
	var clear:=2
	while bool(core.call("rain_for_day",clear)):
		clear+=1
	sim.call("restore_clock",clear,720.0)
	await _shot("00-mapa")
	cam.zoom=keep[0]
	cam.limit_left=keep[1]
	cam.limit_top=keep[2]
	cam.limit_right=keep[3]
	cam.limit_bottom=keep[4]
	player.global_position=keep[5]
	cam.reset_smoothing()
	cam.position_smoothing_enabled=keep[6]
	for pair in layers:
		pair[0].visible=pair[1]
	sim.call("restore_clock",clear,600.0)

func _run() -> void:
	sim=root.get_node("MundoSimulacao")
	farm_node=root.get_node("Fazenda")
	change_scene_to_file("res://cenas/propriedade.tscn")
	while not bool(farm_node.get("initialized")):
		await process_frame
	var farm=farm_node.get("farm")
	var player: CharacterBody2D=farm_node.get("player")
	# Kit de exibição: sementes, materiais e alguns produtos com qualidade.
	farm.transact({},{"hammer":1,"carrotSeeds":4,"beanSeeds":4,"lettuceSeeds":4,"egg":6,"milk":3,"fish":2,"wood":30,"stone":20,"board":10})
	farm.quality_gain("egg",2,2)
	farm.quality_gain("egg",1,2)
	farm.quality_gain("milk",1,1)
	# Dia de tempo aberto para as fotos (o clima é sorteado por dia, em C++).
	var core: Object=sim.get("_core")
	var day:=2
	while bool(core.call("rain_for_day",day)):
		day+=1
	sim.call("restore_clock",day,600.0)
	# Horta com cultivos em todos os estágios (dias regados de 0 até pronto).
	var ids:=["turnip","lettuce","carrot","bean","turnip","lettuce","carrot","bean","turnip"]
	var x:=21
	for id in ids:
		var def: Dictionary=farm.CATALOG[id]
		for y in range(20,25):
			var days:=mini(int(def["days"]),int(round(float(def["days"])*float(y-20)/4.0)))
			farm.plots[Vector2i(x,y)]={"id":id,"day":day,"days":days,"watered":(x+y)%2==0,"missed":0}
		x+=1
	farm_node.call("_rebuild")
	await _map_shot()
	player.global_position=Vector2(800,880)
	await _shot("01-horta-manha")

	# Galinheiro e curral com animais andando.
	var husbandry=farm_node.get("husbandry")
	var stock=farm.livestock
	var coop:=Vector2i(17,41)
	var barn:=Vector2i(24,42)
	stock.add_site(coop,"coop")
	for kind in ["chicken","chicken","chicken","duck","duck"]:
		stock.admit(coop,kind)
	stock.add_site(barn,"barn")
	for kind in ["cow","cow"]:
		stock.admit(barn,kind)
	husbandry.call("_spawn_site",coop)
	husbandry.call("_spawn_site",barn)
	player.global_position=Vector2(720,1430)
	await _frames(90)
	await _shot("02-criacao")

	# Máquinas no pátio da oficina, perto da ponte norte.
	var builder=farm_node.get("builder")
	var machines:={Vector2i(36,22):"cheesePress",Vector2i(37,22):"butterChurn",Vector2i(39,22):"forge",Vector2i(36,25):"clayOven",Vector2i(38,25):"preserveKeg",Vector2i(37,28):"stoneMill"}
	for tile in machines:
		farm.buildings[tile]={"kind":machines[tile],"rotation":0,"open":false}
		builder.call("_spawn",tile)
	player.global_position=Vector2(1150,760)
	farm_node.set("message","Queijeira instalada.")
	farm_node.call("_refresh")
	await _shot("03-maquinas")

	# Fim de tarde, pôr do sol e noite na frente de casa.
	player.global_position=Vector2(752,1230)
	sim.call("restore_clock",day,1080.0)
	await _shot("04-hora-dourada")
	sim.call("restore_clock",day,1290.0)
	await _shot("05-noite")

	# Primeiro dia de chuva do ano.
	var rain_day:=day+1
	while rain_day<112 and not bool(core.call("rain_for_day",rain_day)):
		rain_day+=1
	sim.call("restore_clock",rain_day,660.0)
	await _shot("06-chuva")

	# Mochila aberta.
	sim.call("restore_clock",day,600.0)
	farm_node.call("_toggle_inventory")
	await _shot("07-mochila")
	farm_node.call("_toggle_inventory")

	# Dentro de casa.
	var home=farm_node.get("home")
	home.call("enter")
	await _shot("08-casa")
	home.call("leave")
	# Lago e pedreira.
	player.global_position=Vector2(300,1700)
	await _shot("09-lago")
	# Pontes norte e sul.
	player.global_position=Vector2(1300,640)
	await _shot("10-ponte-norte")
	player.global_position=Vector2(1330,1730)
	await _shot("11-ponte-sul")
	# Margens do rio.
	player.global_position=Vector2(1330,1180)
	await _shot("12-rio")
	player.global_position=Vector2(1300,280)
	await _shot("13-rio-norte")
	print("FOTOS_OK")
	quit()
