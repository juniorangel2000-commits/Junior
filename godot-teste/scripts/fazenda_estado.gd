extends RefCounted
const CATALOG := {"turnip":{"name":"Nabo","days":4,"mask":1,"seed":"seeds","harvest":"turnip","yield_count":1,"regrow":0,"seed_return":1},"lettuce":{"name":"Alface","days":4,"mask":1,"seed":"lettuceSeeds","harvest":"lettuce","yield_count":1,"regrow":0,"seed_return":0},"carrot":{"name":"Cenoura","days":6,"mask":1,"seed":"carrotSeeds","harvest":"carrot","yield_count":1,"regrow":0,"seed_return":0},"bean":{"name":"Feijão","days":7,"mask":3,"seed":"beanSeeds","harvest":"bean","yield_count":1,"regrow":4,"seed_return":0},"tomato":{"name":"Tomate","days":7,"mask":2,"seed":"tomatoSeeds","harvest":"tomato","yield_count":1,"regrow":4,"seed_return":0},"corn":{"name":"Milho","days":8,"mask":2,"seed":"cornSeeds","harvest":"corn","yield_count":1,"regrow":4,"seed_return":0},"wheat":{"name":"Trigo","days":6,"mask":6,"seed":"wheatSeeds","harvest":"wheat","yield_count":1,"regrow":0,"seed_return":0},"watermelon":{"name":"Melancia","days":12,"mask":2,"seed":"watermelonSeeds","harvest":"watermelon","yield_count":1,"regrow":0,"seed_return":0},"sweetPotato":{"name":"Batata-doce","days":8,"mask":4,"seed":"sweetPotatoSeeds","harvest":"sweetPotato","yield_count":1,"regrow":0,"seed_return":0},"pumpkin":{"name":"Abóbora","days":10,"mask":4,"seed":"pumpkinSeeds","harvest":"pumpkin","yield_count":1,"regrow":0,"seed_return":0},"oat":{"name":"Aveia","days":6,"mask":12,"seed":"oatSeeds","harvest":"oat","yield_count":1,"regrow":0,"seed_return":0},"chamomile":{"name":"Camomila","days":6,"mask":4,"seed":"chamomileSeeds","harvest":"chamomile","yield_count":1,"regrow":0,"seed_return":0},"kale":{"name":"Couve","days":5,"mask":8,"seed":"kaleSeeds","harvest":"kale","yield_count":1,"regrow":0,"seed_return":0},"cabbage":{"name":"Repolho","days":9,"mask":8,"seed":"cabbageSeeds","harvest":"cabbage","yield_count":1,"regrow":0,"seed_return":0},"strawberry":{"name":"Morango","days":8,"mask":1,"seed":"strawberrySeeds","harvest":"strawberry","yield_count":1,"regrow":4,"seed_return":0},"daisy":{"name":"Margarida","days":5,"mask":1,"seed":"daisySeeds","harvest":"daisy","yield_count":1,"regrow":0,"seed_return":0},"sunflower":{"name":"Girassol","days":8,"mask":6,"seed":"sunflowerSeeds","harvest":"sunflower","yield_count":1,"regrow":0,"seed_return":0},"mint":{"name":"Hortelã","days":5,"mask":3,"seed":"mintSeeds","harvest":"mint","yield_count":1,"regrow":4,"seed_return":0},"cotton":{"name":"Algodão","days":10,"mask":6,"seed":"cottonSeeds","harvest":"cotton","yield_count":1,"regrow":0,"seed_return":0}}
const CAPACITY := 30
const WATER_CAPACITY := 8
var water_charges := 0
var quickbar: Array = ["hand","hoe","seeds","wateringCan","hatchet","pickaxe","","",""]
var stock: Dictionary = {"hoe":1,"wateringCan":1,"seeds":12,"lettuceSeeds":4,"carrotSeeds":4,"beanSeeds":4,"hatchet":1,"pickaxe":1}
var plots: Dictionary = {}
var resource_progress: Dictionary = {}
var buildings: Dictionary = {}
var chest: Dictionary = {}
var fish_records: Dictionary = {}
var machine_jobs: Dictionary = {}
const Kitchen=preload("res://scripts/cozinha_estado.gd")
var nutrition=Kitchen.new()
const Machines=preload("res://scripts/maquinas_estado.gd")
var livestock=preload("res://scripts/criacao_estado.gd").new()
var core: Object

func _init() -> void:
	if ClassDB.class_exists("AfterRainWorld"):
		core=ClassDB.instantiate("AfterRainWorld")
	for y in range(20,25):
		for x in range(21,30):
			plots[Vector2i(x,y)]={}

func transact(cost: Dictionary,gain: Dictionary) -> bool:
	var next := stock.duplicate()
	for side in range(2):
		var items: Dictionary=cost if side==0 else gain
		for key in items:
			if not key is String or not items[key] is int or items[key]<0:
				return false
			var amount:=int(next.get(key,0))+int(items[key])*(-1 if side==0 else 1)
			if amount<0 or amount>999999:
				return false
			next[key]=amount
	var used:=0
	for value in next.values():
		if value>0:
			used+=1
	if used>CAPACITY:
		return false
	stock=next
	return true

func prepare(tile: Vector2i,restore: bool=false) -> String:
	if stock.get("hoe",0)<1:
		return "Precisa de enxada."
	if restore:
		if not plots.has(tile) or not plots[tile].is_empty():
			return "Canteiro indisponível."
		plots.erase(tile)
		return "Solo restaurado."
	if plots.has(tile):
		return "Terra já preparada."
	plots[tile]={}
	return "Canteiro preparado."

func plant(tile: Vector2i,id: String,day: int) -> String:
	if not CATALOG.has(id) or not plots.has(tile):
		return "Prepare a terra primeiro."
	if not plots[tile].is_empty():
		return "Já existe uma planta."
	var def: Dictionary=CATALOG[id]
	if (int(def["mask"]) & (1 << (int((day-1)/28.0)%4)))==0:
		return "Cultivo fora de estação."
	if not transact({def["seed"]:1},{}):
		return "Sem sementes."
	plots[tile]={"id":id,"day":day,"days":0,"watered":is_instance_valid(core) and bool(core.call("rain_for_day",day)),"missed":0}
	return "%s plantado." % def["name"]

func water(tile: Vector2i) -> String:
	if stock.get("wateringCan",0)<1:
		return "Precisa de regador."
	var crop: Dictionary=plots.get(tile,{})
	if crop.is_empty():
		return "Plante primeiro."
	if crop["watered"]:
		return "Já está regado."
	if water_charges<=0:
		return "Regador vazio. Abasteça no poço ou rio."
	water_charges-=1
	crop["watered"]=true
	return "Terra regada."

func harvest(tile: Vector2i) -> String:
	var crop: Dictionary=plots.get(tile,{})
	if crop.is_empty():
		return "Não há planta."
	var def: Dictionary=CATALOG[crop["id"]]
	if crop["days"]<def["days"]:
		return "%s: faltam %d dias regados." % [def["name"],def["days"]-crop["days"]]
	var gain: Dictionary={def["harvest"]:int(def["yield_count"])}
	if def["seed_return"]>0:
		gain[def["seed"]]=int(def["seed_return"])
	if not transact({},gain):
		return "Mochila cheia."
	if def["regrow"]>0:
		crop["days"]=def["days"]-def["regrow"]
		crop["missed"]=0
	else:
		plots[tile]={}
	return "Colheita: %s +%d" % [def["name"],def["yield_count"]]

func advance(day: int) -> void:
	if not is_instance_valid(core):
		return
	for tile in plots:
		var crop: Dictionary=plots[tile]
		if crop.is_empty() or crop["day"]>=day:
			continue
		var def: Dictionary=CATALOG[crop["id"]]
		var result: Dictionary=core.call("settle_crop",crop["day"],day,crop["days"],def["days"],def["mask"],crop["watered"])
		if not result["alive"]:
			plots[tile]={}
			continue
		for key in ["day","days","watered"]:
			crop[key]=result[key]
		crop["missed"]=mini(999,int(crop["missed"])+int(result["missed"]))

func stage(crop: Dictionary) -> int:
	var growth:=float(crop["days"])/float(CATALOG[crop["id"]]["days"])
	return 0 if growth<=0.0 else (4 if growth>=1.0 else (3 if growth>=2.0/3.0 else (2 if growth>=1.0/3.0 else 1)))

func export_state() -> Dictionary:
	return {"stock":stock.duplicate(true),"plots":plots.duplicate(true),"water_charges":water_charges,"quickbar":quickbar.duplicate(),"resource_progress":resource_progress.duplicate(true),"buildings":buildings.duplicate(true),"chest":chest.duplicate(true),"livestock":livestock.export_state(),"fish_records":fish_records.duplicate(true),"machine_jobs":machine_jobs.duplicate(true),"nutrition":nutrition.export_state()}

func import_state(data: Dictionary,today: int) -> bool:
	var s=data.get("stock")
	var p=data.get("plots")
	if not s is Dictionary or not p is Dictionary or p.size()>6912:
		return false
	var allowed:=["hoe","wateringCan","hatchet","pickaxe","wood","stone","branch","log","plank","scrap","fiber","ironShard","fertilizer","oakSeed","pineSeed","herb","mushroom","cord","flakedStone","handle","peg","hammer","blade","handsaw","board","furniture","doorKit","windowKit","hardwood","hay","egg","duckEgg","milk","goatMilk","wool","manure","feather","milkPail","shears","ironIngot","fishingRod","bait","fish","cloth"]
	for item in ["cheesePress","butterChurn","spinningWheel","loom","clayOven","preserveKeg","waxPress","composter","stoneMill","forge","board","ironIngot","peg","spring","gear","ironShard","cord","hardwood","stone","wood","nails","hinge","metalPart","scrap","strawberry","honey","strawberryJam","watermelon","watermelonJam","beeswax","candle","manure","freshGrass","fertilizer","fiber","milk","cheese","goatMilk","goatCheese","butter","wool","yarn","woolCloth","wheat","flour","corn","cornmeal","oat","oatFlakes","egg","homemadeBread","cornBroa","carrot","carrotCake","duckEgg","strawberryPie","apple","applePie","honeyCake","ironOre"]:
		if not item in allowed:
			allowed.append(item)
	allowed.append("campfire")
	for id in Kitchen.DISHES:
		if not id in allowed:
			allowed.append(id)
		for ingredient in Kitchen.DISHES[id]["ingredients"]:
			if not ingredient in allowed:
				allowed.append(ingredient)
	for def in CATALOG.values():
		allowed.append(def["seed"])
		allowed.append(def["harvest"])
	var used:=0
	for key in s:
		if not key in allowed or not s[key] is int or s[key]<0 or s[key]>999999:
			return false
		if s[key]>0:
			used+=1
	if used>CAPACITY:
		return false
	for tile in p:
		if not tile is Vector2i or tile.x<1 or tile.x>94 or tile.y<1 or tile.y>70 or not p[tile] is Dictionary:
			return false
		var crop: Dictionary=p[tile]
		if crop.is_empty():
			continue
		if not CATALOG.has(crop.get("id","")):
			return false
		for field in ["day","days","missed"]:
			if not crop.get(field) is int:
				return false
		if crop["day"]<1 or crop["day"]>today or crop["days"]<0 or crop["days"]>CATALOG[crop["id"]]["days"] or crop["missed"]<0 or crop["missed"]>999 or not crop.get("watered") is bool:
			return false
	var charges: Variant=data.get("water_charges",0)
	var slots: Variant=data.get("quickbar",["hand","hoe","seeds","wateringCan","hatchet","pickaxe","","",""])
	if not charges is int or charges<0 or charges>WATER_CAPACITY or not slots is Array or slots.size()!=9:
		return false
	for item in slots:
		if not item is String or (item!="" and item!="hand" and not item in allowed):
			return false
	var resources: Variant=data.get("resource_progress",{})
	if not resources is Dictionary or resources.size()>2000:
		return false
	for key in resources:
		if not key is String or key.length()>120 or not resources[key] is Dictionary:
			return false
		var record: Dictionary=resources[key]
		if not record.get("stage") is int or record["stage"]<0 or record["stage"]>2 or not record.get("hits") is int or record["hits"]<0 or record["hits"]>5:
			return false
	var pieces: Variant=data.get("buildings",{})
	if not pieces is Dictionary or pieces.size()>2000:
		return false
	var occupied: Dictionary={}
	for tile in pieces:
		if not tile is Vector2i or tile.x<1 or tile.x>94 or tile.y<1 or tile.y>70 or not pieces[tile] is Dictionary:
			return false
		var piece: Dictionary=pieces[tile]
		if (not piece.get("kind","") in ["fence","gate","workbench","constructionBench","bench","campfire"] and not Machines.MACHINES.has(piece.get("kind",""))) or not piece.get("rotation") is int or piece["rotation"]<0 or piece["rotation"]>3 or not piece.get("open") is bool:
			return false
		var cells: Array=[tile]
		if piece["kind"] in ["workbench","constructionBench"] or (Machines.MACHINES.has(piece["kind"]) and Machines.MACHINES[piece["kind"]]["width"]==2):
			cells.append(tile+(Vector2i.RIGHT if piece["rotation"]%2==0 else Vector2i.DOWN))
		for cell in cells:
			if cell.x>94 or cell.y>70 or occupied.has(cell) or p.has(cell):
				return false
			occupied[cell]=true
	var jobs: Variant=data.get("machine_jobs",{})
	if not Machines.valid_jobs(jobs,pieces,today):
		return false
	var box: Variant=data.get("chest",{})
	if not box is Dictionary or box.size()>60:
		return false
	for key in box:
		if not key in allowed or not box[key] is int or box[key]<0 or box[key]>999999:
			return false
	var records: Variant=data.get("fish_records",{})
	if not preload("res://scripts/pesca_estado.gd").valid_records(records,today):
		return false
	var new_nutrition=Kitchen.new()
	if not new_nutrition.import_state(data.get("nutrition",{"vigor":100,"effect":{}})):
		return false
	var animals: Variant=data.get("livestock",{"day":today})
	if not animals is Dictionary or not livestock.import_state(animals,today):
		return false
	nutrition=new_nutrition
	machine_jobs=jobs.duplicate(true)
	fish_records=records.duplicate(true)
	chest=box.duplicate(true)
	buildings=pieces.duplicate(true)
	resource_progress=resources.duplicate(true)
	water_charges=charges
	quickbar=slots.duplicate()
	stock=s.duplicate(true)
	plots=p.duplicate(true)
	advance(today)
	return true

func refill() -> String:
	if stock.get("wateringCan",0)<1:
		return "Precisa de regador."
	water_charges=WATER_CAPACITY
	return "Regador cheio: 8 cargas."

func assign_slot(index: int,item: String) -> bool:
	if index<0 or index>=9 or (item!="" and item!="hand" and stock.get(item,0)<=0):
		return false
	quickbar[index]=item
	return true

func crop_for_seed(item: String) -> String:
	for id in CATALOG:
		if CATALOG[id]["seed"]==item:
			return str(id)
	return ""

func transfer_chest(item: String,to_chest: bool,amount: int) -> bool:
	if amount<1 or amount>999999 or item=="wateringCan":
		return false
	if to_chest:
		var current:=int(chest.get(item,0))
		if current+amount>999999 or (current==0 and chest.size()>=60):
			return false
		if not transact({item:amount},{}):
			return false
		chest[item]=current+amount
		return true
	if chest.get(item,0)<amount or not transact({},{item:amount}):
		return false
	chest[item]-=amount
	if chest[item]==0:
		chest.erase(item)
	return true
