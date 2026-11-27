import { MapThemeId, ThemeConfig } from "./types";

export const MAP_THEME_IDS: MapThemeId[] = [
  "jungle",
  "desert",
  "ice",
  "space",
  "lava",
  "ocean",
];

export const THEMES: Record<string, ThemeConfig> = {
  // --- DYNAMIC MAP 1: JUNGLE ---
  jungle: {
    id: "jungle",
    name: "Wild Jungle",
    icon: "🌴",
    boardBg1: "#2d5a27",
    boardBg2: "#244a20",
    boardBorder: "#15803d",
    vignette: "rgba(5, 28, 12, 0.52)",
    snakeHead: "#4ade80",
    snakeBodyStart: "#16a34a",
    snakeBodyEnd: "#14532d",
    snakeBelly: "#86efac",
    snakeEyeIris: "#facc15",
    appleColor: "#f43f5e",
    appleHighlight: "#fda4af",
    goldenColor: "#fbbf24",
    hudBg: "rgba(12, 34, 16, 0.85)",
    accent: "#22c55e",
    obstacleColor: "#1f2937",
    obstacleHighlight: "#374151",
    obstacleAccent: "#4ade80",
    bgDetailColor: "rgba(134, 239, 172, 0.08)",
    environmentDesc: "Dense rainforest canopy & ancient mossy ruins",
    obstacleLabel: "Mossy Ruins & Logs",
  },

  // --- DYNAMIC MAP 2: DESERT ---
  desert: {
    id: "desert",
    name: "Golden Desert",
    icon: "🏜️",
    boardBg1: "#b8860b",
    boardBg2: "#9f7128",
    boardBorder: "#784c12",
    vignette: "rgba(66, 38, 8, 0.45)",
    snakeHead: "#fbbf24",
    snakeBodyStart: "#d97706",
    snakeBodyEnd: "#92400e",
    snakeBelly: "#fef3c7",
    snakeEyeIris: "#06b6d4",
    appleColor: "#e11d48",
    appleHighlight: "#fda4af",
    goldenColor: "#fde047",
    hudBg: "rgba(45, 27, 8, 0.8)",
    accent: "#f59e0b",
    obstacleColor: "#3b1d0a",
    obstacleHighlight: "#5c2e12",
    obstacleAccent: "#22c55e",
    bgDetailColor: "rgba(254, 243, 199, 0.09)",
    environmentDesc: "Scorching sand dunes & canyon boulders",
    obstacleLabel: "Sandstone & Cacti",
  },

  // --- DYNAMIC MAP 3: ICE ---
  ice: {
    id: "ice",
    name: "Frozen Ice",
    icon: "❄️",
    boardBg1: "#1e3a5f",
    boardBg2: "#172e4d",
    boardBorder: "#38bdf8",
    vignette: "rgba(14, 116, 144, 0.36)",
    snakeHead: "#7dd3fc",
    snakeBodyStart: "#0ea5e9",
    snakeBodyEnd: "#1e40af",
    snakeBelly: "#e0f2fe",
    snakeEyeIris: "#f43f5e",
    appleColor: "#fb7185",
    appleHighlight: "#ffe4e6",
    goldenColor: "#fde047",
    hudBg: "rgba(12, 32, 56, 0.85)",
    accent: "#38bdf8",
    obstacleColor: "#0a192f",
    obstacleHighlight: "#172554",
    obstacleAccent: "#38bdf8",
    bgDetailColor: "rgba(224, 242, 254, 0.1)",
    environmentDesc: "Glacial tundra with jagged crystal icebergs",
    obstacleLabel: "Glacier Crystals",
  },

  // --- DYNAMIC MAP 4: SPACE ---
  space: {
    id: "space",
    name: "Deep Space",
    icon: "🌌",
    boardBg1: "#0f1029",
    boardBg2: "#16183d",
    boardBorder: "#8b5cf6",
    vignette: "rgba(139, 92, 246, 0.25)",
    snakeHead: "#c084fc",
    snakeBodyStart: "#7c3aed",
    snakeBodyEnd: "#312e81",
    snakeBelly: "#e9d5ff",
    snakeEyeIris: "#22d3ee",
    appleColor: "#f43f5e",
    appleHighlight: "#fda4af",
    goldenColor: "#facc15",
    hudBg: "rgba(15, 16, 41, 0.88)",
    accent: "#a855f7",
    obstacleColor: "#090d16",
    obstacleHighlight: "#1e293b",
    obstacleAccent: "#38bdf8",
    bgDetailColor: "rgba(255, 255, 255, 0.16)",
    environmentDesc: "Zero-gravity starfield & asteroid debris",
    obstacleLabel: "Asteroids & Barriers",
  },

  // --- DYNAMIC MAP 5: LAVA ---
  lava: {
    id: "lava",
    name: "Volcanic Lava",
    icon: "🌋",
    boardBg1: "#2b1b17",
    boardBg2: "#1c110e",
    boardBorder: "#dc2626",
    vignette: "rgba(220, 38, 38, 0.34)",
    snakeHead: "#fb923c",
    snakeBodyStart: "#ea580c",
    snakeBodyEnd: "#7f1d1d",
    snakeBelly: "#fed7aa",
    snakeEyeIris: "#facc15",
    appleColor: "#ef4444",
    appleHighlight: "#fecaca",
    goldenColor: "#f59e0b",
    hudBg: "rgba(43, 20, 18, 0.85)",
    accent: "#f97316",
    obstacleColor: "#0b0606",
    obstacleHighlight: "#261715",
    obstacleAccent: "#fb923c",
    bgDetailColor: "rgba(251, 146, 60, 0.14)",
    environmentDesc: "Scorched basalt crust & molten magma fissures",
    obstacleLabel: "Obsidian Spires",
  },

  // --- DYNAMIC MAP 6: OCEAN ---
  ocean: {
    id: "ocean",
    name: "Deep Ocean",
    icon: "🌊",
    boardBg1: "#0c4a6e",
    boardBg2: "#083344",
    boardBorder: "#14b8a6",
    vignette: "rgba(8, 51, 68, 0.48)",
    snakeHead: "#2dd4bf",
    snakeBodyStart: "#0d9488",
    snakeBodyEnd: "#115e59",
    snakeBelly: "#99f6e4",
    snakeEyeIris: "#fbbf24",
    appleColor: "#fb7185",
    appleHighlight: "#fecdd3",
    goldenColor: "#fde047",
    hudBg: "rgba(8, 47, 73, 0.85)",
    accent: "#14b8a6",
    obstacleColor: "#091521",
    obstacleHighlight: "#172a3a",
    obstacleAccent: "#f472b6",
    bgDetailColor: "rgba(153, 246, 228, 0.09)",
    environmentDesc: "Abyssal currents & vibrant coral reefs",
    obstacleLabel: "Coral Reefs & Rocks",
  },

  // --- LEGACY CAMPAIGN THEMES (PRESERVED) ---
  garden: {
    id: "garden",
    name: "Emerald Forest",
    icon: "🌿",
    boardBg1: "#529a32",
    boardBg2: "#458629",
    boardBorder: "#275017",
    vignette: "rgba(18, 45, 12, 0.45)",
    snakeHead: "#10b981",
    snakeBodyStart: "#059669",
    snakeBodyEnd: "#065f46",
    snakeBelly: "#34d399",
    snakeEyeIris: "#f59e0b",
    appleColor: "#ef4444",
    appleHighlight: "#fca5a5",
    goldenColor: "#fbbf24",
    hudBg: "rgba(19, 42, 19, 0.8)",
    accent: "#10b981",
  },

  magma: {
    id: "magma",
    name: "Volcanic Inferno",
    icon: "🔥",
    boardBg1: "#2b1b17",
    boardBg2: "#1c110e",
    boardBorder: "#dc2626",
    vignette: "rgba(220, 38, 38, 0.32)",
    snakeHead: "#fb923c",
    snakeBodyStart: "#ea580c",
    snakeBodyEnd: "#7f1d1d",
    snakeBelly: "#fed7aa",
    snakeEyeIris: "#facc15",
    appleColor: "#ef4444",
    appleHighlight: "#fecaca",
    goldenColor: "#f59e0b",
    hudBg: "rgba(43, 20, 18, 0.85)",
    accent: "#f97316",
  },

  cyber: {
    id: "cyber",
    name: "Cyber Void",
    icon: "⚡",
    boardBg1: "#0f172a",
    boardBg2: "#1e293b",
    boardBorder: "#06b6d4",
    vignette: "rgba(6, 182, 212, 0.22)",
    snakeHead: "#22d3ee",
    snakeBodyStart: "#06b6d4",
    snakeBodyEnd: "#7c3aed",
    snakeBelly: "#67e8f9",
    snakeEyeIris: "#f43f5e",
    appleColor: "#f43f5e",
    appleHighlight: "#fda4af",
    goldenColor: "#facc15",
    hudBg: "rgba(15, 23, 42, 0.85)",
    accent: "#06b6d4",
  },
};

// Aliases for compatibility
THEMES.neon = THEMES.cyber;
THEMES.midnight = THEMES.cyber;

export function getMainBackgroundGradient(themeId: string): string {
  switch (themeId) {
    case "desert":
      return "radial-gradient(circle at 50% 25%, #2a1c0d 0%, #0d0905 100%)";
    case "magma":
    case "lava":
      return "radial-gradient(circle at 50% 25%, #2b110e 0%, #0a0404 100%)";
    case "ice":
      return "radial-gradient(circle at 50% 25%, #0c233c 0%, #030812 100%)";
    case "space":
      return "radial-gradient(circle at 50% 25%, #19123b 0%, #04030d 100%)";
    case "ocean":
      return "radial-gradient(circle at 50% 25%, #082f49 0%, #020c14 100%)";
    case "cyber":
    case "neon":
    case "midnight":
      return "radial-gradient(circle at 50% 25%, #0c182b 0%, #030712 100%)";
    case "jungle":
      return "radial-gradient(circle at 50% 25%, #112915 0%, #050c06 100%)";
    default:
      return "radial-gradient(circle at 50% 25%, #152416 0%, #070c08 100%)";
  }
}
