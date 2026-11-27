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
	sim.call("restore_clock",3,600.0)
	# Horta com cultivos em todos os estágios (dias regados de 0 até pronto).
	var ids:=["turnip","lettuce","carrot","bean","turnip","lettuce","carrot","bean","turnip"]
	var x:=21
	for id in ids:
		var def: Dictionary=farm.CATALOG[id]
		for y in range(20,25):
			var days:=mini(int(def["days"]),int(round(float(def["days"])*float(y-20)/4.0)))
			farm.plots[Vector2i(x,y)]={"id":id,"day":3,"days":days,"watered":(x+y)%2==0,"missed":0}
		x+=1
	farm_node.call("_rebuild")
	player.global_position=Vector2(816,600)
	await _shot("01-horta-manha")

	# Galinheiro e curral com animais andando.
	var husbandry=farm_node.get("husbandry")
	var stock=farm.livestock
	var coop:=Vector2i(33,19)
	var barn:=Vector2i(33,26)
	stock.add_site(coop,"coop")
	for kind in ["chicken","chicken","chicken","duck","duck"]:
		stock.admit(coop,kind)
	stock.add_site(barn,"barn")
	for kind in ["cow","cow"]:
		stock.admit(barn,kind)
	husbandry.call("_spawn_site",coop)
	husbandry.call("_spawn_site",barn)
	player.global_position=Vector2(1120,760)
	await _frames(90)
	await _shot("02-criacao")

	# Máquinas instaladas ao lado da casa, com produção em andamento.
	var builder=farm_node.get("builder")
	var machines:={Vector2i(31,13):"cheesePress",Vector2i(33,13):"butterChurn",Vector2i(35,13):"forge",Vector2i(31,16):"clayOven",Vector2i(34,16):"preserveKeg",Vector2i(37,16):"stoneMill"}
	for tile in machines:
		farm.buildings[tile]={"kind":machines[tile],"rotation":0,"open":false}
		builder.call("_spawn",tile)
	player.global_position=Vector2(1090,600)
	farm_node.set("message","Queijeira instalada.")
	farm_node.call("_refresh")
	await _shot("03-maquinas")

	# Fim de tarde, pôr do sol e noite na horta.
	player.global_position=Vector2(816,600)
	sim.call("restore_clock",3,1080.0)
	await _shot("04-hora-dourada")
	sim.call("restore_clock",3,1290.0)
	await _shot("05-noite")

	# Primeiro dia de chuva do ano.
	var core: Object=sim.get("_core")
	var rain_day:=4
	while rain_day<112 and not bool(core.call("rain_for_day",rain_day)):
		rain_day+=1
	sim.call("restore_clock",rain_day,660.0)
	await _shot("06-chuva")

	# Mochila aberta.
	sim.call("restore_clock",3,600.0)
	farm_node.call("_toggle_inventory")
	await _shot("07-mochila")
	farm_node.call("_toggle_inventory")

	# Dentro de casa.
	var home=farm_node.get("home")
	home.call("enter")
	await _shot("08-casa")
	print("FOTOS_OK")
	quit()
