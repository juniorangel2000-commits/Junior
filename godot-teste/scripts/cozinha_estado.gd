extends RefCounted
const DISHES={"kaleOmelette":{"name":"Omelete de couve","ingredients":{"egg":2,"kale":1},"vigor":40,"price":90,"station":"stove","source":"helena"},"gardenSalad":{"name":"Salada da horta","ingredients":{"lettuce":1,"tomato":1,"carrot":1},"vigor":35,"price":110,"station":"stove","source":"helena"},"homemadeBread":{"name":"Pão caseiro","ingredients":{"flour":2,"egg":1,"milk":1},"vigor":45,"price":195,"station":"oven","source":"helena"},"heartyBreakfast":{"name":"Café da manhã reforçado","ingredients":{"homemadeBread":1,"egg":1,"milk":1},"vigor":50,"price":335,"station":"stove","source":"helena"},"cornBroa":{"name":"Broa de milho","ingredients":{"cornmeal":2,"egg":1,"butter":1},"vigor":50,"price":300,"station":"oven","source":"helena"},"pamonha":{"name":"Pamonha","ingredients":{"corn":2,"milk":1,"butter":1},"vigor":55,"price":245,"station":"stove","source":"helena"},"pumpkinSoup":{"name":"Sopa de abóbora","ingredients":{"pumpkin":1,"sweetPotato":1,"butter":1},"vigor":60,"price":285,"station":"stove","source":"helena"},"carrotCake":{"name":"Bolo de cenoura","ingredients":{"flour":2,"egg":2,"carrot":1,"milk":1},"vigor":60,"price":265,"station":"oven","source":"helena"},"beanTropeiro":{"name":"Feijão tropeiro","ingredients":{"bean":2,"kale":1,"egg":1,"cornmeal":1},"vigor":70,"price":190,"station":"stove","source":"helena"},"watermelonJuice":{"name":"Suco de melancia","ingredients":{"watermelon":1,"mint":1},"vigor":30,"price":155,"station":"stove","source":"helena"},"oatPorridge":{"name":"Mingau de aveia","ingredients":{"oatFlakes":1,"milk":1,"honey":1},"vigor":50,"price":155,"station":"stove","source":"helena"},"chamomileTea":{"name":"Chá de camomila com mel","ingredients":{"chamomile":1,"honey":1},"vigor":35,"price":95,"station":"stove","source":"helena"},"dulceDeLeche":{"name":"Doce de leite","ingredients":{"milk":3,"honey":1},"vigor":45,"price":180,"station":"stove","source":"helena"},"strawberryPie":{"name":"Torta de morango","ingredients":{"flour":2,"strawberry":2,"butter":1,"duckEgg":1},"vigor":70,"price":380,"station":"oven","source":"helena"},"cheeseHoneyBread":{"name":"Pão com queijo e mel","ingredients":{"homemadeBread":1,"cheese":1,"honey":1},"vigor":80,"price":415,"station":"stove","source":"helena"},"orangeJuice":{"name":"Suco de laranja","ingredients":{"orange":2},"vigor":30,"price":70,"station":"stove","source":"helena"},"pearJam":{"name":"Doce de pera","ingredients":{"pear":2,"honey":1},"vigor":40,"price":130,"station":"stove","source":"helena"},"applePie":{"name":"Torta de maçã","ingredients":{"flour":2,"apple":3,"butter":1,"egg":1},"vigor":70,"price":335,"station":"oven","source":"helena"},"crabStew":{"name":"Caranguejada","ingredients":{"crab":2,"tomato":1,"sweetPotato":1},"vigor":65,"price":180,"station":"stove","source":"helena"},"roastedFish":{"name":"Peixe assado","ingredients":{"fish":1},"vigor":30,"price":30,"station":"campfire","source":"campfire"},"roastedCorn":{"name":"Milho assado","ingredients":{"corn":1},"vigor":20,"price":40,"station":"campfire","source":"campfire"},"roastedSweetPotato":{"name":"Batata-doce assada","ingredients":{"sweetPotato":1},"vigor":25,"price":60,"station":"campfire","source":"campfire"},"minerBroth":{"name":"Caldo do mineiro","ingredients":{"sweetPotato":1,"kale":1,"egg":1},"vigor":65,"price":120,"station":"stove","source":"mine"},"fishStew":{"name":"Ensopado de peixe","ingredients":{"fish":1,"tomato":1,"sweetPotato":1},"vigor":70,"price":110,"station":"stove","source":"survivors"},"honeyCake":{"name":"Bolo de mel","ingredients":{"flour":2,"honey":1,"egg":1,"milk":1},"vigor":75,"price":250,"station":"oven","source":"oldMap"}}
const EFFECTS={"heartyBreakfast":{"name":"Energia do café","minutes":480},"roastedFish":{"name":"Mão firme","minutes":360},"beanTropeiro":{"name":"Firme na Mina","minutes":360},"watermelonJuice":{"name":"Passo leve","minutes":240}}
var vigor: int=100
var effect: Dictionary={}
static func absolute(clock: Dictionary) -> float:
	return float(int(clock["day"])-1)*1440.0+float(clock["minute"])
static func cost(id: String) -> Dictionary:
	var ingredients: Dictionary=DISHES[id]["ingredients"].duplicate()
	ingredients["wood"]=int(ingredients.get("wood",0))+1
	return ingredients
## Qualidade que o prato terá (V51: média das melhores unidades; lenha é só combustível).
static func recipe_quality(inventory,id: String) -> int:
	if not DISHES.has(id):
		return 0
	var qs: Array=[]
	for item in DISHES[id]["ingredients"]:
		if inventory.passes_quality(str(item)):
			qs.append_array(inventory.peek_best(str(item),int(DISHES[id]["ingredients"][item])))
	return inventory.average_quality(qs)

## Vigor do prato com o fator de qualidade da V51 (dishVigor).
static func dish_vigor(id: String,quality: int) -> int:
	return int(round(float(DISHES[id]["vigor"])*[1.0,1.25,1.5][clampi(quality,0,2)]))

static func cook(inventory,id: String,station: String) -> String:
	if not DISHES.has(id) or DISHES[id]["station"]!=station or station=="oven":
		return "Receita incompatível com esta estação."
	var quality: int=inventory.transact_quality(cost(id),{id:1})
	if quality<0:
		return "Faltam ingredientes ou espaço na mochila."
	if quality>0:
		inventory.quality_gain(str(id),quality,1)
	return str(DISHES[id]["name"])+" pronto!"
func active(now: float) -> String:
	if effect.is_empty():
		return ""
	if now>=float(effect["until"]):
		effect.clear()
		return ""
	return str(effect["id"])
func extra(now: float) -> int:
	return int(effect.get("extra",0)) if active(now)=="heartyBreakfast" else 0
func spend(amount: int,now: float) -> void:
	var remaining: int=maxi(amount,0)
	var from_extra: int=mini(remaining,extra(now))
	if from_extra>0:
		effect["extra"]-=from_extra
	vigor=maxi(0,vigor-(remaining-from_extra))
func eat(inventory,id: String,now: float) -> String:
	if not DISHES.has(id) or int(inventory.stock.get(id,0))<1:
		return "Alimento indisponível."
	# Come a melhor unidade (V51 takeBest) e o vigor recebe o fator da qualidade.
	var backup: Dictionary=inventory.item_quality.duplicate(true)
	var taken: Array=inventory.take_best(id,1)
	if not inventory.transact({id:1},{}):
		inventory.item_quality=backup
		return "Alimento indisponível."
	var quality: int=int(taken[0]) if not taken.is_empty() else 0
	var gained:=dish_vigor(id,quality)
	vigor=mini(100,vigor+gained)
	var name: String=str(DISHES[id]["name"])
	if quality>0:
		name+=" (%s)" % ["comum","bom","excelente"][quality]
	var msg: String="%s: +%d de vigor." % [name,gained]
	if EFFECTS.has(id):
		effect={"id":id,"until":minf(999999.0*1440.0,now+float(EFFECTS[id]["minutes"]))}
		if id=="heartyBreakfast":
			effect["extra"]=30
		msg+=" "+str(EFFECTS[id]["name"])+"."
	return msg
func speed(now: float) -> float:
	var bonus: float=1.15 if active(now)=="watermelonJuice" else 1.0
	return bonus*(0.7 if vigor<=0 and extra(now)<=0 else 1.0)
func fishing_bonus(now: float) -> float:
	return 0.07 if active(now)=="roastedFish" else 0.0
func restore() -> void:
	vigor=100
func export_state() -> Dictionary:
	return {"vigor":vigor,"effect":effect.duplicate(true)}
func import_state(data: Variant) -> bool:
	if not data is Dictionary or not data.get("vigor") is int or data["vigor"]<0 or data["vigor"]>100 or not data.get("effect") is Dictionary:
		return false
	var e: Dictionary=data["effect"]
	if not e.is_empty():
		if not EFFECTS.has(e.get("id","")) or not e.get("until") is float or not is_finite(e["until"]) or e["until"]<0.0 or e["until"]>999999.0*1440.0:
			return false
		if e.has("extra") and (e["id"]!="heartyBreakfast" or not e["extra"] is int or e["extra"]<0 or e["extra"]>30):
			return false
	vigor=data["vigor"]
	effect=e.duplicate(true)
	return true
