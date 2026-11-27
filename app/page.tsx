"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { soundFx } from "./utils/audio";
import { THEMES } from "./utils/themes";
import { getLevelConfig, MAX_LEVELS } from "./utils/levels";
import {
  Point,
  Direction,
  Status,
  LevelConfig,
  LevelProgress,
  Particle,
  FloatingText,
  GoldenApple,
} from "./utils/types";

// Modular Child Components
import { GameHud } from "./components/GameHud";
import { DPadControls } from "./components/DPadControls";
import { LevelSelectorModal } from "./components/LevelSelectorModal";
import { LevelClearModal } from "./components/LevelClearModal";
import { GameOverModal } from "./components/GameOverModal";
import { ReadyOverlay } from "./components/ReadyOverlay";
import { PauseOverlay } from "./components/PauseOverlay";

function getInitialGameState(cols = 20, rows = 20) {
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
    dir: { x: 1, y: 0 } as Direction,
    nextDir: { x: 1, y: 0 } as Direction,
    queue: [] as Direction[],
    food: { x: Math.min(cols - 3, startX + 4), y: startY } as Point,
    golden: null as GoldenApple | null,
    score: 0,
    applesEaten: 0,
    goldenEaten: 0,
    startTime: 0,
    bulges: [] as { index: number; progress: number }[],
    hasStartedMoving: false,
  };
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Dynamic Grid sizing
  const gridSizeRef = useRef({ cols: 20, rows: 20 });
  const cellRef = useRef(32);
  const themeRef = useRef(THEMES.garden);

  // Game internal mutable state
  const game = useRef(getInitialGameState(20, 20));
  const statusRef = useRef<Status>("ready");

  // UI state
  const [canvasDim, setCanvasDim] = useState({
    width: 640,
    height: 640,
    cols: 20,
    rows: 20,
  });
  const [status, setStatusState] = useState<Status>("ready");
  const [activeThemeId, setActiveThemeId] = useState<string>("garden");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenHud, setShowFullscreenHud] = useState(false);
  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(true);
  const [controlMode, setControlMode] = useState<"dpad" | "swipe">("dpad");

  // LEVEL CHALLENGE & CAMPAIGN STATE
  const [currentLevelNum, setCurrentLevelNum] = useState<number>(1);
  const [levelProgress, setLevelProgress] = useState<LevelProgress>({
    unlockedLevel: 1,
    stars: {},
    bestTimes: {},
  });
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(75);
  const [levelTimeTaken, setLevelTimeTaken] = useState<number>(0);
  const [earnedStars, setEarnedStars] = useState<number>(1);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  const currentLevelConfig = getLevelConfig(currentLevelNum);
  const currentLevelConfigRef = useRef(currentLevelConfig);
  currentLevelConfigRef.current = currentLevelConfig;

  // DYNAMIC THEME SYNC FOR LEVELS (Tier 1: Levels 1-5, Tier 2: 6-10, Tier 3: 11-15, Tier 4: 16-20, cycling every 5 levels up to 10,000)
  useEffect(() => {
    const lvl = getLevelConfig(currentLevelNum);
    if (lvl && THEMES[lvl.themeId]) {
      setActiveThemeId(lvl.themeId);
      themeRef.current = THEMES[lvl.themeId];
    }
  }, [currentLevelNum]);

  // Animation and visual effects refs
  const particles = useRef<Particle[]>([]);
  const floatingTexts = useRef<FloatingText[]>([]);
  const shakeRef = useRef(0);
  const tongueTimer = useRef(0);
  const mouthOpenRef = useRef(0);
  const animTime = useRef(0);

  function setStatus(s: Status) {
    statusRef.current = s;
    setStatusState(s);
  }

  // Safe random food generator
  const generateRandomFood = useCallback(
    (snake: Point[], excludePoint?: Point): Point => {
      const { cols, rows } = gridSizeRef.current;
      let attempts = 0;
      while (attempts < 1000) {
        attempts++;
        const p = {
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows),
        };
        const onSnake = snake.some((s) => s.x === p.x && s.y === p.y);
        const onExclude =
          excludePoint && excludePoint.x === p.x && excludePoint.y === p.y;
        if (!onSnake && !onExclude) return p;
      }
      return { x: 0, y: 0 };
    },
    []
  );

  // Initialize storage & preferences
  useEffect(() => {
    try {
      const savedControls = localStorage.getItem("snake-controls") as "dpad" | "swipe";
      if (savedControls && ["dpad", "swipe"].includes(savedControls)) {
        setControlMode(savedControls);
      }

      const savedUnlocked = localStorage.getItem("snake-unlocked-level");
      const savedStars = localStorage.getItem("snake-level-stars");
      if (savedUnlocked) {
        const u = Number(savedUnlocked);
        if (u >= 1) {
          setLevelProgress((prev) => ({ ...prev, unlockedLevel: u }));
          setCurrentLevelNum(Math.min(u, MAX_LEVELS));
        }
      }
      if (savedStars) {
        try {
          setLevelProgress((prev) => ({ ...prev, stars: JSON.parse(savedStars) }));
        } catch {}
      }

      setIsMuted(soundFx.muted);
    } catch {}

    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);
    setIsMobileDevice(isTouch);
  }, []);

  // ADAPTIVE RESIZING (Specialized for iPhone, Mobile & Desktop)
  const handleResize = useCallback(() => {
    if (typeof window === "undefined") return;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const isMobile = screenW < 768;
    const isPortrait = screenH > screenW;

    const isFs =
      typeof document !== "undefined" &&
      !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement: Element }).webkitFullscreenElement
      );

    let reservedH = 0;
    if (isFs) {
      reservedH = isMobile && controlMode === "dpad" ? 140 : 0;
    } else if (isMobile) {
      reservedH = controlMode === "dpad" && isPortrait ? 190 : 70;
    } else {
      reservedH = 90;
    }

    const availableW = isFs ? screenW : Math.min(screenW - (isMobile ? 12 : 24), 1400);
    const availableH = Math.max(200, screenH - reservedH);

    const targetCell = isMobile ? (isPortrait ? 22 : 20) : 38;
    const cols = Math.max(isMobile ? 12 : 16, Math.floor(availableW / targetCell));
    const rows = Math.max(isMobile ? 12 : 12, Math.floor(availableH / targetCell));

    const cellW = Math.floor(availableW / cols);
    const cellH = Math.floor(availableH / rows);
    const c = Math.min(cellW, cellH);

    cellRef.current = c;
    gridSizeRef.current = { cols, rows };

    const finalW = cols * c;
    const finalH = rows * c;

    setCanvasDim({
      width: finalW,
      height: finalH,
      cols,
      rows,
    });

    const g = game.current;
    if (g && g.snake) {
      g.snake.forEach((p) => {
        p.x = Math.max(0, Math.min(cols - 1, p.x));
        p.y = Math.max(0, Math.min(rows - 1, p.y));
      });
      g.food.x = Math.max(0, Math.min(cols - 1, g.food.x));
      g.food.y = Math.max(0, Math.min(rows - 1, g.food.y));
    }
  }, [controlMode]);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    const onFsChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
      if (!isFs) {
        setShowFullscreenHud(false);
      }
      setTimeout(handleResize, 60);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, [handleResize]);

  // FULLSCREEN MOUSE-HOVER HUD DETECTOR
  useEffect(() => {
    if (!isFullscreen) {
      setShowFullscreenHud(false);
      if (hudTimerRef.current) {
        clearTimeout(hudTimerRef.current);
        hudTimerRef.current = null;
      }
      return;
    }

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (e.clientY < 75) {
        setShowFullscreenHud(true);
        if (hudTimerRef.current) {
          clearTimeout(hudTimerRef.current);
          hudTimerRef.current = null;
        }
      } else {
        if (!hudTimerRef.current) {
          hudTimerRef.current = setTimeout(() => {
            setShowFullscreenHud(false);
            hudTimerRef.current = null;
          }, 1200);
        }
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      if (hudTimerRef.current) {
        clearTimeout(hudTimerRef.current);
        hudTimerRef.current = null;
      }
    };
  }, [isFullscreen]);

  // FULLSCREEN TOGGLE
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const elem = mainRef.current || document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if ((elem as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen) {
        (elem as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen) {
        (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
    }
  };

  const toggleControlMode = () => {
    const nextMode = controlMode === "dpad" ? "swipe" : "dpad";
    setControlMode(nextMode);
    try {
      localStorage.setItem("snake-controls", nextMode);
    } catch {}
  };

  const lastSoundToggleRef = useRef(0);
  const toggleSound = useCallback(() => {
    const now = Date.now();
    if (now - lastSoundToggleRef.current < 250) return;
    lastSoundToggleRef.current = now;
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  }, []);

  // START GAME (Universal: works 100% on iPhone iOS Safari, Android, and Desktop)
  const lastStartRef = useRef(0);
  const start = useCallback(() => {
    const now = Date.now();
    if (now - lastStartRef.current < 200) return;
    lastStartRef.current = now;

    try {
      const { cols, rows } = gridSizeRef.current;
      const isPortrait = typeof window !== "undefined" && window.innerHeight > window.innerWidth;
      const startX = Math.floor(cols / 2);
      const startY = Math.floor(rows / 2);
      const initialDir: Direction = isPortrait ? { x: 0, y: -1 } : { x: 1, y: 0 };
      const initialSnake: Point[] = isPortrait
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

      // Apply current level theme and time limit
      const currentLvl = currentLevelConfigRef.current;
      if (currentLvl) {
        setTimeLeft(currentLvl.timeLimit);
        if (THEMES[currentLvl.themeId]) {
          setActiveThemeId(currentLvl.themeId);
          themeRef.current = THEMES[currentLvl.themeId];
        }
      }

      setIsTimeUp(false);
      game.current = {
        snake: initialSnake,
        prevSnake: initialSnake.map((p) => ({ ...p })),
        dir: initialDir,
        nextDir: initialDir,
        queue: [],
        food: generateRandomFood(initialSnake),
        golden: null,
        score: 0,
        applesEaten: 0,
        goldenEaten: 0,
        startTime: Date.now(),
        bulges: [],
        hasStartedMoving: false,
      };
      particles.current = [];
      floatingTexts.current = [];
      shakeRef.current = 0;
      mouthOpenRef.current = 0;
      setStatus("playing");
    } catch (e) {
      console.error("Error in start:", e);
      setStatus("playing");
    }

    try {
      soundFx.playTurn();
    } catch {}
  }, [generateRandomFood]);

  const selectLevel = (lvl: LevelConfig) => {
    setCurrentLevelNum(lvl.level);
    currentLevelConfigRef.current = lvl;
    setShowLevelSelector(false);
    setTimeLeft(lvl.timeLimit);
    setIsTimeUp(false);
    if (THEMES[lvl.themeId]) {
      setActiveThemeId(lvl.themeId);
      themeRef.current = THEMES[lvl.themeId];
    }
    start();
  };

  const nextLevel = useCallback(() => {
    lastStartRef.current = 0;
    const nextLvlNum = Math.min(MAX_LEVELS, currentLevelNum + 1);
    const nextLvl = getLevelConfig(nextLvlNum);
    setCurrentLevelNum(nextLvlNum);
    currentLevelConfigRef.current = nextLvl;
    setTimeLeft(nextLvl.timeLimit);
    setIsTimeUp(false);
    if (THEMES[nextLvl.themeId]) {
      setActiveThemeId(nextLvl.themeId);
      themeRef.current = THEMES[nextLvl.themeId];
    }
    start();
  }, [currentLevelNum, start]);

  const turn = useCallback(
    (d: Direction) => {
      if (statusRef.current === "level_clear") {
        nextLevel();
        return;
      }
      if (statusRef.current === "ready" || statusRef.current === "over") {
        start();
        if (game.current) {
          game.current.dir = d;
          game.current.nextDir = d;
          game.current.hasStartedMoving = true;
        }
        return;
      }
      if (statusRef.current !== "playing") return;

      const g = game.current;
      g.hasStartedMoving = true;
      const last = g.queue.length ? g.queue[g.queue.length - 1] : g.dir;
      const isOpposite = last.x + d.x === 0 && last.y + d.y === 0;
      const isSame = last.x === d.x && last.y === d.y;

      if (!isOpposite && !isSame && g.queue.length < 2) {
        g.queue.push(d);
        try {
          soundFx.playTurn();
        } catch {}
      }
    },
    [start, nextLevel]
  );

  const togglePause = useCallback(() => {
    if (statusRef.current === "playing") {
      setStatus("paused");
    } else if (statusRef.current === "paused") {
      setStatus("playing");
    } else {
      start();
    }
  }, [start]);

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const keys: Record<string, Direction> = {
        ArrowUp: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        W: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        S: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        A: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
        D: { x: 1, y: 0 },
      };

      if (keys[e.key]) {
        e.preventDefault();
        turn(keys[e.key]);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        togglePause();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleSound();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        start();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [turn, togglePause, start]);

  // TOUCH & SWIPE CONTROLS
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 16) {
      if (Math.abs(dx) > Math.abs(dy)) {
        turn({ x: dx > 0 ? 1 : -1, y: 0 });
      } else {
        turn({ x: 0, y: dy > 0 ? 1 : -1 });
      }
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    }
  };

  const onTouchEnd = () => {
    touchStartRef.current = null;
  };

  // JUICE PARTICLES & FLOATING TEXTS
  const spawnJuiceParticles = (
    x: number,
    y: number,
    color: string,
    count = 16
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = Math.random() * 3.5 + 1.2;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3.5 + 1.5,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015,
        gravity: 0.08,
      });
    }
  };

  const spawnGoldenStars = (x: number, y: number, count = 26) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 2;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? "#fbbf24" : "#fef08a",
        size: Math.random() * 4 + 2,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01,
        gravity: 0.04,
      });
    }
  };

  const spawnDeathParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 3 === 0 ? "#ef4444" : color,
        size: Math.random() * 4 + 2,
        alpha: 1,
        decay: Math.random() * 0.025 + 0.01,
        gravity: 0.12,
      });
    }
  };

  const addFloatingText = (
    text: string,
    x: number,
    y: number,
    color = "#ffffff"
  ) => {
    floatingTexts.current.push({
      id: Date.now() + Math.random(),
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -1.2,
      scale: 1,
    });
  };

  // HANDLE LEVEL COMPLETION
  const handleLevelComplete = useCallback(() => {
    const g = game.current;
    const lvl = currentLevelConfigRef.current;
    const elapsedSeconds = Math.max(0.1, (Date.now() - g.startTime) / 1000);

    let stars = 1;
    if (elapsedSeconds <= lvl.star3Time) {
      stars = 3;
    } else if (elapsedSeconds <= lvl.star2Time) {
      stars = 2;
    }

    setEarnedStars(stars);
    setLevelTimeTaken(elapsedSeconds);
    setStatus("level_clear");

    try {
      soundFx.playLevelComplete();
      soundFx.playStar(stars);
    } catch {}

    // Unlock next level & persist
    setLevelProgress((prev) => {
      const newUnlocked = Math.max(prev.unlockedLevel, Math.min(MAX_LEVELS, lvl.level + 1));
      const currentBest = prev.stars[lvl.level] || 0;
      const newStars = { ...prev.stars, [lvl.level]: Math.max(currentBest, stars) };
      const newBestTimes = {
        ...prev.bestTimes,
        [lvl.level]: prev.bestTimes[lvl.level]
          ? Math.min(prev.bestTimes[lvl.level], elapsedSeconds)
          : elapsedSeconds,
      };

      try {
        localStorage.setItem("snake-unlocked-level", String(newUnlocked));
        localStorage.setItem("snake-level-stars", JSON.stringify(newStars));
      } catch {}

      return {
        ...prev,
        unlockedLevel: newUnlocked,
        stars: newStars,
        bestTimes: newBestTimes,
      };
    });
  }, []);

  // MAIN GAME LOOP (requestAnimationFrame)
  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();
    let accumulator = 0;

    function step() {
      const g = game.current;
      if (!g.hasStartedMoving) return;
      const c = cellRef.current;
      const { cols, rows } = gridSizeRef.current;

      g.prevSnake = g.snake.map((p) => ({ ...p }));

      if (g.queue.length) {
        g.dir = g.queue.shift()!;
      }

      const head = g.snake[0];
      const nextHead = { x: head.x + g.dir.x, y: head.y + g.dir.y };

      const hitWall =
        nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= cols || nextHead.y >= rows;

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

      // GAME OVER
      if (hitWall || hitSelf) {
        setStatus("over");
        shakeRef.current = 16;
        try {
          soundFx.playDie();
        } catch {}

        const headPos = {
          x: (head.x + 0.5) * c,
          y: (head.y + 0.5) * c,
        };
        spawnDeathParticles(headPos.x, headPos.y, themeRef.current.snakeHead);
        return;
      }

      g.snake.unshift(nextHead);

      g.bulges = g.bulges
        .map((b) => ({ ...b, index: b.index + 1 }))
        .filter((b) => b.index < g.snake.length);

      // APPLE CONSUMPTION
      if (eatingFood) {
        g.score += 10;
        g.applesEaten += 1;

        const foodPixelX = (g.food.x + 0.5) * c;
        const foodPixelY = (g.food.y + 0.5) * c;
        spawnJuiceParticles(foodPixelX, foodPixelY, themeRef.current.appleColor, 20);
        addFloatingText("+10", foodPixelX, foodPixelY - 12, "#fbbf24");
        shakeRef.current = 4;

        try {
          soundFx.playEat(Math.min(5, Math.floor(g.score / 30) + 1));
        } catch {}

        g.bulges.push({ index: 0, progress: 0 });
        g.food = generateRandomFood(g.snake);

        // Check Levels Victory Condition
        if (g.applesEaten >= currentLevelConfigRef.current.targetApples) {
          handleLevelComplete();
          return;
        }

        // Golden Apple Spawn (every 5 apples)
        if (g.applesEaten % 5 === 0 && (!g.golden || !g.golden.active)) {
          g.golden = {
            x: generateRandomFood(g.snake, g.food).x,
            y: generateRandomFood(g.snake, g.food).y,
            active: true,
            timeLeft: 9000,
            maxTime: 9000,
          };
          try {
            soundFx.playGolden();
          } catch {}
        }
      } else if (eatingGolden) {
        g.score += 50;
        g.goldenEaten += 1;

        const goldPixelX = (g.golden!.x + 0.5) * c;
        const goldPixelY = (g.golden!.y + 0.5) * c;
        spawnGoldenStars(goldPixelX, goldPixelY, 28);
        addFloatingText("+50 GOLDEN!", goldPixelX, goldPixelY - 12, "#fde047");
        shakeRef.current = 7;

        try {
          soundFx.playGolden();
        } catch {}

        g.bulges.push({ index: 0, progress: 0 });
        g.golden = null;
      } else {
        g.snake.pop();
      }
    }

    // CANVAS GRAPHICS ENGINE (Restored Hyper-Realistic Slithering Serpent)
    function render(interp: number, timeNow: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const c = cellRef.current;
      const { cols, rows } = gridSizeRef.current;
      const width = cols * c;
      const height = rows * c;
      const theme = themeRef.current;
      const g = game.current;

      ctx.save();

      // Screen Shake translation
      if (shakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current;
        const sy = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(sx, sy);
      }

      // 1. BOARD BACKGROUND (Edge-to-Edge checkered tiles with grass blade highlights)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? theme.boardBg1 : theme.boardBg2;
          ctx.fillRect(x * c, y * c, c, c);

          // Subtle grass blade details for texture
          if ((x * 7 + y * 13) % 7 === 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
            ctx.fillRect(x * c + c * 0.35, y * c + c * 0.35, c * 0.08, c * 0.28);
          }
        }
      }

      // Cinematic Vignette border across the expansive field
      const vigGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.42,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.72
      );
      vigGrad.addColorStop(0, "rgba(0,0,0,0)");
      vigGrad.addColorStop(1, theme.vignette);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. GOLDEN APPLE (if active)
      if (g.golden && g.golden.active) {
        const gx = (g.golden.x + 0.5) * c;
        const gy = (g.golden.y + 0.5) * c;
        const bob = Math.sin(timeNow * 0.007) * (c * 0.08);

        // Golden aura
        const aura = ctx.createRadialGradient(gx, gy + bob, c * 0.1, gx, gy + bob, c * 0.85);
        aura.addColorStop(0, "rgba(250, 204, 21, 0.55)");
        aura.addColorStop(1, "rgba(250, 204, 21, 0)");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(gx, gy + bob, c * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.beginPath();
        ctx.ellipse(gx, gy + c * 0.35, c * 0.38, c * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golden apple body
        const goldGrad = ctx.createRadialGradient(
          gx - c * 0.1,
          gy + bob - c * 0.1,
          c * 0.05,
          gx,
          gy + bob,
          c * 0.42
        );
        goldGrad.addColorStop(0, "#fef08a");
        goldGrad.addColorStop(0.5, "#eab308");
        goldGrad.addColorStop(1, "#a16207");
        ctx.fillStyle = goldGrad;
        ctx.beginPath();
        ctx.arc(gx, gy + bob, c * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Star glint on golden apple
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(gx - c * 0.12, gy + bob - c * 0.12, c * 0.07, 0, Math.PI * 2);
        ctx.fill();

        // Countdown timer ring
        const progress = g.golden.timeLeft / g.golden.maxTime;
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gx, gy + bob, c * 0.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
      }

      // 3. REGULAR 3D APPLE
      const ax = (g.food.x + 0.5) * c;
      const ay = (g.food.y + 0.5) * c;
      const appleBob = Math.sin(timeNow * 0.005) * (c * 0.06);

      // Apple Shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(ax, ay + c * 0.35, c * 0.34, c * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Apple Body
      const appleGrad = ctx.createRadialGradient(
        ax - c * 0.12,
        ay + appleBob - c * 0.1,
        c * 0.05,
        ax,
        ay + appleBob,
        c * 0.38
      );
      appleGrad.addColorStop(0, theme.appleHighlight);
      appleGrad.addColorStop(0.35, theme.appleColor);
      appleGrad.addColorStop(1, "#831843");

      ctx.fillStyle = appleGrad;
      ctx.beginPath();
      ctx.arc(ax, ay + appleBob + c * 0.04, c * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Apple Glint
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.beginPath();
      ctx.ellipse(
        ax - c * 0.14,
        ay + appleBob - c * 0.08,
        c * 0.1,
        c * 0.05,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Wooden Curved Stem
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = Math.max(2.5, c * 0.08);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ax, ay + appleBob - c * 0.28);
      ctx.quadraticCurveTo(
        ax + c * 0.08,
        ay + appleBob - c * 0.45,
        ax + c * 0.15,
        ay + appleBob - c * 0.48
      );
      ctx.stroke();

      // Fresh Green Leaf
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.ellipse(
        ax + c * 0.18,
        ay + appleBob - c * 0.4,
        c * 0.15,
        c * 0.08,
        Math.PI / 5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 4. ULTRA-REALISTIC SNAKE WITH CONTINUOUS SKIN & LIVING MOTION
      const snakeLen = g.snake.length;
      const prevSnake = g.prevSnake || g.snake;

      // Distance from snake head to target food for Gaping Jaws animation
      const headPosCurrent = g.snake[0];
      const targetFood = g.golden && g.golden.active ? g.golden : g.food;
      const distToFood = Math.hypot(
        headPosCurrent.x - targetFood.x,
        headPosCurrent.y - targetFood.y
      );

      const targetMouthOpen = distToFood <= 2.2 ? Math.min(1, (2.2 - distToFood) / 1.4) : 0;
      mouthOpenRef.current += (targetMouthOpen - mouthOpenRef.current) * 0.2;

      // Pre-calculate interpolated smooth points with natural lateral spine undulation
      type RenderNode = { x: number; y: number; radius: number; index: number };
      const nodes: RenderNode[] = [];

      for (let i = 0; i < snakeLen; i++) {
        const curr = g.snake[i];
        const prev = prevSnake[i] || curr;

        let px = prev.x + (curr.x - prev.x) * interp;
        let py = prev.y + (curr.y - prev.y) * interp;

        // Serpentine lateral spine wave
        if (
          statusRef.current === "playing" &&
          game.current.hasStartedMoving &&
          i > 0 &&
          i < snakeLen - 1
        ) {
          const wavePhase = timeNow * 0.009 + i * 0.65;
          const waveAmp = (c * 0.07) * Math.sin((i / snakeLen) * Math.PI);
          const segDirX = curr.x - (g.snake[i + 1]?.x || curr.x);
          const segDirY = curr.y - (g.snake[i + 1]?.y || curr.y);
          const len = Math.hypot(segDirX, segDirY) || 1;
          const perpX = -segDirY / len;
          const perpY = segDirX / len;

          px += (perpX * waveAmp * Math.sin(wavePhase)) / c;
          py += (perpY * waveAmp * Math.sin(wavePhase)) / c;
        }

        const segX = (px + 0.5) * c;
        const segY = (py + 0.5) * c;

        const taper = i === 0 ? 0.95 : 0.45 + 0.55 * (1 - i / snakeLen);
        let radius = c * 0.42 * taper;

        // Digestion bulge swell
        const activeBulge = g.bulges.find((b) => Math.abs(b.index - i) < 1.3);
        if (activeBulge) {
          const bulgeStrength = 1 - Math.abs(activeBulge.index - i) / 1.3;
          radius *= 1 + 0.35 * bulgeStrength;
        }

        nodes.push({ x: segX, y: segY, radius, index: i });
      }

      // PASS 1: Ambient soft shadow cast under entire snake
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
      if ("filter" in ctx) {
        try {
          ctx.filter = `blur(${Math.max(2, c * 0.08)}px)`;
        } catch {}
      }
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        ctx.beginPath();
        ctx.ellipse(
          node.x,
          node.y + c * 0.14,
          node.radius * 1.05,
          node.radius * 0.85,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();

      // PASS 2: CONTINUOUS CONNECTED TUBULAR REPTILE BODY
      for (let i = nodes.length - 1; i >= 1; i--) {
        const currNode = nodes[i];
        const nextNode = nodes[i - 1];

        const dx = nextNode.x - currNode.x;
        const dy = nextNode.y - currNode.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = -dy / dist;
        const ny = dx / dist;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(currNode.x + nx * currNode.radius, currNode.y + ny * currNode.radius);
        ctx.lineTo(nextNode.x + nx * nextNode.radius, nextNode.y + ny * nextNode.radius);
        ctx.arc(nextNode.x, nextNode.y, nextNode.radius, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
        ctx.lineTo(currNode.x - nx * currNode.radius, currNode.y - ny * currNode.radius);
        ctx.arc(currNode.x, currNode.y, currNode.radius, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
        ctx.closePath();

        const bodyGrad = ctx.createLinearGradient(
          currNode.x - nx * currNode.radius,
          currNode.y - ny * currNode.radius,
          currNode.x + nx * currNode.radius,
          currNode.y + ny * currNode.radius
        );

        bodyGrad.addColorStop(0, theme.snakeBodyEnd);
        bodyGrad.addColorStop(0.35, theme.snakeBodyStart);
        bodyGrad.addColorStop(0.65, theme.snakeBelly);
        bodyGrad.addColorStop(1, theme.snakeBodyEnd);

        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Dorsal Diamondback / Saddle Pattern
        if (i % 2 === 0) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
          ctx.beginPath();
          ctx.ellipse(
            currNode.x,
            currNode.y,
            currNode.radius * 0.45,
            currNode.radius * 0.7,
            Math.atan2(dy, dx),
            0,
            Math.PI * 2
          );
          ctx.fill();

          ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
          ctx.beginPath();
          ctx.ellipse(
            currNode.x,
            currNode.y,
            currNode.radius * 0.22,
            currNode.radius * 0.35,
            Math.atan2(dy, dx),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Wet Cylindrical Spine Highlight
        ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
        ctx.lineWidth = Math.max(1.5, currNode.radius * 0.25);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(currNode.x + nx * (currNode.radius * 0.3), currNode.y + ny * (currNode.radius * 0.3));
        ctx.lineTo(nextNode.x + nx * (nextNode.radius * 0.3), nextNode.y + ny * (nextNode.radius * 0.3));
        ctx.stroke();

        ctx.restore();
      }

      // PASS 3: VIPER HEAD WITH GAPING MOUTH & FANGS
      const headNode = nodes[0];
      const headAngle = Math.atan2(g.dir.y, g.dir.x);
      const mouthOpen = mouthOpenRef.current;

      ctx.save();
      ctx.translate(headNode.x, headNode.y);
      ctx.rotate(headAngle);

      // Mouth Interior & Fangs when striking
      if (mouthOpen > 0.05) {
        ctx.fillStyle = "#7f1d1d";
        ctx.beginPath();
        ctx.ellipse(
          c * 0.35,
          0,
          c * 0.3 * mouthOpen,
          c * 0.35 * mouthOpen,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#fb7185";
        ctx.beginPath();
        ctx.ellipse(
          c * 0.28,
          0,
          c * 0.15 * mouthOpen,
          c * 0.2 * mouthOpen,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        const fangSpread = c * 0.28 * mouthOpen;
        const fangLen = c * 0.22 * mouthOpen;

        ctx.fillStyle = "#fdfbf7";
        [-1, 1].forEach((side) => {
          ctx.beginPath();
          ctx.moveTo(c * 0.4, side * fangSpread);
          ctx.lineTo(c * 0.4 + fangLen, side * (fangSpread * 0.7));
          ctx.lineTo(c * 0.34, side * (fangSpread * 0.85));
          ctx.closePath();
          ctx.fill();
        });
      }

      // Upper Head Cranium
      const headGrad = ctx.createRadialGradient(
        c * 0.1,
        -c * 0.1,
        c * 0.05,
        0,
        0,
        c * 0.6
      );
      headGrad.addColorStop(0, theme.snakeHead);
      headGrad.addColorStop(0.5, theme.snakeBodyStart);
      headGrad.addColorStop(1, theme.snakeBodyEnd);

      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.moveTo(c * 0.55, 0);
      ctx.quadraticCurveTo(c * 0.42, c * 0.42, -c * 0.28, c * 0.45);
      ctx.quadraticCurveTo(-c * 0.52, c * 0.22, -c * 0.45, 0);
      ctx.quadraticCurveTo(-c * 0.52, -c * 0.22, -c * 0.28, -c * 0.45);
      ctx.quadraticCurveTo(c * 0.42, -c * 0.42, c * 0.55, 0);
      ctx.closePath();
      ctx.fill();

      // Supraocular Brow Ridges
      ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
      ctx.lineWidth = Math.max(1.8, c * 0.05);
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.arc(c * 0.12, side * c * 0.28, c * 0.16, -0.6 * side, 1.2 * side, side < 0);
        ctx.stroke();
      });

      // Nostrils & Loreal Pits
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.arc(c * 0.42, side * c * 0.11, c * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c * 0.28, side * c * 0.22, c * 0.03, 0, Math.PI * 2);
        ctx.fill();
      });

      // Predatory Eyes
      const eyeOffsets = [-c * 0.28, c * 0.28];
      eyeOffsets.forEach((ey) => {
        ctx.fillStyle = "#fffbeb";
        ctx.beginPath();
        ctx.ellipse(c * 0.1, ey, c * 0.15, c * 0.11, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = theme.snakeEyeIris;
        ctx.beginPath();
        ctx.arc(c * 0.12, ey, c * 0.085, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#09090b";
        ctx.beginPath();
        ctx.ellipse(c * 0.13, ey, c * 0.026, c * 0.075, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(c * 0.09, ey - c * 0.03, c * 0.028, 0, Math.PI * 2);
        ctx.fill();
      });

      // Forked Tongue
      const shouldFlickTongue =
        tongueTimer.current % 130 < 45 || distToFood <= 3.5;

      if (shouldFlickTongue && mouthOpen < 0.6 && statusRef.current === "playing") {
        const tongueProgress = (tongueTimer.current % 45) / 45;
        const ext = Math.sin(tongueProgress * Math.PI);
        const tongueLen = c * 0.55 * ext;
        const quiver = Math.sin(timeNow * 0.05) * (c * 0.06);

        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = Math.max(1.8, c * 0.05);
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(c * 0.52, 0);
        ctx.lineTo(c * 0.52 + tongueLen * 0.65, quiver);

        ctx.moveTo(c * 0.52 + tongueLen * 0.65, quiver);
        ctx.lineTo(c * 0.52 + tongueLen, quiver - c * 0.14);

        ctx.moveTo(c * 0.52 + tongueLen * 0.65, quiver);
        ctx.lineTo(c * 0.52 + tongueLen, quiver + c * 0.14);
        ctx.stroke();
      }

      ctx.restore();

      // 5. PARTICLE SYSTEM
      for (let pIdx = particles.current.length - 1; pIdx >= 0; pIdx--) {
        const p = particles.current[pIdx];
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) p.vy += p.gravity;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.current.splice(pIdx, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 6. FLOATING SCORE TEXT
      for (let tIdx = floatingTexts.current.length - 1; tIdx >= 0; tIdx--) {
        const ft = floatingTexts.current[tIdx];
        ft.y += ft.vy;
        ft.alpha -= 0.018;

        if (ft.alpha <= 0) {
          floatingTexts.current.splice(tIdx, 1);
          continue;
        }

        ctx.save();
        ctx.font = `900 ${Math.round(c * 0.7)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // 7. INITIAL READY HINT ON CANVAS (Waiting for first move)
      if (statusRef.current === "playing" && !game.current.hasStartedMoving) {
        ctx.save();
        const pulse = 0.8 + Math.sin(timeNow * 0.006) * 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.font = `bold ${Math.max(12, Math.round(c * 0.52))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 6;
        ctx.fillText("👆 Swipe or tap D-Pad to move", (cols * c) / 2, Math.round((rows - 2.5) * c));
        ctx.restore();
      }

      ctx.restore();
    }

    function gameLoop(now: number) {
      const dt = now - lastTime;
      lastTime = now;
      animTime.current = now;
      tongueTimer.current += 1;

      if (shakeRef.current > 0) {
        shakeRef.current = Math.max(0, shakeRef.current - dt * 0.035);
      }

      // Countdown Timer
      if (statusRef.current === "playing" && game.current.hasStartedMoving) {
        const elapsed = (Date.now() - game.current.startTime) / 1000;
        const currentLvl = currentLevelConfigRef.current;
        const remain = Math.max(0, currentLvl.timeLimit - elapsed);
        setTimeLeft(remain);
        if (remain <= 0) {
          setIsTimeUp(true);
          setStatus("over");
          shakeRef.current = 14;
          try {
            soundFx.playDie();
          } catch {}
          return;
        }
      }

      if (game.current.golden && game.current.golden.active) {
        game.current.golden.timeLeft -= dt;
        if (game.current.golden.timeLeft <= 0) {
          game.current.golden = null;
        }
      }

      // Speed calculation
      const lvl = currentLevelConfigRef.current;
      const interval = Math.max(65, lvl.baseSpeed - game.current.applesEaten * 1.5);

      if (statusRef.current === "playing") {
        accumulator += dt;
        while (accumulator >= interval && statusRef.current === "playing") {
          accumulator -= interval;
          step();
        }
      } else {
        accumulator = 0;
      }

      const interp =
        statusRef.current === "playing" ? Math.min(1, accumulator / interval) : 1;
      render(interp, now);

      raf = requestAnimationFrame(gameLoop);
    }

    raf = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(raf);
  }, [generateRandomFood, handleLevelComplete]);

  const activeTheme = THEMES[activeThemeId] || THEMES.garden;
  const isHudVisible = !isFullscreen || showFullscreenHud || status !== "playing";
  const totalStarsCount = Object.values(levelProgress.stars).reduce((sum, val) => sum + val, 0);

  return (
    <main
      ref={mainRef}
      className={`h-[100dvh] w-screen flex flex-col items-center select-none overflow-hidden ${
        isFullscreen ? "p-0 justify-center relative" : "p-1.5 sm:p-3 justify-between"
      }`}
      style={{
        background:
          activeThemeId === "desert"
            ? `radial-gradient(circle at 50% 25%, #2a1c0d 0%, #0d0905 100%)`
            : activeThemeId === "magma" || activeThemeId === "lava"
            ? `radial-gradient(circle at 50% 25%, #2b110e 0%, #0a0404 100%)`
            : activeThemeId === "cyber" || activeThemeId === "neon" || activeThemeId === "midnight"
            ? `radial-gradient(circle at 50% 25%, #0c182b 0%, #030712 100%)`
            : `radial-gradient(circle at 50% 25%, #152416 0%, #070c08 100%)`,
      }}
    >
      {/* FULLSCREEN TOP HOVER TRIGGER ZONE */}
      {isFullscreen && (
        <div
          className="fixed top-0 left-0 right-0 h-16 z-40"
          onMouseEnter={() => {
            setShowFullscreenHud(true);
            if (hudTimerRef.current) {
              clearTimeout(hudTimerRef.current);
              hudTimerRef.current = null;
            }
          }}
          onClick={() => {
            setShowFullscreenHud((prev) => !prev);
          }}
        />
      )}

      {/* FULLSCREEN HUD MINI INDICATOR PILL */}
      {isFullscreen && !isHudVisible && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setShowFullscreenHud(true);
            if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
          }}
          onMouseEnter={() => {
            setShowFullscreenHud(true);
            if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
          }}
          className="fixed top-2.5 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white/60 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all duration-200 select-none pointer-events-auto"
          title="Move mouse to top to reveal controls"
        >
          <span className="text-[10px] text-emerald-400">▼</span>
          <span className="text-[11px] tracking-wide">
            {`Lvl ${currentLevelNum}`}
          </span>
        </div>
      )}

      {/* --- TOP COMPACT MODULAR HUD BAR --- */}
      <GameHud
        status={status}
        applesEaten={game.current.applesEaten}
        targetApples={currentLevelConfig.targetApples}
        currentLevel={currentLevelNum}
        totalStars={totalStarsCount}
        timeLeft={timeLeft}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        isHudVisible={isHudVisible}
        isMobileDevice={isMobileDevice}
        controlMode={controlMode}
        onToggleSound={toggleSound}
        onToggleControlMode={toggleControlMode}
        onToggleFullscreen={toggleFullscreen}
        onTogglePause={togglePause}
        onOpenLevelSelector={() => setShowLevelSelector(true)}
        onMouseEnter={() => {
          if (isFullscreen) {
            setShowFullscreenHud(true);
            if (hudTimerRef.current) {
              clearTimeout(hudTimerRef.current);
              hudTimerRef.current = null;
            }
          }
        }}
        onMouseLeave={() => {
          if (isFullscreen && status === "playing") {
            if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
            hudTimerRef.current = setTimeout(() => {
              setShowFullscreenHud(false);
              hudTimerRef.current = null;
            }, 1000);
          }
        }}
      />

      {/* --- CANVAS WRAPPER (TOUCH & POINTER COMPATIBLE) --- */}
      <div
        className="flex-1 w-full flex items-center justify-center relative min-h-0 py-1"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "none" }}
      >
        <div
          className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl border-2 sm:border-4 transition-all"
          style={{
            borderColor: activeTheme.boardBorder,
            boxShadow: `0 15px 40px -10px ${activeTheme.boardBorder}66, 0 0 25px ${activeTheme.boardBorder}33`,
            width: canvasDim.width,
            height: canvasDim.height,
            maxWidth: "calc(100vw - 12px)",
            maxHeight: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasDim.width}
            height={canvasDim.height}
            className="block w-full h-full pointer-events-none"
          />

          {/* OVERLAY: READY / START SCREEN */}
          {status === "ready" && (
            <ReadyOverlay
              level={currentLevelConfig}
              progress={levelProgress}
              onOpenLevelSelector={() => setShowLevelSelector(true)}
              onStart={start}
            />
          )}

          {/* OVERLAY: PAUSED SCREEN */}
          {status === "paused" && (
            <PauseOverlay
              level={currentLevelConfig}
              onResume={togglePause}
              onRestart={start}
              onOpenLevelSelector={() => setShowLevelSelector(true)}
            />
          )}

          {/* OVERLAY: LEVEL CLEAR VICTORY SCREEN */}
          {status === "level_clear" && (
            <LevelClearModal
              level={currentLevelConfig}
              starsEarned={earnedStars}
              timeTaken={levelTimeTaken}
              hasNextLevel={currentLevelNum < MAX_LEVELS}
              onNextLevel={nextLevel}
              onReplay={start}
              onOpenLevelSelector={() => setShowLevelSelector(true)}
            />
          )}

          {/* OVERLAY: GAME OVER / TIME UP SCREEN */}
          {status === "over" && (
            <GameOverModal
              level={currentLevelConfig}
              isTimeUp={isTimeUp}
              applesEaten={game.current.applesEaten}
              targetApples={currentLevelConfig.targetApples}
              snakeLength={game.current.snake.length}
              onRetry={start}
              onOpenLevelSelector={() => setShowLevelSelector(true)}
            />
          )}
        </div>
      </div>

      {/* --- ERGONOMIC MOBILE TOUCH D-PAD --- */}
      {isMobileDevice && controlMode === "dpad" && (
        <DPadControls onTurn={turn} onStart={start} />
      )}

      {/* --- LEVEL SELECTION MAP MODAL --- */}
      {showLevelSelector && (
        <LevelSelectorModal
          currentLevel={currentLevelNum}
          progress={levelProgress}
          onSelectLevel={selectLevel}
          onClose={() => setShowLevelSelector(false)}
        />
      )}

      {/* DESKTOP FOOTER SHORTCUTS */}
      {!isMobileDevice && !isFullscreen && (
        <div className="w-full max-w-4xl flex items-center justify-between px-2 pt-1 text-xs text-white/50 shrink-0">
          <div>
            Slither: <span className="text-white/80 font-bold">WASD / Arrow Keys</span> • Pause: <span className="text-white/80 font-bold">Space</span> • Fullscreen: <span className="text-white/80 font-bold">F</span> • Mute: <span className="text-white/80 font-bold">M</span>
          </div>
          <div>Serpent Pro v2.5 • Levels & Challenge Mode</div>
        </div>
      )}
    </main>
  );
}
