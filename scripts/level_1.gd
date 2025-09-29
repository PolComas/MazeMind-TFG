extends Node2D
# ---------------- Paràmetres del laberint ----------------
var ROWS := 0
var COLS := 0

# Gruix visual de les parets
const WALL_THICKNESS_FRAC := 0.45
const MIN_PATH_PX := 12

# Temps de previsualització
const PREVIEW_TIME := 20.0

# Codis de cel·la
const PATH := 0
const WALL := 1
const BORDER := 2

# ---------------- Colors ----------------
const WALL_COLOR  := Color("#333333")
const PATH_COLOR  := Color("#EEEEEE")
const ENTRY_COLOR := Color("#65C466")
const EXIT_COLOR  := Color("#3A86FF")
const PLAYER_COLOR := Color("#111111")

# ---------------- Estat ----------------
var maze: Array = [] # grid: 0=path, 1=wall, 2=border
var entry := Vector2i(1, 1)   
var exit  := Vector2i(0, 0)  
var player := Vector2i(0, 1)

var cell_px := 20
var origin  := Vector2.ZERO
var invisible := false

func _ready() -> void:
	get_viewport().connect("size_changed", Callable(self, "_on_size_changed"))
	load_level("res://autoloads/laberint_1.json")
	_fit_to_screen()
	_start_preview()
	queue_redraw()

func _on_size_changed() -> void:
	_fit_to_screen()
	queue_redraw()

# Funció per carregar un laberint des d'un fitxer JSON
func load_level(path:String) -> bool:
	var f := FileAccess.open(path, FileAccess.READ)
	var data : Variant = JSON.parse_string(f.get_as_text())
	f.close()
	
	ROWS = int(data.get("rows", 0))
	COLS = int(data.get("cols", 0))
	maze = data.get("grid", [])
	if ROWS == 0 or COLS == 0 or maze.is_empty():
		ROWS = maze.size()
		COLS = maze[0].size() if ROWS > 0 else 0
	
	var e:Array = data["entry"]
	var x:Array = data["exit"]
	entry = Vector2i(int(e[0]), int(e[1]))
	exit  = Vector2i(int(x[0]), int(x[1]))

	player = entry
	return true

# ---------- Preview → Joc ----------
func _start_preview() -> void:
	invisible = false
	queue_redraw()
	var t := get_tree().create_timer(PREVIEW_TIME)
	await t.timeout
	invisible = true
	queue_redraw()

# Config UI
const HUD_H := 56                 # alçada de la franja de UI (instruccions, temps...)
const MARGIN := 16                # marge al voltant del tauler

# ---------- Escalat ----------
func _fit_to_screen() -> void:
	var vp := get_viewport_rect().size
	var board_size := Vector2(
		max(1.0, vp.x - 2.0*MARGIN),
		max(1.0, vp.y - (2.0*MARGIN + HUD_H))
	)

	# escalar cel·la al millor que càpiga dins el "board"
	cell_px = int(floor(min(board_size.x / COLS, board_size.y / ROWS)))
	cell_px = max(cell_px, 1)

	var maze_w := COLS * cell_px
	var maze_h := ROWS * cell_px

	# origen: marges + HUD (si el poses a dalt); centra el laberint dins el board
	origin = Vector2(
		MARGIN + (board_size.x - maze_w) * 0.5,
		MARGIN + HUD_H + (board_size.y - maze_h) * 0.5
	)


# ---------- Dibuix ----------
func _path_rect(cell_rect: Rect2) -> Rect2:
	var inset := int(round(cell_px * WALL_THICKNESS_FRAC))
	var w := cell_rect.size.x - inset*2
	var h := cell_rect.size.y - inset*2
	if w < MIN_PATH_PX:
		inset = max(0, int(floor((cell_rect.size.x - MIN_PATH_PX) * 0.5)))
	if h < MIN_PATH_PX:
		inset = max(inset, int(floor((cell_rect.size.y - MIN_PATH_PX) * 0.5)))
	return Rect2(cell_rect.position + Vector2(inset, inset),
				 cell_rect.size - Vector2(inset*2, inset*2))

func _draw() -> void:
	if ROWS == 0 or COLS == 0:
		return
	# Fons
	draw_rect(Rect2(Vector2.ZERO, get_viewport_rect().size), Color(0.95,0.95,0.95))

	for y in range(ROWS):
		for x in range(COLS):
			var cell := Rect2(origin.x + x*cell_px, origin.y + y*cell_px, cell_px, cell_px)
			var v:int = maze[y][x]
			
			if not invisible:
				# PREVIEW: es veuen parets interiors i de contorn; el camí amb inset
				if v == WALL or v == BORDER:
					draw_rect(cell, WALL_COLOR)
				else: # PATH
					draw_rect(_path_rect(cell), PATH_COLOR)
			else:
				# JOC: parets interiors invisibles -> es pinta com el camí
				# Bordes continuen visibles
				if v == BORDER:
					draw_rect(cell, WALL_COLOR)
				else:
					draw_rect(_path_rect(cell), PATH_COLOR)

	# Entrada/sortida: només en preview 
	if not invisible:
		var e_cell := Rect2(origin.x + entry.x*cell_px, origin.y + entry.y*cell_px, cell_px, cell_px)
		var x_cell := Rect2(origin.x + exit.x*cell_px,  origin.y + exit.y*cell_px,  cell_px, cell_px)
		draw_rect(_path_rect(e_cell), ENTRY_COLOR)
		draw_rect(_path_rect(x_cell), EXIT_COLOR)

	# Jugador: només quan comença el joc
	if invisible:
		var pcenter := origin + Vector2(player.x * cell_px + cell_px*0.5, player.y * cell_px + cell_px*0.5)
		draw_circle(pcenter, max(4.0, cell_px * 0.3), PLAYER_COLOR)

# ---------- Input ----------
func _unhandled_input(event: InputEvent) -> void:
	if not invisible:
		return # durant la previsualització, no es pot moure ni es mostra l'esfera
		
	var dir := Vector2i.ZERO
	if event.is_action_pressed("ui_up"):    dir = Vector2i(0,-1)
	if event.is_action_pressed("ui_down"):  dir = Vector2i(0, 1)
	if event.is_action_pressed("ui_left"):  dir = Vector2i(-1,0)
	if event.is_action_pressed("ui_right"): dir = Vector2i(1, 0)
	if dir != Vector2i.ZERO:
		_try_step(dir)

func _try_step(dir:Vector2i) -> void:
	var target := player + dir
	if target.x < 0 or target.x >= COLS or target.y < 0 or target.y >= ROWS:
		return
	if maze[target.y][target.x] == PATH:
		player = target
		queue_redraw()
		if player == Vector2i(exit.x + (1 if exit.x == 0 else -1), exit.y) or player == Vector2i(exit.x, exit.y + (1 if exit.y == 0 else -1)) or player == Vector2i(exit.x, exit.y):
			print("Nivell completat!")
