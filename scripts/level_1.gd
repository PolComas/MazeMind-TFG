extends Node2D

# ---------------- Paràmetres del laberint ----------------
const ROWS := 11
const COLS := 11

# Gruix visual de les parets
const WALL_THICKNESS_FRAC := 0.45
const MIN_PATH_PX := 12

# Temps de previsualització
const PREVIEW_TIME := 5.0

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
var maze: Array = []                 # grid: 0=path, 1=wall, 2=border
var entry := Vector2i(1, 1)
var exit  := Vector2i(COLS-2, ROWS-2)
var player := Vector2i(1, 1)

var cell_px := 20
var origin  := Vector2.ZERO

var invisible := false      
var preview_timer: SceneTreeTimer

func _ready() -> void:
	get_viewport().connect("size_changed", Callable(self, "_on_size_changed"))
	_initialize_maze()
	_generate_maze()
	_apply_borders()
	_fit_to_screen()
	_start_preview()
	queue_redraw()

func _on_size_changed() -> void:
	_fit_to_screen()
	queue_redraw()

# ---------------- Generació ----------------
func _initialize_maze() -> void:
	maze.clear()
	for r in range(ROWS):
		var row := []
		for c in range(COLS):
			row.append(WALL) # tot paret interior (després posarem bordes)
		maze.append(row)

func _generate_maze() -> void:
	# reinicia interior com a paret
	for r in range(ROWS):
		for c in range(COLS):
			maze[r][c] = WALL

	# DFS
	var start_r := 1
	var start_c := 1
	maze[start_r][start_c] = PATH
	_carve_passages(start_r, start_c)

	# Entrada (mur esquerre) i sortida (mur dret)
	entry = Vector2i(0, 1)
	exit  = Vector2i(COLS - 1, ROWS - 2)

	# Entrada i sortida
	maze[entry.y][0] = PATH
	maze[entry.y][1] = PATH
	maze[exit.y][COLS-1] = PATH
	maze[exit.y][COLS-2] = PATH

	# Col·loca jugador
	player = entry

func _apply_borders() -> void:
	# Marca tot el perímetre com a BORDER 
	for x in range(COLS):
		if maze[0][x] != PATH:             maze[0][x] = BORDER
		if maze[ROWS-1][x] != PATH:        maze[ROWS-1][x] = BORDER
	for y in range(ROWS):
		if maze[y][0] != PATH:             maze[y][0] = BORDER
		if maze[y][COLS-1] != PATH:        maze[y][COLS-1] = BORDER

func _carve_passages(r:int, c:int) -> void:
	var directions = [Vector2i(-2,0), Vector2i(0,2), Vector2i(2,0), Vector2i(0,-2)]
	directions.shuffle()
	for d in directions:
		var nr : int = r + d.y
		var nc : int = c + d.x
		if nr > 0 and nr < ROWS-1 and nc > 0 and nc < COLS-1 and maze[nr][nc] == WALL:
			maze[r + d.y/2][c + d.x/2] = PATH
			maze[nr][nc] = PATH
			_carve_passages(nr, nc)

# ---------------- Preview → Joc ----------------
func _start_preview() -> void:
	invisible = false
	queue_redraw()
	preview_timer = get_tree().create_timer(PREVIEW_TIME)
	await preview_timer.timeout
	invisible = true
	queue_redraw()

# ---------------- Escalat ----------------
func _fit_to_screen() -> void:
	var sw := get_viewport_rect().size.x
	var sh := get_viewport_rect().size.y
	cell_px = int(floor(min(sw / COLS, sh / ROWS)))
	cell_px = max(cell_px, 1)
	var maze_w := COLS * cell_px
	var maze_h := ROWS * cell_px
	origin = Vector2((sw - maze_w) * 0.5, (sh - maze_h) * 0.5)

# ---------------- Dibuix ----------------
func _path_rect(cell_rect: Rect2) -> Rect2:
	var inset := int(round(cell_px * WALL_THICKNESS_FRAC))
	# Mantenir amplada mínima del camí
	var w := cell_rect.size.x - inset*2
	var h := cell_rect.size.y - inset*2
	if w < MIN_PATH_PX:
		inset = max(0, int(floor((cell_rect.size.x - MIN_PATH_PX) * 0.5)))
	if h < MIN_PATH_PX:
		inset = max(inset, int(floor((cell_rect.size.y - MIN_PATH_PX) * 0.5)))
	return Rect2(cell_rect.position + Vector2(inset, inset),
				 cell_rect.size - Vector2(inset*2, inset*2))

func _draw() -> void:
	# Fons
	draw_rect(Rect2(Vector2.ZERO, get_viewport_rect().size), Color(0.95,0.95,0.95))

	for r in range(ROWS):
		for c in range(COLS):
			var cell := Rect2(origin.x + c*cell_px, origin.y + r*cell_px, cell_px, cell_px)
			var v : int = maze[r][c]

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
		var e_cell := Rect2(origin.x + 0*cell_px, origin.y + entry.y*cell_px, cell_px, cell_px)
		var x_cell := Rect2(origin.x + (COLS-1)*cell_px, origin.y + exit.y*cell_px, cell_px, cell_px)
		draw_rect(_path_rect(e_cell), ENTRY_COLOR)
		draw_rect(_path_rect(x_cell), EXIT_COLOR)

	# Jugador: només quan comença el joc
	if invisible:
		var pcenter := origin + Vector2(player.x * cell_px + cell_px*0.5, player.y * cell_px + cell_px*0.5)
		draw_circle(pcenter, max(4.0, cell_px * 0.3), PLAYER_COLOR)

# ---------------- Input ----------------
func _unhandled_input(event: InputEvent) -> void:
	if not invisible:
		return  # durant la previsualització, no es pot moure ni es mostra l'esfera

	var dir := Vector2i.ZERO
	if event.is_action_pressed("ui_up"):    dir = Vector2i(0, -1)
	if event.is_action_pressed("ui_down"):  dir = Vector2i(0,  1)
	if event.is_action_pressed("ui_left"):  dir = Vector2i(-1, 0)
	if event.is_action_pressed("ui_right"): dir = Vector2i(1,  0)
	if dir != Vector2i.ZERO:
		_try_step(dir)

func _try_step(dir:Vector2i) -> void:
	var target := player + dir
	if target.x < 0 or target.x >= COLS or target.y < 0 or target.y >= ROWS:
		return
	# Només caminar per camí (PATH); els BORDER queden com a paret visible
	if maze[target.y][target.x] == PATH:
		player = target
		queue_redraw()
		if player == exit:
			print("Nivell completat!")
