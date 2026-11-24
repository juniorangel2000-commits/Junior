extends SceneTree
func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	if not ClassDB.class_exists("AfterRainMovement"):
		push_error("GDExtension não carregada.")
		quit(1)
		return
	var movement: Object = ClassDB.instantiate("AfterRainMovement")
	if movement == null:
		quit(1)
		return
	var samples := [Vector2.ZERO, Vector2.RIGHT, Vector2.LEFT, Vector2.UP, Vector2.DOWN, Vector2(1, 1), Vector2(-1, 1), Vector2(0.2, -0.8)]
	for sample: Vector2 in samples:
		var actual: Vector2 = movement.call("calculate_velocity", sample, 110.0)
		if not actual.is_equal_approx(sample.normalized() * 110.0):
			push_error("Velocidade divergente: %s" % sample)
			quit(1)
			return
	if movement.call("calculate_velocity", Vector2.RIGHT, -1.0) != Vector2.ZERO:
		push_error("Velocidade negativa não rejeitada.")
		quit(1)
		return
	print("NATIVE_SMOKE_OK")
	quit(0)
