/**
 * Tipus base del domini de laberints.
 */
export type Dir = 'top' | 'right' | 'bottom' | 'left'
export type Cell = { walls: Record<Dir, boolean>; visited?: boolean } // Parets i si ha estat visitada
export type Grid = Cell[][]

export type Diff = 'easy' | 'normal' | 'hard';

/** Entitat de nivell consumida per la resta de pantalles del joc. */
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

/** PRNG determinista (Mulberry32) amb entrada numèrica o textual. */
class PRNG {
  private state: number;

  constructor(seed: string | number) {
    if (typeof seed === 'string') {
      // Converteix seed textual a enter de 32 bits.
      let h = 0xdeadbeef;
      for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
        h = ((h ^ (h >>> 16)) * 2246822507) >>> 0;
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        this.state = (h ^ (h >>> 16)) >>> 0;
      }
      this.state = h; // Fallback assign
    } else {
      this.state = seed >>> 0;
    }
  }

  /** Retorna un valor pseudoaleatori en rang [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/**
 * Generador de laberints "perfectes" (sense cicles) via DFS + backtracking.
 */
export class MazeGenerator {
  width: number
  height: number
  grid: Grid = []
  private prng: PRNG;

  constructor(width: number, height: number, seed?: string | number) {
    this.width = width
    this.height = height
    // Si no hi ha seed, usa una seed temporal.
    this.prng = new PRNG(seed ?? Date.now());
  }

  /** Construeix i retorna una graella de laberint nova. */
  generate(): Grid {
    // Inicialitza la graella amb totes les parets presents i cap cel·la visitada
    this.grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ({
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      }))
    )

    // Pila explícita per al backtracking iteratiu.
    const stack: { x: number; y: number }[] = []
    // Punt d'inici fix.
    const startX = 0, startY = 0
    this.grid[startY][startX].visited = true
    stack.push({ x: startX, y: startY })

    // Bucle principal del DFS.
    while (stack.length) {
      const cur = stack[stack.length - 1]  // Cel·la actual
      const nbs = this.getUnvisitedNeighbors(cur.x, cur.y)  // Veïns pendents

      if (nbs.length) {
        // Selecció pseudoaleatòria del següent veí.
        const next = nbs[Math.floor(this.prng.next() * nbs.length)]
        // Obre pas entre cel·les adjacents.
        this.removeWall(cur, next)
        // Avança en profunditat.
        this.grid[next.y][next.x].visited = true
        stack.push({ x: next.x, y: next.y })
      } else {
        // Sense opcions: retrocedeix.
        stack.pop()
      }
    }
    return this.grid
  }

  /** Retorna veïns vàlids no visitats de la cel·la indicada. */
  private getUnvisitedNeighbors(x: number, y: number) {
    const n: { x: number; y: number; dir: Dir }[] = []
    // Comprova límits i estat de visita a cada direcció.
    if (y > 0 && !this.grid[y - 1][x].visited) n.push({ x, y: y - 1, dir: 'top' })
    if (x < this.width - 1 && !this.grid[y][x + 1].visited) n.push({ x: x + 1, y, dir: 'right' })
    if (y < this.height - 1 && !this.grid[y + 1][x].visited) n.push({ x, y: y + 1, dir: 'bottom' })
    if (x > 0 && !this.grid[y][x - 1].visited) n.push({ x: x - 1, y, dir: 'left' })
    return n
  }

  /** Obre la paret compartida entre dues cel·les adjacents. */
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

/** Paràmetres d'entrada per generar un nivell complet. */
export type LevelParams = {
  width: number;  // Amplada del laberint
  height: number;  // Alçada del laberint
  difficulty: Diff;  // Dificultat del nivell
  memorizeTime: number;  // Temps de memorització
  stars: readonly number[];  // Llindars d'estrelles
  levelNumber: number;  // Número del nivell
  seed?: string | number; // Seed opcional per a generació determinista
};

/** Genera un nivell consistent a partir dels paràmetres rebuts. */
export function generateLevel(params: LevelParams): Level {
  const gen = new MazeGenerator(params.width, params.height, params.seed);

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
