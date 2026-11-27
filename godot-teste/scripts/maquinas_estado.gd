extends RefCounted
const MACHINES={"cheesePress":{"name":"Queijeira","width":1,"cost":{"board":8,"ironIngot":2,"peg":4,"spring":1,"gear":1},"frame_width":248,"frame_height":299},"butterChurn":{"name":"Batedeira de manteiga","width":1,"cost":{"board":6,"ironShard":4,"peg":2,"gear":1},"frame_width":220,"frame_height":288},"spinningWheel":{"name":"Roca","width":2,"cost":{"board":8,"cord":4,"peg":4,"gear":1},"frame_width":286,"frame_height":288},"loom":{"name":"Tear","width":2,"cost":{"board":12,"cord":6,"peg":6,"hardwood":2,"gear":1,"spring":1},"frame_width":332,"frame_height":275},"clayOven":{"name":"Forno de barro","width":2,"cost":{"stone":24,"wood":10,"board":4,"ironShard":2},"frame_width":150,"frame_height":146},"preserveKeg":{"name":"Barril de conservas","width":2,"cost":{"board":8,"ironShard":2,"peg":4,"nails":4},"frame_width":631,"frame_height":627},"waxPress":{"name":"Prensa de cera","width":2,"cost":{"board":6,"ironShard":4,"peg":4,"spring":2,"hinge":1},"frame_width":588,"frame_height":688},"composter":{"name":"Composteira","width":2,"cost":{"board":6,"peg":4,"stone":6,"nails":4},"frame_width":212,"frame_height":192},"stoneMill":{"name":"Moinho de pedra","width":2,"cost":{"stone":20,"ironIngot":2,"board":6,"metalPart":1,"gear":2},"frame_width":286,"frame_height":262},"forge":{"name":"Forja própria","width":1,"cost":{"stone":15,"wood":8,"scrap":6},"frame_width":0,"frame_height":0}}
const RECIPES={"strawberryJam":{"machine":"preserveKeg","cost":{"strawberry":3,"honey":1},"out":"strawberryJam","quantity":1,"minutes":4320,"name":"Geleia de morango"},"watermelonJam":{"machine":"preserveKeg","cost":{"watermelon":3,"honey":1},"out":"watermelonJam","quantity":1,"minutes":4320,"name":"Geleia de melancia"},"candle":{"machine":"waxPress","cost":{"beeswax":2},"out":"candle","quantity":1,"minutes":720,"name":"Vela"},"compost-grass":{"machine":"composter","cost":{"manure":2,"freshGrass":3},"out":"fertilizer","quantity":2,"minutes":2880,"name":"Adubo"},"compost-fiber":{"machine":"composter","cost":{"manure":2,"fiber":3},"out":"fertilizer","quantity":2,"minutes":2880,"name":"Adubo"},"cheese":{"machine":"cheesePress","cost":{"milk":1},"out":"cheese","quantity":1,"minutes":1440,"name":"Queijo"},"goatCheese":{"machine":"cheesePress","cost":{"goatMilk":1},"out":"goatCheese","quantity":1,"minutes":1440,"name":"Queijo de cabra"},"butter":{"machine":"butterChurn","cost":{"milk":2},"out":"butter","quantity":1,"minutes":720,"name":"Manteiga"},"yarn":{"machine":"spinningWheel","cost":{"wool":1},"out":"yarn","quantity":1,"minutes":1440,"name":"Fio de lã"},"cloth":{"machine":"loom","cost":{"yarn":2},"out":"woolCloth","quantity":1,"minutes":1440,"name":"Tecido de lã"},"flour":{"machine":"stoneMill","cost":{"wheat":1},"out":"flour","quantity":1,"minutes":720,"name":"Farinha"},"cornmeal":{"machine":"stoneMill","cost":{"corn":1},"out":"cornmeal","quantity":1,"minutes":720,"name":"Fubá"},"oatFlakes":{"machine":"stoneMill","cost":{"oat":1},"out":"oatFlakes","quantity":1,"minutes":720,"name":"Aveia em flocos"},"oven-homemadeBread":{"machine":"clayOven","cost":{"flour":2,"egg":1,"milk":1,"wood":1},"out":"homemadeBread","quantity":1,"minutes":720,"name":"Pão caseiro"},"oven-cornBroa":{"machine":"clayOven","cost":{"cornmeal":2,"egg":1,"butter":1,"wood":1},"out":"cornBroa","quantity":1,"minutes":720,"name":"Broa de milho"},"oven-carrotCake":{"machine":"clayOven","cost":{"flour":2,"egg":2,"carrot":1,"milk":1,"wood":1},"out":"carrotCake","quantity":1,"minutes":720,"name":"Bolo de cenoura"},"oven-strawberryPie":{"machine":"clayOven","cost":{"flour":2,"strawberry":2,"butter":1,"duckEgg":1,"wood":1},"out":"strawberryPie","quantity":1,"minutes":720,"name":"Torta de morango"},"oven-applePie":{"machine":"clayOven","cost":{"flour":2,"apple":3,"butter":1,"egg":1,"wood":1},"out":"applePie","quantity":1,"minutes":720,"name":"Torta de maçã"},"oven-honeyCake":{"machine":"clayOven","cost":{"flour":2,"honey":1,"egg":1,"milk":1,"wood":1},"out":"honeyCake","quantity":1,"minutes":720,"name":"Bolo de mel"},"smelt-iron":{"machine":"forge","cost":{"ironShard":9},"out":"ironIngot","quantity":1,"minutes":30,"name":"Lingote de ferro"},"smelt-ore":{"machine":"forge","cost":{"ironOre":1},"out":"ironIngot","quantity":1,"minutes":30,"name":"Lingote de ferro"}}

static func clock(day: int,minute: float) -> float:
	return float(day-1)*1440.0+minute

static func start(inventory,tile: Vector2i,id: String,now: float) -> String:
	if not inventory.buildings.has(tile) or not RECIPES.has(id):
		return "Máquina ou receita inexistente."
	var rule: Dictionary=RECIPES[id]
	if inventory.buildings[tile]["kind"]!=rule["machine"]:
		return "Receita incompatível."
	if inventory.machine_jobs.has(tile):
		return "Recolha a produção anterior primeiro."
	if not is_finite(now) or now<0.0 or now+rule["minutes"]>=999999.0*1440.0:
		return "Calendário indisponível."
	# V51: as melhores unidades vão primeiro e o produto sai com a qualidade média delas.
	var input_quality: int=inventory.transact_quality(rule["cost"],{})
	if input_quality<0:
		return "Faltam ingredientes."
	inventory.machine_jobs[tile]={"recipe":id,"started":now,"ready":now+float(rule["minutes"]),"quality":input_quality}
	return "Produção iniciada."

static func collect(inventory,tile: Vector2i,now: float) -> String:
	if not inventory.machine_jobs.has(tile):
		return "Máquina vazia."
	var job: Dictionary=inventory.machine_jobs[tile]
	if now<float(job["ready"]):
		return "Ainda está trabalhando."
	var r: Dictionary=RECIPES[job["recipe"]]
	if not inventory.transact({},{r["out"]:r["quantity"]}):
		return "Mochila cheia. Produto preservado."
	var quality:=int(job.get("quality",0))
	if quality>0:
		inventory.quality_gain(str(r["out"]),quality,int(r["quantity"]))
	inventory.machine_jobs.erase(tile)
	return "%s ×%d recolhido." % [r["name"],r["quantity"]]

static func valid_jobs(value: Variant,pieces: Dictionary,day: int) -> bool:
	if not value is Dictionary or value.size()>128:
		return false
	for tile in value:
		if not tile is Vector2i or not pieces.has(tile) or not value[tile] is Dictionary:
			return false
		var job: Dictionary=value[tile]
		if not RECIPES.has(job.get("recipe","")):
			return false
		var r: Dictionary=RECIPES[job["recipe"]]
		if pieces[tile]["kind"]!=r["machine"]:
			return false
		if not job.get("started") is float or not job.get("ready") is float or not is_finite(job["started"]) or not is_finite(job["ready"]):
			return false
		var quality: Variant=job.get("quality",0) # saves antigos: qualidade comum
		if not quality is int or quality<0 or quality>2:
			return false
		if job["started"]<0.0 or job["started"]>=day*1440.0 or not is_equal_approx(job["ready"],job["started"]+r["minutes"]) or job["ready"]>=999999.0*1440.0:
			return false
	return true
