extends SceneTree
## Monta cenas/propriedade.tscn a partir de dados/propriedade.json (o terreno e os objetos
## extraídos do jogo atual). Rode uma vez; depois a cena é editada direto no editor da Godot.
##   godot --headless --path godot-teste --script res://ferramentas/montar_propriedade.gd

const MATERIAIS := ["grass", "forest", "meadow", "path-dry", "path-wet", "soil", "sand", "moss", "water"]
const NOMES := ["Grama", "Floresta", "Campo", "Estrada seca", "Estrada úmida", "Terra de plantio", "Areia", "Musgo", "Água"]

func _init() -> void:
	var dados: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://dados/propriedade.json"))
	var raiz := Node2D.new(); raiz.name = "Propriedade"

	# Pincel do terreno: 9 materiais numa faixa de 32 × 32.
	var ts := TileSet.new(); ts.tile_size = Vector2i(32, 32)
	var fonte := TileSetAtlasSource.new(); fonte.texture = load("res://arte/terreno/pintura.png"); fonte.texture_region_size = Vector2i(32, 32)
	for i in MATERIALS_COUNT():
		fonte.create_tile(Vector2i(i, 0))
	ts.add_source(fonte, 0)
	ResourceSaver.save(ts, "res://dados/pincel-terreno.tres")
	ts = load("res://dados/pincel-terreno.tres")

	var terreno := ColorRect.new(); terreno.name = "Terreno"
	terreno.size = Vector2(96 * 32, 72 * 32); terreno.mouse_filter = Control.MOUSE_FILTER_IGNORE; terreno.z_index = -10
	var mat := ShaderMaterial.new(); mat.shader = load("res://shaders/terreno.gdshader")
	for i in MATERIAIS.size():
		mat.set_shader_parameter("m%d" % i, load("res://arte/terreno/%s.png" % MATERIAIS[i]))
	var ruido := NoiseTexture2D.new(); ruido.width = 256; ruido.height = 256; ruido.seamless = true
	var fn := FastNoiseLite.new(); fn.frequency = 0.02; fn.fractal_octaves = 3; ruido.noise = fn
	mat.set_shader_parameter("ruido", ruido)
	terreno.material = mat
	terreno.set_script(load("res://scripts/terreno.gd"))
	raiz.add_child(terreno); terreno.owner = raiz

	var pintura := TileMapLayer.new(); pintura.name = "Pintura"; pintura.tile_set = ts
	pintura.modulate = Color(1, 1, 1, 0)  # só os dados; quem desenha é o Terreno
	pintura.z_index = -9
	var linhas: Array = dados["tiles"]
	for y in linhas.size():
		var linha: Array = linhas[y]
		for x in linha.size():
			pintura.set_cell(Vector2i(x, y), 0, Vector2i(maxi(MATERIAIS.find(linha[x]), 0), 0))
	raiz.add_child(pintura); pintura.owner = raiz
	terreno.pintura = pintura

	var chao := Node2D.new(); chao.name = "Decoracao do chao"; chao.z_index = -5
	var objetos := Node2D.new(); objetos.name = "Objetos"; objetos.y_sort_enabled = true
	var acima := Node2D.new(); acima.name = "Acima"; acima.z_index = 5
	for n in [chao, objetos, acima]:
		raiz.add_child(n); n.owner = raiz
	var contagem := {}
	for o in dados["objs"]:
		var tex: Texture2D = load("res://arte/objetos/" + o["arte"])
		if tex == null:
			continue
		var s := Sprite2D.new(); s.texture = tex
		var nome := String(o["arte"]).get_basename()
		contagem[nome] = int(contagem.get(nome, 0)) + 1
		s.name = "%s-%d" % [nome, contagem[nome]]
		var tam := tex.get_size()
		s.scale = Vector2(float(o["w"]) / tam.x, float(o["h"]) / tam.y)
		s.offset = Vector2((0.5 - float(o["ox"])) * tam.x, (0.5 - float(o["oy"])) * tam.y)
		s.position = Vector2(o["x"], o["y"]); s.flip_h = bool(o["flip"])
		var camada := objetos
		if float(o["depth"]) < float(o["y"]) - 40.0: camada = chao
		elif float(o["depth"]) > float(o["y"]) + 40.0: camada = acima
		camada.add_child(s); s.owner = raiz

	var jogador := CharacterBody2D.new(); jogador.name = "Jogador"
	jogador.position = Vector2(dados["player"]["x"], dados["player"]["y"])
	jogador.set_script(load("res://scripts/jogador.gd"))
	var corpo := AnimatedSprite2D.new(); corpo.name = "Corpo"; corpo.scale = Vector2(0.31, 0.31); corpo.offset = Vector2(0, -104)
	jogador.add_child(corpo)
	var forma := CollisionShape2D.new(); forma.name = "Pes"; var r := RectangleShape2D.new(); r.size = Vector2(14, 8); forma.shape = r
	jogador.add_child(forma)
	var camera := Camera2D.new(); camera.name = "Camera"; camera.zoom = Vector2(2, 2)
	camera.limit_left = 0; camera.limit_top = 0; camera.limit_right = 96 * 32; camera.limit_bottom = 72 * 32
	jogador.add_child(camera)
	objetos.add_child(jogador)
	for n in [jogador, corpo, forma, camera]:
		n.owner = raiz
	jogador.terreno = terreno

	var cena := PackedScene.new(); cena.pack(raiz)
	var erro := ResourceSaver.save(cena, "res://cenas/propriedade.tscn")
	print("cena salva: ", erro == OK, " · objetos: ", dados["objs"].size())
	raiz.free()
	quit()

func MATERIALS_COUNT() -> int:
	return MATERIAIS.size()
