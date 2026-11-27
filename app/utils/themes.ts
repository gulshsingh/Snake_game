import { ThemeConfig } from "./types";

export const THEMES: Record<string, ThemeConfig> = {
  // --- TIER 1 (LEVELS 1 - 5): LUSH FOREST & EMERALD GREEN SNAKE ---
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

  // --- TIER 2 (LEVELS 6 - 10): GOLDEN DESERT & SANDSTONE COBRA ---
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
  },

  // --- TIER 3 (LEVELS 11 - 15): VOLCANIC INFERNO & FIERY LAVA DRAGON ---
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

  // --- TIER 4 (LEVELS 16 - 20): CYBER VOID & NEON CYAN PYTHON ---
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
THEMES.lava = THEMES.magma;
THEMES.neon = THEMES.cyber;
THEMES.midnight = THEMES.cyber;
