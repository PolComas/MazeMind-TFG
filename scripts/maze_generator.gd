extends Node2D

# ---------------- Paràmetres del laberint ----------------
const ROWS := 11
const COLS := 19

# Codis de cel·la
const PATH := 0
const WALL := 1
const BORDER := 2   

# ---------------- Estat ----------------
var maze: Array = []                 # grid: 0=path, 1=wall, 2=border
var entry := Vector2i(1, 1)
var exit  := Vector2i(COLS-2, ROWS-2)

func _ready() -> void:
	_initialize_maze()
	_generate_maze()
	_apply_borders()
	_save_level("res://autoloads/laberint_1.json")

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

# Funcions per desar l'array del laberint a un fitxer JSON	
func to_dict() -> Dictionary:
	return {
		"rows": ROWS,
		"cols": COLS,
		"entry": [entry.x, entry.y],
		"exit":  [exit.x,  exit.y],
		"grid":  maze
	}

func _save_level(path:String) -> void:
	var txt := JSON.stringify(to_dict(), "  ")
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f == null:
		push_error("No puc escriure: " + path)
		return
	f.store_string(txt)
	f.close()
	print("Desat: " + path)
