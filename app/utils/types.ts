export type Point = { x: number; y: number };
export type Direction = { x: number; y: number };

export type Status = "ready" | "playing" | "paused" | "over" | "level_clear";

export type MapThemeId = "jungle" | "desert" | "ice" | "space" | "lava" | "ocean";

export type DifficultyLevel = "easy" | "medium" | "hard" | "expert";
export type DifficultyLayer = 1 | 2 | 3 | 4;

export type LayoutPattern =
  | "open"
  | "scattered"
  | "pillars"
  | "corridors"
  | "islands"
  | "crossroads"
  | "fortress"
  | "labyrinth";

export interface Obstacle extends Point {
  variant?: number;
  spawnedAt?: number;
}

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  badge: string;
  description: string;
  baseSpeed: number; // initial tick interval in ms (lower is faster)
  minSpeed: number; // fastest possible tick interval in ms
  speedStepFoods: number; // foods needed per speed increase
  speedStepMs: number; // ms reduced per speed increase
  obstacleRatio: number; // initial obstacle density
  maxInitialObstacles: number;
  obstacleStepFoods: number; // 0 = never add dynamic obstacles
  maxProgressiveObstacles: number;
  bonusInterval: number; // guaranteed bonus food every N foods
  bonusChance: number; // occasional chance on other foods
  bonusDurationMs: number;
  scorePerFood: number;
  bonusScore: number;
  badgeClass: string;
  dots?: string;
}

export interface GameSessionConfig {
  sessionId: string;
  seed: string;
  level: number;
  mapThemeId: MapThemeId;
  difficulty: DifficultyLevel;
  difficultyLayer: DifficultyLayer;
  pattern: LayoutPattern;
  obstacles: Obstacle[];
  initialFood: Point;
  createdAt: number;
}

export interface LevelConfig {
  level: number;
  title: string;
  tier: "normal" | "medium" | "hard" | "mythic";
  targetApples: number;
  timeLimit: number; // in seconds
  baseSpeed: number; // tick interval in ms (lower is faster)
  themeId: string;
  star3Time: number; // finished within this many seconds for 3 stars
  star2Time: number; // finished within this many seconds for 2 stars
  description: string;
}

export interface LevelProgress {
  unlockedLevel: number;
  stars: Record<number, number>; // level -> star count (1, 2, or 3)
  bestTimes: Record<number, number>; // level -> fastest completion time in seconds
}

export interface ThemeConfig {
  id: string;
  name: string;
  icon: string;
  boardBg1: string;
  boardBg2: string;
  boardBorder: string;
  gridLine?: string;
  vignette: string;
  snakeHead: string;
  snakeBodyStart: string;
  snakeBodyEnd: string;
  snakeBelly: string;
  snakeEyeIris: string;
  appleColor: string;
  appleHighlight: string;
  goldenColor: string;
  hudBg: string;
  accent: string;
  obstacleColor?: string;
  obstacleHighlight?: string;
  obstacleAccent?: string;
  bgDetailColor?: string;
  environmentDesc?: string;
  obstacleLabel?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity?: number;
  rotation?: number;
  vRot?: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
  scale: number;
}

export interface DigestionBulge {
  index: number;
  amount: number;
}

export interface GoldenApple {
  x: number;
  y: number;
  active: boolean;
  timeLeft: number;
  maxTime: number;
}
