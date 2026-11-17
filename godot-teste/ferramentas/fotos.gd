extends SceneTree
## Tira fotos da Propriedade rodando (conferência): godot --path godot-teste --script res://ferramentas/fotos.gd
func _init() -> void:
	var cena: Node2D = load("res://cenas/propriedade.tscn").instantiate()
	root.add_child(cena)
	var jogador: CharacterBody2D = cena.get_node("Objetos/Jogador")
	var pontos := [jogador.position, Vector2(1168, 900), Vector2(784, 560), Vector2(1700, 1500)]
	for i in pontos.size():
		jogador.position = pontos[i]
		for f in 8:
			await process_frame
		root.get_viewport().get_texture().get_image().save_png("user://foto-%d.png" % i)
	# O mapa inteiro, pequeno.
	var cam: Camera2D = jogador.get_node("Camera"); cam.zoom = Vector2(0.4, 0.4); jogador.position = Vector2(1536, 1152)
	cam.limit_left = -10000; cam.limit_top = -10000; cam.limit_right = 10000; cam.limit_bottom = 10000
	for f in 8:
		await process_frame
	root.get_viewport().get_texture().get_image().save_png("user://foto-mapa.png")
	quit()
