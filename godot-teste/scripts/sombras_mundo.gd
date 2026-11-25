extends Node2D
## Projeção ortográfica da silhueta real de cada sprite. Não altera as artes.
const SHADOW_SHADER = preload("res://shaders/sombra_projetada.gdshader")
var _casters: Array[Dictionary] = []
var _foot_cache: Dictionary = {}
var _player: AnimatedSprite2D
var _offset := Vector2(0.55,0.25)
var _opacity := 0.0
var _material: ShaderMaterial
var _enabled := true
var _timer := 0.0

func build(scene: Node2D) -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	_material = ShaderMaterial.new()
	_material.shader = SHADOW_SHADER
	material = _material
	for layer_name in ["Objetos","Decoracao do chao","Acima"]:
		var layer := scene.get_node_or_null(layer_name)
		if layer == null:
			continue
		for node in layer.get_children():
			if not node is Sprite2D:
				continue
			var sprite := node as Sprite2D
			if sprite.texture == null:
				continue
			var art := sprite.texture.resource_path.get_file()
			var tall := art.begins_with("asset-tree-") or art.begins_with("asset-pine-")
			var solid := art.begins_with("lake-rock-") or art.begins_with("detailed-ore-") or art == "asset-house.png" or art == "property-well-idle.png" or art.begins_with("pet-shelter-") or art.begins_with("fence-new-") or art.begins_with("gate-") or art.begins_with("forest-detail-stump") or art.begins_with("forest-detail-log")
			if not tall and not solid:
				continue
			var texture := sprite.texture
			var rect := sprite.get_rect()
			var foot := _foot(texture)
			_casters.append({"sprite":sprite,"texture":texture,"rect":rect,"foot":foot,"height_factor":1.0 if tall else 0.85})
	_player = scene.get_node_or_null("Objetos/Jogador/Corpo") as AnimatedSprite2D
	_set_uniforms()
	queue_redraw()

## Mede a última linha significativa de alpha uma única vez por textura.
## Assim a projeção sai da base desenhada, não da margem transparente.
func _foot(texture: Texture2D) -> float:
	var key := texture.get_instance_id()
	if _foot_cache.has(key):
		return float(_foot_cache[key])
	var foot := 1.0
	var image := texture.get_image()
	if image != null and not image.is_empty():
		if image.is_compressed():
			image.decompress()
		if not image.is_compressed():
			var width := image.get_width()
			var height := image.get_height()
			for y in range(height-1,-1,-1):
				var count := 0
				for x in width:
					if image.get_pixel(x,y).a >= 0.58:
						count += 1
						if count >= 2:
							break
				if count >= 2:
					foot = float(y+1)/float(height)
					break
	_foot_cache[key] = foot
	return foot

func caster_count() -> int:
	return _casters.size()

func update_sun(offset: Vector2, opacity: float) -> void:
	_offset = offset
	_opacity = opacity
	_set_uniforms()
	queue_redraw()

func _set_uniforms() -> void:
	if _material != null:
		_material.set_shader_parameter("shadow_strength",_opacity)
		_material.set_shader_parameter("softness",lerpf(0.9,1.9,clampf(_offset.length()/1.1,0.0,1.0)))

func toggle_shadows() -> void:
	_enabled = not _enabled
	queue_redraw()

func _process(delta: float) -> void:
	_timer += delta
	if _timer >= 0.065:
		_timer = 0.0
		queue_redraw()

func _project(texture: Texture2D, rect: Rect2, foot: float, anchor: Vector2, scale_value: Vector2, flipped: bool, height_factor: float) -> void:
	# O eixo X preserva a largura. O eixo Y deita a silhueta no chão,
	# apontando para o lado oposto ao sol. O pé não se desloca.
	var direction := _offset * height_factor
	var basis_x := Vector2(scale_value.x * (-1.0 if flipped else 1.0),0.0)
	var basis_y := -direction * scale_value.y
	var origin := rect.position.x
	if flipped:
		origin = -rect.end.x
	var local_rect := Rect2(Vector2(origin,-rect.size.y*foot),rect.size)
	draw_set_transform_matrix(Transform2D(basis_x,basis_y,anchor))
	draw_texture_rect(texture,local_rect,false)

func _draw() -> void:
	if not _enabled or _opacity <= 0.002:
		return
	var camera := get_viewport().get_camera_2d()
	var view := Rect2(-10000,-10000,20000,20000)
	if camera != null:
		var extent := get_viewport_rect().size / camera.zoom
		view = Rect2(camera.get_screen_center_position()-extent*0.5,extent).grow(520)
	for data in _casters:
		var sprite: Sprite2D = data["sprite"]
		if not is_instance_valid(sprite) or not sprite.is_visible_in_tree():
			continue
		var point := to_local(sprite.global_position)
		if not view.has_point(point):
			continue
		var rect: Rect2 = data["rect"]
		var foot: float = data["foot"]
		var sprite_scale := sprite.global_scale.abs()
		var anchor := point + Vector2(0.0,(rect.position.y+rect.size.y*foot)*sprite_scale.y)
		_project(data["texture"],rect,foot,anchor,sprite_scale,sprite.flip_h,data["height_factor"])
	if is_instance_valid(_player) and _player.sprite_frames != null:
		var tex := _player.sprite_frames.get_frame_texture(_player.animation,_player.frame)
		if tex != null:
			var size := tex.get_size()
			var rect := Rect2(_player.offset-size*0.5 if _player.centered else _player.offset,size)
			var foot := _foot(tex)
			var sprite_scale := _player.global_scale.abs()
			var anchor := to_local(_player.global_position) + Vector2(0.0,(rect.position.y+size.y*foot)*sprite_scale.y)
			_project(tex,rect,foot,anchor,sprite_scale,_player.flip_h,0.9)
	draw_set_transform_matrix(Transform2D.IDENTITY)
