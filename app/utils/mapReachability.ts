import { Direction, Obstacle, Point } from "./types";

export function pointKey(p: Point): string {
  return `${p.x},${p.y}`;
}

export function buildSafeZone(
  cols: number,
  rows: number,
  snake: Point[],
  dir: Direction
): Set<string> {
  const safe = new Set<string>();
  const head = snake[0];

  for (const seg of snake) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = seg.x + dx;
        const ny = seg.y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          safe.add(`${nx},${ny}`);
        }
      }
    }
  }

  for (let step = 1; step <= 5; step++) {
    const cx = head.x + dir.x * step;
    const cy = head.y + dir.y * step;
    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
      safe.add(`${cx},${cy}`);
      const lx = cx + (dir.y !== 0 ? 1 : 0);
      const ly = cy + (dir.x !== 0 ? 1 : 0);
      const rx = cx - (dir.y !== 0 ? 1 : 0);
      const ry = cy - (dir.x !== 0 ? 1 : 0);
      if (lx >= 0 && lx < cols && ly >= 0 && ly < rows) safe.add(`${lx},${ly}`);
      if (rx >= 0 && rx < cols && ry >= 0 && ry < rows) safe.add(`${rx},${ry}`);
    }
  }

  return safe;
}

/**
 * BFS flood fill returning all reachable cells from start, avoiding blocked keys.
 */
export function getReachableCells(
  cols: number,
  rows: number,
  start: Point,
  blocked: Set<string>
): Set<string> {
  const visited = new Set<string>();
  const queue: Point[] = [];
  const startKey = pointKey(start);
  if (blocked.has(startKey)) return visited;

  visited.add(startKey);
  queue.push(start);

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  let headIdx = 0;
  while (headIdx < queue.length) {
    const curr = queue[headIdx++];
    for (const d of dirs) {
      const nx = curr.x + d.x;
      const ny = curr.y + d.y;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      const key = `${nx},${ny}`;
      if (blocked.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }

  return visited;
}

function countOpenNeighbors(
  x: number,
  y: number,
  cols: number,
  rows: number,
  blocked: Set<string>
): number {
  let count = 0;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !blocked.has(`${nx},${ny}`)) {
      count++;
    }
  }
  return count;
}

/**
 * Ensures 100% of open cells are reachable from snake[0] by pruning any
 * obstacles adjacent to disconnected components until one connected arena remains.
 */
export function ensureFullConnectivity(
  cols: number,
  rows: number,
  head: Point,
  obstacles: Obstacle[]
): Obstacle[] {
  const result = [...obstacles];
  let guard = 0;

  while (guard < obstacles.length + 5) {
    guard++;
    const blocked = new Set(result.map((o) => pointKey(o)));
    const reachable = getReachableCells(cols, rows, head, blocked);
    const totalOpen = cols * rows - blocked.size;

    if (reachable.size === totalOpen) break;

    let removeIdx = -1;
    for (let i = 0; i < result.length; i++) {
      const o = result[i];
      let touchesReachable = false;
      let touchesUnreachableOpen = false;
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (const [dx, dy] of dirs) {
        const nx = o.x + dx;
        const ny = o.y + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        const nk = `${nx},${ny}`;
        if (reachable.has(nk)) touchesReachable = true;
        else if (!blocked.has(nk)) touchesUnreachableOpen = true;
      }
      if (touchesReachable && touchesUnreachableOpen) {
        removeIdx = i;
        break;
      }
    }

    if (removeIdx === -1) removeIdx = result.length - 1;
    if (removeIdx >= 0) result.splice(removeIdx, 1);
    else break;
  }

  return result;
}

/**
 * Finds a safe, BFS-reachable food cell that never overlaps snake, obstacles,
 * or excluded points, preferring cells with >= 2 open exits.
 */
export function findSafeFoodCell(
  cols: number,
  rows: number,
  snake: Point[],
  obstacles: Point[] = [],
  excludePoints: Point[] = [],
  rng: () => number = Math.random,
  minDistFromHead = 0
): Point {
  const obsBlocked = new Set<string>(obstacles.map((p) => pointKey(p)));
  const occupied = new Set<string>(obsBlocked);
  snake.forEach((p) => occupied.add(pointKey(p)));
  excludePoints.forEach((p) => occupied.add(pointKey(p)));

  const head = snake[0];
  const bodyAndObsBlocked = new Set<string>(obsBlocked);
  snake.slice(1).forEach((p) => bodyAndObsBlocked.add(pointKey(p)));

  const strictlyReachable = head
    ? getReachableCells(cols, rows, head, bodyAndObsBlocked)
    : null;
  const arenaReachable = head
    ? getReachableCells(cols, rows, head, obsBlocked)
    : null;

  const tier1Preferred: Point[] = [];
  const tier2Strictly: Point[] = [];
  const tier3Arena: Point[] = [];
  const tier4Any: Point[] = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const k = `${x},${y}`;
      if (occupied.has(k)) continue;
      const pt = { x, y };
      const dist = head ? Math.abs(x - head.x) + Math.abs(y - head.y) : minDistFromHead;
      const exits = countOpenNeighbors(x, y, cols, rows, obsBlocked);

      if (strictlyReachable && strictlyReachable.has(k)) {
        if (dist >= minDistFromHead && exits >= 2) tier1Preferred.push(pt);
        else tier2Strictly.push(pt);
      } else if (arenaReachable && arenaReachable.has(k)) {
        tier3Arena.push(pt);
      } else {
        tier4Any.push(pt);
      }
    }
  }

  const pool =
    tier1Preferred.length > 0
      ? tier1Preferred
      : tier2Strictly.length > 0
      ? tier2Strictly
      : tier3Arena.length > 0
      ? tier3Arena
      : tier4Any;

  if (pool.length === 0) return { x: 0, y: 0 };
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Safely spawns a progressive obstacle during gameplay without trapping the snake or blocking food.
 */
export function findSafeProgressiveObstacle(params: {
  cols: number;
  rows: number;
  snake: Point[];
  dir: Direction;
  obstacles: Obstacle[];
  food: Point;
  golden?: Point | null;
  rng?: () => number;
}): Obstacle | null {
  const {
    cols,
    rows,
    snake,
    dir,
    obstacles,
    food,
    golden,
    rng = Math.random,
  } = params;

  const head = snake[0];
  const blocked = new Set<string>(obstacles.map((o) => pointKey(o)));
  const occupied = new Set<string>(blocked);
  snake.forEach((p) => occupied.add(pointKey(p)));
  occupied.add(pointKey(food));
  if (golden) occupied.add(pointKey(golden));

  for (let i = 1; i <= 4; i++) {
    occupied.add(`${head.x + dir.x * i},${head.y + dir.y * i}`);
  }

  const candidates: Point[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (occupied.has(`${x},${y}`)) continue;
      if (Math.abs(x - head.x) + Math.abs(y - head.y) < 5) continue;
      candidates.push({ x, y });
    }
  }

  const maxChecks = Math.min(candidates.length, 18);
  for (let i = 0; i < maxChecks; i++) {
    const swapIdx = i + Math.floor(rng() * (candidates.length - i));
    const tmp = candidates[i];
    candidates[i] = candidates[swapIdx];
    candidates[swapIdx] = tmp;

    const cand = candidates[i];
    const testBlocked = new Set(blocked);
    testBlocked.add(pointKey(cand));

    if (
      countOpenNeighbors(food.x, food.y, cols, rows, testBlocked) < 2 ||
      countOpenNeighbors(head.x, head.y, cols, rows, testBlocked) < 2 ||
      (golden && countOpenNeighbors(golden.x, golden.y, cols, rows, testBlocked) < 2)
    ) {
      continue;
    }

    // Prevent turning any adjacent open tile into a 1-exit dead-end pocket
    let createsDeadEnd = false;
    const adjDirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of adjDirs) {
      const nx = cand.x + dx;
      const ny = cand.y + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (testBlocked.has(`${nx},${ny}`)) continue;
      if (countOpenNeighbors(nx, ny, cols, rows, testBlocked) < 2) {
        createsDeadEnd = true;
        break;
      }
    }
    if (createsDeadEnd) continue;

    const reachable = getReachableCells(cols, rows, head, testBlocked);
    const totalOpen = cols * rows - testBlocked.size;
    if (
      reachable.size === totalOpen &&
      reachable.has(pointKey(food)) &&
      (!golden || reachable.has(pointKey(golden)))
    ) {
      return {
        x: cand.x,
        y: cand.y,
        variant: Math.floor(rng() * 3),
        spawnedAt: Date.now(),
      };
    }
  }

  return null;
}
