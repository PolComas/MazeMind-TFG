extends CharacterBody2D

@export var speed = 8000.0 

func _physics_process(delta): 
	var input_direction = Input.get_vector("left", "right","up","down")
	
	velocity.x = input_direction.x * speed * delta
	velocity.y = input_direction.y * speed * delta
	
	move_and_slide() 
