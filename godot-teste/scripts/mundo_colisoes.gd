extends Node2D
## Colisões por base dos sprites. Medidas iniciais em pixels de mundo, ajustáveis.
const WORLD_SIZE := Vector2(3072, 2304)
const FEET := Vector2(7, 4)
const SOLID_LAYER := 2
var _blocks: Array[Rect2] = []
var _bridges: Array[Rect2] = []
var _debug := false

func build(root: Node2D) -> void:
	var bridge_parts: Dictionary = {}
	var fences: Dictionary = {}
	for layer_name in ["Objetos", "Decoracao do chao", "Acima"]:
		var layer_node := root.get_node_or_null(layer_name)
		if layer_node == null:
			continue
		for child in layer_node.get_children():
			if not child is Sprite2D:
				continue
			var sprite := child as Sprite2D
			if sprite.texture == null:
				continue
			var art := sprite.texture.resource_path.get_file().get_basename()
			var p := to_local(sprite.global_position)
			var size := sprite.texture.get_size() * sprite.scale.abs()
			if art.begins_with("bridge-"):
				var key := art.trim_suffix("-back").trim_suffix("-front")
				if not bridge_parts.has(key):
					bridge_parts[key] = {}
				bridge_parts[key]["back" if art.ends_with("-back") else "front"] = Rect2(p, size)
			elif art.begins_with("fence-new-") or art.begins_with("gate-"):
				fences[Vector2i(p.round())] = true
			elif art.begins_with("asset-tree-") or art.begins_with("asset-pine-"):
				_add_block(p + Vector2(0, -9), Vector2(clampf(size.x * 0.17, 24, 38), 20))
			elif art == "asset-house":
				_add_block(p + Vector2(0, -size.y * 0.23), Vector2(size.x * 0.80, size.y * 0.42))
			elif art == "property-well-idle":
				_add_block(p + Vector2(0, -size.y * 0.15), Vector2(size.x * 0.65, size.y * 0.30))
			elif art.begins_with("lake-rock-") or art.begins_with("detailed-ore-") or art == "forest-detail-stump" or art == "forest-detail-log" or art.begins_with("pet-shelter-"):
				_add_block(p + Vector2(0, -size.y * 0.16), Vector2(size.x * 0.65, maxf(size.y * 0.34, 10)))
	for key in fences:
		var p := Vector2(key)
		var horizontal := fences.has(key + Vector2i(32, 0)) or fences.has(key - Vector2i(32, 0))
		var vertical := fences.has(key + Vector2i(0, 32)) or fences.has(key - Vector2i(0, 32))
		if horizontal or not vertical:
			_add_block(p, Vector2(34, 10))
		if vertical:
			_add_block(p, Vector2(10, 34))
	for pair in bridge_parts.values():
		if pair.has("back") and pair.has("front"):
			var back: Rect2 = pair["back"]
			var front: Rect2 = pair["front"]
			var left := maxf(back.position.x, front.position.x)
			var right := minf(back.end.x, front.end.x)
			var top := back.position.y + 2.0
			var bottom := front.position.y - 12.0
			if right > left and bottom > top:
				_bridges.append(Rect2(left, top, right-left, bottom-top))
	# Um único corpo estático com várias formas, sem centenas de nós de física independentes.
	var body := StaticBody2D.new()
	body.name = "Obstaculos"
	body.collision_layer = SOLID_LAYER
	body.collision_mask = 0
	add_child(body)
	for rect in _blocks:
		var shape := RectangleShape2D.new()
		shape.size = rect.size
		var collision := CollisionShape2D.new()
		collision.shape = shape
		collision.position = rect.get_center()
		body.add_child(collision)

func _add_block(center: Vector2, size: Vector2) -> void:
	_blocks.append(Rect2(center - size * 0.5, size))

func dentro_do_mapa(p: Vector2) -> bool:
	return p.x >= FEET.x and p.y >= FEET.y and p.x <= WORLD_SIZE.x - FEET.x and p.y <= WORLD_SIZE.y - FEET.y

func _na_ponte(p: Vector2) -> bool:
	for bridge in _bridges:
		if bridge.has_point(p):
			return true
	return false

func terreno_livre(p: Vector2, terreno: Node) -> bool:
	if not dentro_do_mapa(p):
		return false
	if terreno == null:
		return true
	for offset in [Vector2(-7,-4), Vector2(7,-4), Vector2(-7,4), Vector2(7,4), Vector2.ZERO]:
		var foot: Vector2 = p + offset
		if terreno.material_em(foot) == "water" and not _na_ponte(foot):
			return false
	return true

func total_obstaculos() -> int:
	return _blocks.size()

func total_pontes() -> int:
	return _bridges.size()

func alternar_debug() -> void:
	_debug = not _debug
	queue_redraw()

func _draw() -> void:
	if not _debug:
		return
	for rect in _blocks:
		draw_rect(rect, Color(1, 0.25, 0.2, 0.35))
		draw_rect(rect, Color(1, 0.3, 0.2, 0.85), false, 1.0)
	for rect in _bridges:
		draw_rect(rect, Color(0.2, 0.9, 1, 0.35))

func ocupado(rect: Rect2) -> bool:
	for block in _blocks:
		if block.intersects(rect):
			return true
	return false
