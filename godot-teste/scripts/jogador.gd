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
var _movimento_nativo: Object
var usando_cpp: bool:
	get:
		return is_instance_valid(_movimento_nativo)

func _ready() -> void:
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

func _physics_process(_delta: float) -> void:
	var entrada := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	if entrada.length() > 0.1:
		_direcao = DIRECOES[Vector2i(signi(roundi(entrada.x)), signi(roundi(entrada.y)))] if Vector2i(signi(roundi(entrada.x)), signi(roundi(entrada.y))) != Vector2i.ZERO else _direcao
		var antes := position
		velocity = _calcular_velocidade(entrada)
		move_and_slide()
		if terreno and terreno.material_em(position) == "water":
			position = antes
		corpo.play("andar-" + _direcao)
	else:
		velocity = Vector2.ZERO
		corpo.play("parada-" + _direcao)

func _calcular_velocidade(entrada: Vector2) -> Vector2:
	if usando_cpp:
		return _movimento_nativo.call("calculate_velocity", entrada, velocidade)
	return entrada.normalized() * velocidade
