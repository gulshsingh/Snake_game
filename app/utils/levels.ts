import { LevelConfig } from "./types";

export const MAX_LEVELS = Number.POSITIVE_INFINITY;

// 4 Cycling Biome Tiers (Changes every 5 levels)
export const BIOMES = [
  {
    tier: "normal" as const,
    themeId: "garden",
    names: [
      "First Slither",
      "Fresh Harvest",
      "Mossy Grove",
      "Green Canopy",
      "Garden Master",
    ],
    qualifiers: ["Forest Slither", "Green Meadow", "Canopy Dash", "Emerald Grove", "Garden Sovereign"],
  },
  {
    tier: "medium" as const,
    themeId: "desert",
    names: [
      "Desert Awakening",
      "Dune Sprint",
      "Mirage Chase",
      "Sandstorm Run",
      "Desert Apex",
    ],
    qualifiers: ["Dune Runner", "Sahara Sprint", "Golden Oasis", "Sand Viper", "Desert Sovereign"],
  },
  {
    tier: "hard" as const,
    themeId: "magma",
    names: [
      "Volcanic Forge",
      "Molten Core",
      "Obsidian Ridge",
      "Inferno Rush",
      "Magma Sovereign",
    ],
    qualifiers: ["Abyssal Flare", "Volcanic Ridge", "Inferno Core", "Lava Dash", "Pyre Sovereign"],
  },
  {
    tier: "mythic" as const,
    themeId: "cyber",
    names: [
      "Cyber Void",
      "Cyber Surge",
      "Neon Python",
      "Matrix Gauntlet",
      "Mythic Ascendant",
    ],
    qualifiers: ["Quantum Void", "Neon Matrix", "Synthwave Dash", "Cyber Core", "Cosmic Ascendant"],
  },
];

export const TIER_CONFIG = {
  normal: {
    label: "NORMAL TIER",
    badge: "🌱 Normal",
    themeName: "Random Map Pool",
    themeIcon: "🎲",
    snakeColor: "Lion Warrior",
    boardDesc: "6 Random Maps • 4×4 Difficulty",
    color: "from-emerald-500 to-green-600",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    textColor: "text-emerald-400",
  },
  medium: {
    label: "MEDIUM TIER",
    badge: "⚡ Medium",
    themeName: "Random Map Pool",
    themeIcon: "🎲",
    snakeColor: "Lion Warrior",
    boardDesc: "6 Random Maps • 4×4 Difficulty",
    color: "from-amber-500 to-yellow-600",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    textColor: "text-amber-400",
  },
  hard: {
    label: "HARD TIER",
    badge: "🔥 Hard",
    themeName: "Random Map Pool",
    themeIcon: "🎲",
    snakeColor: "Lion Warrior",
    boardDesc: "6 Random Maps • 4×4 Difficulty",
    color: "from-orange-500 to-red-600",
    border: "border-orange-500/40",
    bg: "bg-orange-500/10",
    textColor: "text-orange-400",
  },
  mythic: {
    label: "MYTHIC TIER",
    badge: "⚡ Extreme",
    themeName: "Random Map Pool",
    themeIcon: "🎲",
    snakeColor: "Lion Warrior",
    boardDesc: "6 Random Maps • 4×4 Difficulty",
    color: "from-purple-500 via-pink-500 to-cyan-500",
    border: "border-cyan-500/40",
    bg: "bg-cyan-500/10",
    textColor: "text-cyan-400",
  },
};

/**
 * Procedural Level Generator: computes any level config from 1 to unlimited levels dynamically
 */
export function getLevelConfig(lvlNum: number): LevelConfig {
  const level = Math.max(1, Math.floor(Number.isFinite(lvlNum) ? lvlNum : 1));

  // Every 5 levels, the biome bracket advances
  const tierBracket = Math.floor((level - 1) / 5);
  const biomeIndex = tierBracket % 4;
  const intraIndex = (level - 1) % 5;
  const cycleNumber = Math.floor(tierBracket / 4) + 1;

  const biome = BIOMES[biomeIndex];

  // Procedural Title
  let title = biome.names[intraIndex];
  if (cycleNumber > 1) {
    title = `${biome.qualifiers[intraIndex]} ${toRoman(cycleNumber)}`;
  }

  // Target Apples: starts at 5, scales smoothly up to 30
  const targetApples = Math.min(30, 5 + intraIndex * 2 + Math.min(15, Math.floor(tierBracket * 1.2)));

  // Speed tick interval in ms: starts at 160ms, gradually speeds up to 60ms
  const speedReduction = Math.min(100, Math.floor(tierBracket * 4 + intraIndex * 2));
  const baseSpeed = Math.max(60, 160 - speedReduction);

  // Time Limit in seconds: scales proportionally with targetApples so all random difficulties stay fair
  const secondsPerApple = Math.max(2.5, 4.8 - Math.min(2.3, tierBracket * 0.14 + intraIndex * 0.08));
  const bufferSeconds = Math.max(16, Math.round(46 - Math.min(30, tierBracket * 2.2)));
  const timeLimit = Math.max(45, Math.min(130, Math.round(targetApples * secondsPerApple + bufferSeconds)));

  // Star Rating completion time targets
  const star3Time = Math.max(15, Math.round(timeLimit * 0.45));
  const star2Time = Math.max(22, Math.round(timeLimit * 0.7));

  return {
    level,
    title,
    tier: biome.tier,
    targetApples,
    timeLimit,
    baseSpeed,
    themeId: biome.themeId,
    star3Time,
    star2Time,
    description: `Level ${level}: Eat ${targetApples} apples in under ${timeLimit}s. Biome: ${biome.names[intraIndex]}.`,
  };
}

/**
 * Generate a slice/batch of levels on demand for UI paging (e.g. 1-20, 21-40, unlimited)
 */
export function getLevelBatch(startLevel: number, count: number = 20): LevelConfig[] {
  const start = Math.max(1, Math.floor(startLevel || 1));
  return Array.from({ length: count }, (_, i) => getLevelConfig(start + i));
}

// Default initial 20 levels array for backwards compatibility
export const LEVELS: LevelConfig[] = getLevelBatch(1, 20);

// Helper for Roman numerals in cycle titles (O(1) safe for unlimited levels)
function toRoman(num: number): string {
  if (!Number.isFinite(num) || num > 3999) {
    return `#${num}`;
  }
  const lookup: Record<string, number> = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = "";
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman || "I";
}
