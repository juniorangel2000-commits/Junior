extends RefCounted
## Tabuleiro das pontes da Propriedade, portado de src/bridge-art.ts (V51, camada "deck").
## A extração do mapa trouxe só os corrimãos (back/front); sem o tabuleiro a ponte parecia
## dois trilhos soltos sobre a água. Aqui o tabuleiro é desenhado pixel a pixel, igual à V51:
## cabeceiras de pedra, tábuas de 10 px com pregos e veios, vigas nas bordas.

static func _put(img: Image,color: Color,x: int,y: int,w: int,h: int) -> void:
	if w<=0 or h<=0:
		return
	var r:=Rect2i(x,y,w,h).intersection(Rect2i(Vector2i.ZERO,img.get_size()))
	if r.size.x>0 and r.size.y>0:
		img.fill_rect(r,color)

## Madeira com veios: tom base da V51 (148,105,60)·0,89 variando por linha e por tábua.
static func _wood(img: Image,x: int,y: int,w: int,h: int,salt: int) -> void:
	_put(img,Color("#4d3422"),x,y,w,h)
	for py in range(1,h-1):
		for px in range(1,w-1):
			var grain:=sin(float(px+salt*7)*0.9+float((py+salt*13)%7)*0.6)*0.5+0.5
			var knot:=1.0 if (px*31+py*17+salt*53)%97==0 else 0.0
			var shade:=0.80+0.16*grain-0.18*knot+0.05*float((py+salt)%3==0)
			var c:=Color8(int(148.0*0.89*shade),int(105.0*0.89*shade),int(60.0*0.86*shade))
			img.set_pixel(x+px,y+py,c)
	_put(img,Color("#c39758"),x+1,y+1,w-2,1)
	_put(img,Color("#694326"),x+1,y+h-2,w-2,1)

static func _nail(img: Image,x: int,y: int) -> void:
	_put(img,Color("#403a30"),x,y,2,2)
	_put(img,Color("#b9ac86"),x,y,1,1)

static func _stone(img: Image,x: int,y: int,w: int,h: int) -> void:
	_put(img,Color("#424d40"),x,y,w,h)
	_put(img,Color("#81836a"),x+1,y+1,w-2,h-2)
	_put(img,Color("#b7af8a"),x+1,y+1,w-2,2)
	_put(img,Color("#5b6850"),x+1,y+h-3,w-2,2)
	_put(img,Color("#a09e7b"),x+2,y+5,w-4,1)

## width/height: vão da ponte em pixels (largura × altura em blocos de 32).
static func deck(width: int,height: int) -> ImageTexture:
	var img:=Image.create(width+16,height+10,false,Image.FORMAT_RGBA8)
	img.fill(Color(0,0,0,0))
	# Sombra do tabuleiro na água.
	_put(img,Color(0.125,0.231,0.188,0.22),3,7,width+10,height+2)
	# Cabeceiras de alvenaria com juntas desencontradas e um pouco de musgo.
	for x in [0,width+8]:
		for row in 6:
			_stone(img,x,4+row*10,8,10)
			_put(img,Color("#6c7950"),x+(1 if row%2 else 4),8+row*10,3,2)
	_wood(img,7,5,width+2,height-5,1)
	var x:=0
	while x<width:
		var w:=mini(10,width-x)
		_wood(img,8+x,7,w-1,height-10,int(x/10.0))
		for y in [12,height-12]:
			_nail(img,10+x,y)
		if x%30==0:
			_put(img,Color("#80592f"),10+x,23,1,13)
			_put(img,Color("#b78a4b"),11+x,26,1,8)
		x+=10
	# Vigas contínuas nas bordas compridas e cabeceiras de madeira nas entradas.
	_wood(img,6,2,width+4,5,2)
	_wood(img,6,height-5,width+4,6,4)
	_wood(img,6,6,6,height-12,3)
	_wood(img,width+4,6,6,height-12,5)
	return ImageTexture.create_from_image(img)

## Cria o tabuleiro sob os corrimãos de uma ponte. back: base do corrimão de trás (canto
## esquerdo, como no mapa); front: base do corrimão da frente; span: largura da arte do corrimão.
static func attach(root: Node2D,back: Vector2,front: Vector2,span: float) -> Sprite2D:
	var top:=int(round(back.y))-6
	var width:=int(round(span))-16
	var height:=int(round(front.y))+1-top
	var s:=Sprite2D.new()
	s.name="Tabuleiro da ponte"
	s.centered=false
	s.texture=deck(width,height)
	s.position=Vector2(round(back.x),top)
	s.z_index=-7
	s.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
	root.add_child(s)
	return s
