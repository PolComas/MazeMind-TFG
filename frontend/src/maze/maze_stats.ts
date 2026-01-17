import type { Level, Grid } from './maze_generator';

export type Pos = { x: number; y: number };

export type MazeAnalysis = {
  width: number;
  height: number;
  totalCells: number;
  intersections: number;
  intersectionDensity: number;
  deadEnds: number;
  optimalPathLength: number;
  optimalPathTurns: number;
  pathCells: Pos[];
};

const DIRS: Array<{ dx: number; dy: number; wall: 'top' | 'right' | 'bottom' | 'left' }> = [
  { dx: 0, dy: -1, wall: 'top' },
  { dx: 1, dy: 0, wall: 'right' },
  { dx: 0, dy: 1, wall: 'bottom' },
  { dx: -1, dy: 0, wall: 'left' },
];

const OPP: Record<'top'|'right'|'bottom'|'left','top'|'right'|'bottom'|'left'> =
  { top:'bottom', right:'left', bottom:'top', left:'right' };

const getNeighbors = (grid: Grid, pos: Pos) => {
  const neighbors: Pos[] = [];
  const cell = grid[pos.y][pos.x];
  for (const dir of DIRS) {
    const nx = pos.x + dir.dx, ny = pos.y + dir.dy;
    if (nx < 0 || ny < 0 || ny >= grid.length || nx >= grid[0].length) continue;
    const ncell = grid[ny][nx];
    if (!cell.walls[dir.wall] && !ncell.walls[OPP[dir.wall]]) {
      neighbors.push({ x: nx, y: ny });
    }
  }
  return neighbors;
};


const bfsShortestPath = (grid: Grid, start: Pos, goal: Pos) => {
  const queue: Pos[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const prev = new Map<string, Pos>();

  while (queue.length) {
    const current = queue.shift()!;
    if (current.x === goal.x && current.y === goal.y) {
      break;
    }

    for (const next of getNeighbors(grid, current)) {
      const key = `${next.x},${next.y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      prev.set(key, current);
      queue.push(next);
    }
  }

  const path: Pos[] = [];
  let cursor: Pos | undefined = goal;
  while (cursor) {
    path.push(cursor);
    if (cursor.x === start.x && cursor.y === start.y) break;
    const key = `${cursor.x},${cursor.y}`;
    cursor = prev.get(key);
  }

  return path.reverse();
};

export const getTurnPositions = (path: Pos[]): Pos[] => {
  const turns: Pos[] = [];
  if (path.length < 3) return turns;
  let prevDx = path[1].x - path[0].x;
  let prevDy = path[1].y - path[0].y;

  for (let i = 2; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    if (dx !== prevDx || dy !== prevDy) {
      turns.push(path[i - 1]); // la cel·la on es produeix el gir
      prevDx = dx;
      prevDy = dy;
    }
  }
  return turns;
};


const countTurns = (path: Pos[]) => {
  if (path.length < 2) return 0;
  let turns = 0;
  let prevDx = path[1].x - path[0].x;
  let prevDy = path[1].y - path[0].y;

  for (let i = 2; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    if (dx !== prevDx || dy !== prevDy) {
      turns += 1;
      prevDx = dx;
      prevDy = dy;
    }
  }

  return turns;
};

export const analyzeLevel = (level: Level): MazeAnalysis => {
  const { maze } = level;
  const totalCells = level.width * level.height;

  let intersections = 0;
  let deadEnds = 0;

  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const degree = getNeighbors(maze, { x, y }).length;
      if (degree >= 3) intersections += 1;
      if (degree === 1) deadEnds += 1;
    }
  }

  const pathCells = bfsShortestPath(maze, level.start, level.exit);
  const optimalPathLength = Math.max(0, pathCells.length - 1);
  const optimalPathTurns = countTurns(pathCells);

  return {
    width: level.width,
    height: level.height,
    totalCells,
    intersections,
    intersectionDensity: intersections / totalCells,
    deadEnds,
    optimalPathLength,
    optimalPathTurns,
    pathCells,
  };
};
