"use client";

import { useEffect, useRef } from "react";
import { THEMES, getMainBackgroundGradient } from "./utils/themes";
import { DIFFICULTY_CONFIGS } from "./utils/sessionGenerator";
import { useViewportCanvas } from "./hooks/useViewportCanvas";
import { useSnakeSession } from "./hooks/useSnakeSession";
import { useGameLoop } from "./hooks/useGameLoop";

import { GameHud } from "./components/GameHud";
import { DPadControls } from "./components/DPadControls";
import { LevelSelectorModal } from "./components/LevelSelectorModal";
import { LevelClearModal } from "./components/LevelClearModal";
import { GameOverModal } from "./components/GameOverModal";
import { ReadyOverlay } from "./components/ReadyOverlay";
import { PauseOverlay } from "./components/PauseOverlay";

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const gridSizeProxyRef = useRef({ cols: 20, rows: 20 });
  const cellProxyRef = useRef(26);
  const toggleFullscreenProxyRef = useRef<() => void>(() => {});

  const session = useSnakeSession({
    gridSizeRef: gridSizeProxyRef,
    cellRef: cellProxyRef,
    toggleFullscreenRef: toggleFullscreenProxyRef,
  });

  const viewport = useViewportCanvas({
    mainRef,
    controlMode: session.controlMode,
    statusRef: session.statusRef,
    sessionRef: session.sessionRef,
    gameRef: session.game,
    applySessionToGame: session.applySessionToGame,
    onTurn: (d) => session.turnRef.current(d),
  });

  useEffect(() => {
    gridSizeProxyRef.current = viewport.gridSizeRef.current;
    cellProxyRef.current = viewport.cellRef.current;
    toggleFullscreenProxyRef.current = viewport.toggleFullscreen;
  });

  useGameLoop({
    canvasRef,
    cellRef: viewport.cellRef,
    gridSizeRef: viewport.gridSizeRef,
    themeRef: session.themeRef,
    gameRef: session.game,
    statusRef: session.statusRef,
    sessionRef: session.sessionRef,
    currentLevelConfigRef: session.currentLevelConfigRef,
    particlesRef: session.particles,
    floatingTextsRef: session.floatingTexts,
    bestScoreRef: session.bestScoreRef,
    shakeRef: session.shakeRef,
    tongueTimerRef: session.tongueTimer,
    mouthOpenRef: session.mouthOpenRef,
    resumeGraceMsRef: session.resumeGraceMsRef,
    onSyncHud: session.syncHudStats,
    onSetStatus: session.setStatus,
    onSetTimeLeft: session.setTimeLeft,
    onSetIsTimeUp: session.setIsTimeUp,
    onLevelComplete: session.handleLevelComplete,
  });

  const activeTheme = THEMES[session.activeThemeId] || THEMES.jungle;
  const activeDifficulty = session.sessionConfig
    ? DIFFICULTY_CONFIGS[session.sessionConfig.difficulty]
    : DIFFICULTY_CONFIGS.medium;
  const isHudVisible =
    !viewport.isFullscreen || viewport.showFullscreenHud || session.status !== "playing";
  const totalStarsCount = Object.values(session.levelProgress.stars).reduce(
    (sum, val) => sum + val,
    0
  );

  return (
    <main
      ref={mainRef}
      className={`h-[100dvh] w-screen flex flex-col items-center select-none overflow-hidden ${
        viewport.isFullscreen ? "p-0 justify-center relative" : "p-1.5 sm:p-3 justify-between"
      }`}
      style={{ background: getMainBackgroundGradient(session.activeThemeId) }}
    >
      {viewport.isFullscreen && (
        <div
          className="fixed top-0 left-0 right-0 h-16 z-40"
          onMouseEnter={viewport.revealFullscreenHud}
          onClick={viewport.toggleFullscreenHud}
        />
      )}

      {viewport.isFullscreen && !isHudVisible && (
        <div
          role="button"
          tabIndex={0}
          onClick={viewport.revealFullscreenHud}
          onMouseEnter={viewport.revealFullscreenHud}
          className="fixed top-2.5 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white/60 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all duration-200 select-none pointer-events-auto"
          title="Move mouse to top to reveal controls"
        >
          <span className="text-[10px] text-emerald-400">▼</span>
          <span className="text-[11px] tracking-wide">
            {`Lvl ${session.currentLevelNum} • ${activeTheme.icon} ${activeDifficulty.label}`}
          </span>
        </div>
      )}

      <GameHud
        status={session.status}
        sessionTheme={activeTheme}
        sessionDifficulty={activeDifficulty}
        applesEaten={session.hudStats.applesEaten}
        targetApples={session.currentLevelConfig.targetApples}
        currentLevel={session.currentLevelNum}
        totalStars={totalStarsCount}
        timeLeft={session.timeLeft}
        isMuted={session.isMuted}
        isFullscreen={viewport.isFullscreen}
        isHudVisible={isHudVisible}
        isMobileDevice={session.isMobileDevice}
        controlMode={session.controlMode}
        onToggleSound={session.toggleSound}
        onToggleControlMode={session.toggleControlMode}
        onToggleFullscreen={viewport.toggleFullscreen}
        onTogglePause={session.togglePause}
        onRestart={() => session.start(false)}
        onOpenLevelSelector={session.openLevelSelector}
        onMouseEnter={() => {
          if (viewport.isFullscreen) viewport.revealFullscreenHud();
        }}
        onMouseLeave={() => {
          if (viewport.isFullscreen && session.status === "playing") {
            viewport.scheduleHideFullscreenHud();
          }
        }}
      />

      <div
        className="flex-1 w-full flex items-center justify-center relative min-h-0 py-1"
        onTouchStart={viewport.onTouchStart}
        onTouchMove={viewport.onTouchMove}
        onTouchEnd={viewport.onTouchEnd}
        style={{ touchAction: "none" }}
      >
        <div
          className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl border-2 sm:border-4 transition-all"
          style={{
            borderColor: activeTheme.boardBorder,
            boxShadow: `0 15px 40px -10px ${activeTheme.boardBorder}66, 0 0 25px ${activeTheme.boardBorder}33`,
            width: viewport.canvasDim.width,
            height: viewport.canvasDim.height,
            maxWidth: "calc(100vw - 12px)",
            maxHeight: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            width={viewport.canvasDim.width}
            height={viewport.canvasDim.height}
            className="block w-full h-full pointer-events-none"
          />

          {session.status === "ready" && (
            <ReadyOverlay
              session={session.sessionConfig}
              sessionTheme={activeTheme}
              sessionDifficulty={activeDifficulty}
              level={session.currentLevelConfig}
              progress={session.levelProgress}
              onOpenLevelSelector={session.openLevelSelector}
              onStart={() => session.start(false)}
            />
          )}

          {session.status === "paused" && (
            <PauseOverlay
              session={session.sessionConfig}
              sessionTheme={activeTheme}
              sessionDifficulty={activeDifficulty}
              level={session.currentLevelConfig}
              applesEaten={session.hudStats.applesEaten}
              timeLeft={session.timeLeft}
              onResume={session.togglePause}
              onRestart={() => session.start(false)}
              onOpenLevelSelector={session.openLevelSelector}
            />
          )}

          {session.status === "level_clear" && (
            <LevelClearModal
              level={session.currentLevelConfig}
              starsEarned={session.earnedStars}
              timeTaken={session.levelTimeTaken}
              hasNextLevel={true}
              onNextLevel={session.nextLevel}
              onReplay={() => session.start(true)}
              onOpenLevelSelector={session.openLevelSelector}
            />
          )}

          {session.status === "over" && (
            <GameOverModal
              session={session.sessionConfig}
              sessionTheme={activeTheme}
              sessionDifficulty={activeDifficulty}
              level={session.currentLevelConfig}
              isTimeUp={session.isTimeUp}
              applesEaten={session.hudStats.applesEaten}
              targetApples={session.currentLevelConfig.targetApples}
              snakeLength={session.hudStats.snakeLength}
              onRetry={() => session.start(false)}
              onOpenLevelSelector={session.openLevelSelector}
            />
          )}
        </div>
      </div>

      {session.isMobileDevice && session.controlMode === "dpad" && (
        <DPadControls onTurn={session.turn} onStart={() => session.start(false)} />
      )}

      {session.showLevelSelector && (
        <LevelSelectorModal
          currentLevel={session.currentLevelNum}
          progress={session.levelProgress}
          onSelectLevel={session.selectLevel}
          onClose={() => session.setShowLevelSelector(false)}
        />
      )}

      {!session.isMobileDevice && !viewport.isFullscreen && (
        <div className="w-full max-w-4xl flex items-center justify-between px-2 pt-1 text-xs text-white/50 shrink-0">
          <div>
            Slither: <span className="text-white/80 font-bold">WASD / Arrow Keys</span> • Pause:{" "}
            <span className="text-white/80 font-bold">Space / Esc</span> • Restart:{" "}
            <span className="text-white/80 font-bold">R</span> • Fullscreen:{" "}
            <span className="text-white/80 font-bold">F</span> • Mute:{" "}
            <span className="text-white/80 font-bold">M</span>
          </div>
          <div>Serpent Pro v2.5 • Levels & Challenge Mode</div>
        </div>
      )}
    </main>
  );
}
