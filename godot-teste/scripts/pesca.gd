extends Node2D
signal result(message: String)
signal save_requested
const Session=preload("res://scripts/pesca_estado.gd")
var session: RefCounted=Session.new()
var farm
var player: CharacterBody2D
var scene: Node2D
var point:=Vector2.ZERO
var time:=0.0
var rod: Sprite2D
var panel: PanelContainer
var status: Label
var capture: ProgressBar
var track: Control
var close: Button
var active:=false
var rod_tip:=Vector2.ZERO

class Track extends Control:
	var state
	func _draw() -> void:
		draw_rect(Rect2(Vector2.ZERO,size),Color("#263e48"))
		if state==null:
			return
		var y: float=(1.0-state.band-state.band_size*0.5)*size.y
		draw_rect(Rect2(4,y,size.x-8,state.band_size*size.y),Color("#75aa82"))
		var fy: float=(1.0-state.fish)*size.y
		draw_circle(Vector2(size.x*0.5,fy),7,Color("#f5d299"))

func setup(root: Node2D,p: CharacterBody2D,inventory) -> void:
	scene=root
	player=p
	farm=inventory
	session.rng.randomize()
	scene.add_child(self)
	z_index=6
	rod=Sprite2D.new()
	rod.texture=load("res://arte/pesca/vara.png") as Texture2D
	rod.hframes=2
	rod.vframes=2
	rod.hide()
	add_child(rod)
	var layer:=CanvasLayer.new()
	layer.layer=18
	add_child(layer)
	panel=PanelContainer.new()
	panel.theme=preload("res://scripts/tema_ui.gd").theme()
	layer.add_child(panel)
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER_RIGHT)
	panel.offset_left=-250
	panel.offset_right=-18
	panel.offset_top=-185
	panel.offset_bottom=185
	var column:=VBoxContainer.new()
	panel.add_child(column)
	status=Label.new()
	status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	status.custom_minimum_size=Vector2(205,70)
	column.add_child(status)
	track=Track.new()
	track.set("state",session)
	track.custom_minimum_size=Vector2(205,205)
	column.add_child(track)
	capture=ProgressBar.new()
	capture.max_value=100
	column.add_child(capture)
	close=Button.new()
	close.text="Encerrar (Esc)"
	close.focus_mode=Control.FOCUS_NONE
	close.pressed.connect(cancel)
	column.add_child(close)
	panel.hide()

func water_at(p: Vector2) -> bool:
	return p.x>=0.0 and p.x<3072.0 and p.y>=0.0 and p.y<2304.0 and scene.get_node("Terreno").call("material_em",p)=="water"

func start(target: Vector2,clock: Dictionary) -> void:
	if active:
		return
	var origin:=player.global_position
	var direction: Vector2=(target-origin).normalized()
	if direction.is_zero_approx():
		direction=player.call("facing_vector")
	var found:=false
	if origin.distance_to(target)<=176.0 and origin.distance_to(target)>=32.0 and water_at(target):
		point=target
		found=true
	else:
		for distance in [48,64,88,112,144,176]:
			for angle in [0.0,PI/4,-PI/4,PI/2,-PI/2,PI*0.75,-PI*0.75,PI]:
				var candidate: Vector2=origin+direction.rotated(angle)*float(distance)
				if water_at(candidate):
					point=candidate
					found=true
					break
			if found:
				break
	if not found:
		result.emit("Aproxime-se de água livre.")
		return
	var error: String=session.begin(farm,clock)
	if error!="":
		result.emit(error)
		return
	var now: float=preload("res://scripts/cozinha_estado.gd").absolute(clock)
	farm.nutrition.spend(3,now)
	session.band_size=0.28+farm.nutrition.fishing_bonus(now)
	active=true
	time=0.0
	player.set("tool_busy",true)
	scene.get_tree().root.get_node("MundoSimulacao").set("fishing_paused",true)
	panel.show()
	rod.show()
	save_requested.emit()
	result.emit("Lançando a linha.")

func press() -> void:
	if not active:
		return
	if session.phase=="bite":
		session.hook()
	elif session.phase=="caught":
		var msg: String=session.collect(farm)
		if session.phase=="idle":
			_finish(msg)
			save_requested.emit()
		else:
			result.emit(msg)

func cancel() -> void:
	if active:
		_finish("Pescaria encerrada. A isca foi utilizada.")

func _finish(msg: String) -> void:
	active=false
	session.phase="idle"
	panel.hide()
	rod.hide()
	player.set("tool_busy",false)
	scene.get_tree().root.get_node("MundoSimulacao").set("fishing_paused",false)
	queue_redraw()
	result.emit(msg)

func update(delta: float) -> void:
	if not active:
		return
	time+=delta
	var held:=Input.is_physical_key_pressed(KEY_SPACE) or Input.is_physical_key_pressed(KEY_E) or Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
	session.step(delta,held)
	if session.phase=="escaped":
		_finish(session.reason)
		return
	match session.phase:
		"casting": status.text="Lançando..."
		"waiting": status.text="Observe a boia..."
		"bite": status.text="FISGUE! E / espaço / clique · %.1fs" % session.bite_remaining
		"fighting": status.text="Segure espaço/E para subir; solte para descer."
		"caught": status.text="%s! E / espaço / clique para recolher." % session.reward["name"]
	track.visible=session.phase=="fighting"
	capture.visible=session.phase=="fighting"
	capture.value=session.progress*100.0
	track.queue_redraw()
	_update_rod()
	queue_redraw()

func _update_rod() -> void:
	var d:=point-player.global_position
	var frame:=0
	var hand:=Vector2(320,540)
	var tip:=Vector2(352,60)
	var angle: float=-PI/2
	if absf(d.x)>absf(d.y):
		if d.x<0.0:
			frame=2
			hand=Vector2(540,280)
			tip=Vector2(65,230)
			angle=PI
		else:
			frame=3
			hand=Vector2(80,280)
			tip=Vector2(545,230)
			angle=0.0
	elif d.y>0.0:
		frame=1
		hand=Vector2(300,100)
		tip=Vector2(260,570)
		angle=PI/2
	rod.frame=frame
	var cell:=rod.texture.get_size()*0.5
	rod.scale=Vector2.ONE*60.0/cell.x
	rod.offset=(Vector2(320,320)-hand)*cell.x/640.0
	rod.position=player.global_position+Vector2(0,-20)
	var swing:=0.0
	if session.phase=="casting":
		var t: float=float(session.age)
		swing=-0.15-0.8*smoothstep(0.0,0.55,t) if t<0.55 else -0.95*(1.0-smoothstep(0.55,1.25,t))
	rod.rotation=d.angle()-angle+swing
	rod_tip=rod.position+((tip-hand)*60.0/640.0).rotated(rod.rotation)

func _draw() -> void:
	if not active:
		return
	var bob:=point
	if session.phase=="casting":
		var t:=clampf((session.age-0.75)/1.15,0.0,1.0)
		bob=rod_tip.lerp(point,t)-Vector2(0,sin(PI*t)*48.0)
	else:
		bob.x+=sin(time*0.7)*2.5
		bob.y+=sin(time*1.9)*1.15
		if session.phase=="bite":
			bob.y+=4.0+sin(time*17.0)*2.2
		if session.phase=="fighting":
			bob.x+=(session.fish-0.5)*15.0
	draw_polyline(PackedVector2Array([rod_tip,(rod_tip+bob)*0.5+Vector2(0,4),bob]),Color(0.94,0.89,0.73,0.85),0.75,true)
	draw_circle(bob,2.8,Color("#eee6ce"))
	draw_circle(bob+Vector2(0,2),2.1,Color("#c95743"))
	if session.phase!="casting":
		for i in 3:
			var p:=fposmod(time*(1.15 if session.phase=="bite" else 0.42)+float(i)/3.0,1.0)
			var ring:=PackedVector2Array()
			for j in 33:
				var a:=TAU*float(j)/32.0
				ring.append(point+Vector2(cos(a)*(4.0+p*13.5),sin(a)*(1.0+p*3.5)))
			draw_polyline(ring,Color(0.82,0.94,0.89,(1.0-p)*0.45),0.8,true)
