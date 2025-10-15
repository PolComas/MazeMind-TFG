extends Control


func _on_play_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/levels/level_1.tscn")
	#get_tree().change_scene_to_file("res://actors/player/Player.tscn")


#func _on_options_pressed() -> void:
	#pass # Replace with function body.

func _on_options_pressed() -> void:
	# 1. Carrega el fitxer de l'script com un recurs
	var maze_generator_script = load("res://scripts/maze_generator.gd")

	# 2. Crea una nova instància del tipus de node que l'script espera (Node2D)
	var generator_node = Node2D.new()

	# 3. Assigna l'script a la instància del node que acabem de crear
	generator_node.set_script(maze_generator_script)

	# 4. AFEGEIX EL NODE A L'ESCENA ACTUAL. AQUEST ÉS EL PAS CLAU!
	# En aquest moment, la funció _ready() del teu generador s'executarà.
	add_child(generator_node)
	
	# 5. (Opcional, però recomanat) Un cop ha fet la seva feina, ja no el necessitem.
	# El marquem per ser eliminat de forma segura al final del fotograma.
	generator_node.queue_free()

	print("S'ha executat el generador de laberints!")

func _on_exit_pressed() -> void:
	get_tree().quit()
