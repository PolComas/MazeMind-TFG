import { useEffect, useRef } from 'react'
import type { Level } from '../maze/maze_generator'

// Tipus per a les props del component MazeCanvas
type Props = {
  level: Level  
  phase?: 'memorize' | 'playing' | 'completed'  
  playerPos?: { x: number; y: number } 
  settings?: {  // Configuracions opcionals per colors i estils
    path_color?: string
    wall_color?: string
    wall_thickness?: number
    exit_color?: string
    player_color?: string
    revealNearby?: boolean
  }
}

// Renderitzar el laberint en un canvas HTML5
export default function MazeCanvas({ level, phase = 'memorize', playerPos, settings = {} }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Configuració per defecte
  const s = {
    path_color: '#EEF2FF',
    wall_color: '#3B82F6',
    wall_thickness: 3,
    exit_color: '#F59E0B',
    player_color: '#111',
    revealNearby: false,
    ...settings,
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Dibuixar el laberint
    const draw = () => {
      const parent = canvas.parentElement!
      const size = Math.min(parent.clientWidth, parent.clientHeight)  // Mida quadrada basada en el contenidor
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')!
      const cell = size / level.width  // Mida de cada cel·la del laberint

      ctx.fillStyle = s.path_color
      ctx.fillRect(0, 0, size, size)

      // Dibuixa les parets si estem en fase de memorització o si revealNearby és actiu
      if (phase === 'memorize' || s.revealNearby) {
        ctx.strokeStyle = s.wall_color
        ctx.lineWidth = s.wall_thickness
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        // Itera per cada cel·la del laberint
        for (let y = 0; y < level.height; y++) {
          for (let x = 0; x < level.width; x++) {
            const c = level.maze[y][x]  
            const px = x * cell 
            const py = y * cell  
            ctx.beginPath()
            // Dibuixa cada paret si existeix
            if (c.walls.top) { ctx.moveTo(px, py); ctx.lineTo(px + cell, py) }
            if (c.walls.right) { ctx.moveTo(px + cell, py); ctx.lineTo(px + cell, py + cell) }
            if (c.walls.bottom) { ctx.moveTo(px, py + cell); ctx.lineTo(px + cell, py + cell) }
            if (c.walls.left) { ctx.moveTo(px, py); ctx.lineTo(px, py + cell) }
            ctx.stroke()
          }
        }
      }

      // Dibuixa la sortida com un rectangle 
      const ex = level.exit.x * cell, ey = level.exit.y * cell  
      const sz = cell * 0.7, pad = (cell - sz) / 2  
      ctx.fillStyle = s.exit_color
      
      ctx.roundRect?.(ex + pad, ey + pad, sz, sz, cell * 0.15) ?? ctx.fillRect(ex + pad, ey + pad, sz, sz)
      ctx.fill()

      // Dibuixa el jugador com una bola rodona si estem en fase de joc
      if (phase === 'playing' && playerPos) {
        const px = playerPos.x * cell + cell / 2  
        const py = playerPos.y * cell + cell / 2
        const radius = cell * 0.3
        ctx.fillStyle = s.player_color
        ctx.beginPath()
        ctx.arc(px, py, radius, 0, 2 * Math.PI)
        ctx.fill()
      }
    }

    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [level, phase, playerPos, s.path_color, s.wall_color, s.wall_thickness, s.exit_color, s.player_color])

  // Renderitza el canvas amb estils per omplir l'espai i radi de cantonades
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
}
