import { MutableRefObject, RefObject, useEffect } from "react";
import { soundFx } from "../utils/audio";
import { drawBoardBackground, drawObstacles } from "../utils/mapRenderer";
import { drawSerpent } from "../utils/snakeRenderer";
import {
  drawApples,
  drawParticlesAndTexts,
  drawReadyHint,
  drawResumeGraceOverlay,
} from "../utils/fxRenderer";
import { executeGameStep, SnakeGameState } from "../utils/gameStep";
import {
  FloatingText,
  GameSessionConfig,
  LevelConfig,
  Particle,
  Status,
  ThemeConfig,
} from "../utils/types";

interface UseGameLoopParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cellRef: MutableRefObject<number>;
  gridSizeRef: MutableRefObject<{ cols: number; rows: number }>;
  themeRef: MutableRefObject<ThemeConfig>;
  gameRef: MutableRefObject<SnakeGameState>;
  statusRef: MutableRefObject<Status>;
  sessionRef: MutableRefObject<GameSessionConfig | null>;
  currentLevelConfigRef: MutableRefObject<LevelConfig>;
  particlesRef: MutableRefObject<Particle[]>;
  floatingTextsRef: MutableRefObject<FloatingText[]>;
  bestScoreRef: MutableRefObject<number>;
  shakeRef: MutableRefObject<number>;
  tongueTimerRef: MutableRefObject<number>;
  mouthOpenRef: MutableRefObject<number>;
  resumeGraceMsRef: MutableRefObject<number>;
  onSyncHud: () => void;
  onSetStatus: (s: Status) => void;
  onSetTimeLeft: (remain: number) => void;
  onSetIsTimeUp: (timeUp: boolean) => void;
  onLevelComplete: () => void;
}

export function useGameLoop({
  canvasRef,
  cellRef,
  gridSizeRef,
  themeRef,
  gameRef,
  statusRef,
  sessionRef,
  currentLevelConfigRef,
  particlesRef,
  floatingTextsRef,
  bestScoreRef,
  shakeRef,
  tongueTimerRef,
  mouthOpenRef,
  resumeGraceMsRef,
  onSyncHud,
  onSetStatus,
  onSetTimeLeft,
  onSetIsTimeUp,
  onLevelComplete,
}: UseGameLoopParams) {
  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();
    let accumulator = 0;

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
      const g = gameRef.current;

      ctx.save();
      if (shakeRef.current > 0) {
        ctx.translate(
          (Math.random() - 0.5) * shakeRef.current,
          (Math.random() - 0.5) * shakeRef.current
        );
      }

      drawBoardBackground(ctx, cols, rows, c, theme, timeNow);

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

      drawObstacles(ctx, g.obstacles, c, theme, timeNow);
      drawApples(ctx, g.food, g.golden, c, theme, timeNow);

      mouthOpenRef.current = drawSerpent({
        ctx,
        snake: g.snake,
        prevSnake: g.prevSnake || g.snake,
        dir: g.dir,
        food: g.food,
        golden: g.golden,
        bulges: g.bulges,
        c,
        interp,
        timeNow,
        theme,
        status: statusRef.current,
        hasStartedMoving: g.hasStartedMoving,
        tongueTimer: tongueTimerRef.current,
        mouthOpen: mouthOpenRef.current,
        obstacles: g.obstacles,
        cols,
        rows,
        speedMs: g.currentSpeedMs,
        goldenAuraUntil: g.goldenAuraUntil,
      });

      drawParticlesAndTexts(ctx, particlesRef.current, floatingTextsRef.current, c);

      if (statusRef.current === "playing" && !g.hasStartedMoving) {
        drawReadyHint(ctx, cols, rows, c, timeNow);
      }
      if (statusRef.current === "playing" && resumeGraceMsRef.current > 0) {
        drawResumeGraceOverlay(
          ctx,
          g.snake[0],
          g.dir,
          width,
          height,
          c,
          theme.accent,
          resumeGraceMsRef.current
        );
      }

      ctx.restore();
    }

    function gameLoop(now: number) {
      const dt = now - lastTime;
      lastTime = now;
      tongueTimerRef.current += 1;

      if (shakeRef.current > 0) {
        shakeRef.current = Math.max(0, shakeRef.current - dt * 0.035);
      }

      if (statusRef.current === "playing" && resumeGraceMsRef.current > 0) {
        resumeGraceMsRef.current = Math.max(0, resumeGraceMsRef.current - dt);
        if (gameRef.current.hasStartedMoving) gameRef.current.startTime += dt;
        accumulator = 0;
        render(1, now);
        raf = requestAnimationFrame(gameLoop);
        return;
      }

      if (statusRef.current === "playing" && gameRef.current.hasStartedMoving) {
        const elapsed = (Date.now() - gameRef.current.startTime) / 1000;
        const remain = Math.max(0, currentLevelConfigRef.current.timeLimit - elapsed);
        onSetTimeLeft(remain);
        if (remain <= 0) {
          onSetIsTimeUp(true);
          onSetStatus("over");
          shakeRef.current = 14;
          try {
            soundFx.playDie();
          } catch {}
          render(1, now);
          raf = requestAnimationFrame(gameLoop);
          return;
        }
      }

      if (gameRef.current.golden && gameRef.current.golden.active) {
        gameRef.current.golden.timeLeft -= dt;
        if (gameRef.current.golden.timeLeft <= 0) gameRef.current.golden = null;
      }

      const interval = gameRef.current.currentSpeedMs;
      if (statusRef.current === "playing") {
        accumulator += dt;
        while (accumulator >= interval && statusRef.current === "playing") {
          accumulator -= interval;
          executeGameStep({
            game: gameRef.current,
            cols: gridSizeRef.current.cols,
            rows: gridSizeRef.current.rows,
            cellSize: cellRef.current,
            theme: themeRef.current,
            session: sessionRef.current,
            levelConfig: currentLevelConfigRef.current,
            particles: particlesRef.current,
            floatingTexts: floatingTextsRef.current,
            bestScoreRef,
            shakeRef,
            onSyncHud,
            onGameOver: () => onSetStatus("over"),
            onLevelComplete,
          });
        }
      } else {
        accumulator = 0;
      }

      const interp = statusRef.current === "playing" ? Math.min(1, accumulator / interval) : 1;
      render(interp, now);
      raf = requestAnimationFrame(gameLoop);
    }

    raf = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(raf);
  }, [
    bestScoreRef,
    canvasRef,
    cellRef,
    currentLevelConfigRef,
    floatingTextsRef,
    gameRef,
    gridSizeRef,
    mouthOpenRef,
    onLevelComplete,
    onSetIsTimeUp,
    onSetStatus,
    onSetTimeLeft,
    onSyncHud,
    particlesRef,
    resumeGraceMsRef,
    sessionRef,
    shakeRef,
    statusRef,
    themeRef,
    tongueTimerRef,
  ]);
}
