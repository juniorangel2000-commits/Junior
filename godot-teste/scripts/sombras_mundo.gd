extends Node2D
## Sombras aproximadas de contato/projeção. Não são ainda silhuetas completas.
var _casters: Array[Vector4] = []
var _offset := Vector2.ZERO
var _opacity := 0.0

func build(scene: Node2D) -> void:
	for name in ["Objetos","Decoracao do chao","Acima"]:
		var layer := scene.get_node_or_null(name)
		if layer == null:
			continue
		for node in layer.get_children():
			if not node is Sprite2D:
				continue
			var sprite := node as Sprite2D
			if sprite.texture == null:
				continue
			var art := sprite.texture.resource_path.get_file()
			var size := sprite.texture.get_size() * sprite.scale.abs()
			var point := to_local(sprite.global_position)
			var tall := art.begins_with("asset-tree-") or art.begins_with("asset-pine-")
			var solid := art.begins_with("lake-rock-") or art.begins_with("detailed-ore-") or art == "asset-house.png" or art == "property-well-idle.png" or art.begins_with("pet-shelter-")
			if tall or solid:
				_casters.append(Vector4(point.x,point.y,size.x * (0.22 if tall else 0.65),size.y * (0.70 if tall else 0.40)))
	queue_redraw()

func update_sun(offset: Vector2, opacity: float) -> void:
	_offset = offset
	_opacity = opacity
	queue_redraw()

func _draw() -> void:
	if _opacity <= 0.001:
		return
	var camera := get_viewport().get_camera_2d()
	var view := Rect2(-10000,-10000,20000,20000)
	if camera != null:
		var extent := get_viewport_rect().size / camera.zoom
		view = Rect2(camera.get_screen_center_position()-extent*0.5,extent).grow(350)
	for item in _casters:
		var p := Vector2(item.x,item.y)
		if not view.has_point(p):
			continue
		var tip := p + _offset * item.w
		var axis := tip-p
		var length := maxf(axis.length(),5.0)
		draw_set_transform((p+tip)*0.5,axis.angle(),Vector2(length*0.5+5.0,maxf(item.z*0.28,4.0)))
		draw_circle(Vector2.ZERO,1.0,Color(0.045,0.08,0.065,_opacity*0.46),true,-1.0,true)
	draw_set_transform(Vector2.ZERO)
