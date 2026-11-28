import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { soundFx } from "../utils/audio";
import { MAP_THEME_IDS, THEMES } from "../utils/themes";
import { getLevelConfig } from "../utils/levels";
import {
  DIFFICULTY_LAYERS,
  DIFFICULTY_LEVELS,
  createGameSession,
  getInitialSnake,
  getLevelSpeedConfig,
} from "../utils/sessionGenerator";
import { getInitialGameState } from "../utils/gameStep";
import { useSnakeControls } from "./useSnakeControls";
import {
  DifficultyLayer,
  DifficultyLevel,
  Direction,
  FloatingText,
  GameSessionConfig,
  LevelProgress,
  MapThemeId,
  Particle,
  Status,
} from "../utils/types";

interface UseSnakeSessionParams {
  gridSizeRef: MutableRefObject<{ cols: number; rows: number }>;
  cellRef: MutableRefObject<number>;
  toggleFullscreenRef: MutableRefObject<() => void>;
}

export function useSnakeSession({
  gridSizeRef,
  cellRef,
  toggleFullscreenRef,
}: UseSnakeSessionParams) {
  const themeRef = useRef(THEMES.jungle);
  const game = useRef(getInitialGameState(20, 20));
  const statusRef = useRef<Status>("ready");

  const [status, setStatusState] = useState<Status>("ready");
  const [activeThemeId, setActiveThemeId] = useState<string>("jungle");
  const [sessionConfig, setSessionConfig] = useState<GameSessionConfig | null>(null);
  const sessionRef = useRef<GameSessionConfig | null>(null);
  const lastMapThemeRef = useRef<MapThemeId | null>(null);
  const bestScoreRef = useRef<number>(0);
  const [hudStats, setHudStats] = useState({
    score: 0,
    applesEaten: 0,
    snakeLength: 3,
    speedMs: 135,
    bestScore: 0,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(true);
  const [controlMode, setControlMode] = useState<"dpad" | "swipe">("dpad");

  const [currentLevelNum, setCurrentLevelNum] = useState<number>(1);
  const [levelProgress, setLevelProgress] = useState<LevelProgress>({
    unlockedLevel: 1,
    stars: {},
    bestTimes: {},
  });
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const showLevelSelectorRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState<number>(75);
  const [levelTimeTaken, setLevelTimeTaken] = useState<number>(0);
  const [earnedStars, setEarnedStars] = useState<number>(1);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  const currentLevelConfig = getLevelConfig(currentLevelNum);
  const currentLevelConfigRef = useRef(currentLevelConfig);

  const particles = useRef<Particle[]>([]);
  const floatingTexts = useRef<FloatingText[]>([]);
  const shakeRef = useRef(0);
  const tongueTimer = useRef(0);
  const mouthOpenRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);
  const resumeGraceMsRef = useRef(0);
  const turnRef = useRef<(d: Direction) => void>(() => {});

  useEffect(() => {
    showLevelSelectorRef.current = showLevelSelector;
  }, [showLevelSelector]);

  useEffect(() => {
    currentLevelConfigRef.current = currentLevelConfig;
  }, [currentLevelConfig]);

  const setStatus = useCallback((s: Status) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  const syncHudStats = useCallback(() => {
    const g = game.current;
    setHudStats({
      score: g.score,
      applesEaten: g.applesEaten,
      snakeLength: g.snake.length,
      speedMs: g.currentSpeedMs,
      bestScore: bestScoreRef.current,
    });
  }, []);

  const applySessionToGame = useCallback(
    (session: GameSessionConfig, cols: number, rows: number, isPortrait: boolean) => {
      const { snake: initialSnake, dir: initialDir } = getInitialSnake(cols, rows, isPortrait);
      const speedCfg = getLevelSpeedConfig(
        session.difficulty,
        session.level,
        session.difficultyLayer
      );

      sessionRef.current = session;
      setSessionConfig(session);
      if (THEMES[session.mapThemeId]) {
        setActiveThemeId(session.mapThemeId);
        themeRef.current = THEMES[session.mapThemeId];
      }

      game.current = {
        snake: initialSnake,
        prevSnake: initialSnake.map((p) => ({ ...p })),
        dir: initialDir,
        nextDir: initialDir,
        queue: [],
        food: { ...session.initialFood },
        golden: null,
        obstacles: session.obstacles.map((o) => ({ ...o })),
        score: 0,
        applesEaten: 0,
        goldenEaten: 0,
        dynamicObstaclesAdded: 0,
        currentSpeedMs: speedCfg.baseSpeed,
        startTime: Date.now(),
        bulges: [],
        hasStartedMoving: false,
        goldenAuraUntil: 0,
      };
      particles.current = [];
      floatingTexts.current = [];
      shakeRef.current = 0;
      mouthOpenRef.current = 0;
      syncHudStats();
    },
    [syncHudStats]
  );

  const initFreshSession = useCallback(
    (
      cols?: number,
      rows?: number,
      isPortrait?: boolean,
      levelOverride?: number,
      lockedOverride?: {
        seed: string;
        mapThemeId: MapThemeId;
        difficulty: DifficultyLevel;
        difficultyLayer?: DifficultyLayer;
      } | null
    ) => {
      const grid = gridSizeRef.current;
      const cCols = cols ?? grid.cols;
      const cRows = rows ?? grid.rows;
      const portrait =
        isPortrait ?? (typeof window !== "undefined" && window.innerHeight > window.innerWidth);
      const lvlNum = levelOverride ?? currentLevelConfigRef.current.level;

      const newSession = createGameSession({
        cols: cCols,
        rows: cRows,
        level: lvlNum,
        isPortrait: portrait,
        previousMapThemeId: lastMapThemeRef.current,
        seed: lockedOverride?.seed,
        fixedMapThemeId: lockedOverride?.mapThemeId,
        fixedDifficulty: lockedOverride?.difficulty,
        fixedDifficultyLayer: lockedOverride?.difficultyLayer,
      });

      lastMapThemeRef.current = newSession.mapThemeId;
      try {
        localStorage.setItem("snake-last-map", newSession.mapThemeId);
        localStorage.setItem(
          "snake-active-level-session",
          JSON.stringify({
            level: lvlNum,
            seed: newSession.seed,
            mapThemeId: newSession.mapThemeId,
            difficulty: newSession.difficulty,
            difficultyLayer: newSession.difficultyLayer,
          })
        );
      } catch {}

      applySessionToGame(newSession, cCols, cRows, portrait);
      return newSession;
    },
    [applySessionToGame, gridSizeRef]
  );

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      let initialLvl = 1;
      let lockedSession: {
        seed: string;
        mapThemeId: MapThemeId;
        difficulty: DifficultyLevel;
        difficultyLayer?: DifficultyLayer;
      } | null = null;

      try {
        const savedControls = localStorage.getItem("snake-controls") as "dpad" | "swipe";
        if (savedControls && ["dpad", "swipe"].includes(savedControls)) {
          setControlMode(savedControls);
        }
        const savedUnlocked = localStorage.getItem("snake-unlocked-level");
        if (savedUnlocked && Number(savedUnlocked) >= 1) {
          const u = Number(savedUnlocked);
          initialLvl = Math.floor(u);
          setLevelProgress((prev) => ({ ...prev, unlockedLevel: u }));
          setCurrentLevelNum(initialLvl);
          setTimeLeft(getLevelConfig(initialLvl).timeLimit);
        }
        const savedStars = localStorage.getItem("snake-level-stars");
        if (savedStars) {
          setLevelProgress((prev) => ({ ...prev, stars: JSON.parse(savedStars) }));
        }
        const savedLastMap = localStorage.getItem("snake-last-map") as MapThemeId | null;
        if (savedLastMap) lastMapThemeRef.current = savedLastMap;

        const savedBest = Number(localStorage.getItem("snake-session-best") || "0");
        if (Number.isFinite(savedBest) && savedBest > 0) bestScoreRef.current = savedBest;

        const rawLocked = localStorage.getItem("snake-active-level-session");
        if (rawLocked) {
          const parsed = JSON.parse(rawLocked) as {
            level?: number;
            seed?: string;
            mapThemeId?: MapThemeId;
            difficulty?: DifficultyLevel;
            difficultyLayer?: DifficultyLayer;
          };
          if (
            parsed?.level === initialLvl &&
            parsed.seed &&
            parsed.mapThemeId &&
            MAP_THEME_IDS.includes(parsed.mapThemeId) &&
            parsed.difficulty &&
            DIFFICULTY_LEVELS.includes(parsed.difficulty)
          ) {
            const validLayer =
              parsed.difficultyLayer && DIFFICULTY_LAYERS.includes(parsed.difficultyLayer)
                ? parsed.difficultyLayer
                : 2;
            lockedSession = {
              seed: parsed.seed,
              mapThemeId: parsed.mapThemeId,
              difficulty: parsed.difficulty,
              difficultyLayer: validLayer,
            };
          }
        }
        setIsMuted(soundFx.muted);
      } catch {}

      setIsMobileDevice(
        typeof window !== "undefined" &&
          ("ontouchstart" in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768)
      );
      initFreshSession(undefined, undefined, undefined, initialLvl, lockedSession);
    });
    return () => cancelAnimationFrame(rafId);
  }, [initFreshSession]);

  const toggleControlMode = useCallback(() => {
    setControlMode((prev) => {
      const nextMode = prev === "dpad" ? "swipe" : "dpad";
      try {
        localStorage.setItem("snake-controls", nextMode);
      } catch {}
      return nextMode;
    });
  }, []);

  const handleLevelComplete = useCallback(() => {
    const g = game.current;
    const lvl = currentLevelConfigRef.current;
    const elapsedSeconds = Math.max(0.1, (Date.now() - g.startTime) / 1000);
    const stars = elapsedSeconds <= lvl.star3Time ? 3 : elapsedSeconds <= lvl.star2Time ? 2 : 1;

    setEarnedStars(stars);
    setLevelTimeTaken(elapsedSeconds);
    setStatus("level_clear");
    try {
      soundFx.playLevelComplete();
      soundFx.playStar(stars);
    } catch {}

    setLevelProgress((prev) => {
      const newUnlocked = Math.max(prev.unlockedLevel, lvl.level + 1);
      const newStars = { ...prev.stars, [lvl.level]: Math.max(prev.stars[lvl.level] || 0, stars) };
      const newBestTimes = {
        ...prev.bestTimes,
        [lvl.level]: prev.bestTimes[lvl.level]
          ? Math.min(prev.bestTimes[lvl.level], elapsedSeconds)
          : elapsedSeconds,
      };
      try {
        localStorage.removeItem("snake-active-level-session");
        localStorage.setItem("snake-unlocked-level", String(newUnlocked));
        localStorage.setItem("snake-level-stars", JSON.stringify(newStars));
      } catch {}
      return { ...prev, unlockedLevel: newUnlocked, stars: newStars, bestTimes: newBestTimes };
    });
  }, [setStatus]);

  const controls = useSnakeControls({
    gameRef: game,
    statusRef,
    sessionRef,
    gridSizeRef,
    cellRef,
    floatingTexts,
    currentLevelNum,
    currentLevelConfigRef,
    showLevelSelectorRef,
    toggleFullscreenRef,
    pausedAtRef,
    resumeGraceMsRef,
    turnRef,
    setStatus,
    setIsMuted,
    setCurrentLevelNum,
    setShowLevelSelector,
    setTimeLeft,
    setIsTimeUp,
    applySessionToGame,
    initFreshSession,
  });

  return {
    themeRef,
    game,
    statusRef,
    status,
    setStatus,
    activeThemeId,
    sessionConfig,
    sessionRef,
    bestScoreRef,
    hudStats,
    isMuted,
    isMobileDevice,
    controlMode,
    currentLevelNum,
    levelProgress,
    showLevelSelector,
    setShowLevelSelector,
    timeLeft,
    setTimeLeft,
    levelTimeTaken,
    earnedStars,
    isTimeUp,
    setIsTimeUp,
    currentLevelConfig,
    currentLevelConfigRef,
    particles,
    floatingTexts,
    shakeRef,
    tongueTimer,
    mouthOpenRef,
    resumeGraceMsRef,
    turnRef,
    syncHudStats,
    applySessionToGame,
    toggleControlMode,
    handleLevelComplete,
    ...controls,
  };
}
