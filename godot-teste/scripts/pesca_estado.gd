extends RefCounted
# Property habitat: V51 "other": no rare fish, 24% recyclable material.
const SPECIES={
"lambari":{"name":"Lambari","weight":40,"min":6.0,"max":16.0,"grams":55,"speed":1.8,"turn":0.65,"sway":0.06,"freq":4.2},
"tilapia":{"name":"Tilápia","weight":30,"min":18.0,"max":42.0,"grams":1800,"speed":0.85,"turn":2.0,"sway":0.025,"freq":1.7},
"carpa":{"name":"Carpa","weight":18,"min":25.0,"max":65.0,"grams":6000,"speed":1.15,"turn":1.7,"sway":0.045,"freq":2.3},
"bagre":{"name":"Bagre","weight":12,"min":22.0,"max":55.0,"grams":3200,"speed":1.2,"turn":1.5,"sway":0.035,"freq":2.0}}
const TRASH=[["Lata enferrujada","scrap"],["Galho encharcado","branch"],["Bota velha","cloth"],["Corda embolada","cord"]]
var rng:=RandomNumberGenerator.new()
var phase: String="idle"
var reward: Dictionary={}
var age:=0.0
var wait_seconds:=10.0
var bite_remaining:=3.0
var fight_seconds:=0.0
var fish:=0.5
var band:=0.5
var velocity:=0.0
var progress:=0.28
var band_size:=0.28
var target:=0.5
var turn:=0.0
var reason: String=""
var day:=1

func weight(id: String,minute: float,rain: bool) -> float:
	var night:=minute<360.0 or minute>=1140.0
	var morning:=minute>=360.0 and minute<660.0
	var w:=float(SPECIES[id]["weight"])
	if id=="bagre":
		w*=2.2 if night else 0.8
	if id=="lambari":
		w*=1.8 if morning else (0.65 if night else 1.0)
	if id=="tilapia":
		w*=0.65 if night else 1.35
	if rain and id in ["bagre","carpa"]:
		w*=1.5
	return w

static func fish_quality(id: String,length: float) -> int:
	if not SPECIES.has(id) or not is_finite(length):
		return 0
	var def: Dictionary=SPECIES[id]
	var ratio:=clampf((length-float(def["min"]))/(float(def["max"])-float(def["min"])),0.0,1.0)
	return 2 if ratio>=0.9 else (1 if ratio>=0.66 else 0)

func roll(minute: float,rain: bool) -> Dictionary:
	if rng.randf()<0.24:
		var item: Array=TRASH[rng.randi_range(0,TRASH.size()-1)]
		return {"kind":"trash","name":item[0],"item":item[1]}
	var total:=0.0
	for id in SPECIES:
		total+=weight(id,minute,rain)
	var n:=rng.randf()*total
	var species: String="bagre"
	for id in SPECIES:
		n-=weight(id,minute,rain)
		if n<=0.0:
			species=id
			break
	var def: Dictionary=SPECIES[species]
	var length:=roundf(lerpf(def["min"],def["max"],rng.randf())*10.0)/10.0
	var grams:=maxi(1,roundi(def["grams"]*pow(length/float(def["max"]),3.0)*(0.9+rng.randf()*0.2)))
	return {"kind":"fish","name":def["name"],"item":"fish","species":species,"length":length,"grams":grams,"quality":fish_quality(species,length)}

func begin(inventory,clock: Dictionary) -> String:
	if phase!="idle":
		return "Pescaria em andamento."
	if inventory.stock.get("fishingRod",0)<1 or inventory.stock.get("bait",0)<1:
		return "Precisa de vara de pescar e isca."
	reward=roll(float(clock["minute"]),bool(clock["rain"]))
	var gain: Dictionary={reward["item"]:1}
	var old: Dictionary=inventory.stock.duplicate()
	if not inventory.transact({"bait":1},gain):
		reward={}
		return "Libere espaço na mochila."
	inventory.stock=old
	if not inventory.transact({"bait":1},{}):
		return "Sem isca."
	day=int(clock["day"])
	phase="casting"
	age=0.0
	wait_seconds=rng.randf_range(10.0,20.0)
	bite_remaining=3.0
	fight_seconds=0.0
	fish=0.5
	band=0.5
	velocity=0.0
	progress=0.28
	target=0.5
	turn=0.0
	reason=""
	return ""

func hook() -> bool:
	if phase!="bite":
		return false
	phase="fighting"
	return true

func step(seconds: float,held: bool=false) -> void:
	if not is_finite(seconds) or seconds<=0.0:
		return
	if phase=="casting":
		age+=seconds
		if age>=1.9:
			phase="waiting"
			age=0.0
		return
	if phase in ["waiting","bite"]:
		age+=seconds
		if age>=wait_seconds:
			phase="bite"
			bite_remaining=maxf(0.0,3.0-(age-wait_seconds))
			if bite_remaining<=0.0:
				phase="escaped"
				reason="A fisgada foi tarde."
		return
	if phase!="fighting":
		return
	var remaining:=minf(seconds,1.0)
	var habit: Dictionary=SPECIES[reward.get("species","tilapia")]
	while remaining>0.000001 and phase=="fighting":
		var dt:=minf(remaining,1.0/120.0)
		remaining-=dt
		fight_seconds+=dt
		turn-=dt
		if turn<=0.0:
			target=0.08+rng.randf()*0.84
			turn=habit["turn"]*(1.0+rng.randf())
		var movement: float=sin(fight_seconds*1.3)*0.008 if reward["kind"]=="trash" else (target-fish)*habit["speed"]+sin(fight_seconds*habit["freq"])*habit["sway"]
		fish=clampf(fish+clampf(movement,-0.5,0.5)*dt,0.045,0.955)
		velocity=clampf((velocity+(2.1 if held else -1.65)*dt)*exp(-1.6*dt),-0.72,0.72)
		band+=velocity*dt
		var half:=band_size*0.5
		if band<half:
			band=half
			velocity=maxf(0.0,-velocity*0.12)
		if band>1.0-half:
			band=1.0-half
			velocity=minf(0.0,-velocity*0.12)
		progress=clampf(progress+dt*(0.16 if absf(fish-band)<=half else -0.085),0.0,1.0)
		if progress>=1.0:
			phase="caught"
		elif progress<=0.0 or fight_seconds>=45.0:
			phase="escaped"
			reason="O peixe escapou."

func collect(inventory) -> String:
	if phase!="caught":
		return "Nenhuma captura."
	if not inventory.transact({},{reward["item"]:1}):
		return "Mochila cheia. Libere espaço e recolha."
	if reward["kind"]=="fish":
		var id: String=reward["species"]
		var rec: Dictionary=inventory.fish_records.get(id,{"count":0,"length":0.0,"grams":0,"first_day":day})
		rec["count"]=mini(999999,int(rec["count"])+1)
		rec["length"]=maxf(rec["length"],reward["length"])
		rec["grams"]=maxi(rec["grams"],reward["grams"])
		inventory.fish_records[id]=rec
		inventory.quality_gain("fish",int(reward.get("quality",0)),1)
	phase="idle"
	return "%s · %.1f cm · %d g" % [reward["name"],reward["length"],reward["grams"]] if reward["kind"]=="fish" else str(reward["name"])+" recuperado."

static func valid_records(records: Variant,today: int) -> bool:
	if not records is Dictionary or records.size()>SPECIES.size():
		return false
	for id in records:
		if not SPECIES.has(id) or not records[id] is Dictionary:
			return false
		var r: Dictionary=records[id]
		if not r.get("count") is int or r["count"]<1 or r["count"]>999999 or not r.get("first_day") is int or r["first_day"]<1 or r["first_day"]>today:
			return false
		if not r.get("length") is float or not is_finite(r["length"]) or r["length"]<SPECIES[id]["min"] or r["length"]>SPECIES[id]["max"]:
			return false
		if not r.get("grams") is int or r["grams"]<1 or r["grams"]>int(SPECIES[id]["grams"]*1.1)+1:
			return false
	return true
