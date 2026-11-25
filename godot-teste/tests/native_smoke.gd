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
	if not ClassDB.class_exists("AfterRainWorld"):
		push_error("Missing native world")
		quit(1)
		return
	var world: Object = ClassDB.instantiate("AfterRainWorld")
	var state: Dictionary = world.call("snapshot")
	if state["day"] != 1 or state["minute"] != 480.0 or state["rain"]:
		push_error("Wrong initial calendar")
		quit(1)
		return
	var expected_weather := {1:false,2:false,3:true,28:false,29:true,56:false,57:false,84:false,85:false,112:false,113:true,999999:false}
	for day in expected_weather:
		if world.call("rain_for_day",day) != expected_weather[day]:
			push_error("Weather mismatch: %s" % day)
			quit(1)
			return
	world.call("set_clock",28,1439.5)
	if world.call("advance",1.0) != 1:
		push_error("Midnight rollover failed")
		quit(1)
		return
	state = world.call("snapshot")
	if state["day"] != 29 or state["season"] != 1 or state["day_of_season"] != 1 or not is_equal_approx(state["minute"],0.5):
		push_error("Season rollover failed")
		quit(1)
		return
	world.call("set_clock",112,1439.0)
	world.call("advance",1.0)
	state = world.call("snapshot")
	if state["year"] != 2 or state["season"] != 0 or state["day_of_season"] != 1:
		push_error("Year rollover failed")
		quit(1)
		return
	world.call("set_clock",1,720.0)
	state = world.call("snapshot")
	var noon: Color = state["ambient"]
	if noon.r < 0.99 or state["shadow_opacity"] <= 0:
		push_error("Noon lighting wrong")
		quit(1)
		return
	world.call("set_clock",1,0.0)
	state = world.call("snapshot")
	var midnight: Color = state["ambient"]
	if midnight.r > 0.3 or state["shadow_opacity"] != 0.0:
		push_error("Night lighting wrong")
		quit(1)
		return
	world.call("set_clock",999999,1439.0)
	world.call("advance",1.0e12)
	state = world.call("snapshot")
	if state["day"] != 999999 or state["minute"] >= 1440.0:
		push_error("Calendar limit failed")
		quit(1)
		return
	# Verifica direção, comprimento e opacidade da nova projeção.
	world.call("set_clock",1,390.0)
	var morning: Dictionary = world.call("snapshot")
	world.call("set_clock",1,750.0)
	var midday: Dictionary = world.call("snapshot")
	world.call("set_clock",1,1110.0)
	var sunset: Dictionary = world.call("snapshot")
	var morning_dir: Vector2 = morning["shadow_offset"]
	var midday_dir: Vector2 = midday["shadow_offset"]
	var sunset_dir: Vector2 = sunset["shadow_offset"]
	if morning_dir.x <= 0.0 or sunset_dir.x >= 0.0 or morning_dir.length() <= midday_dir.length() or sunset_dir.length() <= midday_dir.length():
		push_error("Solar projection direction or length wrong")
		quit(1)
		return
	var sunset_color: Color = sunset["ambient"]
	if sunset_color.r <= sunset_color.b:
		push_error("Sunset grading missing")
		quit(1)
		return
	world.call("set_clock",1,1170.0)
	var twilight: Dictionary = world.call("snapshot")
	var twilight_color: Color = twilight["ambient"]
	if twilight_color.b <= twilight_color.r or twilight["shadow_opacity"] != 0.0:
		push_error("Twilight grading wrong")
		quit(1)
		return
	world.call("set_clock",3,750.0)
	var rain_state: Dictionary = world.call("snapshot")
	if rain_state["shadow_opacity"] >= midday["shadow_opacity"]:
		push_error("Rain shadows not diffuse")
		quit(1)
		return
	print("NATIVE_LIGHT_SMOKE_OK")
	print("NATIVE_WORLD_SMOKE_OK")
	print("NATIVE_SMOKE_OK")
	quit(0)
