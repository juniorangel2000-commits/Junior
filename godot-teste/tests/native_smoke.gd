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
	var farm=load("res://scripts/fazenda_estado.gd").new()
	var tile:=Vector2i(22,21)
	if farm.plant(tile,"turnip",1)!="Nabo plantado.":
		push_error("Plant failed")
		quit(1)
		return
	farm.refill()
	for day in range(1,5):
		farm.water(tile)
		farm.advance(day+1)
	if farm.stage(farm.plots[tile])!=4 or farm.harvest(tile)!="Colheita: Nabo +1":
		push_error("Harvest failed")
		quit(1)
		return
	var restored=load("res://scripts/fazenda_estado.gd").new()
	if not restored.import_state(farm.export_state(),5) or restored.stock!=farm.stock:
		push_error("Farm state roundtrip failed")
		quit(1)
		return
	var wet: Dictionary=world.call("settle_crop",3,4,0,4,1,false)
	var wilt: Dictionary=world.call("settle_crop",28,29,0,4,1,true)
	if wet["days"]!=1 or wilt["alive"]:
		push_error("Farm climate failed")
		quit(1)
		return
	var test_farm=load("res://scripts/fazenda_estado.gd").new()
	var other:=Vector2i(23,21)
	test_farm.plant(other,"turnip",1)
	if test_farm.water(other)=="Terra regada." or test_farm.water_charges!=0:
		push_error("Empty watering can failed")
		quit(1)
		return
	test_farm.refill()
	test_farm.water(other)
	test_farm.water(other)
	if test_farm.water_charges!=7 or not test_farm.assign_slot(8,"seeds") or test_farm.assign_slot(9,"seeds"):
		push_error("Water or quickbar invariant failed")
		quit(1)
		return
	var clone=load("res://scripts/fazenda_estado.gd").new()
	if not clone.import_state(test_farm.export_state(),1) or clone.water_charges!=7 or clone.quickbar[8]!="seeds":
		push_error("Inventory persistence failed")
		quit(1)
		return
	var res=load("res://scripts/recursos_mundo.gd").new()
	res.farm=test_farm
	var fake:=Sprite2D.new()
	res.entries["tree-test"]={"kind":"tree","sprite":fake,"position":Vector2.ZERO,"shape_id":0}
	if world.call("resource_hit",3,4)!=4 or world.call("resource_hit",4,4)!=-1 or res.hit("tree-test","hand")!="Use a machadinha.":
		push_error("Resource tool rule failed")
		fake.free()
		quit(1)
		return
	for i in 4:
		res.hit("tree-test","hatchet")
	if test_farm.stock.get("log",0)!=2 or test_farm.resource_progress["tree-test"]["stage"]!=1:
		push_error("Resource depletion failed")
		fake.free()
		quit(1)
		return
	fake.free()
	var crafting=load("res://scripts/construcao.gd")
	if not test_farm.transact({},{"fiber":3,"stone":2,"branch":1}) or crafting.craft_state(test_farm,"cord",true)!="Corda vegetal: fabricação concluída.":
		push_error("Crafting transaction failed")
		quit(1)
		return
	if test_farm.stock.get("cord",0)!=1 or test_farm.stock.get("fiber",0)!=0 or crafting.craft_state(test_farm,"blade",false)!="Aproxime-se da bancada correta.":
		push_error("Crafting invariant failed")
		quit(1)
		return
	var cell:=Vector2i(5,5)
	if crafting.footprint(cell,"workbench",1)!=[cell,cell+Vector2i.DOWN]:
		push_error("Building footprint failed")
		quit(1)
		return
	test_farm.buildings[cell]={"kind":"fence","rotation":0,"open":false}
	if not clone.import_state(test_farm.export_state(),1) or not clone.buildings.has(cell):
		push_error("Building persistence failed")
		quit(1)
		return
	var house=load("res://scripts/casa.gd")
	if not house.walkable(Vector2(176,272)) or house.walkable(Vector2(96,96)) or house.sleep_plan(1,720.0)["ok"] or house.sleep_plan(1,1140.0)["day"]!=2 or house.sleep_plan(2,120.0)["day"]!=2:
		push_error("Home geometry or sleep rule failed")
		quit(1)
		return
	if not test_farm.transfer_chest("seeds",true,2) or test_farm.chest.get("seeds",0)!=2 or not test_farm.transfer_chest("seeds",false,1) or test_farm.chest.get("seeds",0)!=1:
		push_error("Chest transfer failed")
		quit(1)
		return
	if not clone.import_state(test_farm.export_state(),1) or clone.chest.get("seeds",0)!=1:
		push_error("Chest save failed")
		quit(1)
		return
	print("NATIVE_HOME_SMOKE_OK")
	print("NATIVE_BUILD_SMOKE_OK")
	print("NATIVE_RESOURCE_SMOKE_OK")
	print("NATIVE_INVENTORY_SMOKE_OK")
	print("NATIVE_FARM_SMOKE_OK")
	print("NATIVE_LIGHT_SMOKE_OK")
	print("NATIVE_WORLD_SMOKE_OK")
	print("NATIVE_SMOKE_OK")
	quit(0)
