extends RefCounted
const RULES={"coop":{"name":"Galinheiro","w":5,"h":5,"body":3,"cost":{"wood":40,"stone":16,"plank":12,"hardwood":6,"doorKit":1,"windowKit":1},"capacity":6,"trough":12,"kinds":["chicken","duck"]},"barn":{"name":"Curral","w":7,"h":6,"body":4,"cost":{"wood":70,"stone":28,"plank":20,"hardwood":10,"doorKit":1,"windowKit":1},"capacity":4,"trough":8,"kinds":["cow"]},"stable":{"name":"Estábulo","w":7,"h":6,"body":4,"cost":{"wood":80,"stone":28,"plank":24,"hardwood":12,"windowKit":1},"capacity":1,"trough":0,"kinds":["horse"]},"aprisco":{"name":"Aprisco","w":7,"h":6,"body":4,"cost":{"wood":60,"stone":24,"plank":18,"hardwood":8,"doorKit":1,"windowKit":1},"capacity":4,"trough":8,"kinds":["sheep","goat"]},"pigsty":{"name":"Chiqueiro","w":5,"h":5,"body":3,"cost":{"wood":40,"stone":20,"plank":12,"hardwood":6,"doorKit":1},"capacity":4,"trough":8,"kinds":["pig"]},"silo":{"name":"Silo","w":3,"h":3,"body":2,"cost":{"stone":40,"wood":16,"ironShard":8,"fiber":20},"capacity":240,"trough":0,"kinds":[]}}
const KINDS={"chicken":"Galinha","duck":"Pato","cow":"Vaca","goat":"Cabra","sheep":"Ovelha","pig":"Porco","horse":"Cavalo"}
const PIG_FOOD=["turnip","lettuce","carrot","bean","tomato","corn","wheat","watermelon","sweetPotato","pumpkin","oat","kale","cabbage","strawberry"]
var sites: Dictionary={}
var last_day:=1
var silo_hay:=0
var next_id:=1
const QUALITY_GOOD:=10
const QUALITY_EXCELLENT:=25

func product_quality(bond: int) -> int:
	return 2 if bond>=QUALITY_EXCELLENT else (1 if bond>=QUALITY_GOOD else 0)

func _push_quality(queue: Array,bond: int) -> void:
	queue.append(product_quality(bond))

func production_day(day: int,minute: float) -> int:
	return maxi(0,day-(1 if minute<360.0 else 0))

func add_site(tile: Vector2i,kind: String) -> bool:
	if not RULES.has(kind) or sites.has(tile):
		return false
	sites[tile]={"kind":kind,"trough":0,"animals":[],"eggs":0,"duckEggs":0,"manure":0,"duckCollected":0,"egg_quality":[],"duck_quality":[]}
	return true

func admit(tile: Vector2i,kind: String) -> bool:
	if not sites.has(tile) or next_id>=1000000:
		return false
	var site: Dictionary=sites[tile]
	var rule: Dictionary=RULES[site["kind"]]
	if not kind in rule["kinds"] or site["animals"].size()>=rule["capacity"]:
		return false
	var count:=0
	for s in sites.values():
		count+=s["animals"].size()
	if count>=64:
		return false
	site["animals"].append({"id":next_id,"kind":kind,"bond":0,"fed":0,"petted":0,"days":0,"ready":false,"ready_quality":0})
	next_id+=1
	return true

func tick(today: int) -> void:
	if today<=last_day:
		return
	for day in range(maxi(last_day+1,today-6),today+1):
		for site in sites.values():
			var queue: Array=site["animals"].duplicate()
			queue.sort_custom(func(a,b): return a["fed"]<b["fed"])
			for animal in queue:
				var kind: String=animal["kind"]
				if kind=="horse":
					continue
				if site["trough"]<=0:
					animal["bond"]=maxi(0,animal["bond"]-2)
					continue
				site["trough"]-=1
				animal["fed"]=day
				animal["bond"]=mini(30,animal["bond"]+1)
				match kind:
					"chicken":
						if site["eggs"]+site["duckEggs"]<6:
							site["eggs"]+=1
							_push_quality(site["egg_quality"],animal["bond"])
					"duck":
						animal["days"]=mini(2,animal["days"]+1)
						if animal["days"]>=2 and site["eggs"]+site["duckEggs"]<6:
							site["duckEggs"]+=1
							_push_quality(site["duck_quality"],animal["bond"])
							animal["days"]=0
					"cow","goat":
						animal["ready"]=true
						animal["ready_quality"]=product_quality(animal["bond"])
					"sheep":
						if not animal["ready"]:
							animal["days"]+=1
							if animal["days"]>=3:
								animal["ready"]=true
								animal["days"]=0
					"pig":
						site["manure"]=mini(4,site["manure"]+1)
	last_day=today

func fill(tile: Vector2i,inventory) -> String:
	var site: Dictionary=sites[tile]
	var space: int=RULES[site["kind"]]["trough"]-site["trough"]
	if space<=0:
		return "Cocho cheio ou sem cocho."
	var cost: Dictionary={}
	var remaining:=space
	var foods: Array=PIG_FOOD if site["kind"]=="pigsty" else ["hay"]
	for item in foods:
		var take:=mini(remaining,int(inventory.stock.get(item,0)))
		if take>0:
			cost[item]=take
			remaining-=take
		if remaining<=0:
			break
	if remaining==space or not inventory.transact(cost,{}):
		return "Traga palha ou colheitas para os porcos."
	site["trough"]+=space-remaining
	return "Cocho abastecido."

func collect(tile: Vector2i,inventory) -> String:
	var site: Dictionary=sites[tile]
	var gain: Dictionary={}
	var quality_products: Dictionary={}
	for entry in [["eggs","egg"],["duckEggs","duckEgg"],["manure","manure"]]:
		if site[entry[0]]>0:
			gain[entry[1]]=site[entry[0]]
			if entry[0]=="eggs" or entry[0]=="duckEggs":
				var queue: Array=site["egg_quality"] if entry[0]=="eggs" else site["duck_quality"]
				var values: Array=queue.duplicate()
				while values.size()<site[entry[0]]:
					values.append(0)
				quality_products[entry[1]]=values.slice(0,site[entry[0]])
	var feathers:=int((site["duckCollected"]+site["duckEggs"])/4.0)-int(site["duckCollected"]/4.0)
	if feathers>0:
		gain["feather"]=feathers
	var ready: Array=[]
	for animal in site["animals"]:
		if not animal["ready"]:
			continue
		var kind: String=animal["kind"]
		var tool: String="shears" if kind=="sheep" else "milkPail"
		if inventory.stock.get(tool,0)<1:
			continue
		var item: String="wool" if kind=="sheep" else ("goatMilk" if kind=="goat" else "milk")
		gain[item]=int(gain.get(item,0))+1
		if not quality_products.has(item):
			quality_products[item]=[]
		quality_products[item].append(int(animal.get("ready_quality",0)))
		ready.append(animal)
	if gain.is_empty():
		return "Sem produção disponível ou faltam ferramentas."
	if not inventory.transact({},gain):
		return "Mochila cheia."
	site["duckCollected"]+=site["duckEggs"]
	for item in quality_products:
		for q in quality_products[item]:
			inventory.quality_gain(item,int(q),1)
	for key in ["eggs","duckEggs","manure"]:
		site[key]=0
	site["egg_quality"].clear()
	site["duck_quality"].clear()
	for animal in ready:
		animal["ready"]=false
		animal["ready_quality"]=0
	return "Produção recolhida."

func pet(tile: Vector2i) -> String:
	var count:=0
	for animal in sites[tile]["animals"]:
		if animal["petted"]!=last_day:
			animal["petted"]=last_day
			animal["bond"]=mini(30,animal["bond"]+1)
			count+=1
	return "Carinho: %d animais." % count

func export_state() -> Dictionary:
	return {"sites":sites.duplicate(true),"day":last_day,"silo":silo_hay,"next":next_id}

func import_state(data: Dictionary,today: int) -> bool:
	var s: Variant=data.get("sites",{})
	var day: Variant=data.get("day",today)
	var silo: Variant=data.get("silo",0)
	var seq: Variant=data.get("next",1)
	if not s is Dictionary or s.size()>32 or not day is int or day<0 or day>today or not silo is int or silo<0 or silo>240 or not seq is int or seq<1 or seq>1000000:
		return false
	var ids: Dictionary={}
	var cells: Dictionary={}
	for tile in s:
		if not tile is Vector2i or not s[tile] is Dictionary:
			return false
		var site: Dictionary=s[tile]
		if not site.has("egg_quality"):
			site["egg_quality"]=[]
		if not site.has("duck_quality"):
			site["duck_quality"]=[]
		if not RULES.has(site.get("kind","")):
			return false
		var rule: Dictionary=RULES[site["kind"]]
		for y in rule["h"]:
			for x in rule["w"]:
				var cell: Vector2i=tile+Vector2i(x,y)
				if cell.x<1 or cell.x>94 or cell.y<1 or cell.y>70 or cells.has(cell):
					return false
				cells[cell]=true
		for field in ["trough","eggs","duckEggs","manure","duckCollected"]:
			if not site.get(field) is int or site[field]<0 or site[field]>1000000:
				return false
		if site["trough"]>rule["trough"] or site["eggs"]+site["duckEggs"]>6 or site["manure"]>4 or not site.get("animals") is Array or site["animals"].size()>rule["capacity"] or not site["egg_quality"] is Array or not site["duck_quality"] is Array or site["egg_quality"].size()>site["eggs"] or site["duck_quality"].size()>site["duckEggs"]:
			return false
		for q in site["egg_quality"]+site["duck_quality"]:
			if not q is int or q<0 or q>2:
				return false
		for a in site["animals"]:
			if not a is Dictionary or not a.get("kind","") in rule["kinds"] or not a.get("ready") is bool:
				return false
			for field in ["id","bond","fed","petted","days"]:
				if not a.get(field) is int or a[field]<0:
					return false
			if a["id"]<1 or a["id"]>=seq or ids.has(a["id"]) or a["bond"]>30 or a["fed"]>today or a["petted"]>today or a["days"]>3 or int(a.get("ready_quality",0))<0 or int(a.get("ready_quality",0))>2:
				return false
			ids[a["id"]]=true
	if ids.size()>64:
		return false
	sites=s.duplicate(true)
	last_day=day
	silo_hay=silo
	next_id=seq
	return true

func reserved(cell: Vector2i) -> bool:
	for tile in sites:
		var rule: Dictionary=RULES[sites[tile]["kind"]]
		if Rect2i(tile,Vector2i(rule["w"],rule["h"])).has_point(cell):
			return true
	return false
