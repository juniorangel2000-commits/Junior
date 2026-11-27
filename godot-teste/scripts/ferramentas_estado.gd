extends RefCounted
## Níveis e desgaste das ferramentas (V51: src/data/economy-balance.ts e src/systems/economy.ts).
## Nível 0 pedra, 1 ferro, 2 ouro, 3 metal negro. Cada golpe gasta 1 de durabilidade; com zero,
## a ferramenta não trabalha até ser reparada. A eficiência dá o dano por golpe, guardando a
## fração para o golpe seguinte (ferro 1,5 = golpes de 1 e 2 alternados).
## Na V51 a melhoria é feita pelo Bento (lingotes + mão de obra em coroas); aqui, sem a vila e
## sem dinheiro, ela é feita na bancada de trabalho só com os lingotes (provisório).
const TOOLS:=["hatchet","pickaxe","hoe"]
const NAMES:={"hatchet":"Machadinha","pickaxe":"Picareta","hoe":"Enxada"}
const TIER_NAMES:=["de pedra","de ferro","de ouro","de metal negro"]
const EFFICIENCY:=[1.0,1.5,2.2,3.2]
const DURABILITY:=[100,250,450,800]
const INGOT_ITEM:=["","ironIngot","goldIngot","blackMetalIngot"]
const INGOTS:={"hatchet":[0,4,5,9],"pickaxe":[0,4,5,9],"hoe":[0,3,4,9]}
## Reparo provisório: pedra com pedra lascada e corda; metais com 1 lingote do metal.
const REPAIR_STONE:={"flakedStone":1,"cord":1}

## Estado de uma ferramenta; saves antigos (sem registro) contam como pedra nova.
static func state(farm,tool: String) -> Dictionary:
	if not farm.tools.has(tool):
		farm.tools[tool]={"tier":0,"durability":DURABILITY[0],"work":0.0}
	return farm.tools[tool]

static func label(farm,tool: String) -> String:
	var s: Dictionary=state(farm,tool)
	return "%s %s · %d/%d" % [NAMES[tool],TIER_NAMES[int(s["tier"])],int(s["durability"]),DURABILITY[int(s["tier"])]]

## Gasta um uso. Devolve o dano do golpe (0 = gasta, não trabalhou).
static func use(farm,tool: String) -> int:
	var s: Dictionary=state(farm,tool)
	if int(s["durability"])<=0:
		return 0
	if is_instance_valid(farm.core):
		var r: Dictionary=farm.core.call("tool_strike",int(s["tier"]),int(s["durability"]),float(s["work"]))
		s["durability"]=int(r["durability"])
		s["work"]=float(r["work"])
		return int(r["damage"])
	var total: float=EFFICIENCY[int(s["tier"])]+float(s["work"])
	s["durability"]=int(s["durability"])-1
	s["work"]=fmod(total,1.0)
	return int(floor(total))

static func worn_message(tool: String) -> String:
	return "%s gasta. Repare na bancada de trabalho (C)." % NAMES[tool]

static func upgrade_cost(farm,tool: String) -> Dictionary:
	var tier: int=int(state(farm,tool)["tier"])
	if tier>=3:
		return {}
	return {INGOT_ITEM[tier+1]:int(INGOTS[tool][tier+1])}

static func upgrade(farm,tool: String) -> String:
	if int(farm.stock.get(tool,0))<1:
		return "Você não tem %s." % NAMES[tool].to_lower()
	var s: Dictionary=state(farm,tool)
	var cost:=upgrade_cost(farm,tool)
	if cost.is_empty():
		return "%s já está no último nível." % NAMES[tool]
	if not farm.transact(cost,{}):
		return "Faltam lingotes para melhorar."
	s["tier"]=int(s["tier"])+1
	s["durability"]=DURABILITY[int(s["tier"])]
	s["work"]=0.0
	return "%s %s pronta!" % [NAMES[tool],TIER_NAMES[int(s["tier"])]]

static func repair_cost(farm,tool: String) -> Dictionary:
	var tier: int=int(state(farm,tool)["tier"])
	return REPAIR_STONE.duplicate() if tier==0 else {INGOT_ITEM[tier]:1}

static func repair(farm,tool: String) -> String:
	if int(farm.stock.get(tool,0))<1:
		return "Você não tem %s." % NAMES[tool].to_lower()
	var s: Dictionary=state(farm,tool)
	if int(s["durability"])>=DURABILITY[int(s["tier"])]:
		return "%s já está inteira." % NAMES[tool]
	if not farm.transact(repair_cost(farm,tool),{}):
		return "Faltam materiais para o reparo."
	s["durability"]=DURABILITY[int(s["tier"])]
	s["work"]=0.0
	return "%s reparada." % NAMES[tool]

static func valid(value: Variant) -> bool:
	if not value is Dictionary or value.size()>8:
		return false
	for tool in value:
		if not tool in TOOLS or not value[tool] is Dictionary:
			return false
		var s: Dictionary=value[tool]
		if not s.get("tier") is int or s["tier"]<0 or s["tier"]>3:
			return false
		if not s.get("durability") is int or s["durability"]<0 or s["durability"]>DURABILITY[s["tier"]]:
			return false
		if not s.get("work") is float or not is_finite(s["work"]) or s["work"]<0.0 or s["work"]>=1.0:
			return false
	return true
