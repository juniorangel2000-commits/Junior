extends Node2D
## O vale inteiro num só mundo: cada cenário fica na posição real do vale (VALLEY_LAYOUT de
## src/data/valley-seams.ts da V51, com a Propriedade em 0,0) e é carregado quando o jogador se
## aproxima e descarregado quando ele se afasta. Atravessar a divisa leva ao cenário vizinho sem
## tela de carregamento.
##
## Os cenários vêm de ferramentas/extrair_cenarios (jogo publicado rodando no navegador):
## res://cenarios/<área>/cenario.json com o chão em blocos, os objetos com a arte original e a
## grade de 16 px de bloqueio e de água.
const T:=32
const W:=96*T
const H:=72*T
const CELL:=16
const LOAD_MARGIN:=900.0
const UNLOAD_MARGIN:=1700.0
const NAMES:={"property":"Propriedade Abandonada","forest":"Floresta Antiga","village":"Vila","cityForest":"Estrada da Cidade","fishingLake":"Lago da Cachoeira","openFields":"Campos Abertos","highland":"Platô da Nascente","survivorCamp":"Acampamento dos Sobreviventes","swamp":"Pântano","ruins":"Ruínas","railway":"Estação Ferroviária","coast":"Costa das Marés","orchard":"Pomar Abandonado"}
## Posição de cada cenário no vale (cópia de VALLEY_LAYOUT; ORCHARD_NORTH_OFFSET = 0).
static func layout() -> Dictionary:
	return {
		"property":Rect2(0,0,W,H),
		"village":Rect2(W,0,W,H),
		"orchard":Rect2(2*W,0,W,H),
		"forest":Rect2(-W,0,W,H),
		"fishingLake":Rect2(0,-H,W,H),
		"cityForest":Rect2(W,-H,W,H),
		"ruins":Rect2(2*W,-H+6*T,W,H),
		"railway":Rect2(3*W,-H+6*T,W,H),
		"highland":Rect2(1462-925,-H-1024,1536,1024),
		"survivorCamp":Rect2(-W-13*T,-H,W,H),
		"swamp":Rect2(-W,H,W,H),
		"openFields":Rect2(0,H,W,H),
		"coast":Rect2(0,2*H,W,H),
	}

const WATER_SHADER:="""shader_type canvas_item;
uniform sampler2D mask : filter_linear;
uniform sampler2D water : repeat_enable, filter_nearest;
uniform vec2 size;
void fragment() {
	vec2 p = UV * size;
	float m = texture(mask, UV).r;
	float a = smoothstep(0.30, 0.62, m);
	if (a <= 0.0) discard;
	vec2 q = p / 96.0 + vec2(TIME * 0.025, sin(TIME * 0.7 + p.x * 0.02) * 0.01);
	vec4 c = texture(water, fract(q));
	// Raso perto da margem: deixa ver o fundo desenhado no chão.
	float raso = 1.0 - smoothstep(0.62, 0.95, m);
	COLOR = vec4(c.rgb, a * mix(0.72, 0.42, raso));
}
"""

var player: Node2D
var objects_root: Node2D
var loaded: Dictionary={}
var available: Dictionary={}
var current:="property"
var _timer:=0.0
var _water_texture: Texture2D
var _water_shader: Shader
signal area_changed(area: String,name: String)

func setup(scene: Node2D,p: Node2D) -> void:
	player=p
	objects_root=scene.get_node("Objetos")
	z_index=-10
	_water_texture=load("res://arte/terreno/water.png")
	_water_shader=Shader.new()
	_water_shader.code=WATER_SHADER
	for area in layout():
		if area!="property" and FileAccess.file_exists("res://cenarios/%s/cenario.json" % area):
			available[area]=true

static func area_at(p: Vector2) -> String:
	var rects:=layout()
	for area in rects:
		if rects[area].has_point(p):
			return area
	return ""

## Dentro de algum cenário que existe e está carregado (a Propriedade sempre está).
func walkable_area(p: Vector2) -> bool:
	var area:=area_at(p)
	return area=="property" or loaded.has(area)

## Carrega na hora o cenário de um ponto (usado ao abrir um save fora da Propriedade).
func ensure_loaded(p: Vector2) -> void:
	var area:=area_at(p)
	if area!="" and area!="property" and available.has(area) and not loaded.has(area):
		_load(area)

func _process(delta: float) -> void:
	if not is_instance_valid(player):
		return
	_timer-=delta
	if _timer>0.0:
		return
	_timer=0.4
	var p: Vector2=player.global_position
	var rects:=layout()
	for area in available:
		var r: Rect2=rects[area]
		var near:=r.grow(LOAD_MARGIN).has_point(p)
		if near and not loaded.has(area):
			_load(area)
		elif loaded.has(area) and not r.grow(UNLOAD_MARGIN).has_point(p):
			_unload(area)
	var here:=area_at(p)
	if here!="" and here!=current:
		current=here
		_update_camera()
		area_changed.emit(here,NAMES.get(here,here))

## Câmera: limita ao cenário atual e se estende para os lados onde há vizinho carregado.
func _update_camera() -> void:
	var cam: Camera2D=player.get_node_or_null("Camera")
	if cam==null or player.get("home_mode"):
		return
	var r: Rect2=layout().get(current,Rect2(0,0,W,H))
	var ext:=[0.0,0.0,0.0,0.0]
	var probes:=[Vector2(r.position.x-8,r.get_center().y),Vector2(r.get_center().x,r.position.y-8),Vector2(r.end.x+8,r.get_center().y),Vector2(r.get_center().x,r.end.y+8)]
	for i in 4:
		var n:=area_at(probes[i])
		if n=="property" or loaded.has(n):
			ext[i]=1400.0
	cam.limit_left=int(r.position.x-ext[0])
	cam.limit_top=int(r.position.y-ext[1])
	cam.limit_right=int(r.end.x+ext[2])
	cam.limit_bottom=int(r.end.y+ext[3])

func _load(area: String) -> void:
	var base:="res://cenarios/%s/" % area
	var data: Variant=JSON.parse_string(FileAccess.get_file_as_string(base+"cenario.json"))
	if not data is Dictionary:
		return
	var origin: Vector2=layout()[area].position
	var root:=Node2D.new()
	root.name="Cenario_"+area
	root.position=origin
	add_child(root)
	# Chão em blocos.
	for t in data["ground"]:
		var s:=Sprite2D.new()
		s.centered=false
		s.texture=load(base+str(t["file"]))
		s.position=Vector2(t["x"],t["y"])
		s.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
		root.add_child(s)
	var grid: Dictionary=data["grid"]
	var cols: int=int(grid["cols"])
	var rows: int=int(grid["rows"])
	var water: String=grid["water"]
	var solid: String=grid["solid"]
	# Água animada por cima do chão, na forma real dos lagos e rios.
	if water.contains("1") or water.contains("5") or water.contains("9"):
		var img:=Image.create(cols,rows,false,Image.FORMAT_L8)
		for y in rows:
			for x in cols:
				img.set_pixel(x,y,Color(minf(1.0,float(int(water[y*cols+x]))/2.0),0,0))
		var mat:=ShaderMaterial.new()
		mat.shader=_water_shader
		mat.set_shader_parameter("mask",ImageTexture.create_from_image(img))
		mat.set_shader_parameter("water",_water_texture)
		mat.set_shader_parameter("size",Vector2(cols*CELL,rows*CELL))
		var rect:=ColorRect.new()
		rect.size=Vector2(cols*CELL,rows*CELL)
		rect.material=mat
		rect.mouse_filter=Control.MOUSE_FILTER_IGNORE
		root.add_child(rect)
	# Objetos: no nó de objetos da cena (ordenados com o jogador pela profundidade original).
	var objs:=Node2D.new()
	objs.name="Objetos_"+area
	objs.y_sort_enabled=true
	objs.position=origin
	objects_root.add_child(objs)
	var sim:=get_tree().root.get_node_or_null("MundoSimulacao")
	for o in data["objs"]:
		var tex: Texture2D=load(base+"arte/"+str(o["arte"]))
		if tex==null:
			continue
		var s:=Sprite2D.new()
		s.texture=tex
		var size:=tex.get_size()
		s.scale=Vector2(float(o["w"])/size.x,float(o["h"])/size.y)
		s.flip_h=bool(o["flipX"])
		s.flip_v=bool(o["flipY"])
		s.rotation=float(o["rot"])
		s.modulate.a=float(o["alpha"])
		if o.get("tint")!=null:
			var tint:=int(o["tint"])
			s.modulate=Color8((tint>>16)&255,(tint>>8)&255,tint&255,int(float(o["alpha"])*255.0))
		# Posição no "pé" de ordenação (profundidade da V51) e a arte deslocada até o lugar certo.
		var depth: float=float(o["depth"])
		s.position=Vector2(float(o["x"]),depth)
		var draw_center:=Vector2(float(o["x"]),float(o["y"]))+Vector2((0.5-float(o["ox"]))*float(o["w"]),(0.5-float(o["oy"]))*float(o["h"]))
		s.offset=(draw_center-s.position)/s.scale
		if s.flip_h:
			s.offset.x=-s.offset.x
		objs.add_child(s)
		if sim!=null and size.y*s.scale.y>=90.0 and _casts_shadow(str(o["arte"])):
			sim.call("register_shadow",s)
	# Colisão: bloqueio e água viram retângulos (o protótipo ainda não tem natação).
	var body:=StaticBody2D.new()
	body.collision_layer=2
	body.collision_mask=0
	body.position=origin
	add_child(body)
	var runs: Dictionary={}
	for y in rows:
		var x:=0
		while x<cols:
			var i:=y*cols+x
			if solid[i]=="1" or water[i]!="0":
				var x0:=x
				while x<cols and (solid[y*cols+x]=="1" or water[y*cols+x]!="0"):
					x+=1
				var key:=Vector2i(x0,x)
				if runs.has(key) and runs[key].y+runs[key].h==y:
					runs[key].h+=1
				else:
					if runs.has(key):
						_add_shape(body,runs[key])
					runs[key]={"x":x0,"w":x-x0,"y":y,"h":1}
			else:
				x+=1
		for key in runs.keys():
			var run: Dictionary=runs[key]
			if run.y+run.h<y+1:
				_add_shape(body,run)
				runs.erase(key)
	for run in runs.values():
		_add_shape(body,run)
	loaded[area]={"root":root,"objects":objs,"body":body}
	_update_camera()

static func _casts_shadow(art: String) -> bool:
	for word in ["tree","pine","cypress","willow","alder","oak","ipe","palm","birch","house","shed","station","ruin","tower","wall","mill","lighthouse"]:
		if art.contains(word):
			return true
	return false

func _add_shape(body: StaticBody2D,run: Dictionary) -> void:
	var shape:=RectangleShape2D.new()
	shape.size=Vector2(run.w*CELL,run.h*CELL)
	var c:=CollisionShape2D.new()
	c.shape=shape
	c.position=Vector2(run.x*CELL,run.y*CELL)+shape.size*0.5
	body.add_child(c)

func _unload(area: String) -> void:
	var entry: Dictionary=loaded[area]
	for key in ["root","objects","body"]:
		if is_instance_valid(entry[key]):
			entry[key].queue_free()
	loaded.erase(area)
	_update_camera()
