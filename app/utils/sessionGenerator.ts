import { MAP_THEME_IDS } from "./themes";
import {
  DifficultyConfig,
  DifficultyLevel,
  Direction,
  GameSessionConfig,
  LayoutPattern,
  MapThemeId,
  Obstacle,
  Point,
} from "./types";

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  "easy",
  "medium",
  "hard",
  "expert",
];

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: "easy",
    label: "Easy",
    badge: "🌱 Easy",
    description: "Slow movement, light obstacles, wide open paths",
    baseSpeed: 180,
    minSpeed: 140,
    speedStepFoods: 6,
    speedStepMs: 2,
    obstacleRatio: 0.014,
    maxInitialObstacles: 5,
    obstacleStepFoods: 7,
    maxProgressiveObstacles: 2,
    bonusInterval: 6,
    bonusChance: 0.1,
    bonusDurationMs: 10000,
    scorePerFood: 10,
    bonusScore: 50,
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
  },
  medium: {
    id: "medium",
    label: "Medium",
    badge: "⚡ Medium",
    description: "Normal speed, a few obstacles, steady ramp-up",
    baseSpeed: 145,
    minSpeed: 105,
    speedStepFoods: 5,
    speedStepMs: 3,
    obstacleRatio: 0.035,
    maxInitialObstacles: 14,
    obstacleStepFoods: 5,
    maxProgressiveObstacles: 6,
    bonusInterval: 5,
    bonusChance: 0.14,
    bonusDurationMs: 9000,
    scorePerFood: 15,
    bonusScore: 75,
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-400/40",
  },
  hard: {
    id: "hard",
    label: "Hard",
    badge: "🔥 Hard",
    description: "Fast speed, denser layouts, quicker scaling",
    baseSpeed: 115,
    minSpeed: 85,
    speedStepFoods: 4,
    speedStepMs: 3,
    obstacleRatio: 0.068,
    maxInitialObstacles: 26,
    obstacleStepFoods: 4,
    maxProgressiveObstacles: 10,
    bonusInterval: 4,
    bonusChance: 0.18,
    bonusDurationMs: 8000,
    scorePerFood: 20,
    bonusScore: 100,
    badgeClass: "bg-orange-500/15 text-orange-300 border-orange-400/40",
  },
  expert: {
    id: "expert",
    label: "Expert",
    badge: "💀 Expert",
    description: "Very fast speed, complex layouts, tight safe zones",
    baseSpeed: 92,
    minSpeed: 68,
    speedStepFoods: 3,
    speedStepMs: 4,
    obstacleRatio: 0.105,
    maxInitialObstacles: 40,
    obstacleStepFoods: 3,
    maxProgressiveObstacles: 14,
    bonusInterval: 4,
    bonusChance: 0.22,
    bonusDurationMs: 7000,
    scorePerFood: 30,
    bonusScore: 150,
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-400/40",
  },
};

let seedCounter = 0;

/** FNV-1a 32-bit string hash */
export function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic Mulberry32 PRNG */
export function createRng(seed: string | number): () => number {
  let a = typeof seed === "number" ? seed >>> 0 : hashSeed(seed);
  if (a === 0) a = 0x9e3779b9;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a unique per-session random seed */
export function generateSessionSeed(): string {
  seedCounter = (seedCounter + 1) >>> 0;
  let randPart = Math.floor(Math.random() * 0xffffffff);
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const buf = new Uint32Array(2);
    globalThis.crypto.getRandomValues(buf);
    randPart = (buf[0] ^ buf[1]) >>> 0;
  }
  const timePart = Date.now().toString(36).slice(-5).toUpperCase();
  const hexPart = randPart.toString(16).toUpperCase().padStart(8, "0");
  return `${timePart}-${hexPart}-${seedCounter.toString(36).toUpperCase()}`;
}

function pointKey(p: Point): string {
  return `${p.x},${p.y}`;
}

export function getInitialSnake(
  cols: number,
  rows: number,
  isPortrait = false
): { snake: Point[]; dir: Direction } {
  const startX = Math.floor(cols / 2);
  const startY = Math.floor(rows / 2);
  const dir: Direction = isPortrait ? { x: 0, y: -1 } : { x: 1, y: 0 };
  const snake: Point[] = isPortrait
    ? [
        { x: startX, y: startY },
        { x: startX, y: Math.min(rows - 1, startY + 1) },
        { x: startX, y: Math.min(rows - 1, startY + 2) },
      ]
    : [
        { x: startX, y: startY },
        { x: Math.max(0, startX - 1), y: startY },
        { x: Math.max(0, startX - 2), y: startY },
      ];
  return { snake, dir };
}

/**
 * Independently picks a map theme, avoiding the previous map whenever possible.
 */
export function pickRandomMapTheme(
  previousMapId?: MapThemeId | null,
  rng: () => number = Math.random
): MapThemeId {
  const candidates =
    previousMapId && MAP_THEME_IDS.length > 1
      ? MAP_THEME_IDS.filter((id) => id !== previousMapId)
      : MAP_THEME_IDS;
  const idx = Math.floor(rng() * candidates.length);
  return candidates[Math.min(candidates.length - 1, Math.max(0, idx))];
}

/**
 * Computes effective baseSpeed and minSpeed tuned to both difficulty and current level.
 */
export function getLevelSpeedConfig(
  difficulty: DifficultyLevel,
  level: number = 1
): { baseSpeed: number; minSpeed: number } {
  const diffCfg = DIFFICULTY_CONFIGS[difficulty];
  const lvl = Math.max(1, Math.floor(level || 1));
  const levelBoost = Math.min(14, Math.floor((lvl - 1) * 0.5));
  const baseSpeed = Math.max(diffCfg.minSpeed + 6, diffCfg.baseSpeed - levelBoost);
  const minSpeed = Math.max(58, diffCfg.minSpeed - Math.floor(levelBoost * 0.5));
  return { baseSpeed, minSpeed };
}

/**
 * Independently picks one of the four difficulty levels.
 * When `level` is provided, weights difficulty smoothly according to the level bracket
 * (early levels favor Easy/Medium; higher levels shift toward Hard/Expert).
 */
export function pickRandomDifficulty(
  rng: () => number = Math.random,
  level?: number
): DifficultyLevel {
  if (!level || level < 1) {
    const idx = Math.floor(rng() * DIFFICULTY_LEVELS.length);
    return DIFFICULTY_LEVELS[Math.min(DIFFICULTY_LEVELS.length - 1, Math.max(0, idx))];
  }

  const r = rng();
  if (level <= 3) {
    // Levels 1-3: Beginner friendly (75% Easy, 25% Medium)
    return r < 0.75 ? "easy" : "medium";
  }
  if (level <= 8) {
    // Levels 4-8: Intermediate (20% Easy, 55% Medium, 25% Hard)
    if (r < 0.2) return "easy";
    if (r < 0.75) return "medium";
    return "hard";
  }
  if (level <= 16) {
    // Levels 9-16: Challenging (25% Medium, 50% Hard, 25% Expert)
    if (r < 0.25) return "medium";
    if (r < 0.75) return "hard";
    return "expert";
  }
  // Levels 17+: Intense unlimited progression (10% Medium, 45% Hard, 45% Expert)
  if (r < 0.1) return "medium";
  if (r < 0.55) return "hard";
  return "expert";
}

function buildSafeZone(
  cols: number,
  rows: number,
  snake: Point[],
  dir: Direction
): Set<string> {
  const safe = new Set<string>();
  const head = snake[0];

  // Buffer 1 cell around all starting snake segments
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

  // Clear runway of 5 cells in front of the starting head (and 1 cell lateral)
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

function getPatternsForDifficulty(difficulty: DifficultyLevel): LayoutPattern[] {
  switch (difficulty) {
    case "easy":
      return ["scattered", "pillars"];
    case "medium":
      return ["scattered", "pillars", "islands"];
    case "hard":
      return ["corridors", "pillars", "islands", "crossroads"];
    case "expert":
      return ["corridors", "crossroads", "fortress", "labyrinth"];
  }
}

function generatePatternCandidates(
  pattern: LayoutPattern,
  cols: number,
  rows: number,
  targetCount: number,
  safeZone: Set<string>,
  rng: () => number
): Obstacle[] {
  if (pattern === "open" || targetCount <= 0) return [];

  const chosen = new Map<string, Obstacle>();
  const addPoint = (x: number, y: number, variant?: number) => {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return;
    const k = `${x},${y}`;
    if (safeZone.has(k) || chosen.has(k)) return;
    chosen.set(k, {
      x,
      y,
      variant: variant ?? Math.floor(rng() * 3),
    });
  };

  if (pattern === "scattered") {
    let attempts = 0;
    while (chosen.size < targetCount && attempts < targetCount * 20) {
      attempts++;
      const x = Math.floor(rng() * cols);
      const y = Math.floor(rng() * rows);
      // Keep scattered rocks spaced apart slightly for clean flow
      let tooClose = false;
      for (let dy = -1; dy <= 1 && !tooClose; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (chosen.has(`${x + dx},${y + dy}`)) {
            tooClose = true;
            break;
          }
        }
      }
      if (!tooClose) addPoint(x, y);
    }
  } else if (pattern === "pillars") {
    const stepX = Math.max(4, Math.floor(cols / (3 + Math.floor(rng() * 2))));
    const stepY = Math.max(4, Math.floor(rows / (3 + Math.floor(rng() * 2))));
    const offX = 1 + Math.floor(rng() * 2);
    const offY = 1 + Math.floor(rng() * 2);
    for (let y = offY; y < rows - 1; y += stepY) {
      for (let x = offX; x < cols - 1; x += stepX) {
        if (chosen.size >= targetCount) break;
        addPoint(x, y);
        if (rng() > 0.45 && chosen.size < targetCount) {
          addPoint(x + (rng() > 0.5 ? 1 : 0), y + (rng() > 0.5 ? 1 : 0));
        }
      }
    }
  } else if (pattern === "islands") {
    const numClusters = Math.max(2, Math.ceil(targetCount / 3));
    for (let c = 0; c < numClusters * 3 && chosen.size < targetCount; c++) {
      const cx = 1 + Math.floor(rng() * Math.max(1, cols - 3));
      const cy = 1 + Math.floor(rng() * Math.max(1, rows - 3));
      const shape = Math.floor(rng() * 3);
      if (shape === 0) {
        // 2x2 block
        addPoint(cx, cy);
        addPoint(cx + 1, cy);
        addPoint(cx, cy + 1);
      } else if (shape === 1) {
        // L-shape
        addPoint(cx, cy);
        addPoint(cx + 1, cy);
        addPoint(cx, cy + 1);
        addPoint(cx, cy + 2);
      } else {
        // Horizontal or vertical bar of 3
        const horiz = rng() > 0.5;
        for (let i = 0; i < 3 && chosen.size < targetCount; i++) {
          addPoint(cx + (horiz ? i : 0), cy + (horiz ? 0 : i));
        }
      }
    }
  } else if (pattern === "corridors") {
    const horizontal = rng() > 0.5;
    const lanes = horizontal ? rows : cols;
    const span = horizontal ? cols : rows;
    const stride = Math.max(4, Math.floor(lanes / 3));
    const offset = 2 + Math.floor(rng() * 2);
    for (let lane = offset; lane < lanes - 2; lane += stride) {
      const gapStart = 2 + Math.floor(rng() * Math.max(1, span - 6));
      const gapLen = 3 + Math.floor(rng() * 2);
      for (let pos = 1; pos < span - 1; pos++) {
        if (chosen.size >= targetCount) break;
        if (pos >= gapStart && pos < gapStart + gapLen) continue;
        if (rng() < 0.78) {
          if (horizontal) addPoint(pos, lane);
          else addPoint(lane, pos);
        }
      }
    }
  } else if (pattern === "crossroads") {
    const midX = Math.floor(cols / 2) + (rng() > 0.5 ? 1 : -1) * Math.floor(rng() * 2);
    const midY = Math.floor(rows / 2) + (rng() > 0.5 ? 1 : -1) * Math.floor(rng() * 2);
    for (let x = 2; x < cols - 2; x++) {
      if (Math.abs(x - midX) <= 2) continue;
      if (x % 3 !== 0 && chosen.size < targetCount) addPoint(x, midY);
    }
    for (let y = 2; y < rows - 2; y++) {
      if (Math.abs(y - midY) <= 2) continue;
      if (y % 3 !== 0 && chosen.size < targetCount) addPoint(midX, y);
    }
  } else if (pattern === "fortress") {
    // Corner bastions & mid-arena brackets limiting safe corners
    const insetX = Math.max(2, Math.floor(cols * 0.16));
    const insetY = Math.max(2, Math.floor(rows * 0.16));
    const corners = [
      [insetX, insetY, 1, 1],
      [cols - 1 - insetX, insetY, -1, 1],
      [insetX, rows - 1 - insetY, 1, -1],
      [cols - 1 - insetX, rows - 1 - insetY, -1, -1],
    ];
    for (const [cx, cy, dx, dy] of corners) {
      for (let i = 0; i < 3; i++) {
        if (chosen.size < targetCount) addPoint(cx + i * dx, cy);
        if (chosen.size < targetCount) addPoint(cx, cy + i * dy);
      }
    }
    // Edge corner pockets
    if (rng() > 0.3) {
      addPoint(0, 0);
      addPoint(cols - 1, 0);
      addPoint(0, rows - 1);
      addPoint(cols - 1, rows - 1);
    }
  } else if (pattern === "labyrinth") {
    // Staggered walls with alternating gates
    const bands = 3;
    const stepY = Math.max(3, Math.floor((rows - 2) / (bands + 1)));
    for (let b = 1; b <= bands; b++) {
      const y = b * stepY;
      if (y <= 1 || y >= rows - 2) continue;
      const gateLeft = b % 2 === 1;
      const startX = gateLeft ? 3 : 1;
      const endX = gateLeft ? cols - 1 : cols - 3;
      const midGap = 2 + Math.floor(rng() * Math.max(1, cols - 5));
      for (let x = startX; x < endX; x++) {
        if (chosen.size >= targetCount) break;
        if (Math.abs(x - midGap) <= 1) continue;
        addPoint(x, y);
      }
    }
  }

  // Top up with safe scattered points if pattern yielded fewer than target
  let topUpAttempts = 0;
  while (chosen.size < targetCount && topUpAttempts < targetCount * 15) {
    topUpAttempts++;
    const x = Math.floor(rng() * cols);
    const y = Math.floor(rng() * rows);
    addPoint(x, y);
  }

  return Array.from(chosen.values()).slice(0, targetCount);
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

    if (reachable.size === totalOpen) {
      break;
    }

    // Find an obstacle that borders a reachable cell and an unreachable open cell
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

    if (removeIdx === -1) {
      // Fallback: remove last obstacle touching unreachable open cell
      removeIdx = result.length - 1;
    }
    if (removeIdx >= 0) {
      result.splice(removeIdx, 1);
    } else {
      break;
    }
  }

  return result;
}

/**
 * Finds a safe, BFS-reachable food cell that never overlaps snake, obstacles,
 * or excluded points, preferring cells with >= 2 open exits (no dead-end traps).
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
  // First try cells reachable from head even treating the current snake body (except head) as walls
  const bodyAndObsBlocked = new Set<string>(obsBlocked);
  snake.slice(1).forEach((p) => bodyAndObsBlocked.add(pointKey(p)));

  const strictlyReachable = head
    ? getReachableCells(cols, rows, head, bodyAndObsBlocked)
    : null;
  const arenaReachable = head
    ? getReachableCells(cols, rows, head, obsBlocked)
    : null;

  const tier1Preferred: Point[] = []; // strictly reachable + >= 2 exits + minDist
  const tier2Strictly: Point[] = [];  // strictly reachable
  const tier3Arena: Point[] = [];     // arena reachable (obstacle-free path from head)
  const tier4Any: Point[] = [];       // any unoccupied fallback

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const k = `${x},${y}`;
      if (occupied.has(k)) continue;
      const pt = { x, y };
      const dist = head ? Math.abs(x - head.x) + Math.abs(y - head.y) : minDistFromHead;
      const exits = countOpenNeighbors(x, y, cols, rows, obsBlocked);

      if (strictlyReachable && strictlyReachable.has(k)) {
        if (dist >= minDistFromHead && exits >= 2) {
          tier1Preferred.push(pt);
        } else {
          tier2Strictly.push(pt);
        }
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

  if (pool.length === 0) {
    return { x: 0, y: 0 };
  }
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Generates a playable, fair map layout deterministically from seed, grid size, and difficulty.
 */
export function generateMapLayout(params: {
  seed: string;
  cols: number;
  rows: number;
  difficulty: DifficultyLevel;
  snake: Point[];
  dir: Direction;
  level?: number;
}): {
  pattern: LayoutPattern;
  obstacles: Obstacle[];
  initialFood: Point;
} {
  const { seed, cols, rows, difficulty, snake, dir, level = 1 } = params;
  const rng = createRng(`${seed}:${cols}x${rows}:${difficulty}:L${level}`);
  const diffCfg = DIFFICULTY_CONFIGS[difficulty];
  const patterns = getPatternsForDifficulty(difficulty);
  const pattern = patterns[Math.floor(rng() * patterns.length)];

  if (diffCfg.obstacleRatio <= 0 || pattern === "open") {
    const initialFood = findSafeFoodCell(cols, rows, snake, [], [], rng, 4);
    return { pattern: "open", obstacles: [], initialFood };
  }

  const totalCells = cols * rows;
  const levelBonus =
    difficulty === "easy" ? 0 : Math.min(4, Math.floor((Math.max(1, level) - 1) / 4));
  const earlyFactor = level <= 2 ? 0.8 : 1;
  const targetCount = Math.min(
    diffCfg.maxInitialObstacles + levelBonus,
    Math.max(2, Math.round(totalCells * diffCfg.obstacleRatio * earlyFactor) + levelBonus)
  );

  const safeZone = buildSafeZone(cols, rows, snake, dir);
  const candidates = generatePatternCandidates(
    pattern,
    cols,
    rows,
    targetCount,
    safeZone,
    rng
  );

  const verifiedObstacles = ensureFullConnectivity(
    cols,
    rows,
    snake[0],
    candidates
  );

  // Also ensure food is placed in the reachable set (guaranteed since 100% open cells are reachable)
  const initialFood = findSafeFoodCell(
    cols,
    rows,
    snake,
    verifiedObstacles,
    [],
    rng,
    4
  );

  return {
    pattern,
    obstacles: verifiedObstacles,
    initialFood,
  };
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

  // Protect next 4 cells directly ahead of snake head
  for (let i = 1; i <= 4; i++) {
    occupied.add(`${head.x + dir.x * i},${head.y + dir.y * i}`);
  }

  const candidates: Point[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (occupied.has(`${x},${y}`)) continue;
      const dist = Math.abs(x - head.x) + Math.abs(y - head.y);
      if (dist < 5) continue;
      candidates.push({ x, y });
    }
  }

  // Shuffle candidates using Fisher-Yates (first 18 tries are plenty)
  const maxChecks = Math.min(candidates.length, 18);
  for (let i = 0; i < maxChecks; i++) {
    const swapIdx = i + Math.floor(rng() * (candidates.length - i));
    const tmp = candidates[i];
    candidates[i] = candidates[swapIdx];
    candidates[swapIdx] = tmp;

    const cand = candidates[i];
    const testBlocked = new Set(blocked);
    testBlocked.add(pointKey(cand));

    // Do not create tight dead-end around food, golden bonus, or snake head
    if (
      countOpenNeighbors(food.x, food.y, cols, rows, testBlocked) < 2 ||
      countOpenNeighbors(head.x, head.y, cols, rows, testBlocked) < 2 ||
      (golden && countOpenNeighbors(golden.x, golden.y, cols, rows, testBlocked) < 2)
    ) {
      continue;
    }

    // Verify full arena connectivity from snake head (including food and active golden apple)
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

/**
 * Creates a complete independent game session with unique seed,
 * non-repeating random map theme, level-aware difficulty, and verified layout.
 */
export function createGameSession(params: {
  cols: number;
  rows: number;
  level?: number;
  isPortrait?: boolean;
  previousMapThemeId?: MapThemeId | null;
  seed?: string;
  fixedMapThemeId?: MapThemeId;
  fixedDifficulty?: DifficultyLevel;
}): GameSessionConfig {
  const {
    cols,
    rows,
    level = 1,
    isPortrait = false,
    previousMapThemeId = null,
    seed = generateSessionSeed(),
    fixedMapThemeId,
    fixedDifficulty,
  } = params;

  const sessionRng = createRng(seed);
  const mapThemeId =
    fixedMapThemeId ?? pickRandomMapTheme(previousMapThemeId, sessionRng);
  const difficulty = fixedDifficulty ?? pickRandomDifficulty(sessionRng, level);
  const { snake, dir } = getInitialSnake(cols, rows, isPortrait);

  const layout = generateMapLayout({
    seed,
    cols,
    rows,
    difficulty,
    snake,
    dir,
    level,
  });

  return {
    sessionId: `sess_${seed}`,
    seed,
    level,
    mapThemeId,
    difficulty,
    pattern: layout.pattern,
    obstacles: layout.obstacles,
    initialFood: layout.initialFood,
    createdAt: Date.now(),
  };
}
