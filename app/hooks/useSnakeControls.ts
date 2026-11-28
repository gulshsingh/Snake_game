import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef } from "react";
import { soundFx } from "../utils/audio";
import { getLevelConfig } from "../utils/levels";
import { pushFloatingText } from "../utils/fxRenderer";
import { adjustGameTimersForPause, SnakeGameState } from "../utils/gameStep";
import {
  DifficultyLayer,
  DifficultyLevel,
  Direction,
  FloatingText,
  GameSessionConfig,
  LevelConfig,
  MapThemeId,
  Status,
} from "../utils/types";

interface UseSnakeControlsParams {
  gameRef: MutableRefObject<SnakeGameState>;
  statusRef: MutableRefObject<Status>;
  sessionRef: MutableRefObject<GameSessionConfig | null>;
  gridSizeRef: MutableRefObject<{ cols: number; rows: number }>;
  cellRef: MutableRefObject<number>;
  floatingTexts: MutableRefObject<FloatingText[]>;
  currentLevelNum: number;
  currentLevelConfigRef: MutableRefObject<LevelConfig>;
  showLevelSelectorRef: MutableRefObject<boolean>;
  toggleFullscreenRef: MutableRefObject<() => void>;
  pausedAtRef: MutableRefObject<number | null>;
  resumeGraceMsRef: MutableRefObject<number>;
  turnRef: MutableRefObject<(d: Direction) => void>;
  setStatus: (s: Status) => void;
  setIsMuted: Dispatch<SetStateAction<boolean>>;
  setCurrentLevelNum: Dispatch<SetStateAction<number>>;
  setShowLevelSelector: Dispatch<SetStateAction<boolean>>;
  setTimeLeft: Dispatch<SetStateAction<number>>;
  setIsTimeUp: Dispatch<SetStateAction<boolean>>;
  applySessionToGame: (
    session: GameSessionConfig,
    cols: number,
    rows: number,
    isPortrait: boolean
  ) => void;
  initFreshSession: (
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
  ) => GameSessionConfig;
}

export function useSnakeControls({
  gameRef,
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
}: UseSnakeControlsParams) {
  const lastPauseToggleRef = useRef(0);
  const lastSoundToggleRef = useRef(0);
  const lastStartRef = useRef(0);

  const toggleSound = useCallback(() => {
    const now = Date.now();
    if (now - lastSoundToggleRef.current < 250) return;
    lastSoundToggleRef.current = now;
    setIsMuted(soundFx.toggleMute());
  }, [setIsMuted]);

  const start = useCallback(
    (forceFreshSession = false) => {
      const now = Date.now();
      if (now - lastStartRef.current < 200) return;
      lastStartRef.current = now;

      try {
        const wasActiveRestart =
          statusRef.current === "playing" || statusRef.current === "paused";
        const { cols, rows } = gridSizeRef.current;
        const isPortrait =
          typeof window !== "undefined" && window.innerHeight > window.innerWidth;
        const currentLvl = currentLevelConfigRef.current;
        if (currentLvl) setTimeLeft(currentLvl.timeLimit);
        setIsTimeUp(false);
        pausedAtRef.current = null;
        resumeGraceMsRef.current = 0;

        if (!forceFreshSession && sessionRef.current) {
          applySessionToGame(sessionRef.current, cols, rows, isPortrait);
        } else {
          initFreshSession(cols, rows, isPortrait, currentLvl?.level);
        }
        gameRef.current.startTime = Date.now();
        setStatus("playing");

        if (wasActiveRestart) {
          const c = cellRef.current;
          pushFloatingText(
            floatingTexts.current,
            "🔄 LEVEL RESTARTED",
            (cols * c) / 2,
            Math.max(c * 1.5, rows * c * 0.25),
            "#34d399"
          );
        }
      } catch (e) {
        console.error("Error in start:", e);
        setStatus("playing");
      }

      try {
        soundFx.playTurn();
      } catch {}
    },
    [
      applySessionToGame,
      cellRef,
      currentLevelConfigRef,
      floatingTexts,
      gameRef,
      gridSizeRef,
      initFreshSession,
      pausedAtRef,
      resumeGraceMsRef,
      sessionRef,
      setIsTimeUp,
      setStatus,
      setTimeLeft,
      statusRef,
    ]
  );

  const selectLevel = useCallback(
    (lvl: LevelConfig) => {
      lastStartRef.current = 0;
      const shouldRefresh = lvl.level !== currentLevelNum || statusRef.current === "level_clear";
      setCurrentLevelNum(lvl.level);
      currentLevelConfigRef.current = lvl;
      setShowLevelSelector(false);
      setTimeLeft(lvl.timeLimit);
      setIsTimeUp(false);
      start(shouldRefresh);
    },
    [
      currentLevelConfigRef,
      currentLevelNum,
      setCurrentLevelNum,
      setIsTimeUp,
      setShowLevelSelector,
      setTimeLeft,
      start,
      statusRef,
    ]
  );

  const nextLevel = useCallback(() => {
    lastStartRef.current = 0;
    const nextLvlNum = currentLevelNum + 1;
    const nextLvl = getLevelConfig(nextLvlNum);
    setCurrentLevelNum(nextLvlNum);
    currentLevelConfigRef.current = nextLvl;
    setTimeLeft(nextLvl.timeLimit);
    setIsTimeUp(false);
    start(true);
  }, [
    currentLevelConfigRef,
    currentLevelNum,
    setCurrentLevelNum,
    setIsTimeUp,
    setTimeLeft,
    start,
  ]);

  const turn = useCallback(
    (d: Direction) => {
      if (statusRef.current === "level_clear") {
        // Wait until the user explicitly taps Start Level on LevelClearModal
        return;
      }
      if (statusRef.current === "ready" || statusRef.current === "over") {
        start(false);
        if (gameRef.current) {
          const isOpp = gameRef.current.dir.x + d.x === 0 && gameRef.current.dir.y + d.y === 0;
          if (!isOpp) {
            gameRef.current.dir = d;
            gameRef.current.nextDir = d;
          }
          gameRef.current.hasStartedMoving = true;
        }
        return;
      }
      if (statusRef.current !== "playing") return;

      const g = gameRef.current;
      if (!g.hasStartedMoving) {
        g.hasStartedMoving = true;
        g.startTime = Date.now();
      }
      if (resumeGraceMsRef.current > 0) resumeGraceMsRef.current = 0;

      const last = g.queue.length ? g.queue[g.queue.length - 1] : g.dir;
      const isOpposite = last.x + d.x === 0 && last.y + d.y === 0;
      const isSame = last.x === d.x && last.y === d.y;

      if (!isOpposite && !isSame && g.queue.length < 3) {
        g.queue.push(d);
        try {
          soundFx.playTurn();
        } catch {}
      }
    },
    [gameRef, resumeGraceMsRef, start, statusRef]
  );

  useEffect(() => {
    turnRef.current = turn;
  }, [turn, turnRef]);

  const pauseGame = useCallback(() => {
    if (statusRef.current !== "playing") return;
    pausedAtRef.current = Date.now();
    resumeGraceMsRef.current = 0;
    setStatus("paused");
    try {
      soundFx.playTurn();
    } catch {}
  }, [pausedAtRef, resumeGraceMsRef, setStatus, statusRef]);

  const resumeGame = useCallback(() => {
    if (statusRef.current !== "paused") return;
    if (pausedAtRef.current !== null) {
      adjustGameTimersForPause(gameRef.current, Date.now() - pausedAtRef.current);
    }
    pausedAtRef.current = null;
    resumeGraceMsRef.current = gameRef.current.hasStartedMoving ? 1200 : 0;
    setStatus("playing");
    try {
      soundFx.playTurn();
    } catch {}
  }, [gameRef, pausedAtRef, resumeGraceMsRef, setStatus, statusRef]);

  const togglePause = useCallback(() => {
    const now = Date.now();
    if (now - lastPauseToggleRef.current < 220) return;
    lastPauseToggleRef.current = now;
    if (statusRef.current === "level_clear") return;
    if (statusRef.current === "playing") pauseGame();
    else if (statusRef.current === "paused") resumeGame();
    else start(false);
  }, [pauseGame, resumeGame, start, statusRef]);

  const openLevelSelector = useCallback(() => {
    if (statusRef.current === "playing") pauseGame();
    setShowLevelSelector(true);
  }, [pauseGame, setShowLevelSelector, statusRef]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        statusRef.current === "playing" &&
        gameRef.current.hasStartedMoving
      ) {
        pauseGame();
      }
    };
    const onWindowBlur = () => {
      if (statusRef.current === "playing" && gameRef.current.hasStartedMoving) {
        pauseGame();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [gameRef, pauseGame, statusRef]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (showLevelSelectorRef.current) {
        if (e.key === "Escape") {
          e.preventDefault();
          setShowLevelSelector(false);
        }
        return;
      }
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
      } else if (
        e.key === " " ||
        e.key === "Enter" ||
        e.key === "Escape" ||
        e.key === "p" ||
        e.key === "P"
      ) {
        e.preventDefault();
        togglePause();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleSound();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        if (statusRef.current !== "level_clear") start(false);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreenRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setShowLevelSelector, showLevelSelectorRef, start, statusRef, toggleFullscreenRef, togglePause, toggleSound, turn]);

  return {
    start,
    selectLevel,
    nextLevel,
    turn,
    togglePause,
    toggleSound,
    openLevelSelector,
  };
}
