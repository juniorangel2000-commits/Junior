extends RefCounted
const ORIGIN:=Vector2(4096,0)
const ENTRANCE:=Vector2(784,546)
const SPAWN:=Vector2(176,272)
const ROOM:=preload("res://arte/casa/room-source.png")
const FURNITURE=[["bed",2,2,2,2,true],["shelf",8,2,2,1,true],["table",8,4,2,2,true],["chair",7,4,1,1,true],["rug",2,5,3,2,false],["plant",1,7,1,1,true],["woodStove",5,2,2,1,true],["chair",10,4,1,1,true],["chest",9,7,1,1,true]]
const ART={"bed":preload("res://arte/casa/bed.png"),"shelf":preload("res://arte/casa/shelf.png"),"table":preload("res://arte/casa/table.png"),"chair":preload("res://arte/casa/chair.png"),"rug":preload("res://arte/casa/rug.png"),"plant":preload("res://arte/casa/plant.png"),"woodStove":preload("res://arte/casa/wood-stove.png"),"chest":preload("res://arte/casa/chest.png")}
var root: Node2D
var player: CharacterBody2D
var scene: Node2D
var inside:=false
var exterior_position:=ENTRANCE
var old_limits: Array[int]=[]
var old_zoom:=Vector2.ONE

class RoomArt extends Node2D:
	func _draw() -> void:
		draw_rect(Rect2(0,0,384,320),Color("#28251f"))
		draw_texture_rect_region(ROOM,Rect2(20,5,344,59),Rect2(86,30,1205,275))
		draw_texture_rect_region(ROOM,Rect2(32,64,320,224),Rect2(108,305,1160,775))
		draw_texture_rect_region(ROOM,Rect2(20,64,12,224),Rect2(86,305,22,775))
		draw_texture_rect_region(ROOM,Rect2(352,64,12,224),Rect2(1268,305,23,775))
		draw_texture_rect_region(ROOM,Rect2(162,288,60,26),Rect2(601,1005,172,76))
		draw_texture_rect_region(ROOM,Rect2(20,288,140,16),Rect2(86,1080,514,36))
		draw_texture_rect_region(ROOM,Rect2(224,288,140,16),Rect2(773,1080,518,36))

func setup(world: Node2D,p: CharacterBody2D) -> void:
	scene=world
	player=p
	root=Node2D.new()
	root.name="InteriorCasa"
	root.position=ORIGIN
	root.y_sort_enabled=true
	scene.add_child(root)
	var room:=RoomArt.new()
	room.z_index=-2
	root.add_child(room)
	for item in FURNITURE:
		var sprite:=Sprite2D.new()
		sprite.texture=ART[item[0]]
		var extent:=Vector2(item[3],item[4])*32.0
		var s:=sprite.texture.get_size()
		sprite.scale=Vector2.ONE*minf(extent.x/s.x,(extent.y+24.0)/s.y)
		sprite.position=Vector2(item[1]*32.0+extent.x/2.0,item[2]*32.0+extent.y)
		sprite.offset=Vector2(0,-s.y*0.5)
		if not item[5]:
			sprite.z_index=-1
		root.add_child(sprite)

static func walkable(local: Vector2) -> bool:
	if local.x<39.0 or local.x>345.0 or local.y<69.0 or local.y>310.0:
		return false
	if local.y>284.0 and (local.x<167.0 or local.x>217.0):
		return false
	var feet:=Rect2(local-Vector2(7,4),Vector2(14,8))
	for item in FURNITURE:
		if item[5] and feet.intersects(Rect2(Vector2(item[1],item[2])*32.0,Vector2(item[3],item[4])*32.0)):
			return false
	return true

func enter(saved: Vector2=SPAWN) -> void:
	if inside:
		return
	inside=true
	exterior_position=player.global_position
	var cam: Camera2D=player.get_node("Camera")
	old_limits=[cam.limit_left,cam.limit_top,cam.limit_right,cam.limit_bottom]
	old_zoom=cam.zoom
	cam.limit_left=3800
	cam.limit_top=-400
	cam.limit_right=4800
	cam.limit_bottom=720
	cam.zoom=Vector2.ONE*2.0
	player.set("home_mode",true)
	player.set("home_controller",self)
	player.global_position=ORIGIN+(saved if walkable(saved) else SPAWN)
	cam.reset_smoothing()
	scene.get_tree().root.get_node("MundoSimulacao").call("set_inside",true)

func leave() -> void:
	if not inside:
		return
	inside=false
	player.set("home_mode",false)
	player.set("home_controller",null)
	player.global_position=exterior_position
	var cam: Camera2D=player.get_node("Camera")
	cam.limit_left=old_limits[0]
	cam.limit_top=old_limits[1]
	cam.limit_right=old_limits[2]
	cam.limit_bottom=old_limits[3]
	cam.zoom=old_zoom
	cam.reset_smoothing()
	scene.get_tree().root.get_node("MundoSimulacao").call("set_inside",false)

func target(point: Vector2) -> String:
	if not inside:
		if player.global_position.distance_to(ENTRANCE)<=65.0 and point.distance_to(ENTRANCE)<=55.0:
			return "enter"
		return ""
	if player.global_position.distance_to(point)>70.0:
		return ""
	var local:=point-ORIGIN
	if Rect2(160,280,64,40).has_point(local):
		return "exit"
	for item in FURNITURE:
		if Rect2(Vector2(item[1],item[2])*32.0,Vector2(item[3],item[4])*32.0).grow(12).has_point(local):
			return str(item[0])
	return ""

func move_allowed(point: Vector2) -> bool:
	return walkable(point-ORIGIN)

static func sleep_plan(day: int,minute: float) -> Dictionary:
	if minute>=480.0 and minute<1140.0:
		return {"ok":false,"message":"Volte para dormir a partir das 19h."}
	if minute>=1140.0 and day>=999999:
		return {"ok":false,"message":"Último dia do calendário."}
	return {"ok":true,"day":day+(1 if minute>=1140.0 else 0),"minute":480.0}
