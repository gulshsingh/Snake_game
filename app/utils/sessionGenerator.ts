import {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_LAYERS,
  DIFFICULTY_LEVELS,
  createRng,
  generateSessionSeed,
  getDifficultyLayerDots,
  getInitialSnake,
  getLayeredDifficultyConfig,
  getLevelSpeedConfig,
  hashSeed,
  pickRandomDifficulty,
  pickRandomDifficultyLayer,
  pickRandomMapTheme,
} from "./difficulties";
import {
  buildSafeZone,
  ensureFullConnectivity,
  findSafeFoodCell,
  findSafeProgressiveObstacle,
  getReachableCells,
} from "./mapReachability";
import {
  DifficultyLayer,
  DifficultyLevel,
  Direction,
  GameSessionConfig,
  LayoutPattern,
  MapThemeId,
  Obstacle,
  Point,
} from "./types";

export {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_LAYERS,
  DIFFICULTY_LEVELS,
  createRng,
  ensureFullConnectivity,
  findSafeFoodCell,
  findSafeProgressiveObstacle,
  generateSessionSeed,
  getDifficultyLayerDots,
  getInitialSnake,
  getLayeredDifficultyConfig,
  getLevelSpeedConfig,
  getReachableCells,
  hashSeed,
  pickRandomDifficulty,
  pickRandomDifficultyLayer,
  pickRandomMapTheme,
};

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
        addPoint(cx, cy);
        addPoint(cx + 1, cy);
        addPoint(cx, cy + 1);
      } else if (shape === 1) {
        addPoint(cx, cy);
        addPoint(cx + 1, cy);
        addPoint(cx, cy + 1);
        addPoint(cx, cy + 2);
      } else {
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
    if (rng() > 0.3) {
      addPoint(0, 0);
      addPoint(cols - 1, 0);
      addPoint(0, rows - 1);
      addPoint(cols - 1, rows - 1);
    }
  } else if (pattern === "labyrinth") {
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

  let topUpAttempts = 0;
  while (chosen.size < targetCount && topUpAttempts < targetCount * 15) {
    topUpAttempts++;
    addPoint(Math.floor(rng() * cols), Math.floor(rng() * rows));
  }

  return Array.from(chosen.values()).slice(0, targetCount);
}

/**
 * Generates a playable, fair map layout deterministically from seed, grid size, and difficulty.
 */
export function generateMapLayout(params: {
  seed: string;
  cols: number;
  rows: number;
  difficulty: DifficultyLevel;
  difficultyLayer?: DifficultyLayer;
  snake: Point[];
  dir: Direction;
  level?: number;
}): {
  pattern: LayoutPattern;
  obstacles: Obstacle[];
  initialFood: Point;
} {
  const { seed, cols, rows, difficulty, difficultyLayer = 2, snake, dir, level = 1 } = params;
  const rng = createRng(`${seed}:${cols}x${rows}:${difficulty}:S${difficultyLayer}:L${level}`);
  const diffCfg = getLayeredDifficultyConfig(difficulty, difficultyLayer);
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
  const candidates = generatePatternCandidates(pattern, cols, rows, targetCount, safeZone, rng);
  const verifiedObstacles = ensureFullConnectivity(cols, rows, snake[0], candidates);
  const initialFood = findSafeFoodCell(cols, rows, snake, verifiedObstacles, [], rng, 4);

  return {
    pattern,
    obstacles: verifiedObstacles,
    initialFood,
  };
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
  fixedDifficultyLayer?: DifficultyLayer;
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
    fixedDifficultyLayer,
  } = params;

  const sessionRng = createRng(seed);
  const mapThemeId = fixedMapThemeId ?? pickRandomMapTheme(previousMapThemeId, sessionRng);
  const difficulty = fixedDifficulty ?? pickRandomDifficulty(sessionRng, level);
  const difficultyLayer = fixedDifficultyLayer ?? pickRandomDifficultyLayer(sessionRng, level);
  const { snake, dir } = getInitialSnake(cols, rows, isPortrait);
  const layout = generateMapLayout({ seed, cols, rows, difficulty, difficultyLayer, snake, dir, level });

  return {
    sessionId: `sess_${seed}`,
    seed,
    level,
    mapThemeId,
    difficulty,
    difficultyLayer,
    pattern: layout.pattern,
    obstacles: layout.obstacles,
    initialFood: layout.initialFood,
    createdAt: Date.now(),
  };
}
