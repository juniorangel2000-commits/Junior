extends CharacterBody2D
## Personagem andando nas 8 direções com os quadros do jogo (WASD ou setas). Não entra na água.

const DIRECOES := {
	Vector2i(0, 1): "south", Vector2i(0, -1): "north", Vector2i(1, 0): "east", Vector2i(-1, 0): "west",
	Vector2i(1, 1): "south-east", Vector2i(-1, 1): "south-west", Vector2i(1, -1): "north-east", Vector2i(-1, -1): "north-west",
}
@export var velocidade := 110.0
@export var terreno: Node
@onready var corpo: AnimatedSprite2D = $Corpo
var _direcao := "south"
var tool_busy := false
var food_speed: float=1.0
var home_mode:=false
var home_controller: RefCounted
const MundoColisoes = preload("res://scripts/mundo_colisoes.gd")
var _mundo: Node2D
var _movimento_nativo: Object
@onready var camera: Camera2D = $Camera
var usando_cpp: bool:
	get:
		return is_instance_valid(_movimento_nativo)

func _ready() -> void:
	add_to_group("native_player")
	motion_mode = CharacterBody2D.MOTION_MODE_FLOATING
	collision_mask = 2
	camera.position_smoothing_enabled = true
	camera.position_smoothing_speed = 10.0
	call_deferred("_preparar_mundo")
	if ClassDB.class_exists("AfterRainMovement") and ClassDB.can_instantiate("AfterRainMovement"):
		_movimento_nativo = ClassDB.instantiate("AfterRainMovement")
	corpo.sprite_frames = _quadros()
	corpo.play("parada-south")
	for par in [["ui_left", KEY_A], ["ui_right", KEY_D], ["ui_up", KEY_W], ["ui_down", KEY_S]]:
		var ev := InputEventKey.new(); ev.physical_keycode = par[1]; InputMap.action_add_event(par[0], ev)

func _quadros() -> SpriteFrames:
	var sf := SpriteFrames.new()
	sf.remove_animation("default")
	for d in DIRECOES.values():
		sf.add_animation("parada-" + d)
		sf.add_frame("parada-" + d, load("res://arte/personagem/parada/%s.png" % d))
		sf.add_animation("andar-" + d)
		sf.set_animation_speed("andar-" + d, 9.0)
		for i in 6:
			sf.add_frame("andar-" + d, load("res://arte/personagem/andar/%s/frame_%03d.png" % [d, i]))
	return sf

func _preparar_mundo() -> void:
	var root := get_parent().get_parent() as Node2D
	_mundo = MundoColisoes.new()
	_mundo.name = "ColisoesNativas"
	_mundo.z_index = 8
	root.add_child(_mundo)
	_mundo.build(root)

func _physics_process(delta: float) -> void:
	if not is_instance_valid(_mundo):
		return
	if tool_busy:
		velocity=Vector2.ZERO
		corpo.play("parada-" + _direcao)
		return
	var entrada := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	if entrada.length() > 0.1:
		var d := Vector2i(signi(roundi(entrada.x)), signi(roundi(entrada.y)))
		if DIRECOES.has(d):
			_direcao = DIRECOES[d]
		var antes := position
		velocity = _calcular_velocidade(entrada)
		var passo := velocity * delta
		_mover_eixo(Vector2(passo.x, 0))
		_mover_eixo(Vector2(0, passo.y))
		if position.distance_to(antes) > 0.01:
			corpo.play("andar-" + _direcao)
		else:
			corpo.play("parada-" + _direcao)
	else:
		velocity = Vector2.ZERO
		corpo.play("parada-" + _direcao)

func _mover_eixo(passo: Vector2) -> void:
	if passo.is_zero_approx():
		return
	if home_mode:
		if home_controller!=null and home_controller.call("move_allowed",global_position+passo):
			global_position+=passo
		return
	var antes := position
	move_and_collide(passo)
	if not _mundo.terreno_livre(position, terreno):
		position = antes

func _input(event: InputEvent) -> void:
	if not (event is InputEventKey and event.pressed and not event.echo):
		return
	match event.keycode:
		KEY_EQUAL, KEY_PLUS, KEY_KP_ADD:
			camera.zoom = Vector2.ONE * minf(camera.zoom.x + 0.25, 3.0)
		KEY_MINUS, KEY_KP_SUBTRACT:
			camera.zoom = Vector2.ONE * maxf(camera.zoom.x - 0.25, 1.5)
		KEY_F4:
			if is_instance_valid(_mundo):
				_mundo.alternar_debug()

func mundo_colisoes() -> Node2D:
	return _mundo

func _calcular_velocidade(entrada: Vector2) -> Vector2:
	if usando_cpp:
		return _movimento_nativo.call("calculate_velocity", entrada, velocidade*food_speed)
	return entrada.normalized() * velocidade*food_speed

func facing_vector() -> Vector2:
	for dir in DIRECOES:
		if DIRECOES[dir]==_direcao:
			return Vector2(dir).normalized()
	return Vector2.DOWN
