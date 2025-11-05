import { useEffect, useRef } from 'react'
import type { Level } from '../maze/maze_generator'

type Pos = { x: number; y: number }

// Tipus per a les props del component MazeCanvas
type Props = {
  level: Level  
  phase?: 'memorize' | 'playing' | 'completed' | 'failed'
  playerPos?: Pos
  settings?: {
    path_color?: string
    wall_color?: string
    wall_thickness?: number
    exit_color?: string
    player_color?: string
    player_path_color?: string;
    crash_help_color?: string;
  }
  // Props per a les ajudes 
  showReveal?: boolean
  showPlayerPath?: boolean
  crashPosition?: Pos | null
  forcePathHistory?: Pos[] // Per el preview de LevelScreenSettings
}

// Renderitzar el laberint en un canvas HTML5
export default function MazeCanvas({ 
  level, 
  phase = 'memorize', 
  playerPos, 
  settings = {},
  showReveal = false,
  showPlayerPath = false,
  crashPosition = null,
  forcePathHistory,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Guardar les posicions del jugador per dibuixar el camí
  const pathHistoryRef = useRef<Pos[]>([])
  
  // Configuració per defecte
  const s = {
    path_color: '#EEF2FF',
    wall_color: '#3B82F6',
    wall_thickness: 3,
    exit_color: '#F59E0B',
    player_color: '#111',
    player_path_color: 'rgba(0, 0, 0, 0.4)',
    crash_help_color: '#E11D48',
    ...settings,
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Netejar l'historial si el joc es reinicia
    if (phase === 'memorize') {
      pathHistoryRef.current = []
    }

    // Afegir la posició actual a l'historial si canvia
    let currentPath: Pos[] = [];
    if (forcePathHistory) {
      // Per al preview, utilitzem l'historial forçat
      currentPath = forcePathHistory;
    } else {
      // Comportament normal: construir l'historial dinàmicament
      if (phase === 'memorize') {
        pathHistoryRef.current = []
      }
      if (playerPos) {
        const lastPos = pathHistoryRef.current[pathHistoryRef.current.length - 1]
        if (!lastPos || lastPos.x !== playerPos.x || lastPos.y !== playerPos.y) {
          pathHistoryRef.current.push(playerPos)
        }
      }
      currentPath = pathHistoryRef.current;
    }

    // Dibuixar el laberint
    const draw = () => {
      const parent = canvas.parentElement!
      const size = Math.min(parent.clientWidth, parent.clientHeight)
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')!
      const cell = size / level.width

      // Fons
      ctx.fillStyle = s.path_color
      ctx.fillRect(0, 0, size, size)

      // Sortida
      const ex = level.exit.x * cell, ey = level.exit.y * cell  
      const sz = cell * 0.7, pad = (cell - sz) / 2  
      ctx.fillStyle = s.exit_color
      ctx.roundRect?.(ex + pad, ey + pad, sz, sz, cell * 0.15) ?? ctx.fillRect(ex + pad, ey + pad, sz, sz)
      ctx.fill()

      // Camí del jugador
      if (phase === 'playing' && showPlayerPath && currentPath.length > 1) {
        ctx.strokeStyle = s.player_path_color
        ctx.lineWidth = s.wall_thickness 
        ctx.globalAlpha = 0.4 
        ctx.beginPath()
        const start = currentPath[0]
        ctx.moveTo(start.x * cell + cell / 2, start.y * cell + cell / 2)
        for (const pos of currentPath.slice(1)) {
          ctx.lineTo(pos.x * cell + cell / 2, pos.y * cell + cell / 2)
        }
        ctx.stroke()
        ctx.globalAlpha = 1.0
      }

      // Parets (si 'memorize' o 'showReveal' és true)
      if (phase === 'memorize' || showReveal) {
        ctx.strokeStyle = s.wall_color
        ctx.lineWidth = s.wall_thickness
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        for (let y = 0; y < level.height; y++) {
          for (let x = 0; x < level.width; x++) {
            const c = level.maze[y][x]  
            const px = x * cell 
            const py = y * cell  
            ctx.beginPath()
            if (c.walls.top) { ctx.moveTo(px, py); ctx.lineTo(px + cell, py) }
            if (c.walls.right) { ctx.moveTo(px + cell, py); ctx.lineTo(px + cell, py + cell) }
            if (c.walls.bottom) { ctx.moveTo(px, py + cell); ctx.lineTo(px + cell, py + cell) }
            if (c.walls.left) { ctx.moveTo(px, py); ctx.lineTo(px, py + cell) }
            ctx.stroke()
          }
        }
      }

      // Ajuda de Xoc: destacar les parets en la zona 3x3 al voltant de la cel·la de xoc
      if (phase === 'playing' && crashPosition) {
        ctx.strokeStyle = s.crash_help_color
        ctx.lineWidth = s.wall_thickness + 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        const { x, y } = crashPosition

        // Iterar la regió 3x3 centrada a (x,y) per dibuixar les parets dels veïns
        for (let ny = y - 1; ny <= y + 1; ny++) {
          for (let nx = x - 1; nx <= x + 1; nx++) {
            if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height) continue
            const cellObj = level.maze[ny][nx]
            const px = nx * cell
            const py = ny * cell
            ctx.beginPath()
            // Dibuixar les parets presents a la cel·la veïna
            if (cellObj.walls.top) { ctx.moveTo(px, py); ctx.lineTo(px + cell, py) }
            if (cellObj.walls.right) { ctx.moveTo(px + cell, py); ctx.lineTo(px + cell, py + cell) }
            if (cellObj.walls.bottom) { ctx.moveTo(px, py + cell); ctx.lineTo(px + cell, py + cell) }
            if (cellObj.walls.left) { ctx.moveTo(px, py); ctx.lineTo(px, py + cell) }
            ctx.stroke()
          }
        }
      }

      // Jugador
      if ((phase === 'playing' || phase === 'memorize') && playerPos) {
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

  // Actualitzar dependències
  }, [
    level, phase, playerPos, 
    showReveal, showPlayerPath, crashPosition,
    s.path_color, s.wall_color, s.wall_thickness, s.exit_color, s.player_color,
    s.player_path_color, s.crash_help_color,
    forcePathHistory
  ])

  // Renderitza el canvas
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
}
