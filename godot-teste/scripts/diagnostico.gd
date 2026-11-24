extends CanvasLayer
## Painel de diagnóstico opcional, F3. Não modifica a simulação.
var _label: Label
var _tempo := 0.0

func _ready() -> void:
	layer = 100
	_label = Label.new()
	_label.position = Vector2(12, 12)
	_label.add_theme_color_override("font_color", Color.WHITE)
	_label.add_theme_color_override("font_shadow_color", Color.BLACK)
	_label.add_theme_constant_override("shadow_offset_x", 2)
	_label.add_theme_constant_override("shadow_offset_y", 2)
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label.visible = false
	add_child(_label)
	_atualizar()

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
	var backend := "C++ disponível" if ClassDB.class_exists("AfterRainMovement") else "GDScript (alternativa)"
	_label.text = "Native V0.01 | %s\nFPS: %d | Memória estática Godot: %.1f MiB" % [backend, Engine.get_frames_per_second(), float(OS.get_static_memory_usage()) / 1048576.0]
