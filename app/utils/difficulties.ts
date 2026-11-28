import { MAP_THEME_IDS } from "./themes";
import {
  DifficultyConfig,
  DifficultyLevel,
  Direction,
  MapThemeId,
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
 * Independently picks one of the four difficulty levels, weighted by level bracket.
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
  if (level <= 3) return r < 0.75 ? "easy" : "medium";
  if (level <= 8) {
    if (r < 0.2) return "easy";
    if (r < 0.75) return "medium";
    return "hard";
  }
  if (level <= 16) {
    if (r < 0.25) return "medium";
    if (r < 0.75) return "hard";
    return "expert";
  }
  if (r < 0.1) return "medium";
  if (r < 0.55) return "hard";
  return "expert";
}
