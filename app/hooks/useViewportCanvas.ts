"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SnakeGameState } from "../utils/gameStep";
import {
  ensureFullConnectivity,
  findSafeFoodCell,
  generateMapLayout,
  getInitialSnake,
} from "../utils/sessionGenerator";
import { Direction, GameSessionConfig, Status } from "../utils/types";

interface UseViewportCanvasParams {
  mainRef: React.RefObject<HTMLElement | null>;
  controlMode: "dpad" | "swipe";
  statusRef: React.RefObject<Status>;
  sessionRef: React.RefObject<GameSessionConfig | null>;
  gameRef: React.RefObject<SnakeGameState>;
  applySessionToGame: (
    session: GameSessionConfig,
    cols: number,
    rows: number,
    isPortrait: boolean
  ) => void;
  onTurn: (dir: Direction) => void;
}

export function useViewportCanvas({
  mainRef,
  controlMode,
  statusRef,
  sessionRef,
  gameRef,
  applySessionToGame,
  onTurn,
}: UseViewportCanvasParams) {
  const gridSizeRef = useRef({ cols: 20, rows: 20 });
  const cellRef = useRef(32);

  const [canvasDim, setCanvasDim] = useState({
    width: 640,
    height: 640,
    cols: 20,
    rows: 20,
    dpr: 1,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenHud, setShowFullscreenHud] = useState(false);
  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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
    const rows = Math.max(12, Math.floor(availableH / targetCell));

    const c = Math.min(Math.floor(availableW / cols), Math.floor(availableH / rows));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cellRef.current = c;
    gridSizeRef.current = { cols, rows };

    setCanvasDim({ width: cols * c, height: rows * c, cols, rows, dpr });

    const g = gameRef.current;
    if (statusRef.current === "ready" && sessionRef.current) {
      const { snake: initialSnake, dir: initialDir } = getInitialSnake(cols, rows, isPortrait);
      const layout = generateMapLayout({
        seed: sessionRef.current.seed,
        cols,
        rows,
        difficulty: sessionRef.current.difficulty,
        difficultyLayer: sessionRef.current.difficultyLayer,
        snake: initialSnake,
        dir: initialDir,
        level: sessionRef.current.level,
      });
      applySessionToGame(
        {
          ...sessionRef.current,
          pattern: layout.pattern,
          obstacles: layout.obstacles,
          initialFood: layout.initialFood,
        },
        cols,
        rows,
        isPortrait
      );
    } else if (g && g.snake) {
      g.snake.forEach((p) => {
        p.x = Math.max(0, Math.min(cols - 1, p.x));
        p.y = Math.max(0, Math.min(rows - 1, p.y));
      });
      g.food.x = Math.max(0, Math.min(cols - 1, g.food.x));
      g.food.y = Math.max(0, Math.min(rows - 1, g.food.y));
      if (g.obstacles && g.obstacles.length) {
        const snakeKeys = new Set(g.snake.map((p) => `${p.x},${p.y}`));
        const foodKey = `${g.food.x},${g.food.y}`;
        const seen = new Set<string>();
        const clamped = g.obstacles
          .map((o) => ({
            ...o,
            x: Math.max(0, Math.min(cols - 1, o.x)),
            y: Math.max(0, Math.min(rows - 1, o.y)),
          }))
          .filter((o) => {
            const k = `${o.x},${o.y}`;
            if (snakeKeys.has(k) || k === foodKey || seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        g.obstacles = ensureFullConnectivity(cols, rows, g.snake[0], clamped);
      }
      if (
        g.snake.some((s) => s.x === g.food.x && s.y === g.food.y) ||
        g.obstacles.some((o) => o.x === g.food.x && o.y === g.food.y)
      ) {
        g.food = findSafeFoodCell(cols, rows, g.snake, g.obstacles);
      }
      if (
        g.golden &&
        g.golden.active &&
        (g.snake.some((s) => s.x === g.golden!.x && s.y === g.golden!.y) ||
          g.obstacles.some((o) => o.x === g.golden!.x && o.y === g.golden!.y) ||
          (g.golden.x === g.food.x && g.golden.y === g.food.y))
      ) {
        const nextGolden = findSafeFoodCell(cols, rows, g.snake, g.obstacles, [g.food]);
        g.golden.x = nextGolden.x;
        g.golden.y = nextGolden.y;
      }
    }
  }, [controlMode, applySessionToGame, gameRef, sessionRef, statusRef]);

  useEffect(() => {
    const rafId = requestAnimationFrame(handleResize);
    window.addEventListener("resize", handleResize);

    const onFsChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
      if (!isFs) setShowFullscreenHud(false);
      setTimeout(handleResize, 60);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, [handleResize]);

  useEffect(() => {
    if (!isFullscreen) {
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
      } else if (!hudTimerRef.current) {
        hudTimerRef.current = setTimeout(() => {
          setShowFullscreenHud(false);
          hudTimerRef.current = null;
        }, 1200);
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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const elem = mainRef.current || document.documentElement;
      if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
      else if ((elem as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen) {
        (elem as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if ((document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen) {
      (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
    }
  }, [mainRef]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const threshold = Math.max(18, cellRef.current * 0.7);
    if (Math.hypot(dx, dy) > threshold) {
      onTurn(Math.abs(dx) > Math.abs(dy) ? { x: dx > 0 ? 1 : -1, y: 0 } : { x: 0, y: dy > 0 ? 1 : -1 });
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    }
  };

  const onTouchEnd = () => {
    touchStartRef.current = null;
  };

  const revealFullscreenHud = useCallback(() => {
    setShowFullscreenHud(true);
    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current);
      hudTimerRef.current = null;
    }
  }, []);

  const toggleFullscreenHud = useCallback(() => {
    setShowFullscreenHud((prev) => !prev);
  }, []);

  const scheduleHideFullscreenHud = useCallback(() => {
    if (!isFullscreen) return;
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setShowFullscreenHud(false);
      hudTimerRef.current = null;
    }, 1000);
  }, [isFullscreen]);

  return {
    gridSizeRef,
    cellRef,
    canvasDim,
    isFullscreen,
    showFullscreenHud,
    revealFullscreenHud,
    toggleFullscreenHud,
    scheduleHideFullscreenHud,
    toggleFullscreen,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
