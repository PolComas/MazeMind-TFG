export type Dir = 'top' | 'right' | 'bottom' | 'left' 
export type Cell = { walls: Record<Dir, boolean>; visited: boolean } // Parets i si ha estat visitada
export type Grid = Cell[][]

export type Diff = 'easy' | 'normal' | 'hard';

// Tipus per a un nivell complet del joc
export type Level = {
  id: string  
  number: number  
  difficulty: Diff;
  width: number 
  height: number  
  maze: Grid  
  memorizeTime: number
  starThresholds: readonly number[]
  start: { x: number; y: number }
  exit: { x: number; y: number } 
}

// Generador de laberints utilitzant l'algorisme de backtracking recursiu
export class MazeGenerator {
  width: number
  height: number
  grid: Grid = []

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  generate(): Grid {
    // Inicialitza la graella amb totes les parets presents i cap cel·la visitada
    this.grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ({
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      }))
    )

    // Pila per al backtracking
    const stack: { x: number; y: number }[] = []
    // Inicia des de la cantonada superior esquerra
    const startX = 0, startY = 0
    this.grid[startY][startX].visited = true
    stack.push({ x: startX, y: startY })

    // Algorisme principal: mentre hi hagi elements a la pila
    while (stack.length) {
      const cur = stack[stack.length - 1]  // Cel·la actual (cim de la pila)
      const nbs = this.getUnvisitedNeighbors(cur.x, cur.y)  // Veïns no visitats

      if (nbs.length) {
        // Escull un veí aleatori
        const next = nbs[Math.floor(Math.random() * nbs.length)]
        // Treu la paret entre la cel·la actual i la següent
        this.removeWall(cur, next)
        // Marca la següent com visitada i afegeix a la pila
        this.grid[next.y][next.x].visited = true
        stack.push({ x: next.x, y: next.y })
      } else {
        // No hi ha veïns no visitats, torna enrere
        stack.pop()
      }
    }
    return this.grid
  }

  // Retorna la llista de veïns no visitats d'una cel·la
  private getUnvisitedNeighbors(x: number, y: number) {
    const n: { x: number; y: number; dir: Dir }[] = []
    // Comprova cada direcció si està dins dels límits i no visitada
    if (y > 0 && !this.grid[y - 1][x].visited) n.push({ x, y: y - 1, dir: 'top' })
    if (x < this.width - 1 && !this.grid[y][x + 1].visited) n.push({ x: x + 1, y, dir: 'right' })
    if (y < this.height - 1 && !this.grid[y + 1][x].visited) n.push({ x, y: y + 1, dir: 'bottom' })
    if (x > 0 && !this.grid[y][x - 1].visited) n.push({ x: x - 1, y, dir: 'left' })
    return n
  }

  // Treu la paret entre dues cel·les adjacents
  private removeWall(a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = b.x - a.x  
    const dy = b.y - a.y  
    if (dx === 1) {  // Moviment cap a la dreta
      this.grid[a.y][a.x].walls.right = false
      this.grid[b.y][b.x].walls.left = false
    } else if (dx === -1) {  // Moviment cap a l'esquerra
      this.grid[a.y][a.x].walls.left = false
      this.grid[b.y][b.x].walls.right = false
    } else if (dy === 1) {  // Moviment cap avall
      this.grid[a.y][a.x].walls.bottom = false
      this.grid[b.y][b.x].walls.top = false
    } else if (dy === -1) {  // Moviment cap amunt
      this.grid[a.y][a.x].walls.top = false
      this.grid[b.y][b.x].walls.bottom = false
    }
  }
}

// Paràmetres per generar un nivell
export type LevelParams = {
  width: number;  // Amplada del laberint
  height: number;  // Alçada del laberint
  difficulty: Diff;  // Dificultat del nivell
  memorizeTime: number;  // Temps de memorització
  stars: readonly number[];  // Llindars d'estrelles
  levelNumber: number;  // Número del nivell
};

// Funció per generar un nivell complet amb laberint
export function generateLevel(params: LevelParams): Level {
  const gen = new MazeGenerator(params.width, params.height);
  
  return {
    id: `${params.difficulty}-level-${params.levelNumber}`,
    number: params.levelNumber,
    difficulty: params.difficulty,
    maze: gen.generate(), 
    width: params.width,
    height: params.height,
    memorizeTime: params.memorizeTime,
    starThresholds: params.stars,
    start: { x: 0, y: 0 },  
    exit: { x: params.width - 1, y: params.height - 1 },
  };
}

