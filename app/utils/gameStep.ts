import { soundFx } from "./audio";
import {
  pushDeathParticles,
  pushFloatingText,
  pushGoldenStars,
  pushJuiceParticles,
} from "./fxRenderer";
import {
  findSafeFoodCell,
  findSafeProgressiveObstacle,
  getLayeredDifficultyConfig,
  getLevelSpeedConfig,
} from "./sessionGenerator";
import {
  Direction,
  FloatingText,
  GameSessionConfig,
  GoldenApple,
  LevelConfig,
  Obstacle,
  Particle,
  Point,
  ThemeConfig,
} from "./types";

export interface SnakeGameState {
  snake: Point[];
  prevSnake: Point[];
  dir: Direction;
  nextDir: Direction;
  queue: Direction[];
  food: Point;
  golden: GoldenApple | null;
  obstacles: Obstacle[];
  score: number;
  applesEaten: number;
  goldenEaten: number;
  dynamicObstaclesAdded: number;
  currentSpeedMs: number;
  startTime: number;
  bulges: { index: number; progress: number }[];
  hasStartedMoving: boolean;
  goldenAuraUntil?: number;
  goldenAuraMs?: number;
  comboCount?: number;
  comboTimerMs?: number;
}

export function adjustGameTimersForPause(
  g: SnakeGameState,
  pauseDurationMs: number
): void {
  if (pauseDurationMs <= 0) return;
  if (g.hasStartedMoving) {
    g.startTime += pauseDurationMs;
  }
  for (const obs of g.obstacles) {
    if (obs.spawnedAt) {
      obs.spawnedAt += pauseDurationMs;
    }
  }
}

export function getInitialGameState(cols = 20, rows = 20): SnakeGameState {
  const startX = Math.floor(cols / 2);
  const startY = Math.floor(rows / 2);
  const initialSnake: Point[] = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  return {
    snake: initialSnake,
    prevSnake: initialSnake.map((p) => ({ ...p })),
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    queue: [],
    food: { x: Math.min(cols - 3, startX + 4), y: startY },
    golden: null,
    obstacles: [],
    score: 0,
    applesEaten: 0,
    goldenEaten: 0,
    dynamicObstaclesAdded: 0,
    currentSpeedMs: 135,
    startTime: 0,
    bulges: [],
    hasStartedMoving: false,
    goldenAuraUntil: 0,
    goldenAuraMs: 0,
    comboCount: 0,
    comboTimerMs: 0,
  };
}

export interface StepContext {
  game: SnakeGameState;
  cols: number;
  rows: number;
  cellSize: number;
  theme: ThemeConfig;
  session: GameSessionConfig | null;
  levelConfig: LevelConfig;
  particles: Particle[];
  floatingTexts: FloatingText[];
  bestScoreRef: { current: number };
  shakeRef: { current: number };
  onSyncHud: () => void;
  onGameOver: () => void;
  onLevelComplete: () => void;
}

export function executeGameStep(ctx: StepContext): void {
  const {
    game: g,
    cols,
    rows,
    cellSize: c,
    theme,
    session,
    levelConfig,
    particles,
    floatingTexts,
    bestScoreRef,
    shakeRef,
    onSyncHud,
    onGameOver,
    onLevelComplete,
  } = ctx;

  if (!g.hasStartedMoving) return;

  g.prevSnake = g.snake.map((p) => ({ ...p }));
  if (g.queue.length) {
    g.dir = g.queue.shift()!;
  }

  const head = g.snake[0];
  const nextHead = { x: head.x + g.dir.x, y: head.y + g.dir.y };

  const hitWall =
    nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= cols || nextHead.y >= rows;
  const hitObstacle = g.obstacles.some(
    (o) => o.x === nextHead.x && o.y === nextHead.y
  );

  const eatingFood = nextHead.x === g.food.x && nextHead.y === g.food.y;
  const eatingGolden =
    g.golden &&
    g.golden.active &&
    nextHead.x === g.golden.x &&
    nextHead.y === g.golden.y;

  const willGrow = eatingFood || eatingGolden;
  const bodyToCheck = willGrow ? g.snake : g.snake.slice(0, -1);
  const hitSelf = bodyToCheck.some(
    (p) => p.x === nextHead.x && p.y === nextHead.y
  );

  if (hitWall || hitSelf || hitObstacle) {
    onSyncHud();
    onGameOver();
    shakeRef.current = 16;
    try {
      soundFx.playDie();
    } catch {}
    pushDeathParticles(particles, (head.x + 0.5) * c, (head.y + 0.5) * c, "#a855f7");
    return;
  }

  g.snake.unshift(nextHead);
  g.bulges = g.bulges
    .map((b) => ({ ...b, index: b.index + 1 }))
    .filter((b) => b.index < g.snake.length);

  const diffCfg = getLayeredDifficultyConfig(
    session?.difficulty ?? "medium",
    session?.difficultyLayer ?? 2
  );

  if (eatingFood) {
    const nextCombo = (g.comboTimerMs ?? 0) > 0 ? Math.min(5, (g.comboCount ?? 0) + 1) : 1;
    g.comboCount = nextCombo;
    g.comboTimerMs = 3500;
    const comboBonus = nextCombo > 1 ? Math.round(diffCfg.scorePerFood * 0.25 * (nextCombo - 1)) : 0;
    const pointsEarned = diffCfg.scorePerFood + comboBonus;

    g.score += pointsEarned;
    g.applesEaten += 1;

    if (g.score > bestScoreRef.current) {
      bestScoreRef.current = g.score;
      try {
        localStorage.setItem("snake-session-best", String(g.score));
      } catch {}
    }

    const foodPx = (g.food.x + 0.5) * c;
    const foodPy = (g.food.y + 0.5) * c;
    pushJuiceParticles(particles, foodPx, foodPy, theme.appleColor, 20);
    const scoreLabel = nextCombo > 1 ? `+${pointsEarned} x${nextCombo}!` : `+${pointsEarned}`;
    pushFloatingText(
      floatingTexts,
      scoreLabel,
      foodPx,
      foodPy - 12,
      nextCombo >= 3 ? "#fde047" : "#fbbf24"
    );
    shakeRef.current = 4;

    try {
      soundFx.playEat(nextCombo);
    } catch {}

    g.bulges.push({ index: 0, progress: 0 });
    g.food = findSafeFoodCell(
      cols,
      rows,
      g.snake,
      g.obstacles,
      g.golden?.active ? [g.golden] : []
    );

    if (g.applesEaten >= levelConfig.targetApples) {
      onSyncHud();
      onLevelComplete();
      return;
    }

    const levelSpeedCfg = getLevelSpeedConfig(
      diffCfg.id,
      session?.level ?? levelConfig.level,
      session?.difficultyLayer ?? 2
    );
    const speedTier = Math.floor(g.applesEaten / diffCfg.speedStepFoods);
    const nextSpeed = Math.max(
      levelSpeedCfg.minSpeed,
      levelSpeedCfg.baseSpeed - speedTier * diffCfg.speedStepMs
    );
    if (nextSpeed < g.currentSpeedMs) {
      g.currentSpeedMs = nextSpeed;
      pushFloatingText(floatingTexts, "⚡ SPEED UP!", foodPx, foodPy - 28, "#38bdf8");
    }

    if (
      diffCfg.obstacleStepFoods > 0 &&
      g.applesEaten % diffCfg.obstacleStepFoods === 0 &&
      g.dynamicObstaclesAdded < diffCfg.maxProgressiveObstacles
    ) {
      const newObs = findSafeProgressiveObstacle({
        cols,
        rows,
        snake: g.snake,
        dir: g.dir,
        obstacles: g.obstacles,
        food: g.food,
        golden: g.golden?.active ? g.golden : null,
      });
      if (newObs) {
        g.obstacles.push(newObs);
        g.dynamicObstaclesAdded += 1;
        const obsPx = (newObs.x + 0.5) * c;
        const obsPy = (newObs.y + 0.5) * c;
        pushJuiceParticles(particles, obsPx, obsPy, theme.obstacleAccent || theme.accent, 12);
        pushFloatingText(floatingTexts, "🪨 +OBSTACLE", obsPx, obsPy - 12, "#fda4af");
      }
    }

    if (
      (!g.golden || !g.golden.active) &&
      (g.applesEaten % diffCfg.bonusInterval === 0 || Math.random() < diffCfg.bonusChance)
    ) {
      const goldenPos = findSafeFoodCell(cols, rows, g.snake, g.obstacles, [g.food]);
      g.golden = {
        x: goldenPos.x,
        y: goldenPos.y,
        active: true,
        timeLeft: diffCfg.bonusDurationMs,
        maxTime: diffCfg.bonusDurationMs,
      };
      try {
        soundFx.playGolden();
      } catch {}
    }

    onSyncHud();
  } else if (eatingGolden) {
    g.score += diffCfg.bonusScore;
    g.goldenEaten += 1;
    g.goldenAuraUntil = Date.now() + 5000;
    g.goldenAuraMs = 5000;

    if (g.score > bestScoreRef.current) {
      bestScoreRef.current = g.score;
      try {
        localStorage.setItem("snake-session-best", String(g.score));
      } catch {}
    }

    const goldPx = (g.golden!.x + 0.5) * c;
    const goldPy = (g.golden!.y + 0.5) * c;
    pushGoldenStars(particles, goldPx, goldPy, 28);
    pushFloatingText(floatingTexts, `+${diffCfg.bonusScore} BONUS!`, goldPx, goldPy - 12, "#fde047");
    shakeRef.current = 7;

    try {
      soundFx.playGolden();
    } catch {}

    g.bulges.push({ index: 0, progress: 0 });
    g.golden = null;
    onSyncHud();
  } else {
    g.snake.pop();
  }
}
