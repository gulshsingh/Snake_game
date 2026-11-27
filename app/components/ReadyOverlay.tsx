"use client";

import React from "react";
import {
  DifficultyConfig,
  GameSessionConfig,
  LevelConfig,
  LevelProgress,
  ThemeConfig,
} from "../utils/types";

interface ReadyOverlayProps {
  session?: GameSessionConfig | null;
  sessionTheme?: ThemeConfig;
  sessionDifficulty?: DifficultyConfig;
  level: LevelConfig;
  progress: LevelProgress;
  onOpenLevelSelector: () => void;
  onStart: () => void;
}

export const ReadyOverlay: React.FC<ReadyOverlayProps> = ({
  session,
  sessionTheme,
  sessionDifficulty,
  level,
  progress,
  onOpenLevelSelector,
  onStart,
}) => {
  const starsEarned = progress.stars[level.level] || 0;

  return (
    <div
      className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-3 sm:p-4 text-center z-30 select-none cursor-pointer"
      style={{ touchAction: "manipulation" }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onStart();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onStart();
      }}
    >
      <div className="text-3xl sm:text-5xl mb-1 animate-float pointer-events-none">🐍</div>
      <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500 mb-2 tracking-tight pointer-events-none">
        SERPENT PRO
      </h1>

      {/* LEVELS CHALLENGE CARD */}
      <div
        className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-3 mb-4 flex flex-col items-center z-40"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Level Header: Difficulty Badge & Stars */}
        <div className="flex items-center justify-between w-full mb-1">
          {sessionDifficulty ? (
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${sessionDifficulty.badgeClass}`}
            >
              {sessionDifficulty.badge}
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/15">
              Rolling...
            </span>
          )}

          {/* Stars */}
          <div className="flex text-xs text-amber-400">
            {[1, 2, 3].map((s) => (
              <span key={s} className={s <= starsEarned ? "opacity-100" : "opacity-25"}>
                ⭐
              </span>
            ))}
          </div>
        </div>

        <div className="text-base sm:text-lg font-black text-white">
          Level {level.level}: {level.title}
        </div>

        {/* Dynamic Map Theme, Layout & Obstacle Summary */}
        {session && sessionTheme ? (
          <>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/85 my-1">
              <span>{sessionTheme.icon}</span>
              <span>{sessionTheme.name}</span>
              <span className="text-white/30">•</span>
              <span className="capitalize text-cyan-300">{session.pattern}</span>
              <span className="text-white/30">•</span>
              <span className="text-amber-300">{session.obstacles.length} obstacles</span>
            </div>
            <div className="text-[10px] font-mono text-white/45 mb-1">
              Seed #{session.seed.slice(0, 10)}
            </div>
          </>
        ) : (
          <div className="text-[11px] text-white/60 my-1">
            Preparing random map & layout...
          </div>
        )}

        <p className="text-xs text-white/70 mb-2.5">
          🎯 Eat <span className="text-emerald-400 font-bold">{level.targetApples} apples</span> in{" "}
          <span className="text-amber-300 font-bold">{level.timeLimit}s</span>!
        </p>

        <button
          type="button"
          onPointerDown={onOpenLevelSelector}
          onClick={onOpenLevelSelector}
          className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 touch-btn cursor-pointer active:scale-95 flex items-center gap-1.5"
        >
          <span>🗺️</span>
          <span>View All Levels Map</span>
        </button>
      </div>

      {/* START SLITHERING BUTTON */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
          onStart();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
        className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-base sm:text-xl tracking-wide shadow-2xl shadow-emerald-600/50 touch-btn animate-pulse-glow cursor-pointer z-40 active:scale-95"
      >
        {`START LEVEL ${level.level}`}
      </button>

      <div className="text-[11px] text-white/60 mt-3 max-w-xs pointer-events-none">
        Tap button or D-Pad • Swipe anywhere to turn
      </div>
    </div>
  );
};
