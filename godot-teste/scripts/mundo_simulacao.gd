extends Node
## Núcleo C++: relógio/calendário/clima. Sem DLL, mantém uma prévia estática às 08:00.
signal novo_dia(dia: int, chuva: bool)
var _core: Object
var _state: Dictionary = {}
var _elapsed := 0.0
var _last_day := 1
var _scene: Node2D
var _shadow: Node2D
var _light: ShaderMaterial
var _rain: Control
var _label: Label
const PREVIEW_TIMES := [315,375,480,720,900,1050,1110,1170,1320]
var _preview_index := -1
var _inside := false
var fishing_paused:=false
const SEASONS := ["Primavera", "Verão", "Outono", "Inverno"]
const SHADOWS = preload("res://scripts/sombras_mundo.gd")
const LIGHT = preload("res://shaders/luz_mundo.gdshader")

class RainOverlay extends Control:
	var raining := false
	var elapsed := 0.0
	func _process(delta: float) -> void:
		if raining:
			elapsed = fmod(elapsed + delta, 1000.0)
			queue_redraw()
	func _draw() -> void:
		if not raining or size.x <= 0.0 or size.y <= 0.0:
			return
		for i in 125:
			var x := fposmod(float(i * 137) - elapsed * 95.0, size.x + 48.0) - 24.0
			var y := fposmod(float(i * 211) + elapsed * (480.0 + float(i % 7) * 20.0), size.y + 30.0) - 15.0
			draw_line(Vector2(x,y), Vector2(x-5,y+16), Color(0.69,0.83,1.0,0.30), 1.0)

func _ready() -> void:
	if ClassDB.class_exists("AfterRainWorld") and ClassDB.can_instantiate("AfterRainWorld"):
		_core = ClassDB.instantiate("AfterRainWorld")
	_make_overlays()
	_refresh()

func using_cpp() -> bool:
	return is_instance_valid(_core)

func snapshot() -> Dictionary:
	return _state.duplicate()

func _make_overlays() -> void:
	var effects := CanvasLayer.new()
	effects.layer = 10
	add_child(effects)
	var tint := ColorRect.new()
	tint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_light = ShaderMaterial.new()
	_light.shader = LIGHT
	tint.material = _light
	effects.add_child(tint)
	tint.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_rain = RainOverlay.new()
	_rain.mouse_filter = Control.MOUSE_FILTER_IGNORE
	effects.add_child(_rain)
	_rain.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var hud := CanvasLayer.new()
	hud.layer = 11
	add_child(hud)
	var panel := PanelContainer.new()
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(panel)
	panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	panel.offset_left = -350
	panel.offset_right = -12
	panel.offset_top = 12
	panel.offset_bottom = 76
	var box_style := StyleBoxFlat.new()
	box_style.bg_color = Color(0.07,0.09,0.12,0.77)
	box_style.set_corner_radius_all(6)
	box_style.content_margin_left = 12
	box_style.content_margin_right = 12
	box_style.content_margin_top = 7
	box_style.content_margin_bottom = 7
	panel.add_theme_stylebox_override("panel",box_style)
	_label = Label.new()
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	panel.add_child(_label)

func _process(delta: float) -> void:
	if not is_instance_valid(_scene):
		var scene := get_tree().current_scene as Node2D
		if scene != null and scene.has_node("Objetos"):
			_scene = scene
			_shadow = SHADOWS.new()
			_shadow.z_index = -4
			_scene.add_child(_shadow)
			_shadow.call("build",_scene)
			_refresh()
	if using_cpp() and not fishing_paused:
		_core.call("advance",delta)
	_elapsed += delta
	if _elapsed >= 0.20:
		_elapsed = 0.0
		_refresh()

func _refresh() -> void:
	_state = _core.call("snapshot") if using_cpp() else {"day":1,"minute":480.0,"year":1,"season":0,"day_of_season":1,"rain":false,"ambient":Color.WHITE,"saturation":1.0,"contrast":1.0,"shadow_offset":Vector2.ZERO,"shadow_opacity":0.0}
	var minute := int(_state["minute"])
	var day := int(_state["day"])
	var raining: bool = _state["rain"]
	_light.set_shader_parameter("ambient",Color(1.0,0.94,0.84) if _inside else _state["ambient"])
	_light.set_shader_parameter("saturation",1.0 if _inside else _state["saturation"])
	_light.set_shader_parameter("contrast",1.0 if _inside else _state["contrast"])
	_light.set_shader_parameter("vignette",0.08 if _inside else _state.get("vignette",0.0))
	_rain.set("raining",raining and not _inside)
	_rain.queue_redraw()
	if is_instance_valid(_shadow):
		_shadow.call("update_sun",_state["shadow_offset"],_state["shadow_opacity"])
	var phase := _phase(minute)
	_label.text = "%s %d · Ano %d\n%02d:%02d · %s · %s" % [SEASONS[int(_state["season"])],int(_state["day_of_season"]),int(_state["year"]),int(minute / 60.0),minute % 60,phase,"Chuva" if raining else "Tempo aberto"]
	if day != _last_day:
		_last_day = day
		novo_dia.emit(day,raining)

func _input(event: InputEvent) -> void:
	if fishing_paused or not using_cpp() or not (event is InputEventKey and event.pressed and not event.echo):
		return
	if event.keycode == KEY_F6:
		_core.call("advance",60.0)
		_refresh()
	elif event.keycode == KEY_F7:
		var current: Dictionary = _core.call("snapshot")
		var next := mini(int(current["day"])+1,999999)
		if next > int(current["day"]):
			_core.call("set_clock",next,480.0)
		_refresh()

	elif event.keycode == KEY_F8:
		_preview_index = (_preview_index+1)%PREVIEW_TIMES.size()
		var current: Dictionary = _core.call("snapshot")
		_core.call("set_clock",int(current["day"]),float(PREVIEW_TIMES[_preview_index]))
		_refresh()
	elif event.keycode == KEY_F9 and is_instance_valid(_shadow):
		_shadow.call("toggle_shadows")

func shadow_caster_count() -> int:
	return int(_shadow.call("caster_count")) if is_instance_valid(_shadow) else 0

func _phase(minute: int) -> String:
	if minute < 300:
		return "Madrugada"
	if minute < 360:
		return "Aurora"
	if minute < 420:
		return "Nascer do sol"
	if minute < 720:
		return "Manhã"
	if minute < 990:
		return "Tarde"
	if minute < 1080:
		return "Hora dourada"
	if minute < 1140:
		return "Pôr do sol"
	if minute < 1200:
		return "Crepúsculo"
	return "Noite"

func restore_clock(day: int,minute: float) -> void:
	if using_cpp():
		_core.call("set_clock",day,minute)
		_last_day=day
		_refresh()

func register_shadow(sprite: Sprite2D) -> void:
	if is_instance_valid(_shadow):
		_shadow.call("register_sprite",sprite)

func set_inside(value: bool) -> void:
	_inside=value
	_refresh()

func sleep_until_morning() -> String:
	if not using_cpp():
		return "Relógio indisponível."
	var d: Dictionary=_core.call("snapshot")
	var plan: Dictionary=load("res://scripts/casa.gd").sleep_plan(int(d["day"]),float(d["minute"]))
	if not plan["ok"]:
		return plan["message"]
	_core.call("set_clock",plan["day"],plan["minute"])
	_refresh()
	return "Você acordou às 08:00 do dia %d." % plan["day"]
